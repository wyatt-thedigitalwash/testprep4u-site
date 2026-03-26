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

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
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

  if (!userId || !tier || !courseType) {
    console.error("Webhook missing metadata:", session.metadata);
    return;
  }

  const supabase = createAdminClient();

  // Find the course by type (assumes one course per type per state for now)
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("type", courseType)
    .eq("active", true)
    .limit(1)
    .single();

  if (!course) {
    console.error("No active course found for type:", courseType);
    return;
  }

  // Check for existing enrollment (idempotency)
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (existing) {
    console.log("Enrollment already exists, skipping:", existing.id);
    return;
  }

  // Calculate expiration
  const accessMonths = TIER_ACCESS_MONTHS[tier] ?? 6;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + accessMonths);

  // Create enrollment
  const { error: enrollError } = await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: course.id,
    status: "active",
    expires_at: expiresAt.toISOString(),
  });

  if (enrollError) {
    console.error("Failed to create enrollment:", enrollError);
    return;
  }

  // Update profile with Stripe customer ID and plan tier
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (customerId) {
    await supabase
      .from("profiles")
      .update({
        stripe_customer_id: customerId,
        plan_tier: tier,
      })
      .eq("id", userId);
  }

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
