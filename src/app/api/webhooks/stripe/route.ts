import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/send-email";
import { enrollmentEmail } from "@/lib/emails";

const TIER_ACCESS_MONTHS: Record<string, number> = {
  essentials: 6,
  pro: 9,
  premium: 12,
};

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier;
  const courseType = session.metadata?.course_type;
  const isUpgrade = session.metadata?.upgrade === "true";

  if (!userId || !tier || !courseType) {
    console.error("Webhook missing metadata:", session.metadata);
    return;
  }

  const supabase = createAdminClient();

  if (isUpgrade) {
    await handleUpgrade(session, supabase);
    return;
  }

  const courseSlug = session.metadata?.course_slug;

  // Look up course by slug (multi-state safe), fall back to type for legacy sessions
  let courseQuery = supabase.from("courses").select("id").eq("active", true);
  if (courseSlug) {
    courseQuery = courseQuery.eq("slug", courseSlug);
  } else {
    courseQuery = courseQuery.eq("type", courseType);
  }
  const { data: course } = await courseQuery.limit(1).single();

  if (!course) {
    console.error("No active course found for type:", courseType);
    return;
  }

  // Idempotency check: use Stripe session ID to prevent duplicate enrollments
  const stripeSessionId = session.id;
  const { data: existingBySession } = await supabase
    .from("enrollments")
    .select("id")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (existingBySession) {
    console.log("Enrollment already exists for session, skipping:", existingBySession.id);
    return;
  }

  // Also check for active enrollment on same course (belt-and-suspenders)
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    console.log("Active enrollment already exists, skipping:", existing.id);
    return;
  }

  // Calculate expiration (clamp month overflow — e.g. Jan 31 + 1 month = Feb 28)
  const accessMonths = TIER_ACCESS_MONTHS[tier] ?? 6;
  const expiresAt = new Date();
  const targetMonth = expiresAt.getMonth() + accessMonths;
  expiresAt.setMonth(targetMonth);
  // If the day overflowed into the next month, clamp to last day of target month
  if (expiresAt.getMonth() !== targetMonth % 12) {
    expiresAt.setDate(0); // Sets to last day of previous month
  }

  // Create enrollment with Stripe session ID for idempotency
  const { error: enrollError } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: course.id,
    status: "active",
    expires_at: expiresAt.toISOString(),
    stripe_session_id: stripeSessionId,
  });

  if (enrollError) {
    console.error("Failed to create enrollment:", enrollError);
    return;
  }

  // Always update plan tier; update Stripe customer ID when available
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const profileUpdate: Record<string, string> = { plan_tier: tier };
  if (customerId) {
    profileUpdate.stripe_customer_id = customerId;
  }
  await supabase.from("profiles").update(profileUpdate).eq("id", userId);

  // Send enrollment confirmation email
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const { data: courseData } = await supabase
    .from("courses")
    .select("name")
    .eq("id", course.id)
    .single();

  if (userData?.user?.email && courseData) {
    const name =
      userData.user.user_metadata?.full_name ||
      userData.user.user_metadata?.name ||
      userData.user.email ||
      "";
    const email = enrollmentEmail({
      name,
      courseName: courseData.name,
      tier,
      accessMonths,
      expiresAt: expiresAt.toISOString(),
    });
    sendEmail({
      to: userData.user.email,
      subject: email.subject,
      html: email.html,
    });
  }
}

/* ── Upgrade handler ─────────────────────────────────────────── */

async function handleUpgrade(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createAdminClient>
) {
  const userId = session.metadata!.user_id!;
  const newTier = session.metadata!.tier!;
  const enrollmentId = session.metadata?.enrollment_id;
  const oldTier = session.metadata?.old_tier;

  if (!enrollmentId) {
    console.error("Upgrade webhook missing enrollment_id");
    return;
  }

  const stripeSessionId = session.id;

  // Idempotency: check if this Stripe session was already processed.
  // We store the session ID in a dedicated upgrade_sessions tracking query.
  // Use time_logs as a proxy — check for a log entry tagged with this session ID.
  // Simpler approach: check if plan_tier already matches the target AND
  // a previous upgrade session exists for this enrollment.
  const { data: existingUpgrade } = await supabase
    .from("time_logs")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("source", `upgrade:${stripeSessionId}`)
    .maybeSingle();

  if (existingUpgrade) {
    console.log("Upgrade already processed for session:", stripeSessionId);
    return;
  }

  // Get current enrollment — include user_id for ownership check
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, user_id, expires_at, status")
    .eq("id", enrollmentId)
    .single();

  if (!enrollment) {
    console.error("Upgrade enrollment not found:", enrollmentId);
    return;
  }

  // Verify enrollment belongs to the user from the Stripe session
  if (enrollment.user_id !== userId) {
    console.error(
      "Upgrade enrollment ownership mismatch:",
      enrollmentId,
      "expected user:",
      userId,
      "got:",
      enrollment.user_id
    );
    return;
  }

  // Extend expiration: add the difference in tier months
  const oldMonths = TIER_ACCESS_MONTHS[oldTier || "essentials"] ?? 6;
  const newMonths = TIER_ACCESS_MONTHS[newTier] ?? 9;
  const additionalMonths = newMonths - oldMonths;

  const expiresAt = new Date(enrollment.expires_at);
  if (additionalMonths > 0) {
    const targetMonth = expiresAt.getMonth() + additionalMonths;
    expiresAt.setMonth(targetMonth);
    // Clamp month overflow
    if (expiresAt.getMonth() !== targetMonth % 12) {
      expiresAt.setDate(0);
    }
  }

  // Update enrollment expiration
  const { error: updateError } = await supabase
    .from("enrollments")
    .update({ expires_at: expiresAt.toISOString() })
    .eq("id", enrollmentId);

  if (updateError) {
    console.error("Failed to extend enrollment:", updateError);
    return;
  }

  // Update plan tier
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const profileUpdate: Record<string, string> = { plan_tier: newTier };
  if (customerId) {
    profileUpdate.stripe_customer_id = customerId;
  }
  await supabase.from("profiles").update(profileUpdate).eq("id", userId);

  // Write idempotency marker so this session is never processed twice.
  // Uses time_logs with a special source tag — zero-duration, no time impact.
  await supabase.from("time_logs").insert({
    enrollment_id: enrollmentId,
    module_id: null,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    duration_seconds: 0,
    source: `upgrade:${stripeSessionId}`,
  });

  console.log(
    `Upgrade complete: user ${userId}, ${oldTier} → ${newTier}, expires ${expiresAt.toISOString()}`
  );
}
