import Stripe from "stripe";

let cachedClient: Stripe | null = null;

/** Lazily construct the Stripe client so a missing key only fails requests that need it. */
export function getStripe(): Stripe {
  if (!cachedClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    cachedClient = new Stripe(key);
  }
  return cachedClient;
}

/** Price, in pence, for the fixed-price Paid Assessment — keep in sync with the £499 shown in the UI. */
export const PAID_ASSESSMENT_PRICE_GBP_PENCE = 49900;
