# SPEC — Innoligo M365 Licence & Cost Optimiser

## What this is

A web app that takes Microsoft 365 admin-centre CSV exports from a UK SME and produces a costed licence-waste report. It is the top of a four-stage commercial funnel:

```
Free scan (headline saving only)
  → £499 verified assessment (full report + human review)
    → 25% gainshare on verified first-year savings
      → £99/month monitoring
```

The software's job is to generate the headline number that starts a sales conversation. It is not trying to be a full FinOps platform.

**Target customer:** UK SMEs and mid-market, 50–2,000 employees, bought through Innoligo's Microsoft CSP practice.

## Three non-negotiable rules

1. **No LLM anywhere in the savings calculation.** Every pound of claimed saving comes from deterministic TypeScript running over parsed CSV rows. The model is used only to write the narrative commentary in the report, and it is given the already-computed numbers as input. If a number appears in the PDF, a unit test must be able to prove it.
2. **User Principal Names are personal data.** Under UK GDPR this file is a customer's staff list. Never log a UPN, never send one to an LLM API, pseudonymise on ingest, store the mapping encrypted, and honour a delete request within 24 hours.
3. **Never claim compliance, certification, or guaranteed savings.** The report says "identified opportunity, subject to verification". Every finding carries a confidence tier.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 15 (App Router), TypeScript strict | One deployable, server actions for uploads |
| UI | Tailwind + shadcn/ui | Fast, no design debt |
| DB + Auth | Supabase (Postgres, EU/London region), Supabase Auth magic link | Free tier, RLS for tenant isolation |
| Payments | Stripe Checkout + webhooks | No fixed fee until revenue |
| Email | Resend | Free tier covers launch |
| PDF | `@react-pdf/renderer`, server-side | Same components as the web report |
| Parsing | `papaparse` + `zod` | Schema validation at the boundary |
| AI | Anthropic SDK, narrative only | Cheap, one call per report |
| Hosting | Vercel | Free tier until paying customers, then upgrade |
| Errors | Sentry (free tier), with PII scrubbing on | |

**Do not add:** Microsoft Graph API connectors, admin consent flows, RMM/PSA integrations, a mobile app, or multi-currency. All of those are post-revenue.

## Input files

The customer is asked for three exports. Column headers change between tenants and between Microsoft UI revisions, so **build a column-mapping layer, not hardcoded header names**: fuzzy-match to the canonical fields, then show the user a mapping confirmation screen where they can correct it before analysis runs.

**File A — Users and assigned licences**
`Admin centre → Users → Active users → Export users`
Canonical fields: display name, UPN, sign-in blocked (yes/no), assigned licences (delimited SKU list), department, creation date.

**File B — Subscriptions purchased**
`Admin centre → Billing → Your products`
Canonical fields: product/SKU name, quantity purchased, quantity assigned, billing term (monthly/annual), unit price if available.

**File C — Per-service usage**
`Admin centre → Reports → Usage → Active users (per service)` — export the 90-day or 180-day view
Canonical fields: UPN, last activity date per service (Exchange, OneDrive, SharePoint, Teams, Viva Engage), plus the report refresh date.

**Optional File D — Sign-in activity**
`Entra ID → Users → export with last sign-in`, or the "Inactive users" report.

If File C is missing, the engine must still run but downgrade every usage-dependent finding to **Needs review** and say so prominently. Never silently assume a user is inactive because you lack the data.

**Ingest guards:** 25 MB cap, CSV/XLSX only, reject files with no recognisable UPN column, strip BOM, handle semicolon delimiters and UTF-16 (the admin centre emits both), cope with 50,000 rows without timing out.

## The rules engine — this is the product

`lib/rules/` — one file per rule, each exporting a pure function with this shape:

```ts
type Finding = {
  id: string;
  title: string;
  category: 'inactive' | 'unassigned' | 'overlap' | 'oversized' | 'unused-service' | 'commercial';
  affectedUsers: string[];        // pseudonymised ids only
  count: number;
  annualSaving: number;           // GBP
  confidence: 'Certain' | 'Likely' | 'Needs review';
  evidence: string;               // exactly which rows and fields triggered this
  remediation: string;
  caveat?: string;
}
```

**Rules to implement, in this order:**

1. **Unassigned licences** — purchased quantity exceeds assigned quantity. Confidence: *Certain*. This is pure arithmetic on File B and is the most defensible finding in the report. Build this one first and prove it end to end before writing any other rule.
2. **Blocked / disabled users still licensed** — sign-in blocked = yes, licence assigned. *Certain*.
3. **Never-signed-in users** — account created more than 60 days ago, no sign-in ever recorded. *Certain* if File D present.
4. **Dormant users** — no activity across every service in File C for 90+ days. *Likely*. Caveat: seasonal staff, long-term leave, shared-device workers.
5. **Licence on a shared/resource mailbox** — mailbox under 50 GB with a full user licence and no interactive sign-in. *Likely*.
6. **SKU overlap** — a premium suite plus a standalone product whose entitlement the suite already includes (the classic cases: a top-tier suite alongside separate identity-protection, endpoint-security, BI, telephony or audio-conferencing SKUs). Encode the overlap map as **data in a seeded table**, not as branching logic — entitlements change several times a year and you will be editing this constantly. *Likely*.
7. **Premium tier not being used** — top-tier suite assigned, but the usage export shows no activity in any of the features that justify the uplift. Value the finding as the *delta* to the lower tier, never as the full licence cost. *Needs review* — this one always requires a human call.
8. **Sub-300-user tenant on enterprise SKUs** — flag the business-tier alternative where the user count is under the threshold and the entitlement gap is acceptable. Value as the delta. *Needs review*; the gap genuinely matters for some customers.
9. **Unused add-ons** — project, visio, and similar add-ons assigned with no recorded activity. *Likely*.
10. **Billing term** — flag monthly-commitment subscriptions where an annual commitment would cost less, using the customer's own price table. *Likely*, and note the flexibility trade-off.

**Deduplication is mandatory.** A user can trigger rules 4, 6 and 7 at once. Do not sum the same licence three times. Implement a reconciliation pass: per user per SKU, keep only the single highest-value non-overlapping finding, and make the report show both the gross opportunity and the deduplicated net. Write the test for double-counting before you write the reconciliation.

## Pricing data

**Do not hardcode Microsoft list prices anywhere in the rules.** Seed a `sku_prices` table (sku_id, display name, unit price GBP, term, effective date) and leave it empty for me to populate from Innoligo's own CSP price list. Every report must let the operator override unit prices per engagement, because CSP and EA pricing differs from list. Show the price source and effective date on the report so a customer can challenge it.

## Output

**Free tier (unauthenticated, email-gated):** headline annual spend, headline identified saving, saving as a percentage, count of findings by category. No user-level detail, no remediation steps. One CTA: book a verified assessment.

**Paid tier (£499):** everything above, plus per-finding detail with evidence and affected user counts, a prioritised remediation plan, an assumptions and methodology section, the price table used, and a "verified savings" baseline section — the numbers a gainshare agreement will later be measured against. Branded Innoligo PDF, downloadable and emailed.

**Report tone:** commercially plain. "17 licences are assigned to accounts that have been blocked from signing in" — not "we detected anomalous entitlement patterns."

## Data model

```
organisations   (id, name, created_at, retention_expires_at)
users           (Supabase auth, linked to organisation)
uploads         (id, org_id, file_type, original_name, row_count, status, uploaded_at)
tenant_snapshot (id, org_id, upload_batch_id, captured_at)
licence_rows    (snapshot_id, pseudonym_id, sku_id, blocked, last_activity_at, ...)
subscriptions   (snapshot_id, sku_id, purchased, assigned, term, unit_price_override)
sku_prices      (sku_id, name, unit_price_gbp, term, effective_from)
sku_overlaps    (parent_sku, included_sku, note)
findings        (snapshot_id, rule_id, count, annual_saving, confidence, evidence_json)
reports         (id, snapshot_id, tier, pdf_url, generated_at)
payments        (stripe_session_id, org_id, product, amount, status)
```

Row Level Security on every table from the first migration — never "add auth later". Uploads carry a retention date; a scheduled job hard-deletes raw licence rows after 90 days by default, 30 days for free scans.

## Testing

- **Golden fixtures.** Build three synthetic tenant CSV sets in `fixtures/`: a clean 80-user tenant with almost nothing to find, a messy 400-user tenant with known planted waste, and a broken export (wrong delimiter, missing columns, 5,000 rows). Each has an expected-findings JSON. These are the regression suite.
- Unit tests per rule, including the boundary cases (exactly 60 days, exactly 300 users, zero purchased).
- One test asserting no double-counting across rules 4/6/7.
- One test asserting no UPN appears in any log line or any outbound AI request payload.
- A synthetic 50,000-row parse must finish inside the serverless timeout.

Every slice ships with its tests. A slice is not done if `npm run build`, `npm run lint` and `npm test` don't all pass.

## The 10 vertical slices

| # | Slice | Definition of done |
|---|---|---|
| 1 | Landing page + free estimate form | Deployed on Vercel, captures email to Supabase, no analysis yet |
| 2 | CSV upload + parse + column mapping UI | Three fixture files parse; user can correct a mis-mapped column |
| 3 | Schema validation + snapshot persistence | Rows land in Postgres under RLS; bad files fail with a useful message |
| 4 | Rule 1 (unassigned licences) end to end | Upload → one finding → number on screen, with a passing test |
| 5 | Rules 2–5 + price table | Four more rules, prices from the seeded table not constants |
| 6 | Rules 6–10 + deduplication pass | Gross and net savings both shown; double-count test passes |
| 7 | Report UI + free/paid gating | Free view shows headline only; paid view is built but locked |
| 8 | Stripe Checkout + webhook unlock | Test-mode payment unlocks the full report for that org |
| 9 | PDF generation + Resend delivery | Branded PDF matches the web report, arrives by email |
| 10 | Auth, retention job, Sentry, production deploy | Magic-link login, deletion job scheduled, PII scrubbing verified |

Ship slice 1 to production on day one and keep it deployable every day after. If a slice runs long, cut scope inside the slice — never skip ahead to a later one.

## Two things to do outside Claude Code

**Populate the price table yourself.** The engine is only as credible as its prices, and yours come from the CSP portal, not from a model's memory. Every wrong price in a first report costs you the meeting.

**Derive the overlap map from a real tenant.** Before slice 6, open one tenant you already have access to, list which standalone SKUs are sitting alongside which suites, and encode what you actually see. Microsoft's entitlement matrix moves; your own observed data is better than any published summary.

Then run the first three assessments by hand alongside the software and compare the outputs. Where the engine and your judgement disagree, the engine is usually wrong — and that disagreement is the real specification for version two.
