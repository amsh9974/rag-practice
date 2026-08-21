# Innoligo AI Financial Risk & Fraud Intelligence

*Detect anomalies. Reduce financial risk. Make better decisions.*

An AI-powered **decision-support** platform for financial risk, fraud and
compliance: it analyses financial documents, invoices, billing records and
related business data to surface potential fraud indicators, anomalies and
compliance risks — with a full explanation and a recommended next step. It
never declares a person or company fraudulent; it flags **potential
anomalies** and **risk signals** for a human investigator to review.

This repository implements the recommended MVP: the **AI Invoice Fraud &
Financial Document Checker**. See [docs/PRODUCT.md](docs/PRODUCT.md) for
full product positioning and the long-term vision, and
[docs/ROADMAP.md](docs/ROADMAP.md) for what comes after the MVP.

## What it does

Given an invoice, its purchase order, the supplier's on-file record, and
(optionally) a payment record and invoice history, the system:

1. Extracts and validates the structured fields from each document.
2. Compares Invoice → Purchase Order → Supplier → Payment.
3. Recomputes totals and VAT to catch manipulated figures — deterministically,
   no LLM involved in the arithmetic.
4. Flags duplicate invoices and duplicate-payment risk.
5. Flags supplier bank-detail changes (payment-redirection risk) and
   address/VAT mismatches.
6. Produces an explainable 0–100 risk score and a Low/Medium/High/Critical
   band.
7. Recommends a prioritised investigation plan (what to do, what extra
   evidence to gather).
8. Produces an executive-ready investigation report.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full multi-agent
design and why the maths is deterministic rather than AI-generated.

## Quickstart

Requires Python 3.10+, no dependencies for the core package.

```bash
# Run the built-in demo (fictional company, planted anomalies)
python3 -m innoligo.cli

# Or as structured JSON
python3 -m innoligo.cli --json

# Run the test suite
python3 -m pip install -r requirements-dev.txt
python3 -m pytest
```

### Use it programmatically

```python
from innoligo.pipeline import run_invoice_fraud_check

result = run_invoice_fraud_check(
    invoice_data=...,            # required
    purchase_order_data=...,     # optional
    supplier_record_data=...,    # optional
    payment_record_data=...,     # optional
    historical_invoices_data=..., # optional, for duplicate detection
)

print(result.assessment.score, result.assessment.level)
print(result.report_markdown)
```

Each `*_data` argument is the structured JSON a document-extraction step
would produce (see `demo/meridian_oak/*.json` for the shape, and
`innoligo/agents/document_intelligence.py` for the seam where a real OCR/AI
extraction service — e.g. Azure AI Document Intelligence — plugs in).

## Demo scenario

`demo/meridian_oak/` is the sales-demo dataset described in the brief: a
fictional supplier, **Meridian Oak Facilities Ltd**, with five deliberately
planted anomalies across its invoice, purchase order, supplier record,
payment record and invoice history — a manipulated total, quantities
billed above the approved PO, a bank-detail change shortly before payment,
a reused invoice number, and an address mismatch. Running
`python3 -m innoligo.cli` produces:

```
Financial Risk Score: 100/100 — CRITICAL
2 Critical, 1 High, 2 Medium, 1 Low finding(s).
Hold payment: Yes
Investigation Priority: Immediate — hold payment and escalate to
  finance/security leadership today
```

with a full breakdown of each finding, its evidence, and the recommended
next step for every one.

## Project layout

```
innoligo/
  models.py                 shared data structures (Invoice, Finding, RiskAssessment, ...)
  engine/calculations.py    deterministic financial checks (totals, VAT, variance, duplicates)
  agents/
    document_intelligence.py  Agent 1 — extraction & validation
    invoice_intelligence.py   Agent 3 — document comparison
    fraud_detection.py        Agent 5 — signals -> explainable findings
    risk_scoring.py           Agent 6 — findings -> 0-100 score & band
    investigation.py          Agent 7 — next steps & priority
    reporting.py               Agent 8 — executive report
  pipeline.py                orchestrates the MVP end to end
  cli.py                      runs the demo scenario
demo/meridian_oak/           demonstration dataset with planted anomalies
tests/                        pytest suite for the calculation engine and pipeline
docs/                          product positioning, architecture, roadmap, security
```

## Documentation

- [docs/PRODUCT.md](docs/PRODUCT.md) — positioning, tagline, target segments, MVP rationale.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — agent design, explainability, tech direction.
- [docs/ROADMAP.md](docs/ROADMAP.md) — expansion into financial analysis, KYC/KYB, modelling, AML.
- [docs/SECURITY_COMPLIANCE.md](docs/SECURITY_COMPLIANCE.md) — GDPR, human-in-the-loop, audit principles.
