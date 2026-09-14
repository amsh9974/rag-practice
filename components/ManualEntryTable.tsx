"use client";

import { useState } from "react";
import { resolveProducts, parseDateCell, type UserRecord } from "@/lib/parseUsageReport";
import { LICENSE_CATALOG } from "@/lib/licenseCatalog";

interface ManualRow {
  upn: string;
  displayName: string;
  department: string;
  licensesText: string;
  lastActivityDate: string;
}

function emptyRow(): ManualRow {
  return { upn: "", displayName: "", department: "", licensesText: "", lastActivityDate: "" };
}

interface ManualEntryTableProps {
  onApply: (users: UserRecord[]) => void;
}

const SKU_HINT = Object.values(LICENSE_CATALOG)
  .map((s) => s.displayName)
  .join(" · ");

export default function ManualEntryTable({ onApply }: ManualEntryTableProps) {
  const [rows, setRows] = useState<ManualRow[]>([emptyRow(), emptyRow(), emptyRow()]);

  function updateRow(index: number, patch: Partial<ManualRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function apply() {
    const users: UserRecord[] = rows
      .filter((r) => r.upn.trim())
      .map((r) => {
        const { skus, unrecognized } = resolveProducts(r.licensesText);
        return {
          upn: r.upn.trim(),
          displayName: r.displayName.trim() || r.upn.trim(),
          department: r.department.trim() || null,
          assignedSkus: skus,
          unrecognizedProducts: unrecognized,
          lastActivityDate: parseDateCell(r.lastActivityDate),
          workloadActivity: {},
        };
      });
    onApply(users);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="font-semibold text-ink">Enter licenses manually</h3>
      <p className="mt-1 text-sm text-slate-600">
        For a small tenant, list each user directly. Type license names in the license column, separated by
        commas — e.g. <code className="text-xs bg-slate-100 rounded px-1">Microsoft 365 E3, EMS E3</code>.
      </p>
      <p className="mt-1 text-xs text-slate-400">Recognised SKUs: {SKU_HINT}</p>
      <p className="mt-1 text-xs text-slate-400">
        Leave &quot;Last active&quot; blank if the user has never been seen active — they&apos;ll be flagged for
        review rather than silently skipped.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-2">Email / UPN</th>
              <th className="py-2 pr-2">Display name</th>
              <th className="py-2 pr-2">Department</th>
              <th className="py-2 pr-2">Licenses</th>
              <th className="py-2 pr-2">Last active</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 pr-2">
                  <input
                    value={row.upn}
                    onChange={(e) => updateRow(i, { upn: e.target.value })}
                    placeholder="jane.doe@company.com"
                    className="w-full rounded border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    value={row.displayName}
                    onChange={(e) => updateRow(i, { displayName: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full rounded border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    value={row.department}
                    onChange={(e) => updateRow(i, { department: e.target.value })}
                    placeholder="Finance"
                    className="w-full rounded border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    value={row.licensesText}
                    onChange={(e) => updateRow(i, { licensesText: e.target.value })}
                    placeholder="Microsoft 365 E3"
                    className="w-full rounded border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="date"
                    value={row.lastActivityDate}
                    onChange={(e) => updateRow(i, { lastActivityDate: e.target.value })}
                    className="w-full rounded border border-slate-200 px-2 py-1"
                  />
                </td>
                <td className="py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-slate-400 hover:text-red-500"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addRow}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50"
        >
          + Add row
        </button>
        <button
          type="button"
          onClick={apply}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Use this data
        </button>
      </div>
    </div>
  );
}
