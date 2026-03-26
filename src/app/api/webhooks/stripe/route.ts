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
    console.error("[stripe-webhook] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured");
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
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[stripe-webhook] Webhook received:", event.type, "| event ID:", event.id);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("[stripe-webhook] Processing checkout.session.completed | session ID:", session.id);
    await handleCheckoutCompleted(session);
  } else {
    console.log("[stripe-webhook] Ignoring event type:", event.type);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier;
  const courseType = session.metadata?.course_type;
  const courseSlug = session.metadata?.course_slug;
  const isUpgrade = session.metadata?.upgrade === "true";

  console.log("[stripe-webhook] Extracted metadata:", {
    user_id: userId,
    tier,
    course_type: courseType,
    course_slug: courseSlug,
    upgrade: isUpgrade,
  });

  if (!userId || !tier || !courseType) {
    console.error("[stripe-webhook] Missing required metadata — aborting. Full metadata:", session.metadata);
    return;
  }

  const supabase = createAdminClient();

  if (isUpgrade) {
    console.log("[stripe-webhook] Routing to upgrade handler");
    await handleUpgrade(session, supabase);
    return;
  }

  // ── Course lookup ──────────────────────────────────────────────
  const lookupField = courseSlug ? "slug" : "type";
  const lookupValue = courseSlug || courseType;
  console.log("[stripe-webhook] Looking up course by", lookupField, "=", lookupValue);

  let courseQuery = supabase.from("courses").select("id").eq("active", true);
  if (courseSlug) {
    courseQuery = courseQuery.eq("slug", courseSlug);
  } else {
    courseQuery = courseQuery.eq("type", courseType);
  }
  const { data: course, error: courseError } = await courseQuery.limit(1).single();

  if (courseError || !course) {
    console.error("[stripe-webhook] Course lookup failed:", { lookupField, lookupValue, error: courseError });
    return;
  }
  console.log("[stripe-webhook] Course lookup result: found course ID:", course.id);

  // ── Idempotency: check by Stripe session ID ───────────────────
  const stripeSessionId = session.id;
  console.log("[stripe-webhook] Checking for existing enrollment by stripe_session_id:", stripeSessionId);

  const { data: existingBySession, error: sessionCheckError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (sessionCheckError) {
    console.error("[stripe-webhook] Session idempotency check error:", sessionCheckError);
  }

  if (existingBySession) {
    console.log("[stripe-webhook] Enrollment already exists for session — skipping. Enrollment ID:", existingBySession.id);
    return;
  }
  console.log("[stripe-webhook] No existing enrollment for this session");

  // ── Idempotency: check for active enrollment on same course ───
  console.log("[stripe-webhook] Checking for existing active enrollment | user:", userId, "| course:", course.id);

  const { data: existing, error: activeCheckError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (activeCheckError) {
    console.error("[stripe-webhook] Active enrollment check error:", activeCheckError);
  }

  if (existing) {
    console.log("[stripe-webhook] Active enrollment already exists — skipping. Enrollment ID:", existing.id);
    return;
  }
  console.log("[stripe-webhook] No existing active enrollment found");

  // ── Calculate expiration ───────────────────────────────────────
  const accessMonths = TIER_ACCESS_MONTHS[tier] ?? 6;
  const expiresAt = new Date();
  const targetMonth = expiresAt.getMonth() + accessMonths;
  expiresAt.setMonth(targetMonth);
  // If the day overflowed into the next month, clamp to last day of target month
  if (expiresAt.getMonth() !== targetMonth % 12) {
    expiresAt.setDate(0); // Sets to last day of previous month
  }

  // ── Create enrollment ──────────────────────────────────────────
  const enrollmentData = {
    user_id: userId,
    course_id: course.id,
    status: "active",
    expires_at: expiresAt.toISOString(),
    stripe_session_id: stripeSessionId,
  };
  console.log("[stripe-webhook] Creating enrollment:", enrollmentData);

  const { data: insertedEnrollment, error: enrollError } = await supabase
    .from("enrollments")
    .insert(enrollmentData)
    .select("id")
    .single();

  if (enrollError) {
    console.error("[stripe-webhook] Enrollment insert FAILED:", enrollError);
    return;
  }
  console.log("[stripe-webhook] Enrollment insert SUCCESS — ID:", insertedEnrollment?.id);

  // ── Update profile ─────────────────────────────────────────────
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const profileUpdate: Record<string, string> = { plan_tier: tier };
  if (customerId) {
    profileUpdate.stripe_customer_id = customerId;
  }
  console.log("[stripe-webhook] Updating profile | user:", userId, "| data:", profileUpdate);

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (profileError) {
    console.error("[stripe-webhook] Profile update FAILED:", profileError);
  } else {
    console.log("[stripe-webhook] Profile update SUCCESS");
  }

  // ── Send enrollment confirmation email ─────────────────────────
  console.log("[stripe-webhook] Fetching user data for enrollment email | user:", userId);

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) {
    console.error("[stripe-webhook] Failed to fetch user for email:", userError);
  }

  const { data: courseData, error: courseNameError } = await supabase
    .from("courses")
    .select("name")
    .eq("id", course.id)
    .single();

  if (courseNameError) {
    console.error("[stripe-webhook] Failed to fetch course name for email:", courseNameError);
  }

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
    console.log("[stripe-webhook] Enrollment email queued for:", userData.user.email);
  } else {
    console.error("[stripe-webhook] Skipped enrollment email — missing user email or course data");
  }

  console.log("[stripe-webhook] handleCheckoutCompleted DONE | enrollment:", insertedEnrollment?.id);
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
  const stripeSessionId = session.id;

  console.log("[stripe-webhook:upgrade] Starting upgrade | session:", stripeSessionId, "| user:", userId, "| old:", oldTier, "| new:", newTier, "| enrollment:", enrollmentId);

  if (!enrollmentId) {
    console.error("[stripe-webhook:upgrade] Missing enrollment_id in metadata");
    return;
  }

  // Idempotency check
  console.log("[stripe-webhook:upgrade] Checking idempotency marker for session:", stripeSessionId);

  const { data: existingUpgrade, error: idempotencyError } = await supabase
    .from("time_logs")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("source", `upgrade:${stripeSessionId}`)
    .maybeSingle();

  if (idempotencyError) {
    console.error("[stripe-webhook:upgrade] Idempotency check error:", idempotencyError);
  }

  if (existingUpgrade) {
    console.log("[stripe-webhook:upgrade] Already processed — skipping. Marker ID:", existingUpgrade.id);
    return;
  }
  console.log("[stripe-webhook:upgrade] No existing marker — proceeding");

  // Get current enrollment
  console.log("[stripe-webhook:upgrade] Fetching enrollment:", enrollmentId);

  const { data: enrollment, error: enrollFetchError } = await supabase
    .from("enrollments")
    .select("id, user_id, expires_at, status")
    .eq("id", enrollmentId)
    .single();

  if (enrollFetchError || !enrollment) {
    console.error("[stripe-webhook:upgrade] Enrollment fetch failed:", { enrollmentId, error: enrollFetchError });
    return;
  }
  console.log("[stripe-webhook:upgrade] Enrollment found:", { id: enrollment.id, status: enrollment.status, expires_at: enrollment.expires_at });

  // Verify ownership
  if (enrollment.user_id !== userId) {
    console.error("[stripe-webhook:upgrade] Ownership mismatch | enrollment:", enrollmentId, "| expected user:", userId, "| actual user:", enrollment.user_id);
    return;
  }

  // Extend expiration
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
  console.log("[stripe-webhook:upgrade] Extending expiration | additional months:", additionalMonths, "| new expires_at:", expiresAt.toISOString());

  // Update enrollment expiration
  const { error: updateError } = await supabase
    .from("enrollments")
    .update({ expires_at: expiresAt.toISOString() })
    .eq("id", enrollmentId);

  if (updateError) {
    console.error("[stripe-webhook:upgrade] Enrollment expiration update FAILED:", updateError);
    return;
  }
  console.log("[stripe-webhook:upgrade] Enrollment expiration update SUCCESS");

  // Update plan tier
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const profileUpdate: Record<string, string> = { plan_tier: newTier };
  if (customerId) {
    profileUpdate.stripe_customer_id = customerId;
  }
  console.log("[stripe-webhook:upgrade] Updating profile | user:", userId, "| data:", profileUpdate);

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (profileError) {
    console.error("[stripe-webhook:upgrade] Profile update FAILED:", profileError);
  } else {
    console.log("[stripe-webhook:upgrade] Profile update SUCCESS");
  }

  // Write idempotency marker
  const { error: markerError } = await supabase.from("time_logs").insert({
    enrollment_id: enrollmentId,
    module_id: null,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    duration_seconds: 0,
    source: `upgrade:${stripeSessionId}`,
  });

  if (markerError) {
    console.error("[stripe-webhook:upgrade] Idempotency marker insert FAILED:", markerError);
  } else {
    console.log("[stripe-webhook:upgrade] Idempotency marker insert SUCCESS");
  }

  console.log("[stripe-webhook:upgrade] DONE | user:", userId, "|", oldTier, "→", newTier, "| expires:", expiresAt.toISOString());
}
