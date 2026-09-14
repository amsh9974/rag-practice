"use client";

import type { Finding, FindingType } from "@/lib/engine";
import { LICENSE_CATALOG } from "@/lib/licenseCatalog";

const TYPE_LABEL: Record<FindingType, string> = {
  inactive: "Inactive — reclaim",
  duplicate: "Duplicate license",
  downgrade: "Over-specified",
};

const TYPE_STYLE: Record<FindingType, string> = {
  inactive: "bg-red-50 text-red-700",
  duplicate: "bg-amber-50 text-amber-700",
  downgrade: "bg-blue-50 text-blue-700",
};

function formatGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

function toCsv(findings: Finding[]): string {
  const header = [
    "Type",
    "User",
    "Display Name",
    "Department",
    "Current Licenses",
    "Recommended Action",
    "Evidence",
    "Monthly Saving (GBP)",
    "Annual Saving (GBP)",
  ];
  const rows = findings.map((f) => [
    TYPE_LABEL[f.type],
    f.upn,
    f.displayName,
    f.department ?? "",
    f.currentSkus.map((s) => LICENSE_CATALOG[s].displayName).join(" + "),
    f.recommendedAction,
    f.evidence,
    f.monthlySavingGbp.toFixed(2),
    (f.monthlySavingGbp * 12).toFixed(2),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map((c) => escape(String(c))).join(",")).join("\n");
}

export default function ReportTable({ findings }: { findings: Finding[] }) {
  function exportCsv() {
    const csv = toCsv(findings);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "m365-license-savings-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card text-sm text-slate-600">
        No findings against the current thresholds — either this tenant is well optimised, or try lowering the
        inactivity threshold under Assumptions.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink">Findings ({findings.length})</h3>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Current licenses</th>
              <th className="py-2 pr-3">Recommendation</th>
              <th className="py-2 pr-3">Evidence</th>
              <th className="py-2 pr-3 text-right">£/mo</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f) => (
              <tr key={f.id} className="border-b border-slate-100 align-top">
                <td className="py-2.5 pr-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLE[f.type]}`}>
                    {TYPE_LABEL[f.type]}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <div className="font-medium text-ink">{f.displayName}</div>
                  <div className="text-xs text-slate-400">{f.upn}</div>
                  {f.department && <div className="text-xs text-slate-400">{f.department}</div>}
                </td>
                <td className="py-2.5 pr-3 text-slate-600">
                  {f.currentSkus.map((s) => LICENSE_CATALOG[s].displayName).join(" + ")}
                </td>
                <td className="py-2.5 pr-3 text-slate-600 max-w-xs">{f.recommendedAction}</td>
                <td className="py-2.5 pr-3 text-slate-500 max-w-xs text-xs">{f.evidence}</td>
                <td className="py-2.5 pr-3 text-right font-medium text-ink whitespace-nowrap">
                  {formatGbp(f.monthlySavingGbp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
