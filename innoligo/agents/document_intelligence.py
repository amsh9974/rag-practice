"""Agent 1 — Document Intelligence Agent.

Responsible for extracting structured fields from source documents.

In production this agent would call Azure AI Document Intelligence (layout
+ prebuilt invoice/receipt models) followed by an Azure OpenAI extraction
pass for fields the prebuilt models miss, then validate the result against
a schema before handing it to the downstream agents.

For the MVP, documents are already-structured JSON (as if OCR/extraction
had already run) — this agent's job is schema validation and
normalisation, so the seam where a real extraction service plugs in is a
single, well-defined function: ``extract_invoice`` etc. Swapping the body
of these functions for an Azure Document Intelligence call does not
require any change to the agents that consume their output.
"""

from __future__ import annotations

from typing import Any

from innoligo.models import (
    CompanyRegistration,
    Invoice,
    PaymentRecord,
    PurchaseOrder,
    SupplierRecord,
)

REQUIRED_INVOICE_FIELDS = {
    "invoice_number",
    "issue_date",
    "supplier_name",
    "supplier_address",
    "supplier_vat_number",
    "customer_name",
    "currency",
    "line_items",
    "subtotal",
    "vat_rate",
    "vat_amount",
    "total",
    "bank_account_name",
    "bank_sort_code",
    "bank_account_number",
}


class DocumentValidationError(ValueError):
    """Raised when a source document is missing required extracted fields."""


def _require_fields(data: dict[str, Any], required: set[str], doc_type: str) -> None:
    missing = required - data.keys()
    if missing:
        raise DocumentValidationError(
            f"{doc_type} is missing required fields: {sorted(missing)}"
        )


def extract_invoice(data: dict[str, Any]) -> Invoice:
    _require_fields(data, REQUIRED_INVOICE_FIELDS, "invoice")
    return Invoice.from_dict(data)


def extract_purchase_order(data: dict[str, Any]) -> PurchaseOrder:
    _require_fields(
        data,
        {"po_number", "issue_date", "supplier_name", "customer_name", "line_items", "approved_total", "currency"},
        "purchase_order",
    )
    return PurchaseOrder.from_dict(data)


def extract_supplier_record(data: dict[str, Any]) -> SupplierRecord:
    _require_fields(
        data,
        {
            "supplier_name",
            "registered_address",
            "vat_number",
            "on_file_bank_sort_code",
            "on_file_bank_account_number",
            "on_file_since",
            "last_verified",
        },
        "supplier_record",
    )
    return SupplierRecord.from_dict(data)


def extract_company_registration(data: dict[str, Any]) -> CompanyRegistration:
    _require_fields(
        data,
        {"company_name", "company_number", "registered_address", "incorporation_date", "vat_number"},
        "company_registration",
    )
    return CompanyRegistration.from_dict(data)


def extract_payment_record(data: dict[str, Any]) -> PaymentRecord:
    _require_fields(
        data,
        {
            "payment_reference",
            "invoice_number",
            "amount_paid",
            "payment_date",
            "paid_to_sort_code",
            "paid_to_account_number",
            "payment_method",
        },
        "payment_record",
    )
    return PaymentRecord.from_dict(data)
