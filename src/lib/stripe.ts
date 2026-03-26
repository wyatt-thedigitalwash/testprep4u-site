import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

// Maps tier slug + course type to a Stripe Price ID.
// Populate these after creating products in the Stripe Dashboard.
// Each key is "{tier}-{courseType}", e.g. "pro-life".
export const STRIPE_PRICE_IDS: Record<string, string> = {
  "essentials-life": "price_1TFHFmDpayTd63L242sqQPIQ",
  "pro-life": "price_1TFHTTDpayTd63L2KP4CvRCX",
  "premium-life": "price_1TFHTTDpayTd63L2qqQBXf8A",
  "essentials-health": "price_1TFHGzDpayTd63L2GrHVjCZC",
  "pro-health": "price_1TFHUCDpayTd63L2VSAMjZn7",
  "premium-health": "price_1TFHUCDpayTd63L2nQOOYhix",
  "essentials-combined": "price_1TFHHYDpayTd63L22KAIJrp6",
  "pro-combined": "price_1TFHVDDpayTd63L2F85ZIAbG",
  "premium-combined": "price_1TFHVDDpayTd63L2vdktgL3c",
};

export function getStripePriceId(
  tier: string,
  courseType: string
): string | undefined {
  return STRIPE_PRICE_IDS[`${tier}-${courseType}`];
}
