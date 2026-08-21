from innoligo.engine import calculations as calc
from innoligo.models import Invoice, LineItem, PaymentRecord, PurchaseOrder, SupplierRecord


def make_invoice(**overrides) -> Invoice:
    base = dict(
        invoice_number="INV-1",
        issue_date="2026-01-01",
        supplier_name="Acme Ltd",
        supplier_address="1 Test St",
        supplier_vat_number="GB000000001",
        customer_name="Buyer Ltd",
        po_number="PO-1",
        currency="GBP",
        line_items=[LineItem("Widgets", 10, 5.0)],
        subtotal=50.0,
        vat_rate=0.20,
        vat_amount=10.0,
        total=60.0,
        bank_account_name="Acme Ltd",
        bank_sort_code="00-00-00",
        bank_account_number="12345678",
    )
    base.update(overrides)
    return Invoice(**base)


def test_verify_invoice_math_correct_invoice_is_ok():
    invoice = make_invoice()
    result = calc.verify_invoice_math(invoice)
    assert result["subtotal_ok"]
    assert result["vat_ok"]
    assert result["total_ok"]


def test_verify_invoice_math_detects_manipulated_total():
    invoice = make_invoice(total=999.0)
    result = calc.verify_invoice_math(invoice)
    assert result["total_ok"] is False
    assert result["total_diff"] == 939.0


def test_compare_invoice_to_po_flags_quantity_mismatch():
    invoice = make_invoice(line_items=[LineItem("Widgets", 10, 5.0)], subtotal=50.0)
    po = PurchaseOrder(
        po_number="PO-1",
        issue_date="2026-01-01",
        supplier_name="Acme Ltd",
        customer_name="Buyer Ltd",
        line_items=[LineItem("Widgets", 8, 5.0)],
        approved_total=40.0,
        currency="GBP",
    )
    result = calc.compare_invoice_to_po(invoice, po)
    assert len(result["line_mismatches"]) == 1
    assert result["line_mismatches"][0]["issue"] == "quantity_or_price_mismatch"
    assert result["exceeds_tolerance"] is True


def test_compare_invoice_to_po_within_tolerance_not_flagged():
    invoice = make_invoice(line_items=[LineItem("Widgets", 10, 5.0)], subtotal=50.0)
    po = PurchaseOrder(
        po_number="PO-1",
        issue_date="2026-01-01",
        supplier_name="Acme Ltd",
        customer_name="Buyer Ltd",
        line_items=[LineItem("Widgets", 10, 5.0)],
        approved_total=49.6,  # < 2% variance
        currency="GBP",
    )
    result = calc.compare_invoice_to_po(invoice, po)
    assert result["line_mismatches"] == []
    assert result["exceeds_tolerance"] is False


def test_check_bank_detail_change_detects_difference():
    invoice = make_invoice(bank_sort_code="11-11-11", bank_account_number="11111111")
    supplier = SupplierRecord(
        supplier_name="Acme Ltd",
        registered_address="1 Test St",
        vat_number="GB000000001",
        on_file_bank_sort_code="22-22-22",
        on_file_bank_account_number="22222222",
        on_file_since="2020-01-01",
        last_verified="2024-01-01",
    )
    result = calc.check_bank_detail_change(invoice, supplier)
    assert result["bank_details_changed"] is True
    assert result["sort_code_changed"] is True
    assert result["account_number_changed"] is True


def test_check_bank_detail_change_no_change():
    invoice = make_invoice(bank_sort_code="22-22-22", bank_account_number="22222222")
    supplier = SupplierRecord(
        supplier_name="Acme Ltd",
        registered_address="1 Test St",
        vat_number="GB000000001",
        on_file_bank_sort_code="22-22-22",
        on_file_bank_account_number="22222222",
        on_file_since="2020-01-01",
        last_verified="2024-01-01",
    )
    result = calc.check_bank_detail_change(invoice, supplier)
    assert result["bank_details_changed"] is False


def test_check_address_mismatch_ignores_case_and_whitespace():
    invoice = make_invoice(supplier_address="  1  Test   St ")
    supplier = SupplierRecord(
        supplier_name="Acme Ltd",
        registered_address="1 test st",
        vat_number="GB000000001",
        on_file_bank_sort_code="00-00-00",
        on_file_bank_account_number="12345678",
        on_file_since="2020-01-01",
        last_verified="2024-01-01",
    )
    result = calc.check_address_mismatch(invoice, supplier)
    assert result["matches"] is True


def test_check_duplicate_invoices_detects_reused_number():
    invoice = make_invoice(invoice_number="INV-DUP")
    historical = [make_invoice(invoice_number="INV-DUP", total=1.0)]
    result = calc.check_duplicate_invoices(invoice, historical)
    assert result["duplicate_invoice_number"] is True
    assert result["duplicate_invoice_number_refs"] == ["INV-DUP"]


def test_check_duplicate_invoices_detects_same_amount_same_supplier():
    invoice = make_invoice(invoice_number="INV-2", total=60.0)
    historical = [make_invoice(invoice_number="INV-1", total=60.0)]
    result = calc.check_duplicate_invoices(invoice, historical)
    assert result["duplicate_invoice_number"] is False
    assert result["same_amount_same_supplier"] is True


def test_check_duplicate_invoices_no_match():
    invoice = make_invoice(invoice_number="INV-2", total=60.0)
    historical = [make_invoice(invoice_number="INV-1", total=999.0)]
    result = calc.check_duplicate_invoices(invoice, historical)
    assert result["duplicate_invoice_number"] is False
    assert result["same_amount_same_supplier"] is False


def test_check_payment_against_invoice_matches():
    invoice = make_invoice()
    payment = PaymentRecord(
        payment_reference="PAY-1",
        invoice_number="INV-1",
        amount_paid=60.0,
        payment_date="2026-01-05",
        paid_to_sort_code="00-00-00",
        paid_to_account_number="12345678",
        payment_method="bank_transfer",
    )
    result = calc.check_payment_against_invoice(invoice, payment)
    assert result["reference_matches"] is True
    assert result["amount_matches"] is True
    assert result["paid_to_matches_invoice_bank_details"] is True


def test_check_payment_against_invoice_detects_redirected_payment():
    invoice = make_invoice()
    payment = PaymentRecord(
        payment_reference="PAY-1",
        invoice_number="INV-1",
        amount_paid=60.0,
        payment_date="2026-01-05",
        paid_to_sort_code="99-99-99",
        paid_to_account_number="99999999",
        payment_method="bank_transfer",
    )
    result = calc.check_payment_against_invoice(invoice, payment)
    assert result["paid_to_matches_invoice_bank_details"] is False


def test_is_suspiciously_round():
    assert calc.is_suspiciously_round(1000.0) is True
    assert calc.is_suspiciously_round(1234.56) is False
