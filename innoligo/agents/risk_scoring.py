"""Agent 6 — Risk Scoring Agent.

Combines findings from Agent 5 (Fraud Detection) into a single explainable
0-100 risk score and Low/Medium/High/Critical band, per the brief's
"Fraud Detection Engine" (section 6). The mapping is a fixed, documented
rule table — deterministic and auditable, not an opaque model output.
"""

from __future__ import annotations

from innoligo.models import Finding, RiskAssessment, RiskLevel, Severity

# Points contributed per finding, by severity. Chosen so that a single
# CRITICAL finding alone already pushes the case into the "High" band,
# and two CRITICAL findings reach "Critical" — reflecting that signals
# like payment redirection or duplicate invoice numbers are each, on
# their own, serious enough to warrant urgent investigation.
POINTS_BY_SEVERITY: dict[Severity, int] = {
    Severity.INFO: 0,
    Severity.LOW: 5,
    Severity.MEDIUM: 12,
    Severity.HIGH: 25,
    Severity.CRITICAL: 40,
}

# Score -> band thresholds (inclusive lower bound).
_BANDS: list[tuple[int, RiskLevel]] = [
    (75, RiskLevel.CRITICAL),
    (50, RiskLevel.HIGH),
    (25, RiskLevel.MEDIUM),
    (0, RiskLevel.LOW),
]


def score_to_level(score: int) -> RiskLevel:
    for threshold, level in _BANDS:
        if score >= threshold:
            return level
    return RiskLevel.LOW


def score(findings: list[Finding]) -> RiskAssessment:
    raw = sum(f.risk_points for f in findings)
    capped = min(raw, 100)
    level = score_to_level(capped)
    # Sort most severe first for downstream reporting.
    ordered = sorted(findings, key=lambda f: f.risk_points, reverse=True)
    return RiskAssessment(score=capped, level=level, findings=ordered)
