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

    const { tier, courseType } = await request.json();

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

    // Look up existing Stripe customer ID from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    // Build checkout session params
    const params: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.headers.get("origin")}/dashboard?checkout=success`,
      cancel_url: `${request.headers.get("origin")}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        tier,
        course_type: courseType,
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
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
