# PLAN.md — Slice plan for the M365 Optimiser

Read alongside `SPEC.md` (the full brief) and `CLAUDE.md` (the condensed
operating rules). Each slice below is scoped for one session: implement,
test, `npm run build && npm run lint && npm test`, commit.

## Flags before writing code

Raising these now because they change file structure or sequencing later —
better to agree on them here than discover them mid-slice.

1. **RLS vs. the anonymous free scan.** Slice 1 takes an unauthenticated
   email + company size straight into Supabase, and the free-scan flow
   (slices 1–4, 7) has no login at all — but "RLS on every table from the
   first migration" implicitly assumes a request carries an org/user
   identity to filter on. An anonymous visitor has neither. Proposed
   resolution: anonymous writes (the email-capture row, and free-scan
   uploads/snapshots/findings) go through a Postgres function called via
   the Supabase `anon` role, scoped to insert-only with no select, and
   carry a server-issued opaque `scan_token` instead of an `org_id`; that
   token becomes the row's owner until it's claimed by a real account.
   Flagging because "add the org/user relationship" is a decision, not
   an implementation detail — want a yes/no before slice 3.
2. **Paid unlock happens before auth exists.** Slice 8 (Stripe unlock)
   ships two slices before slice 10 (magic-link auth). A paying customer
   can't "log in" to see their unlocked report yet. Proposed resolution:
   the unlock is keyed to the `scan_token` / org row from flag 1, and the
   post-checkout redirect + emailed link both carry that token — the
   account/login layer in slice 10 then lets the same org be *claimed* by
   a Supabase Auth user, rather than being how access is granted in the
   first place. Want this confirmed before slice 8, since it decides the
   shape of the `organisations` row from slice 1 onward.
3. **Dedup should not pick the *highest*-value finding.** SPEC.md says
   the reconciliation pass keeps "the single highest-value non-overlapping
   finding" per user per SKU. That optimises for the biggest headline
   number, which cuts against rule 3 in CLAUDE.md (never overstate
   savings) — a user hit by both rule 6 (SKU overlap, *Likely*) and rule 7
   (premium tier unused, *Needs review*) should surface the more
   defensible finding, not the pricier one. Building the reconciliation
   pass in slice 6 to prefer highest-*confidence*, tie-broken by lowest
   value, unless told otherwise — this is the one item in this list I'd
   actively push back on the spec for rather than just flag as ambiguous.
4. **Rule 3 has no stated fallback when File D is absent.** SPEC.md is
   explicit that rule 4 downgrades to "Needs review" when File C is
   missing, but says nothing for rule 3 (never-signed-in users) when the
   optional File D isn't supplied. Treating it the same way: rule 3 is
   skipped (returns no findings, not a false "Certain" claim) with a
   note in the report's methodology section when File D is absent, for
   symmetry with rule 4's handling of File C.
5. **50,000-row parse vs. Vercel's serverless timeout.** SPEC.md requires
   a 50k-row parse to finish inside the serverless timeout, but also
   specs Vercel's free tier for as long as possible, which caps function
   duration (10s on Hobby). Flagging now because it affects slice 2/3
   design: parsing needs to be streaming and allocation-light from the
   start, not something retrofitted once a real tenant file times out.
   Will revisit the actual number once we're near a paying customer and
   can justify the Pro-tier upgrade.

None of these block slice 1. They matter starting around slice 3
(persistence) and slice 8 (payments).

## Slices

### 1 — Landing page + free estimate form
**Touches:** `app/page.tsx`, `app/actions/capture-lead.ts` (server
action), `lib/supabase/server.ts`, `supabase/migrations/0001_leads.sql`.
**DoD:** Deployed to Vercel. One headline, one sub-line, one form (work
email + company size), a Supabase insert behind RLS per flag 1, a
thank-you state. No analysis, no upload, no auth. Copy written for a UK
finance director / IT manager: the problem is paying for licences nobody
uses, with no cheap way to find out how many.

### 2 — CSV upload + parse + column mapping UI
**Touches:** `fixtures/clean-80/`, `fixtures/messy-400/`,
`fixtures/broken-export/`, `lib/parsing/canonical-fields.ts`,
`lib/parsing/column-matcher.ts`, `lib/parsing/parse-csv.ts`,
`app/upload/page.tsx`, `components/column-mapping-review.tsx`.
**DoD:** The three golden fixtures exist first, including a
semicolon-delimited UTF-16 file, before the parser is written against
them. Headers fuzzy-match to canonical fields (no hardcoded Microsoft
column names); user sees and can correct the mapping. Parses to memory
only — no database writes yet.

### 3 — Schema validation + snapshot persistence
**Touches:** `lib/parsing/schemas.ts` (zod), `supabase/migrations/0002_*`
(`organisations`, `uploads`, `tenant_snapshot`, `licence_rows`,
`subscriptions`, RLS policies), `lib/pseudonymise.ts`,
`lib/supabase/*`.
**DoD:** Validated rows land in Postgres under RLS (per flag 1 for the
anonymous path). UPNs are pseudonymised before they're written — nothing
downstream of `lib/parsing` ever holds a raw UPN. Bad files fail with a
specific, useful message (not a stack trace).

### 4 — Rule 1 (unassigned licences) end to end
**Touches:** `lib/types.ts` (the `Finding` shape), `lib/rules/
unassigned-licences.ts`, `lib/rules/unassigned-licences.test.ts`,
`supabase/migrations/0003_sku_prices.sql` (seeded empty, per SPEC.md),
`app/report/[snapshotId]/page.tsx`.
**DoD:** Test written first against the messy-400 fixture with a
hand-checked expected saving. This rule sets the template — `Finding`
type, evidence field, file layout — every later rule copies. Upload →
finding → annual saving number rendered on screen.

### 5 — Rules 2–5 + price table
**Touches:** `lib/rules/blocked-users.ts`, `lib/rules/never-signed-in.ts`,
`lib/rules/dormant-users.ts`, `lib/rules/shared-mailbox.ts`, and a
`.test.ts` per file, `lib/pricing/get-price.ts`.
**DoD:** Each rule in its own file, its own test, explicit boundary
cases (exactly 60 days, zero purchased, etc.). No literal GBP figures in
rule files — prices come from `sku_prices`. Rules 4/5 carry caveat text
a customer could push back on (seasonal staff, shared devices) — that
text is treated as a first-class part of the finding, not an
afterthought.

### 6 — Rules 6–10 + deduplication pass
**Touches:** `supabase/migrations/0004_sku_overlaps.sql` (seeded empty,
per SPEC.md), `lib/rules/sku-overlap.ts`, `lib/rules/premium-tier-
unused.ts`, `lib/rules/oversized-tenant.ts`, `lib/rules/unused-addons.ts`,
`lib/rules/billing-term.ts`, `lib/reconciliation/dedupe-findings.ts`,
`lib/reconciliation/dedupe-findings.test.ts`.
**DoD:** Failing test written first proving a user triggering rules 4, 6
and 7 on the same SKU gets summed three times; reconciliation pass fixes
it per the tie-break rule in flag 3. Report shows both gross and
deduplicated net — net never silently replaces gross.

### 7 — Report UI + free/paid gating
**Touches:** `app/report/[snapshotId]/page.tsx` (extended),
`components/report/*`, `lib/report/gate.ts`.
**DoD:** Free view: headline spend, headline saving, saving %, finding
count by category, one CTA. Paid view is fully built but locked behind
the gate from flag 2 — no Stripe integration yet, just the access check
and a "verified assessment" upsell in its place.

### 8 — Stripe Checkout + webhook unlock
**Touches:** `app/api/stripe/webhook/route.ts`, `app/actions/
create-checkout.ts`, `supabase/migrations/0005_payments.sql`.
**DoD:** Test-mode payment unlocks the full report for that org/scan
(per flag 2's token-based access, not login). Webhook signature verified;
webhook handler is idempotent against Stripe retries.

### 9 — PDF generation + Resend delivery
**Touches:** `lib/pdf/report-document.tsx`, `app/api/reports/
[reportId]/pdf/route.ts`, `lib/email/send-report.ts`,
`supabase/migrations/0006_reports.sql`.
**DoD:** Branded Innoligo PDF matches the web report's numbers exactly
(same `Finding[]` in, same component logic where practical) and arrives
by email. No UPNs in PDF metadata (author/producer fields checked
explicitly).

### 10 — Auth, retention job, Sentry, production deploy
**Touches:** `app/login/page.tsx`, `lib/supabase/middleware.ts`,
`supabase/migrations/0007_auth_linkage.sql` (claim flow for flag 1/2's
token-based orgs), `app/api/cron/retention/route.ts` +
`vercel.json` cron entry, `sentry.*.config.ts`.
**DoD:** Magic-link login; existing token-owned orgs can be claimed by a
logged-in user. Retention job hard-deletes raw licence rows after 90
days (30 for free scans) — tested against a backdated fixture row, not
just read from the migration. Sentry wired with PII scrubbing verified
(a UPN sent through a forced test error must not appear in the captured
event).

Ship slice 1 to production on day one and keep it deployable every day
after. If a slice runs long, cut scope inside the slice — never skip
ahead to a later one.
