# M365 License & Cost Optimizer

Upload (or enter) a Microsoft 365 tenant's license mix and usage. The engine finds inactive
users, duplicate/overlapping licenses, and over-specified E3/E5/Business Premium seats, and
turns it into a costed, evidence-backed savings report.

Software is the lead magnet; the service carries the revenue. This app is the free-scan half
of that model — it exists to produce a defensible number in minutes and hand off into a paid
engagement.

## Scope freeze (v1)

This is the scope agreed for the first build. Anything not listed here is deliberately out.

**In scope**

- Two input paths: upload the native Microsoft 365 admin center "Active users" usage-report
  CSV (Reports → Usage → Active users → Export), or enter a small tenant's licenses manually.
  A simplified CSV template is also supported for tenants that already track licenses in a
  spreadsheet.
- Three rules, run entirely client-side:
  1. **Inactive** — a user holds a paid license and has no recorded activity for ≥ the
     inactivity threshold (default 90 days, or never active) → recommend full reclaim.
  2. **Duplicate / overlapping** — a user holds two or more licenses where one SKU's
     functionality is already contained in another assigned SKU (e.g. Business Premium
     already includes Business Standard; Microsoft 365 E3 already includes Office 365 E3 and
     EMS E3) → recommend removing the redundant SKU.
  3. **Over-specified** — a user holds an E5-tier license but their tracked activity is
     limited to core workloads (Exchange/OneDrive/SharePoint/Teams) with no Yammer/Viva
     Engage or Skype for Business signal in the lookback window (default 60 days) →
     recommend downgrading to the E3-equivalent. This is an explicit proxy signal — it does
     not check Purview, Defender for Office 365, Power BI Pro or Teams Phone usage, which is
     part of what the Paid Assessment adds.
- A costed summary (current spend, addressable monthly/annual savings, breakdown by rule)
  and a per-user findings table, each row carrying its evidence, CSV-exportable — this is
  the traceability a gain-share invoice needs to survive a dispute.
- An editable SKU price table (indicative UK list prices) and editable thresholds, since the
  client's actual CSP rate and what counts as "inactive" both vary.
- A landing page carrying the commercial model, the illustrative month-1 revenue worked
  example, and the three named risks with how the product/service model handles each.
- A lightweight lead-capture gate in front of the detail table (name/company/email) —
  currently client-side only, a placeholder for a real CRM/email integration.

**Out of scope for v1** (flagged, not silently dropped)

- Any live connection to a tenant (Graph API, admin center OAuth). v1 is export-and-upload
  only, by design — it's also the answer to the CSP-channel-conflict risk (no incumbent CSP
  access needed to get a number).
- Payment processing / billing for the Paid Assessment, Gain Share or Monthly Monitoring
  tiers. CTAs are `mailto:` links into the sales process, not checkout flows.
- Persistence — nothing is stored server-side; there is no backend. Each scan is a single
  browser session. Monthly Monitoring (recurring re-scans with drift/delta reporting) is
  priced on the landing page but not built — it needs storage and scheduling, which is a v2
  decision once the free-scan → paid-assessment funnel is validated.
- Full E5 feature-usage audit (Purview, Defender for Office 365, Power BI Pro, Teams Phone).
  The current engine only has access to what the standard usage-report export contains.
- CRM/email wiring for the lead-capture form.
- Any SKU outside the ~11-SKU catalog in `lib/licenseCatalog.ts` (add-ons like Visio, Project,
  Power BI Pro, Teams Phone are parsed but currently priced at £0 / ignored for savings math,
  and surfaced back to the user as "unrecognized product tokens" so nothing is silently
  mispriced).

## Commercial model

| Tier | Price | Notes |
| --- | --- | --- |
| Free Scan | £0 | 14-day trial framing; this app |
| Paid Assessment | £499, fixed | Analyst-verified findings against the live tenant |
| Gain Share | 25% of verified savings, one-time | Only charged on savings the client actions |
| Monthly Monitoring | from £249/month | Not built in v1 — priced on the landing page only |

Illustrative month-1 revenue per customer: £499 assessment + 25% × £20,000 verified annual
savings = **£5,499**.

## Risks (named on the landing page and in the report's methodology panel)

1. **Microsoft license rules change often** — SKU catalog and rules are versioned; the Paid
   Assessment re-checks against current Microsoft pricing.
2. **Savings must be verifiable, or gain-share invoices get disputed** — every finding
   carries its evidence inline; the CSV export is the same row-level data used to invoice.
3. **CSP channel conflict** — the free scan only needs a self-service export, not incumbent
   CSP access; actioning changes may still need their cooperation.

## Documentation

- [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md) — end-user instructions, GDPR/data-protection
  details, and FAQ for the free scan and the paid tiers.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run typecheck
```

No environment variables, database, or external API keys are required — the app is fully
client-side (Next.js App Router used for routing/static hosting only).

## Project layout

- `lib/licenseCatalog.ts` — SKU catalog, indicative UK prices, and the containment map used
  for duplicate detection.
- `lib/parseUsageReport.ts` — parses both supported CSV formats into a common `UserRecord`.
- `lib/engine.ts` — the three rules, savings math, and summary totals.
- `app/page.tsx` — landing page (pricing, risk, ICP).
- `app/scan/page.tsx` + `components/*` — the free-scan tool (upload/manual entry, engine
  run, report, lead gate, CTA into the Paid Assessment).
- `public/sample-data/` — a bundled demo tenant (native format) and a blank simplified
  template, so the free scan works instantly without a real tenant export.

## Target ICP

UK SMEs, 50–2,000 employees, leveraging existing Microsoft CSP status, Dell Expert Network
membership, the fixed-price Microsoft assessments already offered at innoligo.com, and the
existing UK SME target list.
