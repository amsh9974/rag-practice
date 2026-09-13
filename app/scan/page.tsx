"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import UploadPanel from "@/components/UploadPanel";
import ManualEntryTable from "@/components/ManualEntryTable";
import EngineSettings from "@/components/EngineSettings";
import ReportSummary from "@/components/ReportSummary";
import ReportTable from "@/components/ReportTable";
import MethodologyPanel from "@/components/MethodologyPanel";
import LeadGate from "@/components/LeadGate";
import { runEngine, DEFAULT_ENGINE_OPTIONS, type EngineOptions } from "@/lib/engine";
import type { ParseResult, UserRecord } from "@/lib/parseUsageReport";

type InputMode = "upload" | "manual";

export default function ScanPage() {
  const [mode, setMode] = useState<InputMode>("upload");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [options, setOptions] = useState<EngineOptions>(DEFAULT_ENGINE_OPTIONS);
  const [unlocked, setUnlocked] = useState(false);

  function handleParsed(result: ParseResult, label: string) {
    setUsers(result.users);
    setWarnings(result.warnings);
    setSourceLabel(label);
    setUnlocked(false);
  }

  function handleManualApply(rows: UserRecord[]) {
    setUsers(rows);
    setWarnings([]);
    setSourceLabel(`${rows.length} manually entered user(s)`);
    setUnlocked(false);
  }

  const result = useMemo(() => (users.length > 0 ? runEngine(users, options) : null), [users, options]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">Free scan</h1>
            <p className="mt-2 text-slate-600">
              Upload a usage export or enter licenses manually. Nothing leaves your browser — this scan runs
              entirely client-side.
            </p>
          </div>

          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`rounded-md px-4 py-2 font-medium ${
                mode === "upload" ? "bg-ink text-white" : "bg-white border border-slate-300 text-ink"
              }`}
            >
              Upload CSV
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-md px-4 py-2 font-medium ${
                mode === "manual" ? "bg-ink text-white" : "bg-white border border-slate-300 text-ink"
              }`}
            >
              Enter manually
            </button>
          </div>

          {mode === "upload" ? (
            <UploadPanel onParsed={handleParsed} />
          ) : (
            <ManualEntryTable onApply={handleManualApply} />
          )}

          {warnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Notes from parsing {sourceLabel}:</p>
              <ul className="mt-1 list-disc list-inside">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {result && (
            <>
              <EngineSettings options={options} onChange={setOptions} />

              <div>
                <p className="text-xs text-slate-500 mb-3">
                  Source: {sourceLabel} · {result.summary.usersAnalyzed} user(s) analyzed
                </p>
                <ReportSummary summary={result.summary} />
              </div>

              {unlocked ? (
                <ReportTable findings={result.findings} />
              ) : (
                <LeadGate onUnlock={() => setUnlocked(true)} />
              )}

              <MethodologyPanel />

              <div className="rounded-xl border border-ink bg-ink p-6 text-center">
                <p className="text-white font-semibold">
                  Want these findings independently verified and turned into an action plan?
                </p>
                <p className="mt-1 text-slate-300 text-sm">
                  The Paid Assessment (£499, fixed price) checks every finding against the live tenant, then a
                  one-time 25% gain-share applies only to the savings you actually action.
                </p>
                <a
                  href="mailto:amitsh@innoligo.com?subject=M365%20License%20Assessment"
                  className="mt-4 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-slate-100"
                >
                  Book a Paid Assessment
                </a>
              </div>
            </>
          )}

          {!result && (
            <p className="text-sm text-slate-500">
              No data loaded yet.{" "}
              <Link href="/#pricing" className="text-brand-600 hover:underline">
                See pricing
              </Link>{" "}
              or load the sample tenant above to see a report in seconds.
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
