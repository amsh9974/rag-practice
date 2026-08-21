"""Shared data structures for the invoice fraud & document checker MVP.

These represent already-extracted, structured document fields (i.e. the
output of a document intelligence step such as Azure AI Document
Intelligence in production). The MVP consumes structured JSON directly so
the deterministic engine and scoring logic can be built and tested without
depending on a live OCR/LLM service; see docs/ARCHITECTURE.md for how a
real extraction agent slots in ahead of this layer.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


@dataclass
class LineItem:
    description: str
    quantity: float
    unit_price: float

    @property
    def line_total(self) -> float:
        return round(self.quantity * self.unit_price, 2)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "LineItem":
        return cls(
            description=data["description"],
            quantity=float(data["quantity"]),
            unit_price=float(data["unit_price"]),
        )


@dataclass
class Invoice:
    invoice_number: str
    issue_date: str
    supplier_name: str
    supplier_address: str
    supplier_vat_number: str
    customer_name: str
    po_number: str | None
    currency: str
    line_items: list[LineItem]
    subtotal: float
    vat_rate: float
    vat_amount: float
    total: float
    bank_account_name: str
    bank_sort_code: str
    bank_account_number: str
    payment_terms: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Invoice":
        return cls(
            invoice_number=data["invoice_number"],
            issue_date=data["issue_date"],
            supplier_name=data["supplier_name"],
            supplier_address=data["supplier_address"],
            supplier_vat_number=data["supplier_vat_number"],
            customer_name=data["customer_name"],
            po_number=data.get("po_number"),
            currency=data["currency"],
            line_items=[LineItem.from_dict(li) for li in data["line_items"]],
            subtotal=float(data["subtotal"]),
            vat_rate=float(data["vat_rate"]),
            vat_amount=float(data["vat_amount"]),
            total=float(data["total"]),
            bank_account_name=data["bank_account_name"],
            bank_sort_code=data["bank_sort_code"],
            bank_account_number=data["bank_account_number"],
            payment_terms=data.get("payment_terms"),
        )


@dataclass
class PurchaseOrder:
    po_number: str
    issue_date: str
    supplier_name: str
    customer_name: str
    line_items: list[LineItem]
    approved_total: float
    currency: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PurchaseOrder":
        return cls(
            po_number=data["po_number"],
            issue_date=data["issue_date"],
            supplier_name=data["supplier_name"],
            customer_name=data["customer_name"],
            line_items=[LineItem.from_dict(li) for li in data["line_items"]],
            approved_total=float(data["approved_total"]),
            currency=data["currency"],
        )


@dataclass
class SupplierRecord:
    supplier_name: str
    registered_address: str
    vat_number: str
    on_file_bank_sort_code: str
    on_file_bank_account_number: str
    on_file_since: str
    last_verified: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SupplierRecord":
        return cls(
            supplier_name=data["supplier_name"],
            registered_address=data["registered_address"],
            vat_number=data["vat_number"],
            on_file_bank_sort_code=data["on_file_bank_sort_code"],
            on_file_bank_account_number=data["on_file_bank_account_number"],
            on_file_since=data["on_file_since"],
            last_verified=data["last_verified"],
        )


@dataclass
class CompanyRegistration:
    company_name: str
    company_number: str
    registered_address: str
    incorporation_date: str
    vat_number: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CompanyRegistration":
        return cls(
            company_name=data["company_name"],
            company_number=data["company_number"],
            registered_address=data["registered_address"],
            incorporation_date=data["incorporation_date"],
            vat_number=data["vat_number"],
        )


@dataclass
class PaymentRecord:
    payment_reference: str
    invoice_number: str
    amount_paid: float
    payment_date: str
    paid_to_sort_code: str
    paid_to_account_number: str
    payment_method: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PaymentRecord":
        return cls(
            payment_reference=data["payment_reference"],
            invoice_number=data["invoice_number"],
            amount_paid=float(data["amount_paid"]),
            payment_date=data["payment_date"],
            paid_to_sort_code=data["paid_to_sort_code"],
            paid_to_account_number=data["paid_to_account_number"],
            payment_method=data["payment_method"],
        )


@dataclass
class Finding:
    """A single explainable risk signal, never a fraud accusation."""

    code: str
    category: str
    severity: Severity
    title: str
    what_happened: str
    why_suspicious: str
    evidence: list[str]
    recommended_action: str
    risk_points: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "category": self.category,
            "severity": self.severity.value,
            "title": self.title,
            "what_happened": self.what_happened,
            "why_suspicious": self.why_suspicious,
            "evidence": self.evidence,
            "recommended_action": self.recommended_action,
            "risk_points": self.risk_points,
        }


@dataclass
class RiskAssessment:
    score: int
    level: RiskLevel
    findings: list[Finding] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "score": self.score,
            "level": self.level.value,
            "findings": [f.to_dict() for f in self.findings],
        }
