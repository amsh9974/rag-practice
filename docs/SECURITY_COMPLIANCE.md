# Security & Compliance

Target environment: UK/EU business requirements. This document states the
principles the architecture is designed against; a production deployment
must implement the infrastructure controls (this repository is
application logic only — it does not itself ship storage, auth or
networking).

## Principles

- **Human oversight.** No finding in this system is worded as a
  determination of fraud (see `innoligo/agents/fraud_detection.py` and the
  disclaimer appended by `innoligo/agents/reporting.py`). No payment,
  account change or other action is executed automatically — the
  Investigation Agent only *recommends* a hold and next steps.
  Legally definitive fraud, KYC or AML determinations require human and
  regulatory controls this system does not attempt to replace.
- **Explainability.** Every finding is traceable to specific evidence
  (`Finding.evidence`) and a specific deterministic calculation or
  comparison (`innoligo/engine/calculations.py`) — no black-box scores.
- **Data minimisation.** The MVP consumes only the structured fields each
  check needs (see `document_intelligence.py`'s required-field sets);
  it does not require or store more than that.
- **Data residency.** The Azure services named in
  [ARCHITECTURE.md](ARCHITECTURE.md) should be deployed in UK/EU regions
  for a UK/EU customer base.

## Production requirements (not implemented in this repository)

These belong in the deployment/platform layer around this application
logic:

- **GDPR** — lawful basis for processing invoice/KYC data, data subject
  rights handling, retention limits on documents and extracted PII.
- **Encryption** — at rest (document storage) and in transit (API/UI).
- **Access control** — role-based access control so only authorised
  finance/compliance users can view findings or release a held payment.
- **Audit trails** — immutable log of who viewed which report, who
  overrode a "hold payment" recommendation, and when.
- **Data retention** — defined retention/deletion schedule for uploaded
  documents and extracted data, consistent with GDPR data minimisation.
- **Model monitoring** — for any AI/LLM component introduced later
  (extraction accuracy, narrative-generation drift), independent of the
  deterministic engine's correctness (which is covered by the test suite
  in `tests/`).

## What this repository already enforces

- Deterministic, reproducible risk scores (`innoligo/agents/risk_scoring.py`)
  — the same input documents always produce the same score, independently
  auditable without re-running any AI model.
- A fixed vocabulary of non-accusatory language for every finding.
- Explicit `DocumentValidationError` (`innoligo/agents/document_intelligence.py`)
  when required fields are missing, rather than silently guessing —
  correctness at the extraction boundary matters more than convenience.
