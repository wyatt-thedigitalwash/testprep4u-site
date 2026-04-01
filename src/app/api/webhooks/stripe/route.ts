import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/send-email";
import { enrollmentEmail } from "@/lib/emails";
import {
  getRevenueFromSession,
  captureBillingAddress as captureBillingFromSessionId,
  type RevenueFields,
} from "@/lib/stripe-revenue";

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

/* ── Shared: create commission payout if affiliate code used ─ */

async function createCommissionPayout(
  discountCode: string,
  revenue: RevenueFields,
  stripeSessionId: string,
  supabase: ReturnType<typeof createAdminClient>,
  logPrefix: string
) {
  // Look up the discount code with its affiliate
  const { data: discountRow } = await supabase
    .from("discount_codes")
    .select("id, affiliate_id")
    .eq("code", discountCode)
    .maybeSingle();

  if (!discountRow?.affiliate_id) return;

  // Look up the affiliate
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, commission_rate, commission_type, is_active")
    .eq("id", discountRow.affiliate_id)
    .single();

  if (!affiliate || !affiliate.is_active) {
    console.log(`${logPrefix} Affiliate not found or inactive — skipping commission`);
    return;
  }

  // Find the redemption record for this session
  const { data: redemption } = await supabase
    .from("discount_code_redemptions")
    .select("id")
    .eq("stripe_checkout_session_id", stripeSessionId)
    .maybeSingle();

  if (!redemption) {
    console.error(`${logPrefix} No redemption found for session — skipping commission`);
    return;
  }

  // Calculate commission
  const commissionAmount =
    affiliate.commission_type === "percentage"
      ? Math.round(revenue.net_amount * (affiliate.commission_rate / 100) * 100) / 100
      : affiliate.commission_rate;

  const grossProfit =
    Math.round((revenue.net_amount - commissionAmount) * 100) / 100;

  const { error } = await supabase.from("commission_payouts").insert({
    affiliate_id: affiliate.id,
    redemption_id: redemption.id,
    commission_amount: commissionAmount,
    gross_profit: grossProfit,
    status: "pending",
  });

  if (error) {
    console.error(`${logPrefix} Commission payout insert FAILED:`, error);
  } else {
    console.log(`${logPrefix} Commission payout created | amount: $${commissionAmount} | gross_profit: $${grossProfit}`);
  }
}

/* ── Shared: track discount redemption from either path ───── */

async function trackDiscountRedemption(
  session: Stripe.Checkout.Session,
  userId: string,
  stripeSessionId: string,
  revenue: RevenueFields,
  supabase: ReturnType<typeof createAdminClient>,
  logPrefix: string
) {
  // Path 1: code was pre-applied on pricing page (stored in metadata)
  let resolvedCode = session.metadata?.discount_code || "";

  // Path 2: code entered on Stripe's checkout page (not in metadata)
  // Detect by retrieving the expanded session and checking discount info
  if (!resolvedCode) {
    try {
      const expanded = await getStripe().checkout.sessions.retrieve(
        stripeSessionId,
        { expand: ["total_details.breakdown"] }
      );

      const discounts = expanded.total_details?.breakdown?.discounts;
      if (discounts && discounts.length > 0) {
        const disc = discounts[0].discount;

        // Try to match by promotion_code ID (stored as stripe_promo_code_id)
        const promoId =
          typeof disc.promotion_code === "string"
            ? disc.promotion_code
            : disc.promotion_code?.id;

        if (promoId) {
          const { data: match } = await supabase
            .from("discount_codes")
            .select("code")
            .eq("stripe_promo_code_id", promoId)
            .maybeSingle();

          if (match) {
            resolvedCode = match.code;
            console.log(
              `${logPrefix} Discount detected via Stripe checkout page (promo): ${resolvedCode}`
            );
          }
        }

        // Fallback: match by coupon ID prefix convention (DISC_{CODE})
        if (!resolvedCode && disc.id) {
          const discId = disc.id;
          if (discId.startsWith("DISC_")) {
            const codeFromId = discId.replace(/^DISC_/, "").replace(/_\d+$/, "");
            const { data: fallback } = await supabase
              .from("discount_codes")
              .select("code")
              .eq("code", codeFromId)
              .maybeSingle();

            if (fallback) {
              resolvedCode = fallback.code;
              console.log(
                `${logPrefix} Discount detected via coupon ID convention: ${resolvedCode}`
              );
            }
          }
        }
      }
    } catch (err) {
      console.error(`${logPrefix} Failed to check Stripe discount:`, err);
    }
  }

  if (!resolvedCode) return;

  console.log(`${logPrefix} Processing discount code redemption: ${resolvedCode}`);

  const { data: discountRow } = await supabase
    .from("discount_codes")
    .select("id, discount_type, discount_value")
    .eq("code", resolvedCode)
    .maybeSingle();

  if (!discountRow) return;

  // Increment current_uses first to prevent max_uses bypass
  const { error: usesError } = await supabase.rpc(
    "increment_discount_uses",
    { code_id: discountRow.id }
  );

  if (usesError) {
    console.error(`${logPrefix} Discount uses increment FAILED:`, usesError);
  } else {
    console.log(`${logPrefix} Discount code uses incremented`);
  }

  // Calculate amount discounted
  const amountDiscounted =
    session.amount_total !== null && session.amount_subtotal !== null
      ? (session.amount_subtotal - session.amount_total) / 100
      : discountRow.discount_value;

  // Create redemption record
  const { error: redemptionError } = await supabase
    .from("discount_code_redemptions")
    .insert({
      discount_code_id: discountRow.id,
      user_id: userId,
      stripe_checkout_session_id: stripeSessionId,
      amount_discounted: Math.abs(amountDiscounted),
    });

  if (redemptionError) {
    console.error(`${logPrefix} Discount redemption insert FAILED:`, redemptionError);
  } else {
    console.log(`${logPrefix} Discount redemption recorded`);
  }

  // Auto-create commission payout if affiliate code
  await createCommissionPayout(
    resolvedCode,
    revenue,
    stripeSessionId,
    supabase,
    logPrefix
  );
}

/* ── Main enrollment handler ────────────────────────────────── */

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

  // Handle flash cards add-on purchases (no tier/courseType in metadata)
  if (session.metadata?.addon === "flash-cards") {
    // TODO: Implement flash cards purchase flow — update user profile or
    // add-ons table to grant flash cards access for this user.
    console.log("[stripe-webhook] Flash cards add-on purchase received | user:", userId, "| session:", session.id);
    return;
  }

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
  if (expiresAt.getMonth() !== targetMonth % 12) {
    expiresAt.setDate(0);
  }

  // ── Retrieve revenue data from Stripe ─────────────────────────
  const revenue = await getRevenueFromSession(stripeSessionId);
  console.log("[stripe-webhook] Revenue data:", revenue);

  // ── Create enrollment (with revenue fields) ───────────────────
  const enrollmentData = {
    user_id: userId,
    course_id: course.id,
    status: "active",
    expires_at: expiresAt.toISOString(),
    stripe_session_id: stripeSessionId,
    gross_amount: revenue.gross_amount,
    discount_amount: revenue.discount_amount,
    tax_amount: revenue.tax_amount,
    fee_amount: revenue.fee_amount,
    net_amount: revenue.net_amount,
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

  // ── Update profile (tier + billing address) ───────────────────
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

  // Capture billing address from Stripe
  await captureBillingFromSessionId(session.id, userId, supabase);

  // ── Track discount code redemption ─────────────────────────────
  // Two paths: (1) code pre-applied on pricing page (in metadata.discount_code),
  // or (2) code entered on Stripe's checkout page (detected via coupon ID).
  await trackDiscountRedemption(
    session,
    userId,
    stripeSessionId,
    revenue,
    supabase,
    "[stripe-webhook]"
  );

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
    if (expiresAt.getMonth() !== targetMonth % 12) {
      expiresAt.setDate(0);
    }
  }
  console.log("[stripe-webhook:upgrade] Extending expiration | additional months:", additionalMonths, "| new expires_at:", expiresAt.toISOString());

  // ── Retrieve revenue data from Stripe ─────────────────────────
  const revenue = await getRevenueFromSession(stripeSessionId);
  console.log("[stripe-webhook:upgrade] Revenue data:", revenue);

  // Update enrollment (expiration + revenue)
  const { error: updateError } = await supabase
    .from("enrollments")
    .update({
      expires_at: expiresAt.toISOString(),
      gross_amount: revenue.gross_amount,
      discount_amount: revenue.discount_amount,
      tax_amount: revenue.tax_amount,
      fee_amount: revenue.fee_amount,
      net_amount: revenue.net_amount,
    })
    .eq("id", enrollmentId);

  if (updateError) {
    console.error("[stripe-webhook:upgrade] Enrollment update FAILED:", updateError);
    return;
  }
  console.log("[stripe-webhook:upgrade] Enrollment update SUCCESS");

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

  // Capture billing address from Stripe
  await captureBillingFromSessionId(session.id, userId, supabase);

  // ── Track discount code redemption + commission ───────────────
  await trackDiscountRedemption(
    session,
    userId,
    stripeSessionId,
    revenue,
    supabase,
    "[stripe-webhook:upgrade]"
  );

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
