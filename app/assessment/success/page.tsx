import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function formatGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

interface PaymentDetails {
  status: "paid" | "unpaid" | "unverified";
  amountPence: number | null;
  email: string | null;
}

async function getPaymentDetails(sessionId: string | undefined): Promise<PaymentDetails> {
  if (!sessionId) return { status: "unverified", amountPence: null, email: null };
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      status: session.payment_status === "paid" ? "paid" : "unpaid",
      amountPence: session.amount_total,
      email: session.customer_details?.email ?? null,
    };
  } catch {
    return { status: "unverified", amountPence: null, email: null };
  }
}

export default async function AssessmentSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const details = await getPaymentDetails(searchParams.session_id);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-24">
          {details.status === "paid" ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl">
                ✓
              </div>
              <h1 className="mt-5 text-2xl font-bold text-ink">Payment received</h1>
              <p className="mt-2 text-slate-600">
                Thanks{details.email ? ` — a receipt is on its way to ${details.email}` : ""}. Your Paid
                Assessment
                {details.amountPence !== null ? ` (${formatGbp(details.amountPence)})` : ""} is booked.
              </p>
              <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-5 text-left text-sm text-slate-600">
                <p className="font-medium text-ink mb-2">What happens next</p>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>We&apos;ll email you within 1 business day to arrange the tenant usage export</li>
                  <li>Every automated finding is re-verified against the live tenant and CSP invoice</li>
                  <li>You get a board-ready, costed report — the basis for any Gain Share engagement after</li>
                </ul>
              </div>
              <p className="mt-6 text-xs text-slate-400">
                Questions in the meantime? Email{" "}
                <a className="text-brand-600 hover:underline" href="mailto:amitsh@innoligo.com">
                  amitsh@innoligo.com
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <h1 className="text-2xl font-bold text-ink">We couldn&apos;t confirm this payment</h1>
              <p className="mt-2 text-slate-600">
                If you completed checkout, this is most likely just a delay — check your email for a Stripe
                receipt. If something went wrong, no charge should have gone through.
              </p>
              <a
                href="mailto:amitsh@innoligo.com?subject=M365%20License%20Assessment%20-%20Payment%20check"
                className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Contact us
              </a>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-brand-600 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
