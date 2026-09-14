import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PAID_ASSESSMENT_PRICE_GBP_PENCE } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Temporary diagnostic endpoint — reports env var wiring and the exact Stripe error, if any,
 * without exposing full secret values. Remove once checkout is confirmed working.
 */
export async function GET() {
  const secretRaw = process.env.STRIPE_SECRET_KEY;
  const pubRaw = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const secret = secretRaw?.trim();
  const pub = pubRaw?.trim();

  const report: Record<string, unknown> = {
    STRIPE_SECRET_KEY: {
      present: !!secretRaw,
      length: secretRaw?.length ?? 0,
      hasWhitespace: secretRaw !== secret,
      prefix: secret ? secret.slice(0, 8) : null,
      looksLikeSecretKey: !!secret && /^sk_(test|live)_/.test(secret),
    },
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
      present: !!pubRaw,
      length: pubRaw?.length ?? 0,
      hasWhitespace: pubRaw !== pub,
      prefix: pub ? pub.slice(0, 8) : null,
      looksLikePublishableKey: !!pub && /^pk_(test|live)_/.test(pub),
    },
  };

  if (!secret) {
    report.result = "FAIL: STRIPE_SECRET_KEY is not set in this deployment's environment.";
    return NextResponse.json(report, { status: 200 });
  }

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: PAID_ASSESSMENT_PRICE_GBP_PENCE,
            product_data: { name: "Debug test session" },
          },
          quantity: 1,
        },
      ],
      managed_payments: { enabled: false },
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
    });
    report.result = "OK: Stripe session created successfully.";
    report.sessionId = session.id;
    report.sessionUrl = session.url;
  } catch (err) {
    report.result = "FAIL: Stripe rejected the session creation.";
    if (err instanceof Stripe.errors.StripeError) {
      report.stripeError = {
        type: err.type,
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      };
    } else {
      report.error = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(report, { status: 200 });
}
