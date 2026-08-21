"""Deterministic financial calculation engine.

Per the Innoligo architecture principle: "Do not rely on an LLM alone for
mathematical calculations or deterministic financial checks." Every function
here is pure arithmetic/comparison logic with no AI involved. Agents
interpret these results into explainable findings; this module only ever
returns plain numbers, booleans and dicts.
"""

from __future__ import annotations

from innoligo.models import Invoice, LineItem, PaymentRecord, PurchaseOrder, SupplierRecord

CENTS = 0.01


def line_items_subtotal(line_items: list[LineItem]) -> float:
    return round(sum(li.line_total for li in line_items), 2)


def verify_invoice_math(invoice: Invoice) -> dict:
    """Recompute subtotal, VAT and total from the invoice's own line items
    and rates, and compare against the stated figures.
    """
    computed_subtotal = line_items_subtotal(invoice.line_items)
    computed_vat = round(computed_subtotal * invoice.vat_rate, 2)
    computed_total = round(computed_subtotal + computed_vat, 2)

    subtotal_diff = round(invoice.subtotal - computed_subtotal, 2)
    vat_diff = round(invoice.vat_amount - computed_vat, 2)
    total_diff = round(invoice.total - computed_total, 2)

    return {
        "computed_subtotal": computed_subtotal,
        "computed_vat": computed_vat,
        "computed_total": computed_total,
        "stated_subtotal": invoice.subtotal,
        "stated_vat": invoice.vat_amount,
        "stated_total": invoice.total,
        "subtotal_diff": subtotal_diff,
        "vat_diff": vat_diff,
        "total_diff": total_diff,
        "subtotal_ok": abs(subtotal_diff) < CENTS,
        "vat_ok": abs(vat_diff) < CENTS,
        "total_ok": abs(total_diff) < CENTS,
    }


def percentage_variance(a: float, b: float) -> float:
    """Signed percentage variance of ``a`` relative to ``b``. 0 if b is 0."""
    if b == 0:
        return 0.0
    return round(((a - b) / b) * 100, 2)


def compare_invoice_to_po(invoice: Invoice, po: PurchaseOrder, tolerance_pct: float = 2.0) -> dict:
    """Compare invoice line items and total to the approved purchase order."""
    po_lines_by_desc = {li.description: li for li in po.line_items}
    line_mismatches = []

    for inv_line in invoice.line_items:
        po_line = po_lines_by_desc.get(inv_line.description)
        if po_line is None:
            line_mismatches.append(
                {
                    "description": inv_line.description,
                    "issue": "not_on_purchase_order",
                    "invoice_quantity": inv_line.quantity,
                    "invoice_unit_price": inv_line.unit_price,
                }
            )
            continue
        if inv_line.quantity != po_line.quantity or inv_line.unit_price != po_line.unit_price:
            line_mismatches.append(
                {
                    "description": inv_line.description,
                    "issue": "quantity_or_price_mismatch",
                    "invoice_quantity": inv_line.quantity,
                    "po_quantity": po_line.quantity,
                    "invoice_unit_price": inv_line.unit_price,
                    "po_unit_price": po_line.unit_price,
                }
            )

    total_variance_pct = percentage_variance(invoice.subtotal, po.approved_total)

    return {
        "po_number_match": invoice.po_number == po.po_number,
        "supplier_name_match": invoice.supplier_name == po.supplier_name,
        "line_mismatches": line_mismatches,
        "invoice_subtotal": invoice.subtotal,
        "po_approved_total": po.approved_total,
        "total_variance_pct": total_variance_pct,
        "exceeds_tolerance": abs(total_variance_pct) > tolerance_pct,
    }


def check_bank_detail_change(invoice: Invoice, supplier: SupplierRecord) -> dict:
    """Detect whether the invoice's bank details differ from the supplier
    master record on file — a classic payment-redirection / BEC fraud
    indicator, especially when combined with a recent invoice.
    """
    sort_code_changed = invoice.bank_sort_code != supplier.on_file_bank_sort_code
    account_changed = invoice.bank_account_number != supplier.on_file_bank_account_number
    return {
        "sort_code_changed": sort_code_changed,
        "account_number_changed": account_changed,
        "bank_details_changed": sort_code_changed or account_changed,
        "invoice_sort_code": invoice.bank_sort_code,
        "on_file_sort_code": supplier.on_file_bank_sort_code,
        "invoice_account_number": invoice.bank_account_number,
        "on_file_account_number": supplier.on_file_bank_account_number,
    }


def check_address_mismatch(invoice: Invoice, supplier: SupplierRecord) -> dict:
    normalized_invoice = " ".join(invoice.supplier_address.lower().split())
    normalized_onfile = " ".join(supplier.registered_address.lower().split())
    return {
        "matches": normalized_invoice == normalized_onfile,
        "invoice_address": invoice.supplier_address,
        "on_file_address": supplier.registered_address,
    }


def check_vat_number_mismatch(invoice: Invoice, supplier: SupplierRecord) -> dict:
    return {
        "matches": invoice.supplier_vat_number == supplier.vat_number,
        "invoice_vat_number": invoice.supplier_vat_number,
        "on_file_vat_number": supplier.vat_number,
    }


def check_duplicate_invoices(invoice: Invoice, historical_invoices: list[Invoice]) -> dict:
    """Flag exact invoice-number reuse and near-duplicate submissions
    (same supplier + same amount within a short window)."""
    exact_number_matches = [
        h for h in historical_invoices if h.invoice_number == invoice.invoice_number
    ]
    amount_matches = [
        h
        for h in historical_invoices
        if h.invoice_number != invoice.invoice_number
        and h.supplier_name == invoice.supplier_name
        and abs(h.total - invoice.total) < CENTS
    ]
    return {
        "duplicate_invoice_number": len(exact_number_matches) > 0,
        "duplicate_invoice_number_refs": [h.invoice_number for h in exact_number_matches],
        "same_amount_same_supplier": len(amount_matches) > 0,
        "same_amount_refs": [h.invoice_number for h in amount_matches],
    }


def check_payment_against_invoice(invoice: Invoice, payment: PaymentRecord) -> dict:
    amount_diff = round(payment.amount_paid - invoice.total, 2)
    return {
        "reference_matches": payment.invoice_number == invoice.invoice_number,
        "amount_matches": abs(amount_diff) < CENTS,
        "amount_diff": amount_diff,
        "paid_to_matches_invoice_bank_details": (
            payment.paid_to_sort_code == invoice.bank_sort_code
            and payment.paid_to_account_number == invoice.bank_account_number
        ),
    }


def is_suspiciously_round(amount: float, multiple: int = 500) -> bool:
    """Heuristic: whole-currency amounts that are exact multiples of a
    round figure (e.g. 500/1000) are mildly more associated with fabricated
    invoices than organically priced goods/services."""
    return amount > 0 and amount % multiple == 0
