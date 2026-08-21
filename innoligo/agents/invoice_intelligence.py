"""Agent 3 — Invoice Intelligence Agent.

Runs the deterministic Invoice -> Purchase Order -> Supplier -> Payment
comparison chain described in the brief and returns the raw signal set
that Agent 5 (Fraud Detection) interprets into explainable findings.

This agent does not assign severity or risk points itself — it only
gathers and structures comparison results, keeping the deterministic
maths (innoligo.engine.calculations) fully separated from risk judgement.
"""

from __future__ import annotations

from dataclasses import dataclass

from innoligo.engine import calculations as calc
from innoligo.models import Invoice, PaymentRecord, PurchaseOrder, SupplierRecord


@dataclass
class InvoiceSignals:
    math: dict
    po_comparison: dict | None
    bank_details: dict | None
    address: dict | None
    vat_number: dict | None
    duplicates: dict
    payment: dict | None


def analyse(
    invoice: Invoice,
    *,
    purchase_order: PurchaseOrder | None = None,
    supplier: SupplierRecord | None = None,
    payment: PaymentRecord | None = None,
    historical_invoices: list[Invoice] | None = None,
) -> InvoiceSignals:
    math = calc.verify_invoice_math(invoice)

    po_comparison = None
    if purchase_order is not None:
        po_comparison = calc.compare_invoice_to_po(invoice, purchase_order)

    bank_details = None
    address = None
    vat_number = None
    if supplier is not None:
        bank_details = calc.check_bank_detail_change(invoice, supplier)
        address = calc.check_address_mismatch(invoice, supplier)
        vat_number = calc.check_vat_number_mismatch(invoice, supplier)

    duplicates = calc.check_duplicate_invoices(invoice, historical_invoices or [])

    payment_check = None
    if payment is not None:
        payment_check = calc.check_payment_against_invoice(invoice, payment)

    return InvoiceSignals(
        math=math,
        po_comparison=po_comparison,
        bank_details=bank_details,
        address=address,
        vat_number=vat_number,
        duplicates=duplicates,
        payment=payment_check,
    )
