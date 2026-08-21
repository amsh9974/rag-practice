import json
from pathlib import Path

from innoligo.models import RiskLevel
from innoligo.pipeline import run_invoice_fraud_check

DEMO_DIR = Path(__file__).resolve().parent.parent / "demo" / "meridian_oak"


def _load(name: str) -> dict:
    with open(DEMO_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def test_meridian_oak_demo_flags_all_planted_anomalies():
    result = run_invoice_fraud_check(
        invoice_data=_load("invoice.json"),
        purchase_order_data=_load("purchase_order.json"),
        supplier_record_data=_load("supplier_record.json"),
        payment_record_data=_load("payment_record.json"),
        historical_invoices_data=_load("historical_invoices.json"),
    )

    codes = {f.code for f in result.assessment.findings}
    assert "INV-MATH-001" in codes  # manipulated total
    assert "INV-PO-002" in codes  # quantity mismatch vs PO
    assert "INV-PO-003" in codes  # amount variance vs PO
    assert "SUP-BANK-001" in codes  # bank details changed
    assert "SUP-ADDR-001" in codes  # address mismatch
    assert "INV-DUP-001" in codes  # duplicate invoice number

    assert result.assessment.level == RiskLevel.CRITICAL
    assert result.assessment.score == 100

    assert result.plan.hold_payment is True
    assert "Investigation Priority" in result.report_markdown
    assert "Financial Risk Score: 100/100 — CRITICAL" in result.report_markdown


def test_clean_invoice_with_no_supporting_documents_has_no_findings():
    clean_invoice = {
        "invoice_number": "INV-CLEAN-1",
        "issue_date": "2026-01-01",
        "supplier_name": "Trusted Supplier Ltd",
        "supplier_address": "1 Honest Road",
        "supplier_vat_number": "GB999999999",
        "customer_name": "Innoligo Demo Client Ltd",
        "po_number": None,
        "currency": "GBP",
        "line_items": [{"description": "Consulting", "quantity": 10, "unit_price": 100.0}],
        "subtotal": 1000.0,
        "vat_rate": 0.20,
        "vat_amount": 200.0,
        "total": 1200.0,
        "bank_account_name": "Trusted Supplier Ltd",
        "bank_sort_code": "10-20-30",
        "bank_account_number": "40506070",
    }

    result = run_invoice_fraud_check(invoice_data=clean_invoice)

    assert result.assessment.findings == []
    assert result.assessment.score == 0
    assert result.assessment.level == RiskLevel.LOW
    assert result.plan.hold_payment is False


def test_document_validation_error_on_missing_required_field():
    import pytest

    from innoligo.agents.document_intelligence import DocumentValidationError

    with pytest.raises(DocumentValidationError):
        run_invoice_fraud_check(invoice_data={"invoice_number": "INV-1"})
