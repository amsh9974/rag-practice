# Architecture

## Multi-agent design

The brief specifies eight specialised agents. This repository implements
the six the MVP needs; two are stubbed only as documentation until the
Financial Analysis and KYC/KYB use cases are built (see
[ROADMAP.md](ROADMAP.md)).

| # | Agent | Status | Module |
|---|-------|--------|--------|
| 1 | Document Intelligence | **Implemented** — extraction/validation seam | `innoligo/agents/document_intelligence.py` |
| 2 | Financial Analysis | Not built (roadmap) | — |
| 3 | Invoice Intelligence | **Implemented** — Invoice→PO→Supplier→Payment comparison | `innoligo/agents/invoice_intelligence.py` |
| 4 | KYC/KYB | Not built (roadmap) | — |
| 5 | Fraud Detection | **Implemented** — signals → explainable findings | `innoligo/agents/fraud_detection.py` |
| 6 | Risk Scoring | **Implemented** — findings → 0–100 score & band | `innoligo/agents/risk_scoring.py` |
| 7 | Investigation | **Implemented** — next steps & priority | `innoligo/agents/investigation.py` |
| 8 | Reporting | **Implemented** — executive report | `innoligo/agents/reporting.py` |

`innoligo/pipeline.py` orchestrates agents 1, 3, 5, 6, 7, 8 in sequence for
the MVP flow. Each agent is a small, independently testable module with a
narrow input/output contract (`innoligo/models.py`), so the Financial
Analysis and KYC/KYB agents can be added later as new modules that plug
into the same `Finding` / `RiskAssessment` types without changing anything
downstream.

## Why the maths is deterministic, not AI

Per the brief: *"Do not rely on an LLM alone for mathematical calculations
or deterministic financial checks."* Every total, VAT figure, percentage
variance, duplicate match and threshold check in this repository is plain
Python arithmetic in `innoligo/engine/calculations.py` — no model call, no
non-determinism, no hallucination risk. That module is deliberately kept
free of any notion of "risk" or "severity"; it only returns facts (numbers,
booleans, diffs). The Fraud Detection Agent is the only place that
interprets those facts into a graded, explainable finding — see
[Explainability](#explainability) below. This means the *evidence* a
report cites, and the *score* it computes, are fully reproducible and
auditable, independent of whichever LLM (if any) is used for narrative
phrasing.

## Where AI fits

AI is intentionally scoped to what it's good at:

- **Document understanding** — turning unstructured PDFs/images into the
  structured fields `innoligo/agents/document_intelligence.py` consumes.
  In production this is an Azure AI Document Intelligence (layout +
  prebuilt invoice/receipt models) call, with an Azure OpenAI pass for
  fields the prebuilt models don't cover. The MVP's extraction functions
  (`extract_invoice`, `extract_purchase_order`, ...) are the seam where
  that call goes — everything downstream is unaffected by the swap.
- **Natural-language reporting** — the executive report in
  `innoligo/agents/reporting.py` currently uses deterministic, templated
  text so the whole pipeline runs and tests without any external service.
  In production this is the natural place for an Azure OpenAI-backed
  narrative generator to phrase the same structured findings more
  fluently; because the structure and every number come from the
  deterministic agents upstream, swapping the narrative layer can never
  change a risk score or a finding.
- **Pattern interpretation & investigation assistance** — future work
  (KYC/KYB shell-company indicators, financial statement anomaly
  narratives) that benefits from reasoning over ambiguous, qualitative
  signals rather than hard thresholds.

## Explainability

Every `Finding` (`innoligo/models.py`) answers the four questions from the
brief by construction, not by convention:

- **What happened?** → `Finding.what_happened`
- **Why is it suspicious?** → `Finding.why_suspicious`
- **What supports it?** → `Finding.evidence` (document/field references)
- **What should the user do?** → `Finding.recommended_action`

`RiskAssessment.score` is a fixed, documented sum of per-severity point
values (`innoligo/agents/risk_scoring.py`) — never an opaque model output.

## Human-in-the-loop

Finding language is deliberately restricted to *potential anomaly*,
*suspicious indicator*, *risk signal*, *requires investigation*, *possible
inconsistency* — never an accusation. `innoligo/agents/reporting.py`
appends a fixed disclaimer to every report, and the Investigation Agent's
output is a *recommended* plan, not an automated action (no payment is
ever executed by this system). Final decisions stay with authorised human
investigators/compliance teams.

## Technology direction (target production stack)

The architecture is designed to slot into Microsoft/Azure where commercially
appropriate:

- **Azure AI Document Intelligence** — document extraction (Agent 1).
- **Azure OpenAI / Microsoft Foundry** — narrative generation, investigation
  assistance, reasoning over qualitative signals.
- **Vector database / RAG** — for KYC/KYB and financial-statement agents
  that need to reason over policy documents, prior cases and external
  registers alongside a single document.
- **Secure document storage, RBAC, audit logging, encryption, monitoring**
  — see [SECURITY_COMPLIANCE.md](SECURITY_COMPLIANCE.md).
- **Python deterministic calculation engine** — as implemented here,
  unchanged by the choice of LLM provider.

None of this repository's code depends on Azure; it is pure Python so the
deterministic core and the agent contracts can be developed, tested and
demoed without cloud credentials, then wired to Azure services purely at
the extraction/narrative seams described above.
