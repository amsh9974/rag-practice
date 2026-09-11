"use client";

import { useState } from "react";

interface LeadGateProps {
  onUnlock: (lead: { name: string; company: string; email: string }) => void;
}

export default function LeadGate({ onUnlock }: LeadGateProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !company.trim() || !email.trim()) return;
    onUnlock({ name: name.trim(), company: company.trim(), email: email.trim() });
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-6">
      <h3 className="font-semibold text-ink">Unlock the full per-user report</h3>
      <p className="mt-1 text-sm text-slate-600">
        Your savings summary is above. Enter your details to see the per-user evidence table and export a CSV —
        this is also how you&apos;d kick off a Paid Assessment on the same tenant.
      </p>
      <form onSubmit={submit} className="mt-4 grid sm:grid-cols-3 gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="sm:col-span-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Show full report
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-400">
        Demo build: details are kept in this browser session only and aren&apos;t sent anywhere. Wire this form
        into your CRM/email before going live.
      </p>
    </div>
  );
}
