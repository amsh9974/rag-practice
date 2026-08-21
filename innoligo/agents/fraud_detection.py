"""Agent 5 — Fraud Detection Agent.

Interprets the structured signals produced by Agent 3 (Invoice
Intelligence) — and, in future, the Financial Analysis and KYC/KYB agents
— into explainable Finding objects. Every finding names a risk *signal*,
never a fraud accusation, per the human-in-the-loop principle in the
brief: language stays to "potential anomaly", "suspicious indicator",
"requires investigation".

Severity -> risk_points mapping is deterministic and lives in
innoligo.agents.risk_scoring; this agent only decides *which* findings
apply and how to explain them.
"""

from __future__ import annotations

from innoligo.agents.invoice_intelligence import InvoiceSignals
from innoligo.models import Finding, Invoice, Severity
from innoligo.agents.risk_scoring import POINTS_BY_SEVERITY


def _finding(
    code: str,
    category: str,
    severity: Severity,
    title: str,
    what_happened: str,
    why_suspicious: str,
    evidence: list[str],
    recommended_action: str,
) -> Finding:
    return Finding(
        code=code,
        category=category,
        severity=severity,
        title=title,
        what_happened=what_happened,
        why_suspicious=why_suspicious,
        evidence=evidence,
        recommended_action=recommended_action,
        risk_points=POINTS_BY_SEVERITY[severity],
    )


def detect(invoice: Invoice, signals: InvoiceSignals) -> list[Finding]:
    findings: list[Finding] = []

    # --- Document math / manipulated totals -------------------------------
    m = signals.math
    if not m["total_ok"] or not m["vat_ok"] or not m["subtotal_ok"]:
        broken = [k for k in ("subtotal", "vat", "total") if not m[f"{k}_ok"]]
        findings.append(
            _finding(
                code="INV-MATH-001",
                category="Document Fraud / Manipulated Totals",
                severity=Severity.HIGH,
                title="Invoice totals do not reconcile with its own line items",
                what_happened=(
                    f"The stated {', '.join(broken)} on invoice {invoice.invoice_number} "
                    f"do not match the amount calculated from its line items and VAT rate. "
                    f"Stated total: {invoice.currency} {m['stated_total']:.2f}; "
                    f"recalculated total: {invoice.currency} {m['computed_total']:.2f} "
                    f"(difference: {invoice.currency} {m['total_diff']:.2f})."
                ),
                why_suspicious=(
                    "A mismatch between the printed total and the sum of the printed line "
                    "items is a classic indicator of an altered or manually edited figure."
                ),
                evidence=[f"invoice:{invoice.invoice_number}:line_items", f"invoice:{invoice.invoice_number}:total"],
                recommended_action="Request an itemised, re-issued invoice from the supplier and recheck the arithmetic before payment.",
            )
        )

    # --- Invoice vs Purchase Order -----------------------------------------
    po = signals.po_comparison
    if po is not None:
        if not po["po_number_match"] or not po["supplier_name_match"]:
            findings.append(
                _finding(
                    code="INV-PO-001",
                    category="Invoice & Billing Fraud / PO Mismatch",
                    severity=Severity.MEDIUM,
                    title="Invoice references do not match the purchase order on file",
                    what_happened="The invoice's PO number and/or supplier name do not match the referenced purchase order record.",
                    why_suspicious="Invoices should trace cleanly to an approved purchase order; a mismatch may indicate an incorrect, forged or unauthorised invoice.",
                    evidence=[f"invoice:{invoice.invoice_number}:po_number", f"purchase_order:po_number"],
                    recommended_action="Confirm with procurement that this invoice belongs to the referenced PO before payment.",
                )
            )
        if po["line_mismatches"]:
            findings.append(
                _finding(
                    code="INV-PO-002",
                    category="Invoice & Billing Fraud / PO Mismatch",
                    severity=Severity.MEDIUM,
                    title="Invoiced quantities or prices exceed what was approved on the purchase order",
                    what_happened=(
                        f"{len(po['line_mismatches'])} line item(s) on the invoice do not match the "
                        f"approved purchase order: {po['line_mismatches']}."
                    ),
                    why_suspicious="Billing for quantities, items or prices beyond what was approved may indicate invoice inflation or unauthorised scope creep.",
                    evidence=[f"invoice:{invoice.invoice_number}:line_items", "purchase_order:line_items"],
                    recommended_action="Verify the extra quantity/price with the budget owner who approved the purchase order.",
                )
            )
        if po["exceeds_tolerance"]:
            findings.append(
                _finding(
                    code="INV-PO-003",
                    category="Invoice & Billing Fraud / Amount Variance",
                    severity=Severity.MEDIUM,
                    title="Invoice amount differs materially from the approved purchase order",
                    what_happened=(
                        f"Invoice subtotal ({invoice.currency} {po['invoice_subtotal']:.2f}) differs from the "
                        f"approved PO total ({invoice.currency} {po['po_approved_total']:.2f}) by "
                        f"{po['total_variance_pct']:.1f}%."
                    ),
                    why_suspicious="Payments should not materially exceed what procurement approved without a change order.",
                    evidence=[f"invoice:{invoice.invoice_number}:subtotal", "purchase_order:approved_total"],
                    recommended_action="Obtain a signed change order or written approval for the variance before payment.",
                )
            )

    # --- Supplier bank details change (payment redirection risk) ----------
    bd = signals.bank_details
    if bd is not None and bd["bank_details_changed"]:
        findings.append(
            _finding(
                code="SUP-BANK-001",
                category="Supplier Risk / Bank Account Change",
                severity=Severity.CRITICAL,
                title="Invoice bank details differ from the supplier's on-file bank details",
                what_happened=(
                    f"The invoice requests payment to sort code {bd['invoice_sort_code']} / "
                    f"account {bd['invoice_account_number']}, which differs from the bank details "
                    f"on file for this supplier (sort code {bd['on_file_sort_code']} / "
                    f"account {bd['on_file_account_number']})."
                ),
                why_suspicious=(
                    "Unverified bank account changes on an invoice are one of the strongest indicators "
                    "of payment-redirection / business email compromise fraud."
                ),
                evidence=[f"invoice:{invoice.invoice_number}:bank_details", "supplier_record:on_file_bank_details"],
                recommended_action=(
                    "Do not pay to the new account until it has been verified directly with the supplier "
                    "via a known, independently-sourced phone number — not contact details on the invoice itself."
                ),
            )
        )

    # --- Supplier address mismatch -----------------------------------------
    addr = signals.address
    if addr is not None and not addr["matches"]:
        findings.append(
            _finding(
                code="SUP-ADDR-001",
                category="Supplier Risk / Information Mismatch",
                severity=Severity.LOW,
                title="Supplier address on the invoice differs from the record on file",
                what_happened=(
                    f"Invoice address: '{addr['invoice_address']}'. "
                    f"On-file registered address: '{addr['on_file_address']}'."
                ),
                why_suspicious="An address mismatch alone is not proof of fraud but, combined with other signals, can indicate impersonation of a legitimate supplier or an unverified new entity.",
                evidence=[f"invoice:{invoice.invoice_number}:supplier_address", "supplier_record:registered_address"],
                recommended_action="Confirm the supplier's current registered address against Companies House or an equivalent trusted register.",
            )
        )

    vat = signals.vat_number
    if vat is not None and not vat["matches"]:
        findings.append(
            _finding(
                code="SUP-VAT-001",
                category="Supplier Risk / Information Mismatch",
                severity=Severity.MEDIUM,
                title="Supplier VAT number on the invoice differs from the record on file",
                what_happened=(
                    f"Invoice VAT number: {vat['invoice_vat_number']}. "
                    f"On-file VAT number: {vat['on_file_vat_number']}."
                ),
                why_suspicious="A VAT number mismatch can indicate an incorrectly issued invoice or an attempt to impersonate a known, trusted supplier.",
                evidence=[f"invoice:{invoice.invoice_number}:supplier_vat_number", "supplier_record:vat_number"],
                recommended_action="Verify the VAT number against HMRC's VAT number checker before payment.",
            )
        )

    # --- Duplicate invoices ---------------------------------------------
    dup = signals.duplicates
    if dup["duplicate_invoice_number"]:
        findings.append(
            _finding(
                code="INV-DUP-001",
                category="Invoice & Billing Fraud / Duplicate Invoice",
                severity=Severity.CRITICAL,
                title="Invoice number has already been submitted previously",
                what_happened=f"Invoice number {invoice.invoice_number} matches previously recorded invoice(s): {dup['duplicate_invoice_number_refs']}.",
                why_suspicious="A reused invoice number strongly suggests a duplicate payment attempt, whether accidental or deliberate.",
                evidence=[f"invoice:{invoice.invoice_number}", "historical_invoices"],
                recommended_action="Confirm this invoice has not already been paid before releasing any further payment.",
            )
        )
    elif dup["same_amount_same_supplier"]:
        findings.append(
            _finding(
                code="INV-DUP-002",
                category="Invoice & Billing Fraud / Duplicate Invoice",
                severity=Severity.MEDIUM,
                title="Another invoice from the same supplier for an identical amount was found",
                what_happened=f"Invoice(s) {dup['same_amount_refs']} from the same supplier were issued for the identical total amount.",
                why_suspicious="Identical repeat amounts from the same supplier can indicate accidental duplicate billing or invoice splitting.",
                evidence=[f"invoice:{invoice.invoice_number}", "historical_invoices"],
                recommended_action="Cross-check both invoices against goods/services actually received before paying either.",
            )
        )

    # --- Payment record cross-check ----------------------------------------
    pay = signals.payment
    if pay is not None:
        if not pay["amount_matches"]:
            findings.append(
                _finding(
                    code="PAY-001",
                    category="Transaction Risk / Payment Mismatch",
                    severity=Severity.MEDIUM,
                    title="Amount paid does not match the invoice total",
                    what_happened=f"Payment record shows {invoice.currency} {pay['amount_diff']:+.2f} difference versus the invoice total.",
                    why_suspicious="Payments should match the invoiced amount exactly; unexplained differences require reconciliation.",
                    evidence=[f"invoice:{invoice.invoice_number}:total", "payment_record:amount_paid"],
                    recommended_action="Reconcile the payment amount with finance before closing this invoice.",
                )
            )
        if not pay["paid_to_matches_invoice_bank_details"]:
            findings.append(
                _finding(
                    code="PAY-002",
                    category="Transaction Risk / Payment Redirection",
                    severity=Severity.CRITICAL,
                    title="Payment was sent to bank details different from those on the invoice",
                    what_happened="The recorded payment's destination sort code/account number do not match the bank details stated on the invoice.",
                    why_suspicious="A discrepancy between the invoiced bank details and the actual payment destination is a strong indicator that a payment may have been redirected fraudulently.",
                    evidence=[f"invoice:{invoice.invoice_number}:bank_details", "payment_record:paid_to"],
                    recommended_action="Escalate immediately to finance and security teams to confirm the funds reached the intended, verified recipient.",
                )
            )

    return findings
