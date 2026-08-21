# Roadmap

The brief's long-term vision:

```
Invoice Fraud → Financial Analysis → KYC/KYB → AML Risk → Supplier Risk
  → Transaction Monitoring → Continuous Financial Risk Intelligence
```

## Shipped (this repository)

- **AI Invoice Fraud & Financial Document Checker** (MVP) — Document
  Intelligence, Invoice Intelligence, Fraud Detection, Risk Scoring,
  Investigation and Reporting agents; deterministic calculation engine;
  demonstration scenario with planted anomalies; test suite.

## Next: Financial Statement Analysis Agent

- Deterministic ratio engine (revenue growth, gross/EBITDA/operating
  margin, current/quick ratio, debt-to-equity, working capital) alongside
  the existing calculation engine philosophy — no LLM in the arithmetic.
- Anomaly detection over period-on-period statement data (sudden revenue
  jumps, margin swings, receivables/payables drift, profit-vs-cash-flow
  divergence).
- Plain-English explanation layer reusing the `Finding` model already
  defined in `innoligo/models.py`, so risk scoring and reporting agents
  need no changes to support a second finding source.

## Then: KYC & KYB Risk Agent

- New `innoligo/agents/kyc_kyb.py` producing `Finding`s for identity/company
  inconsistencies, missing information, duplicate identities and
  ownership-structure red flags.
- Explicit separation in the report between **AI document analysis**
  (what this repo does) and **external verification** (Companies House,
  sanctions/PEP lists, trusted data sources) — the investigation agent
  already lists this as "additional evidence requested" for supplier
  address/VAT mismatches; KYC/KYB extends the same pattern to directors,
  beneficial owners and corporate structures.
- Never state a company or person "is fraudulent" from the AI score alone
  — enforced by the same finding-language rules as the invoice checker.

## Then: Financial Modelling Agent

- Revenue/cost/P&L/cash-flow/balance-sheet forecasting engine (deterministic
  spreadsheet-style calculations, not LLM arithmetic).
- Base / Optimistic / Conservative scenarios with sensitivity analysis.
- Explicit three-way tagging of every number as **Actual Data**, **User
  Assumption**, or **AI-generated Estimate**.

## Later: AML Risk, Transaction Monitoring, Continuous Risk Intelligence

- Combine invoice, financial-statement and KYC/KYB signals into an ongoing
  monitoring feed rather than a one-off check — the `RiskAssessment`
  model already supports aggregating findings from multiple agents; the
  main new work is a persistence/monitoring layer plus a "risk changed
  since last check" delta view for compliance teams.

## Design constraints that carry forward

- Deterministic calculation engine, AI for understanding/reasoning/
  narrative only.
- Every finding must answer: what happened, why suspicious, what evidence,
  how serious, what to do next.
- Human-in-the-loop language and final decision-making at every stage.
- New agents add `Finding`s into the existing `RiskAssessment`/reporting
  pipeline rather than building parallel scoring systems.
