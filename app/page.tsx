import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const PRICING_TIERS = [
  {
    name: "Free Scan",
    price: "£0",
    unit: "14-day trial",
    description:
      "Upload a usage export, get an instant costed savings estimate. The lead magnet — proves the number before anyone commits budget.",
    features: [
      "Inactive-user, duplicate-license and over-spec findings",
      "Full costed summary in the browser, no install",
      "Sample tenant data included so you can try it in 60 seconds",
    ],
    cta: "Run a free scan",
    href: "/scan",
    highlight: false,
  },
  {
    name: "Paid Assessment",
    price: "£499",
    unit: "one-off, fixed price",
    description:
      "A consultant-verified assessment: every finding checked against the tenant, sign-in logs and CSP invoice before it goes in the report you can act on.",
    features: [
      "Analyst-verified findings (not just the automated scan)",
      "Board-ready costed report with evidence per user",
      "Sets up the gain-share engagement below",
    ],
    cta: "Book an assessment",
    href: "/api/checkout",
    highlight: true,
  },
  {
    name: "Gain Share",
    price: "25%",
    unit: "of verified savings, one-time",
    description:
      "Charged only on savings the client actually banks — license changes they approve and action after the assessment. No savings, no fee.",
    features: [
      "Aligned incentive: we only earn when the client saves",
      "Invoice line-items trace back to source usage-report rows",
      "Typically follows directly on from the Paid Assessment",
    ],
    cta: "See a worked example",
    href: "#worked-example",
    highlight: false,
  },
  {
    name: "Monthly Monitoring",
    price: "from £249",
    unit: "per month, recurring",
    description:
      "License rules and usage drift constantly. Monitoring re-runs the engine monthly so waste doesn't creep back in, and keeps rule logic current.",
    features: [
      "Monthly re-scan with drift/delta reporting",
      "Rule-set maintained as Microsoft changes SKUs and pricing",
      "Early warning before renewal / true-up dates",
    ],
    cta: "Ask about monitoring",
    href: "mailto:amitsh@innoligo.com?subject=M365%20Monthly%20Monitoring",
    highlight: false,
  },
];

const RISKS = [
  {
    title: "Microsoft license rules change often",
    body:
      "SKU names, bundling and feature entitlements are revised by Microsoft on their own schedule, and a rule-set that was correct last quarter can silently mis-price a report today.",
    mitigation:
      "Mitigation: the SKU catalog and rule logic are versioned and reviewed on every Monthly Monitoring cycle; the Paid Assessment includes a manual check against current Microsoft pricing before anything is signed off.",
  },
  {
    title: "Savings must be verifiable, or gain-share invoices get disputed",
    body:
      "A gain-share fee only survives client sign-off if every pound of claimed saving can be traced back to a specific user, a specific license, and a specific piece of evidence.",
    mitigation:
      "Mitigation: every finding in this tool carries its evidence (last-activity dates, the exact overlapping SKUs) inline, and the CSV export is the same row-level data used to invoice — nothing is claimed that isn't traceable to a source row.",
  },
  {
    title: "CSP channel conflict",
    body:
      "If the client's incumbent CSP or reseller resists handing over tenant exports, or feels threatened by license changes recommended by a third party, engagements can stall or turn adversarial.",
    mitigation:
      "Mitigation: the free scan only needs a self-service usage-report export the client can pull themselves (no CSP involvement required to get a number), and the assessment engagement explicitly maps who needs to approve changes before anything is actioned.",
  },
];

const CREDIBILITY = [
  "Microsoft CSP status",
  "Dell Expert Network member",
  "Fixed-price Microsoft assessments already offered at innoligo.com",
  "Built for the UK SME market (50–2,000 employees)",
];

function formatGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

export default function LandingPage() {
  const assessmentFee = 499;
  const exampleVerifiedSavings = 20000;
  const gainShareRate = 0.25;
  const gainShareFee = exampleVerifiedSavings * gainShareRate;
  const month1Revenue = assessmentFee + gainShareFee;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-block rounded-full bg-brand-100 text-brand-700 text-xs font-medium px-3 py-1 mb-4">
                For UK SMEs, 50–2,000 employees
              </p>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink">
                Stop paying for Microsoft 365 licenses nobody is using.
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Upload your tenant&apos;s license mix and usage export. The engine finds inactive users, duplicate
                licenses, and over-specified E3/E5/Business Premium seats — and turns it into a costed savings
                report in minutes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/scan"
                  className="rounded-md bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  Run a free 14-day scan
                </Link>
                <a
                  href="#pricing"
                  className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-ink hover:bg-slate-50 transition-colors"
                >
                  See pricing
                </a>
              </div>
              <p className="mt-3 text-xs text-slate-500">No tenant connection required — works from a self-service CSV export.</p>
            </div>
            <div id="worked-example" className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 scroll-mt-24">
              <p className="text-sm font-medium text-slate-500">Illustrative month-1 revenue per customer</p>
              <p className="mt-2 text-3xl font-bold text-ink">{formatGbp(month1Revenue)}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatGbp(assessmentFee)} assessment + one-time {Math.round(gainShareRate * 100)}% gain-share on{" "}
                {formatGbp(exampleVerifiedSavings)} of verified annual savings
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-t border-slate-100 pt-3">
                  <dt className="text-slate-500">Paid assessment (fixed)</dt>
                  <dd className="font-medium text-ink">{formatGbp(assessmentFee)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">
                    Gain-share (25% × {formatGbp(exampleVerifiedSavings)})
                  </dt>
                  <dd className="font-medium text-ink">{formatGbp(gainShareFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                  <dt className="font-semibold text-ink">Total</dt>
                  <dd className="font-semibold text-ink">{formatGbp(month1Revenue)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Credibility bar */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-wrap gap-x-8 gap-y-2 justify-center text-sm text-slate-500">
            {CREDIBILITY.map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center">How it works</h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Upload or enter your license mix",
                body: "Export the standard Microsoft 365 admin center 'Active users' usage report and upload it, or enter licenses manually for a smaller tenant.",
              },
              {
                step: "2",
                title: "The engine finds the waste",
                body: "Inactive users still holding paid seats, duplicate/overlapping SKUs (e.g. E3 + E5, Business Premium + Business Standard), and E5 seats used like E3.",
              },
              {
                step: "3",
                title: "Get a costed, verifiable report",
                body: "Every finding carries its evidence and a £/month saving. Export it, or turn it into a paid, analyst-verified assessment and gain-share engagement.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-semibold">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-slate-50 border-y border-slate-200">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center">
              Software is the lead magnet. The service carries the revenue.
            </h2>
            <p className="mt-3 text-center text-slate-600 max-w-2xl mx-auto">
              Four ways to engage, in the order most customers move through them.
            </p>
            <div id="pricing-example" className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-xl border p-6 flex flex-col bg-white ${
                    tier.highlight ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200"
                  }`}
                >
                  {tier.highlight && (
                    <span className="inline-block mb-3 self-start rounded-full bg-brand-100 text-brand-700 text-xs font-medium px-2.5 py-0.5">
                      Highest month-1 revenue
                    </span>
                  )}
                  <h3 className="font-semibold text-ink">{tier.name}</h3>
                  <p className="mt-2 text-2xl font-bold text-ink">{tier.price}</p>
                  <p className="text-xs text-slate-500">{tier.unit}</p>
                  <p className="mt-3 text-sm text-slate-600">{tier.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-600 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-brand-600">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={tier.href}
                    className={`mt-6 rounded-md px-4 py-2 text-sm font-medium text-center transition-colors ${
                      tier.highlight
                        ? "bg-brand-600 text-white hover:bg-brand-700"
                        : "border border-slate-300 text-ink hover:bg-slate-50"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Risk */}
        <section id="risk" className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center">Risk &amp; verification</h2>
          <p className="mt-3 text-center text-slate-600 max-w-2xl mx-auto">
            Named up front, with how the product and service model handle each one.
          </p>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {RISKS.map((r) => (
              <div key={r.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-ink">{r.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{r.body}</p>
                <p className="mt-3 text-sm text-brand-700 bg-brand-50 rounded-md p-3">{r.mitigation}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-ink">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">See your number in the next five minutes.</h2>
            <p className="mt-3 text-slate-300 max-w-xl mx-auto">
              Try it with the bundled sample tenant, or upload your own usage export — nothing is stored on a
              server.
            </p>
            <Link
              href="/scan"
              className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-slate-100 transition-colors"
            >
              Run a free scan
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
