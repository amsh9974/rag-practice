"""Orchestrates the MVP: AI Invoice Fraud & Financial Document Checker.

Wires together Agents 1, 3, 5, 6, 7 and 8 in the order described in the
brief's MVP section:

    1. Extract information (Agent 1).
    2. Compare the documents (Agent 3).
    3-6. Check maths/VAT, identify duplicates, detect inconsistencies (Agent 3 + 5).
    7. Generate a risk score (Agent 6).
    8. Explain the findings / recommend next steps (Agent 7).
    9. Produce an investigation report (Agent 8).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from innoligo.agents import document_intelligence as doc_agent
from innoligo.agents import fraud_detection
from innoligo.agents import investigation as investigation_agent
from innoligo.agents import invoice_intelligence
from innoligo.agents import reporting
from innoligo.agents import risk_scoring
from innoligo.agents.investigation import InvestigationPlan
from innoligo.models import RiskAssessment


@dataclass
class InvoiceCheckResult:
    assessment: RiskAssessment
    plan: InvestigationPlan
    report_markdown: str


def run_invoice_fraud_check(
    invoice_data: dict[str, Any],
    *,
    purchase_order_data: dict[str, Any] | None = None,
    supplier_record_data: dict[str, Any] | None = None,
    payment_record_data: dict[str, Any] | None = None,
    historical_invoices_data: list[dict[str, Any]] | None = None,
    company_name: str = "Innoligo Demo Client Ltd",
) -> InvoiceCheckResult:
    """Run the full invoice fraud & financial document check pipeline.

    All inputs are already-extracted structured document fields (see
    innoligo.agents.document_intelligence for the real-world extraction
    seam). Only ``invoice_data`` is required; every other document is
    optional and simply narrows the set of checks that can run.
    """
    # 1. Document Intelligence Agent — extract & validate.
    invoice = doc_agent.extract_invoice(invoice_data)
    po = doc_agent.extract_purchase_order(purchase_order_data) if purchase_order_data else None
    supplier = doc_agent.extract_supplier_record(supplier_record_data) if supplier_record_data else None
    payment = doc_agent.extract_payment_record(payment_record_data) if payment_record_data else None
    historical_invoices = (
        [doc_agent.extract_invoice(d) for d in historical_invoices_data] if historical_invoices_data else []
    )

    # 2-6. Invoice Intelligence Agent — compare documents, run deterministic checks.
    signals = invoice_intelligence.analyse(
        invoice,
        purchase_order=po,
        supplier=supplier,
        payment=payment,
        historical_invoices=historical_invoices,
    )

    # Fraud Detection Agent — interpret signals into explainable findings.
    findings = fraud_detection.detect(invoice, signals)

    # 7. Risk Scoring Agent — explainable 0-100 score.
    assessment = risk_scoring.score(findings)

    # 8. Investigation Agent — next steps & priority.
    plan = investigation_agent.build_plan(assessment)

    # 9. Reporting Agent — executive-friendly investigation report.
    report_markdown = reporting.build_report(
        invoice, assessment, plan, signals, company_name=company_name
    )

    return InvoiceCheckResult(assessment=assessment, plan=plan, report_markdown=report_markdown)
