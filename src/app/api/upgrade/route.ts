import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { PRICING_TIERS } from "@/lib/pricing";
import type { CourseType } from "@/lib/pricing";

const TIER_RANK: Record<string, number> = {
  essentials: 1,
  pro: 2,
  premium: 3,
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  life: "Life Insurance",
  health: "Health Insurance",
  combined: "Life & Health Insurance",
};

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetTier, courseType, enrollmentId, discountCode } =
      await request.json();

    if (!targetTier || !courseType || !enrollmentId) {
      return NextResponse.json(
        { error: "Missing targetTier, courseType, or enrollmentId" },
        { status: 400 }
      );
    }

    if (!TIER_RANK[targetTier]) {
      return NextResponse.json(
        { error: "Invalid target tier" },
        { status: 400 }
      );
    }

    // Get current plan tier
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan_tier, stripe_customer_id, state")
      .eq("id", user.id)
      .single();

    const currentTier = profile?.plan_tier || "essentials";

    if ((TIER_RANK[targetTier] || 0) <= (TIER_RANK[currentTier] || 0)) {
      return NextResponse.json(
        { error: "Target tier must be higher than current tier" },
        { status: 400 }
      );
    }

    // Verify enrollment ownership
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, user_id, status, course_id")
      .eq("id", enrollmentId)
      .single();

    if (!enrollment || enrollment.user_id !== user.id) {
      return NextResponse.json(
        { error: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (enrollment.status !== "active") {
      return NextResponse.json(
        { error: "Enrollment is not active" },
        { status: 400 }
      );
    }

    // Calculate price difference
    const ct = courseType as CourseType;
    const currentTierData = PRICING_TIERS.find((t) => t.slug === currentTier);
    const targetTierData = PRICING_TIERS.find((t) => t.slug === targetTier);

    if (!currentTierData || !targetTierData) {
      return NextResponse.json(
        { error: "Invalid tier configuration" },
        { status: 400 }
      );
    }

    const currentPrice =
      currentTierData.prices[ct] || currentTierData.prices.life;
    const targetPrice =
      targetTierData.prices[ct] || targetTierData.prices.life;
    const priceDifference = targetPrice - currentPrice;

    if (priceDifference <= 0) {
      return NextResponse.json(
        { error: "No price difference for this upgrade" },
        { status: 400 }
      );
    }

    // Get state for description
    const userState = profile?.state || "FL";
    const stateLabel = userState === "FL" ? "Florida" : userState;
    const courseLabel = COURSE_TYPE_LABELS[courseType] || courseType;
    const currentLabel =
      currentTier.charAt(0).toUpperCase() + currentTier.slice(1);
    const targetLabel =
      targetTier.charAt(0).toUpperCase() + targetTier.slice(1);

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.testprep4u.com";

    // Note: allow_promotion_codes is NOT set here because Stripe doesn't
    // support promotion codes with price_data line items. Discount codes
    // for upgrades are applied via the UpgradeSection UI and stored in metadata.
    const params: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: priceDifference * 100, // Stripe expects cents
            product_data: {
              name: `Upgrade from ${currentLabel} to ${targetLabel}`,
              description: `${stateLabel} ${courseLabel} — plan upgrade`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/settings?upgrade=success`,
      cancel_url: `${origin}/dashboard/settings?upgrade=cancelled`,
      metadata: {
        user_id: user.id,
        tier: targetTier,
        course_type: courseType,
        upgrade: "true",
        enrollment_id: enrollmentId,
        old_tier: currentTier,
        discount_code: "",
      },
    };

    if (profile?.stripe_customer_id) {
      params.customer = profile.stripe_customer_id;
    } else {
      params.customer_email = user.email;
    }

    // Store discount code in metadata for webhook tracking.
    // Stripe's promotion code field handles the actual discount.
    if (discountCode && typeof discountCode === "string") {
      (params.metadata as Record<string, string>).discount_code =
        discountCode.trim().toUpperCase();
    }

    const session = await getStripe().checkout.sessions.create(
      params as Stripe.Checkout.SessionCreateParams
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Upgrade checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create upgrade checkout" },
      { status: 500 }
    );
  }
}
