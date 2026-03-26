import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

// Maps tier slug + course type to a Stripe Price ID.
// Populate these after creating products in the Stripe Dashboard.
// Each key is "{tier}-{courseType}", e.g. "pro-life".
export const STRIPE_PRICE_IDS: Record<string, string> = {
  "essentials-life": "price_1TEwY6Dud8ZjhEeELhVF6vJO",
  "pro-life": "price_1TEwZhDud8ZjhEeENZRHobFz",
  "premium-life": "price_1TEwZhDud8ZjhEeE7lvrvNKv",
  "essentials-health": "price_1TEwanDud8ZjhEeELi5OVceR",
  "pro-health": "price_1TEwbUDud8ZjhEeEitlTnqJM",
  "premium-health": "price_1TEwbUDud8ZjhEeEJf02ZOt2",
  "essentials-combined": "price_1TEwbrDud8ZjhEeEGWSsQEKB",
  "pro-combined": "price_1TEwcSDud8ZjhEeE5VaibXGB",
  "premium-combined": "price_1TEwcSDud8ZjhEeE8bom4Ptb",
};

export function getStripePriceId(
  tier: string,
  courseType: string
): string | undefined {
  return STRIPE_PRICE_IDS[`${tier}-${courseType}`];
}
