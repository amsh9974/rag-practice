import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { IconCheck, IconFileCheck } from "@/components/Icons";
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

      <main className="relative flex-1 overflow-hidden bg-slate-50">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_10%,transparent_70%)]"
        />
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-24">
          {details.status === "paid" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-card">
              <div className="mx-auto h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                <IconCheck className="h-7 w-7" />
              </div>
              <h1 className="mt-6 text-3xl font-bold text-ink tracking-tight">Payment received</h1>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Thanks{details.email ? ` — a receipt is on its way to ${details.email}` : ""}. Your Paid
                Assessment
                {details.amountPence !== null ? ` (${formatGbp(details.amountPence)})` : ""} is booked.
              </p>
              <div className="mt-7 rounded-xl bg-slate-50 border border-slate-200 p-6 text-left text-sm text-slate-600">
                <p className="font-semibold text-ink mb-3 flex items-center gap-2">
                  <IconFileCheck className="h-4 w-4 text-brand-600" />
                  What happens next
                </p>
                <ul className="space-y-2.5">
                  <li className="flex gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                    We&apos;ll email you within 1 business day to arrange the tenant usage export
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                    Every automated finding is re-verified against the live tenant and CSP invoice
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                    You get a board-ready, costed report — the basis for any Gain Share engagement after
                  </li>
                </ul>
              </div>
              <p className="mt-7 text-xs text-slate-400">
                Questions in the meantime? Email{" "}
                <a className="text-brand-600 hover:underline" href="mailto:amitsh@innoligo.com">
                  amitsh@innoligo.com
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-card">
              <h1 className="text-2xl font-bold text-ink tracking-tight">We couldn&apos;t confirm this payment</h1>
              <p className="mt-3 text-slate-600 leading-relaxed">
                If you completed checkout, this is most likely just a delay — check your email for a Stripe
                receipt. If something went wrong, no charge should have gone through.
              </p>
              <a
                href="mailto:amitsh@innoligo.com?subject=M365%20License%20Assessment%20-%20Payment%20check"
                className="mt-7 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
              >
                Contact us
              </a>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
