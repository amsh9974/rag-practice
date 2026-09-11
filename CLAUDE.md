# CLAUDE.md — Innoligo M365 Licence & Cost Optimiser

This file is read every session. `SPEC.md` is the full brief; this file is
the condensed operating rules for writing code against it. `PLAN.md` has
the slice breakdown. If this file and `SPEC.md` disagree, `SPEC.md` wins —
fix this file, don't silently follow it.

## What this is

A web app that turns Microsoft 365 admin-centre CSV exports into a costed
licence-waste report, as the top of a four-stage sales funnel (free scan →
£499 assessment → 25% gainshare → £99/month monitoring). The product *is*
the rules engine. Everything else — auth, payments, PDF, email — exists to
deliver that engine's output to a customer.

## The three non-negotiable rules

1. **No LLM anywhere in the savings calculation.** Every pound of claimed
   saving comes from deterministic TypeScript running over parsed CSV rows,
   in `lib/rules/`. The model is only ever called to write narrative
   commentary in the report, and only after the numbers are already
   computed — it receives numbers as input, never produces them. If a
   number appears in the PDF, a unit test must be able to prove it.
2. **UPNs are personal data.** A User Principal Name is a customer's staff
   member under UK GDPR. Never log a UPN. Never send one to an LLM API.
   Pseudonymise on ingest (before anything is persisted or processed
   further). Store the pseudonym mapping encrypted. Honour a delete
   request within 24 hours. `Finding.affectedUsers` holds pseudonym ids
   only, never raw UPNs or display names.
3. **Never claim compliance, certification, or guaranteed savings.** Report
   copy says "identified opportunity, subject to verification". Every
   `Finding` carries a `confidence` tier ('Certain' | 'Likely' | 'Needs
   review') and the UI/PDF must always render it next to the number.

## Stack

- **App**: Next.js 15, App Router, TypeScript strict, Tailwind + shadcn/ui.
- **DB + Auth**: Supabase (Postgres, EU/London region), Supabase Auth
  magic link, Row Level Security on every table from the first migration.
- **Payments**: Stripe Checkout + webhooks.
- **Email**: Resend.
- **PDF**: `@react-pdf/renderer`, rendered server-side, sharing components
  with the web report where practical.
- **Parsing**: `papaparse` + `zod` schema validation at the boundary.
- **AI**: Anthropic SDK, narrative-only, one call per report, fed
  already-computed numbers.
- **Hosting**: Vercel.
- **Errors**: Sentry, with PII scrubbing enabled before any customer data
  flows through it.
- **Tests**: Vitest.

**Do not add** (all post-revenue, out of scope for this build):
Microsoft Graph API connectors, admin consent flows, RMM/PSA integrations,
a mobile app, multi-currency support.

Supabase (`@supabase/supabase-js`) and `zod` were added in slice 1, for the
free-estimate lead capture. Stripe and the Anthropic SDK are still not
installed — they get added in the slice that first needs them, not before.

## Folder layout

```
app/                    Next.js App Router routes (pages, layouts, route
                         handlers for webhooks/API, server actions for
                         mutations like uploads and checkout)
components/
  ui/                   shadcn/ui primitives
                         other shared presentational components live
                         directly under components/
lib/
  rules/                One file per rule (see SPEC.md's rule list). Each
                         exports a pure function: (parsed data, price
                         table) -> Finding[]. No I/O, no LLM calls, no
                         Supabase client. This is the most-tested code in
                         the repo.
  reconciliation/        The dedup pass that merges overlapping findings
                         per user per SKU into gross + net.
  parsing/               CSV/XLSX ingest: column fuzzy-matching, canonical
                         field schemas (zod), the mapping-confirmation
                         data flow.
  pricing/                sku_prices / sku_overlaps lookups and the
                         per-engagement price override logic.
  pdf/                   @react-pdf/renderer report templates.
  ai/                    Narrative-only Anthropic calls. Nothing here may
                         compute a saving figure — it only phrases ones
                         already in a Finding.
  supabase/               Server/browser Supabase client helpers. Every
                         query here must be RLS-safe by construction.
  pseudonymise.ts         The single place UPNs get turned into pseudonym
                         ids. Nothing outside lib/parsing and this file
                         should ever see a raw UPN.
  types.ts                Finding and other cross-cutting shared types.
supabase/
  migrations/             SQL migrations. RLS policies ship in the same
                         migration as the table that needs them.
fixtures/                 Golden synthetic tenant CSV sets (clean/messy/
                         broken) + their expected-findings JSON. The
                         regression suite rules are tested against.
```

Co-locate tests next to the source file they cover (`foo.ts` /
`foo.test.ts`), except the fixture-driven regression tests, which live
under `fixtures/` alongside the data they exercise.

## Coding conventions

- TypeScript strict mode, no `any` without a comment explaining why it's
  unavoidable.
- Every rule in `lib/rules/` is a pure function matching the `Finding`
  shape in `SPEC.md`. No side effects, no network calls, no Supabase
  client — this is what makes them unit-testable and what makes "no LLM
  in the savings path" provable rather than just asserted.
- No hardcoded Microsoft list prices, SKU costs, or overlap logic as
  branching `if` statements. Prices come from the seeded `sku_prices`
  table; overlaps come from the seeded `sku_overlaps` table. If a rule
  file has a literal GBP number or a hardcoded SKU-vs-SKU comparison in
  it, that's a bug.
- Column-header matching is fuzzy and user-correctable — never match a
  literal Microsoft column name. Admin-centre exports change headers
  between tenants and UI revisions.
- A rule that lacks the data it needs (e.g. Rule 4 without File C)
  downgrades its findings to `'Needs review'` and says why in the
  `caveat`. It never silently assumes absence means inactivity.
- Every table gets Row Level Security in the same migration that creates
  it. "Add auth later" is not an acceptable sequencing.
- A slice is not done until `npm run build`, `npm run lint`, and
  `npm test` all pass.
- Report and UI copy is commercially plain, written for a UK finance
  director or IT manager — not "we detected anomalous entitlement
  patterns," but "17 licences are assigned to accounts that have been
  blocked from signing in."
