"use client";

import { useRef, useState } from "react";
import { parseUsageReportCsv, type ParseResult } from "@/lib/parseUsageReport";

interface UploadPanelProps {
  onParsed: (result: ParseResult, sourceLabel: string) => void;
}

export default function UploadPanel({ onParsed }: UploadPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setIsLoading(true);
    setFileName(file.name);
    try {
      const text = await file.text();
      const result = parseUsageReportCsv(text);
      onParsed(result, file.name);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSample() {
    setIsLoading(true);
    setFileName("sample-active-users.csv");
    try {
      const res = await fetch("/sample-data/sample-active-users.csv");
      const text = await res.text();
      const result = parseUsageReportCsv(text);
      onParsed(result, "sample-active-users.csv (bundled demo data)");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="font-semibold text-ink">Upload a usage export</h3>
      <p className="mt-1 text-sm text-slate-600">
        In the Microsoft 365 admin center: Reports → Usage → Active users → Export. Or use the simplified CSV
        template below for a smaller tenant.
      </p>

      <div
        className="mt-4 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-brand-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <p className="text-sm text-slate-600">
          {fileName ? (
            <span className="font-medium text-ink">{fileName}</span>
          ) : (
            <>
              <span className="font-medium text-brand-600">Click to upload</span> or drag a CSV file here
            </>
          )}
        </p>
        {isLoading && <p className="mt-2 text-xs text-slate-400">Parsing…</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => void loadSample()}
          className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-ink hover:bg-slate-50"
        >
          Try with sample tenant data
        </button>
        <a
          href="/sample-data/simplified-template.csv"
          download
          className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-ink hover:bg-slate-50"
        >
          Download simplified template
        </a>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Processed entirely in your browser — the file is never uploaded to a server.
      </p>
    </div>
  );
}
