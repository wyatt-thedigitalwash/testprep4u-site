// Shared Stripe revenue helpers used by the webhook handler and backfill route.

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type { createAdminClient } from "@/lib/supabase/server";

export interface RevenueFields {
  gross_amount: number;
  discount_amount: number;
  tax_amount: number;
  fee_amount: number;
  net_amount: number;
}

export async function getRevenueFromSession(
  sessionId: string
): Promise<RevenueFields> {
  try {
    const expanded = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "total_details.breakdown"],
    });

    const grossCents = expanded.amount_subtotal ?? 0;
    const totalCents = expanded.amount_total ?? 0;
    const taxCents = expanded.total_details?.amount_tax ?? 0;

    // Discount: sum of all discount amounts from breakdown
    let discountCents = 0;
    const breakdown = expanded.total_details?.breakdown;
    if (breakdown?.discounts && breakdown.discounts.length > 0) {
      for (const d of breakdown.discounts) {
        discountCents += d.amount;
      }
    }

    const gross = grossCents / 100;
    const discount = discountCents > 0 ? -(discountCents / 100) : 0;
    const tax = taxCents > 0 ? -(taxCents / 100) : 0;
    // TODO: Replace fee estimate with actual Stripe Balance Transaction API
    // lookup for precise fee. This uses the standard 2.9% + $0.30 estimate.
    const fee = totalCents > 0 ? -((totalCents * 0.029 + 30) / 100) : 0;
    const feeRounded = Math.round(fee * 100) / 100;
    const net = Math.round((gross + discount + tax + feeRounded) * 100) / 100;

    return {
      gross_amount: gross,
      discount_amount: discount,
      tax_amount: tax,
      fee_amount: feeRounded,
      net_amount: net,
    };
  } catch (err) {
    console.error("[stripe-revenue] Failed to retrieve expanded session:", err);
    return {
      gross_amount: 0,
      discount_amount: 0,
      tax_amount: 0,
      fee_amount: 0,
      net_amount: 0,
    };
  }
}

export async function captureBillingAddress(
  sessionId: string,
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const address = session.customer_details?.address;
    if (!address) return;

    const billingUpdate: Record<string, string | null> = {};
    if (address.line1)
      billingUpdate.billing_street =
        address.line1 + (address.line2 ? `, ${address.line2}` : "");
    if (address.city) billingUpdate.billing_city = address.city;
    if (address.state) billingUpdate.billing_state = address.state;
    if (address.postal_code) billingUpdate.billing_zip = address.postal_code;

    if (Object.keys(billingUpdate).length > 0) {
      await supabase
        .from("profiles")
        .update(billingUpdate)
        .eq("id", userId);
    }
  } catch {
    // Non-critical — don't block on billing capture failure
  }
}
