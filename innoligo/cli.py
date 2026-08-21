"""Run the Meridian Oak demo scenario end to end.

Usage:
    python -m innoligo.cli
    python -m innoligo.cli --json   # print the structured assessment as JSON instead
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from innoligo.pipeline import run_invoice_fraud_check

DEMO_DIR = Path(__file__).resolve().parent.parent / "demo" / "meridian_oak"


def _load(name: str) -> dict:
    with open(DEMO_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def run_demo() -> None:
    parser = argparse.ArgumentParser(description="Innoligo AI Invoice Fraud & Financial Document Checker demo")
    parser.add_argument("--json", action="store_true", help="Print the risk assessment as JSON instead of the report")
    args = parser.parse_args()

    result = run_invoice_fraud_check(
        invoice_data=_load("invoice.json"),
        purchase_order_data=_load("purchase_order.json"),
        supplier_record_data=_load("supplier_record.json"),
        payment_record_data=_load("payment_record.json"),
        historical_invoices_data=_load("historical_invoices.json"),
    )

    if args.json:
        print(json.dumps(result.assessment.to_dict(), indent=2))
    else:
        print(result.report_markdown)


if __name__ == "__main__":
    run_demo()
