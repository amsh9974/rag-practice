"""Innoligo AI Financial Risk, Fraud & Compliance Agent — MVP core package.

This package implements the MVP recommended in the Innoligo product brief:
the AI Invoice Fraud & Financial Document Checker. It cross-checks an
invoice against its purchase order, supplier master record, company
registration and payment record, runs deterministic financial checks,
scores the combined risk and produces an explainable investigation report.

Architecture follows the multi-agent design from the brief. Each agent is a
small, focused module under ``innoligo.agents``:

    Agent 1 - Document Intelligence  -> innoligo.agents.document_intelligence
    Agent 3 - Invoice Intelligence   -> innoligo.agents.invoice_intelligence
    Agent 5 - Fraud Detection        -> innoligo.agents.fraud_detection
    Agent 6 - Risk Scoring           -> innoligo.agents.risk_scoring
    Agent 7 - Investigation          -> innoligo.agents.investigation
    Agent 8 - Reporting              -> innoligo.agents.reporting

Agents 2 (Financial Analysis) and 4 (KYC/KYB) are out of scope for the MVP
and are documented as roadmap items in docs/ROADMAP.md.

All monetary/mathematical checks (totals, VAT, variance, duplicates) are
deterministic — see innoligo.engine.calculations. No LLM call is required
for correctness; a pluggable NarrativeGenerator (innoligo.agents.reporting)
turns findings into plain-English text, with a documented seam for swapping
in Azure OpenAI in production.
"""

from innoligo.pipeline import run_invoice_fraud_check

__all__ = ["run_invoice_fraud_check"]
