"use client";

import { useState } from "react";
import { LICENSE_CATALOG, type SkuId } from "@/lib/licenseCatalog";
import type { EngineOptions } from "@/lib/engine";

interface EngineSettingsProps {
  options: EngineOptions;
  onChange: (options: EngineOptions) => void;
}

export default function EngineSettings({ options, onChange }: EngineSettingsProps) {
  const [expanded, setExpanded] = useState(false);

  function setPrice(sku: SkuId, value: string) {
    const num = parseFloat(value);
    onChange({
      ...options,
      priceOverrides: {
        ...options.priceOverrides,
        [sku]: Number.isFinite(num) && num >= 0 ? num : undefined,
      },
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="font-semibold text-ink">Assumptions</h3>
        <span className="text-sm text-slate-400">{expanded ? "Hide" : "Edit thresholds & pricing"}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-slate-600">Inactivity threshold (days)</span>
              <input
                type="number"
                min={1}
                value={options.inactivityThresholdDays}
                onChange={(e) =>
                  onChange({ ...options, inactivityThresholdDays: Math.max(1, Number(e.target.value) || 1) })
                }
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-600">E5-downgrade lookback (days)</span>
              <input
                type="number"
                min={1}
                value={options.downgradeLookbackDays}
                onChange={(e) =>
                  onChange({ ...options, downgradeLookbackDays: Math.max(1, Number(e.target.value) || 1) })
                }
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
              />
            </label>
          </div>

          <div>
            <p className="text-sm text-slate-600 mb-2">
              Price list (GBP/user/month, ex VAT) — replace with the client&apos;s actual CSP rate card before
              using a report to invoice gain-share.
            </p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {Object.values(LICENSE_CATALOG).map((sku) => (
                <label key={sku.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-slate-600">{sku.displayName}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={options.priceOverrides[sku.id] ?? sku.listPriceGbpPerMonth}
                    onChange={(e) => setPrice(sku.id, e.target.value)}
                    className="w-24 rounded border border-slate-200 px-2 py-1 text-right"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
