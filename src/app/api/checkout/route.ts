import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe, getStripePriceId } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier, courseType, discountCode } = await request.json();

    if (!tier || !courseType) {
      return NextResponse.json(
        { error: "Missing tier or courseType" },
        { status: 400 }
      );
    }

    const priceId = getStripePriceId(tier, courseType);
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid tier or course type" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, state")
      .eq("id", user.id)
      .single();

    const userState = profile?.state || "FL";

    const { data: courseRow } = await supabase
      .from("courses")
      .select("slug")
      .eq("type", courseType)
      .eq("state", userState)
      .eq("active", true)
      .limit(1)
      .single();

    const courseSlug =
      courseRow?.slug || `${userState.toLowerCase()}-${courseType}`;

    const params: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.testprep4u.com"}/dashboard?checkout=success`,
      cancel_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://www.testprep4u.com"}/pricing?checkout=cancelled&plan=${tier}&course=${courseType}`,
      metadata: {
        user_id: user.id,
        tier,
        course_type: courseType,
        course_slug: courseSlug,
        discount_code: "",
      },
    };

    if (profile?.stripe_customer_id) {
      params.customer = profile.stripe_customer_id;
    } else {
      params.customer_email = user.email;
    }

    // If a discount code was pre-applied on the pricing page, look up its
    // Stripe promotion code and attach it to the session. This pre-fills
    // the discount on Stripe's checkout page. Also allow users to enter
    // a different code via the promotion code input field.
    if (discountCode && typeof discountCode === "string") {
      const normalizedCode = discountCode.trim().toUpperCase();
      (params.metadata as Record<string, string>).discount_code =
        normalizedCode;

      // Look up the Stripe promotion code ID for this discount code
      const { data: discount } = await supabase
        .from("discount_codes")
        .select("stripe_promo_code_id, is_active")
        .eq("code", normalizedCode)
        .maybeSingle();

      if (discount?.stripe_promo_code_id && discount.is_active) {
        // Pre-apply the discount via Stripe's discounts param.
        // This is compatible with allow_promotion_codes for catalog prices.
        params.discounts = [
          { promotion_code: discount.stripe_promo_code_id },
        ];
      } else {
        // No synced promo code — let users enter it manually on checkout
        params.allow_promotion_codes = true;
      }
    } else {
      // No pre-applied code — show the promo code input field
      params.allow_promotion_codes = true;
    }

    const session = await getStripe().checkout.sessions.create(
      params as Stripe.Checkout.SessionCreateParams
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
