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
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-8">
          <div>
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide">Free scan</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-ink tracking-tight">Find the waste in minutes</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Upload a usage export or enter licenses manually. Nothing leaves your browser — this scan runs
              entirely client-side.
            </p>
          </div>

          <div className="inline-flex gap-1 rounded-lg bg-slate-200/60 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`rounded-md px-4 py-2 font-medium transition-colors ${
                mode === "upload" ? "bg-white text-ink shadow-sm" : "text-slate-600 hover:text-ink"
              }`}
            >
              Upload CSV
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`rounded-md px-4 py-2 font-medium transition-colors ${
                mode === "manual" ? "bg-white text-ink shadow-sm" : "text-slate-600 hover:text-ink"
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

              <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl"
                />
                <p className="relative text-white font-semibold text-lg">
                  Want these findings independently verified and turned into an action plan?
                </p>
                <p className="relative mt-2 text-slate-300 text-sm max-w-xl mx-auto">
                  The Paid Assessment (£499, fixed price) checks every finding against the live tenant, then a
                  one-time 25% gain-share applies only to the savings you actually action.
                </p>
                <a
                  href="/api/checkout"
                  className="relative mt-5 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm hover:bg-slate-100 transition-colors"
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
