# Innoligo AI Financial Risk & Fraud Intelligence — Product Positioning

## Positioning

**Innoligo AI Financial Risk & Fraud Intelligence** is an AI-powered
**decision-support platform**, not a system that automatically declares a
person or company fraudulent. It analyses financial documents, invoices,
billing records, KYC/KYB information and related business data to surface
potential fraud indicators, financial anomalies, inconsistencies and
compliance risks — and explains its reasoning so a human investigator can
act on it.

**Tagline:** *Detect anomalies. Reduce financial risk. Make better decisions.*
**Alternative:** *AI-powered financial intelligence for fraud, billing and compliance.*

## Target segments

SMEs · Financial services · Accountancy firms · Procurement teams ·
Insurance companies · FinTech · Retail · Manufacturing · Professional
services · Regulated businesses.

## Why this framing, not "financial modelling"

Financial modelling is one of eight capabilities in the long-term vision
(see [ROADMAP.md](ROADMAP.md)), but it is not what makes this defensible
or differentiated. Fraud, billing and compliance risk is: it has clear
buyers (finance, procurement, compliance teams), a quantifiable ROI (money
not lost to fraud, hours not spent on manual reconciliation), and a
natural expansion path into adjacent, higher-value risk domains.

## The five core use cases (long-term)

1. **AI Document Fraud Detection** — altered figures, inconsistent dates,
   duplicate documents, suspicious formatting, tampering.
2. **AI Invoice & Billing Fraud Agent** — duplicate/invalid invoices,
   invoice splitting, supplier bank-account changes, PO/goods/payment
   reconciliation. **This is the MVP**, see below.
3. **KYC & KYB Risk Agent** — identity/company inconsistencies, ownership
   structures, shell-company indicators.
4. **Financial Statement Analysis Agent** — ratio analysis, anomaly
   detection in P&L/balance sheet/cash flow, explained in plain English.
5. **Financial Modelling Agent** — revenue/cost/P&L/cash-flow forecasting
   with Base/Optimistic/Conservative scenarios, clearly separating actual
   data, user assumptions and AI-generated estimates.

## MVP: AI Invoice Fraud & Financial Document Checker

Implemented in this repository. A user supplies an **invoice + purchase
order + supplier record** (optionally a payment record and invoice
history). The system:

1. Extracts information from each document (`innoligo/agents/document_intelligence.py`).
2. Compares Invoice → Purchase Order → Supplier → Payment (`innoligo/agents/invoice_intelligence.py`).
3. Checks mathematical calculations and VAT deterministically (`innoligo/engine/calculations.py`).
4. Identifies duplicate invoices.
5. Detects inconsistencies (bank detail changes, address/VAT mismatches).
6. Generates an explainable 0–100 risk score and Low/Medium/High/Critical
   band (`innoligo/agents/risk_scoring.py`).
7. Recommends a prioritised investigation plan (`innoligo/agents/investigation.py`).
8. Produces an executive investigation report (`innoligo/agents/reporting.py`).

Run it: `python3 -m innoligo.cli` (see the repo README for the full demo
output). This is the same shape as the sales demo:

```
Financial Risk Score: 76/100 — HIGH
3 Critical Findings
2 Medium Findings
Recommended Action: Manual supplier/payment verification
```

This gives Innoligo a simple, demonstrable product that can later expand
into KYC, KYB, financial modelling and broader fraud detection without
throwing away the deterministic engine or the agent architecture — see
[ROADMAP.md](ROADMAP.md).
