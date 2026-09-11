import type { EngineSummary } from "@/lib/engine";

function formatGbp(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
}

export default function ReportSummary({ summary }: { summary: EngineSummary }) {
  const cards = [
    { label: "Users analyzed", value: summary.usersAnalyzed.toLocaleString("en-GB") },
    { label: "Current monthly spend", value: formatGbp(summary.totalMonthlySpendGbp) },
    { label: "Addressable monthly savings", value: formatGbp(summary.totalMonthlySavingsGbp), accent: true },
    { label: "Addressable annual savings", value: formatGbp(summary.totalAnnualSavingsGbp), accent: true },
  ];

  const breakdown = [
    { type: "inactive", label: "Inactive users with a live license", count: summary.countByType.inactive, saving: summary.savingsByType.inactive },
    { type: "duplicate", label: "Duplicate / overlapping licenses", count: summary.countByType.duplicate, saving: summary.savingsByType.duplicate },
    { type: "downgrade", label: "Over-specified (E5 used like E3)", count: summary.countByType.downgrade, saving: summary.savingsByType.downgrade },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.accent ? "text-brand-700" : "text-ink"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-ink mb-3">Savings by finding type</p>
        <div className="space-y-2">
          {breakdown.map((b) => (
            <div key={b.type} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">
                {b.label} <span className="text-slate-400">({b.count})</span>
              </span>
              <span className="font-medium text-ink">{formatGbp(b.saving)}/mo</span>
            </div>
          ))}
        </div>
      </div>

      {!summary.hasWorkloadDetail && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
          This dataset has no per-workload activity detail (simplified format), so over-specified E5 seats
          can&apos;t be flagged — only inactivity and duplicate/overlapping licenses were checked. Upload the
          native Microsoft 365 &quot;Active users&quot; export for the full rule set.
        </p>
      )}

      {summary.unrecognizedProductTokens.length > 0 && (
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-3">
          {summary.unrecognizedProductTokens.length} product token(s) in the file weren&apos;t recognised and
          were ignored for pricing (e.g. add-ons like Visio, Power BI Pro, Teams Phone): {" "}
          {summary.unrecognizedProductTokens.slice(0, 8).join(", ")}
          {summary.unrecognizedProductTokens.length > 8 ? "…" : ""}
        </p>
      )}
    </div>
  );
}
