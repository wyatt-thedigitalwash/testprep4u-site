import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripe, FLASH_CARDS_ADDON_PRICE_ID } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseSlug } = await request.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan_tier")
      .eq("id", user.id)
      .single();

    // Pro and Premium users already have flash cards
    if (profile?.plan_tier === "pro" || profile?.plan_tier === "premium") {
      return NextResponse.json(
        { error: "Flash cards are already included in your plan" },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.testprep4u.com";

    const successUrl = courseSlug
      ? `${origin}/dashboard/courses/${courseSlug}/flash-cards?purchase=success`
      : `${origin}/dashboard?purchase=success`;

    const cancelUrl = courseSlug
      ? `${origin}/dashboard/courses/${courseSlug}`
      : `${origin}/dashboard`;

    const params: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: FLASH_CARDS_ADDON_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        addon: "flash-cards",
        course_slug: courseSlug || "",
      },
    };

    if (profile?.stripe_customer_id) {
      params.customer = profile.stripe_customer_id;
    } else {
      params.customer_email = user.email;
    }

    const session = await getStripe().checkout.sessions.create(
      params as Stripe.Checkout.SessionCreateParams
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Flash cards checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
