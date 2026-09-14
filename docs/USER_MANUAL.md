# M365 License & Cost Optimizer — User Manual

**Microsoft 365 license audit software for UK SMEs.** Find inactive users, duplicate
licenses, and over-specified E3/E5/Business Premium seats in minutes, get a costed
savings report you can act on, and escalate straight into an analyst-verified
paid assessment when you're ready to action the findings.

This manual covers: how to run a free Microsoft 365 license scan, how to read the
savings report, how data is (and isn't) handled for UK GDPR / Data Protection Act
2018 purposes, and answers to the questions IT managers and procurement/finance
teams ask most often — written so your team can self-serve the tool without a
trip to senior management for sign-off on every step.

---

## 1. What this tool does

The M365 License & Cost Optimizer is a Microsoft 365 cost optimization and
license management tool. Point it at your tenant's license and usage data and it
runs three license audit rules entirely in your browser:

| Rule | What it catches | Recommended action |
| --- | --- | --- |
| **Inactive licenses** | A user holds a paid license with no recorded sign-in activity for 90+ days (configurable), or has never been active | Reclaim the license |
| **Duplicate / overlapping licenses** | A user holds two SKUs where one already contains the other (e.g. Microsoft 365 Business Premium already includes Business Standard; Microsoft 365 E3 already includes Office 365 E3 + EMS E3) | Remove the redundant SKU |
| **Over-specified (E5→E3) licenses** | A user holds an E5-tier license but only shows core-workload activity (Exchange/OneDrive/SharePoint/Teams), with no Viva Engage/Yammer or Skype for Business signal in the lookback window (60 days, configurable) | Downgrade to the E3-equivalent |

Every finding is delivered with its evidence attached (last-activity date, the
exact overlapping SKUs) so the report survives scrutiny from finance, procurement,
or your Microsoft CSP — not just a number with no paper trail.

## 2. Getting started

### Step 1 — Open the free scan

From the homepage, choose **Run a free 14-day scan** or go directly to `/scan`.
No account, login, or tenant connection is required.

### Step 2 — Load your license and usage data

You have three options:

1. **Upload the native Microsoft 365 usage report.** In the Microsoft 365 admin
   center: **Reports → Usage → Active users → Export**. Upload the CSV as-is.
2. **Upload the simplified CSV template.** Use this if your licenses are already
   tracked in a spreadsheet rather than pulled from a live tenant. A blank
   template is bundled under `public/sample-data/simplified-template.csv`.
3. **Enter licenses manually.** Best for small tenants — use the on-screen table
   to add users and assigned SKUs directly, no file needed.

Don't have data handy? Click through with the bundled **sample tenant** data to
see a full report in under 60 seconds before committing your own export.

### Step 3 — Review and adjust engine settings (optional)

The **Engine settings** panel lets you tune:

- The inactivity threshold (default 90 days)
- The E5 over-specification lookback window (default 60 days)
- Indicative UK list prices per SKU, if your CSP rate differs

Adjusting these re-runs the scan instantly — nothing is re-uploaded.

### Step 4 — Read the costed summary

The report opens with a **costed summary**: current spend, addressable
monthly/annual savings, and a breakdown by rule (inactive / duplicate /
over-specified). This is the number to take into a budget conversation without
needing a follow-up analysis first.

### Step 5 — Unlock the full per-user findings table

The detail table — the row-by-row evidence behind the summary number — sits
behind a short lead-capture form (name, company, work email). This is what
turns an anonymous scan into a report your team, or your Paid Assessment
analyst, can act on.

### Step 6 — Export or escalate

- **Export to CSV** for board packs, procurement sign-off, or your CSP renewal
  conversation — the same row-level data doubles as an audit trail.
- **Book a Paid Assessment** directly from the report if you want every finding
  independently verified against the live tenant before you action changes.

## 3. Understanding your report

- **Summary totals** — current annualized license spend, total addressable
  savings, and savings split by rule.
- **Per-user findings table** — one row per flagged user, the rule that fired,
  the SKU(s) involved, the evidence (last activity date / overlapping SKU /
  workload signal), and the £/month saving.
- **Methodology panel** — a plain-English explanation of exactly how each rule
  works and its known limitations (see below), so the report is defensible
  without needing to read source code.

### Known limitations (read before you present the number upward)

- The engine only sees what a standard usage-report export contains. It does
  **not** audit Purview, Defender for Office 365, Power BI Pro, or Teams Phone
  usage — that level of detail is part of the Paid Assessment.
- No live tenant connection (Graph API / admin-center OAuth) is used in this
  version — every scan is a point-in-time snapshot from an export you provide.
- SKUs outside the ~11-SKU catalog (e.g. Visio, Project add-ons) are parsed and
  flagged as "unrecognized product tokens" rather than silently priced at zero.

Being upfront about these limits in the report itself is what lets a finding go
straight to a decision-maker instead of being bounced back down for
re-verification — fewer round trips, fewer senior-management escalations.

## 4. From free scan to paid engagement

| Tier | Price | What it adds |
| --- | --- | --- |
| **Free Scan** | £0 | This tool. Instant, self-service, evidence-backed estimate. |
| **Paid Assessment** | £499 fixed | Every automated finding checked by an analyst against the live tenant, sign-in logs, and your CSP invoice — delivered as a board-ready report. |
| **Gain Share** | 25% of verified savings, one-time | Charged only on savings you actually action after the assessment — no savings, no fee. |
| **Monthly Monitoring** | from £249/month | Recurring re-scans with drift/delta reporting, so reclaimed savings don't quietly creep back. |

Most teams move through these in order: run the free scan to get a defensible
number this week, book the **Paid Assessment** to get it signed off, and move to
**Monthly Monitoring** so the license waste doesn't return at renewal. The
**Book an assessment** button on the report and the pricing section both route
into this upgrade path — that's the intended path from "interesting free tool"
to "budget-approved license optimization subscription."

## 5. Data protection & GDPR compliance

This section explains, accurately and specifically to this application's current
build, what happens to your data — so your Data Protection Officer or
compliance lead can sign off on use without a lengthy separate review.

### 5.1 What data the free scan processes

- **License/usage data** (from your CSV upload or manual entry): parsed and
  analyzed **entirely client-side, in your browser**. The Next.js app is used
  for routing and static hosting only — there is no backend database and
  nothing you upload is transmitted to, or stored on, a server. Closing the
  tab discards the data.
- **Lead-capture details** (name, company, work email) entered to unlock the
  per-user table: in the current build this is a **demonstration gate only** —
  the values are held in browser session state and are not transmitted
  anywhere. This is a deliberate placeholder; see 5.4 below before relying on
  it for a live lead-capture flow.
- **Payment details** for the Paid Assessment: handled entirely by
  **Stripe Checkout**. Card and billing data are entered on Stripe's hosted
  page and processed by Stripe as an independent data controller/processor —
  this application never receives or stores card details itself.

### 5.2 Lawful basis and data minimization

Because the free-scan path performs all processing client-side and discards
data on tab close, it is designed around **data minimization by default**: no
personal data about the M365 tenant's users (names, activity dates, license
assignments) is collected, stored, or retained by the operator of this tool.
The only personal data collected today is the lead-capture form, which — once
wired to a live CRM/email system (see 5.4) — will need its own documented
lawful basis (typically legitimate interest or consent, depending on your
markets) recorded in a privacy notice shown at the point of collection.

### 5.3 International transfers

The Paid Assessment checkout is processed via Stripe, which may process and
store data outside the UK/EEA under its own standard contractual clauses.
Review Stripe's data processing agreement and privacy policy directly if you
require transfer-mechanism documentation for a DPIA.

### 5.4 Before you rely on the lead-capture form in production

The README for this project is explicit that the lead-capture form is
**"currently client-side only, a placeholder for a real CRM/email integration."**
Before treating any data entered there as processed personal data under UK
GDPR, confirm the following are in place once it's wired to a live system:

1. A privacy notice at the point of collection (what's collected, why, lawful
   basis, retention period, and data subject rights).
2. A record of processing activity (Article 30) once volumes justify it.
3. A signed data processing agreement with whichever CRM/email platform
   receives the data.
4. A defined retention period and a documented process for handling access,
   rectification, and erasure requests.

### 5.5 Your rights and how to exercise them

Because the free scan itself does not collect or store personal data about you
or your tenant's users, there is typically nothing to access, rectify, or erase
from this tool for that flow. For data submitted via the lead-capture form
once live, or via Stripe during checkout, requests to exercise UK GDPR rights
(access, rectification, erasure, restriction, portability, objection) should be
sent to the contact in Section 7 — direct GDPR/data-protection questions here
rather than escalating internally, which is usually the fastest way to close
them out without involving senior management.

### 5.6 Security

No server-side storage of tenant data means no server-side data breach surface
for the free scan — there's nothing at rest to exfiltrate. Payment security is
delegated to Stripe's PCI-DSS-compliant infrastructure. If you identify a
security concern, report it per Section 7 rather than through a public channel.

## 6. Frequently asked questions (FAQ)

**Is this a Microsoft-approved or Microsoft-branded tool?**
No. It's an independent Microsoft 365 license optimization and cost-savings
tool built for the CSP/reseller ecosystem; "Microsoft 365" is used descriptively
to identify the licenses it audits.

**Do I need to give this tool access to my tenant?**
No. v1 is export-and-upload only — no Graph API or admin-center OAuth
connection is requested or required. You export a report yourself and upload
it; nothing is pulled from your tenant automatically.

**Is my usage data stored anywhere?**
No. Parsing and analysis run entirely in your browser. There is no backend
database for the free scan. Refreshing or closing the page clears it.

**Is this GDPR compliant?**
The free-scan flow is built around data minimization — no personal data is
collected or retained by the tool for that flow, which is the strongest
position under UK GDPR (there's nothing to process). See Section 5 for the
specific caveats that apply once the lead-capture form or Stripe checkout are
in play, and what still needs to be documented before go-live.

**Why do I need to enter my name, company, and email to see the full report?**
The costed summary is free and unlocked immediately. The per-user evidence
table — the data you'd actually use to action license changes or brief your
CSP — is behind a short form. This is the same information you'd need to
provide to start a Paid Assessment engagement anyway.

**How accurate is the free scan compared to the Paid Assessment?**
The free scan is a strong first estimate based on the standard usage-report
export. It doesn't check Purview, Defender for Office 365, Power BI Pro, or
Teams Phone usage, and it can't verify findings against your CSP invoice or
live sign-in logs — that verification is exactly what the £499 Paid Assessment
adds before you action anything.

**Can I change the inactivity threshold or SKU prices?**
Yes — both are editable in the Engine Settings panel on the scan page, since
"inactive" and your actual CSP rate both vary by organization.

**What license types (SKUs) does it support?**
The bundled catalog (`lib/licenseCatalog.ts`) covers the ~11 most common
Microsoft 365 SKUs (Business Basic/Standard/Premium, Office 365 E1/E3/E5,
Microsoft 365 E3/E5, EMS E3/E5). Anything outside that catalog is flagged as an
"unrecognized product token" rather than silently mispriced.

**Will running this affect my live tenant?**
No. The scan is read-only against the file/data you provide and makes no
changes to Microsoft 365 licenses, users, or settings.

**We want recurring monitoring, not a one-off scan — is that available?**
Monthly Monitoring (from £249/month) is priced on the landing page for exactly
this — recurring re-scans with drift/delta reporting so savings don't quietly
disappear again after a renewal or new-starter wave. Contact us (Section 7) to
set it up.

**Who do we contact for procurement, security review, or a DPIA questionnaire?**
Section 7 below — routing these directly avoids a round trip through internal
management for questions this manual, or a short follow-up email, can usually
answer directly.

## 7. Support & contact

- **General questions, Paid Assessment bookings, Monthly Monitoring:**
  `amitsh@innoligo.com`
- **Data protection / GDPR requests:** use the same address with subject line
  `Data protection request` so it's routed correctly.
- **Bugs or unexpected report output:** include your CSV source (native export
  vs. simplified template) and the engine settings you used — this is usually
  enough to reproduce without a back-and-forth.

---

*This manual describes the v1 scope of the M365 License & Cost Optimizer as
implemented in this repository (see the root `README.md` for the full scope
freeze). Update it alongside any change to data handling, pricing, or the
lead-capture flow so it stays accurate rather than aspirational.*
