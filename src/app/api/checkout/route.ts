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

    // Resolve the course slug so the webhook can look up by slug (safe for multi-state)
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, state")
      .eq("id", user.id)
      .single();

    const userState = profile?.state || "FL";

    // Find the matching course slug for this user's state + course type
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

    // Build checkout session params
    // allow_promotion_codes lets users enter codes on the Stripe checkout page.
    // If a code was pre-applied on the pricing page, we store it in metadata
    // so the webhook can track the redemption even if Stripe handles the discount.
    const params: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
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

    // If a discount code was pre-applied on the pricing page, store it in
    // metadata for webhook tracking. Stripe's promotion code field will
    // handle the actual discount application on the checkout page.
    if (discountCode && typeof discountCode === "string") {
      (params.metadata as Record<string, string>).discount_code =
        discountCode.trim().toUpperCase();
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
