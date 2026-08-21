"""Agent 7 — Investigation Agent.

Turns a scored set of findings into a prioritised, de-duplicated
investigation plan: what a human investigator should do next, and what
additional evidence would help resolve each open question. This agent
never concludes fraud occurred — it only recommends investigative steps,
consistent with the human-in-the-loop principle in the brief.
"""

from __future__ import annotations

from dataclasses import dataclass

from innoligo.models import RiskAssessment, RiskLevel, Severity

_PRIORITY_BY_LEVEL: dict[RiskLevel, str] = {
    RiskLevel.CRITICAL: "Immediate — hold payment and escalate to finance/security leadership today",
    RiskLevel.HIGH: "Urgent — hold payment pending manual verification within 24 hours",
    RiskLevel.MEDIUM: "Standard — verify before the next payment run",
    RiskLevel.LOW: "Routine — note on file, no payment hold required",
}


@dataclass
class InvestigationPlan:
    priority: str
    hold_payment: bool
    next_steps: list[str]
    additional_evidence_requested: list[str]


def build_plan(assessment: RiskAssessment) -> InvestigationPlan:
    priority = _PRIORITY_BY_LEVEL[assessment.level]
    hold_payment = assessment.level in (RiskLevel.HIGH, RiskLevel.CRITICAL) or any(
        f.severity == Severity.CRITICAL for f in assessment.findings
    )

    # De-duplicate recommended actions while preserving priority order
    # (findings are already sorted most-severe-first by the risk scorer).
    seen: set[str] = set()
    next_steps: list[str] = []
    for finding in assessment.findings:
        if finding.recommended_action not in seen:
            seen.add(finding.recommended_action)
            next_steps.append(finding.recommended_action)

    additional_evidence = _suggest_additional_evidence(assessment)

    return InvestigationPlan(
        priority=priority,
        hold_payment=hold_payment,
        next_steps=next_steps,
        additional_evidence_requested=additional_evidence,
    )


def _suggest_additional_evidence(assessment: RiskAssessment) -> list[str]:
    codes = {f.code for f in assessment.findings}
    suggestions: list[str] = []

    if "SUP-BANK-001" in codes or "PAY-002" in codes:
        suggestions.append("Independently verified confirmation call log with the supplier's finance contact")
        suggestions.append("Supplier's bank account verification letter or open banking confidence check")
    if "INV-MATH-001" in codes:
        suggestions.append("Original, unedited invoice source file (PDF metadata / creation history)")
    if {"INV-PO-001", "INV-PO-002", "INV-PO-003"} & codes:
        suggestions.append("Goods-received note or service completion sign-off for the disputed line items")
    if {"SUP-ADDR-001", "SUP-VAT-001"} & codes:
        suggestions.append("Companies House / HMRC VAT register extract for the supplier")
    if {"INV-DUP-001", "INV-DUP-002"} & codes:
        suggestions.append("Full payment history for this supplier over the last 12 months")

    if not suggestions:
        suggestions.append("No further evidence required beyond standard record-keeping")

    return suggestions
