import { NextRequest, NextResponse } from "next/server";
import { getStripe, PAID_ASSESSMENT_PRICE_GBP_PENCE } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Plain-link checkout entry point: GET /api/checkout redirects straight to a hosted
 * Stripe Checkout page for the fixed-price Paid Assessment. Works as a normal <a href>,
 * no client-side JS required.
 */
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    // Stripe isn't configured yet — send the user to the contact flow instead of a broken checkout.
    return NextResponse.redirect(
      `mailto:amitsh@innoligo.com?subject=${encodeURIComponent("M365 License Assessment")}`
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          unit_amount: PAID_ASSESSMENT_PRICE_GBP_PENCE,
          product_data: {
            name: "M365 License & Cost Optimizer — Paid Assessment",
            description:
              "Fixed-price, analyst-verified Microsoft 365 license assessment: every automated finding checked against the live tenant, sign-in logs and CSP invoice, delivered as a board-ready costed report.",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/assessment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
  });

  if (!session.url) {
    return NextResponse.redirect(`${origin}/#pricing`);
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
