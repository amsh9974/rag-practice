"use client";

import { useActionState } from "react";
import { captureLead, type CaptureLeadState } from "@/app/actions/capture-lead";
import { COMPANY_SIZE_BANDS } from "@/lib/leads/schema";

const initialState: CaptureLeadState = { status: "idle" };

export function LeadCaptureForm() {
  const [state, formAction, isPending] = useActionState(captureLead, initialState);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center"
      >
        <p className="font-medium text-neutral-900">Thanks - check your inbox.</p>
        <p className="mt-1 text-sm text-neutral-600">
          We&apos;ll be in touch about booking your free scan.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="workEmail" className="sr-only">
          Work email
        </label>
        <input
          id="workEmail"
          name="workEmail"
          type="email"
          required
          placeholder="you@company.co.uk"
          className="w-full rounded-md border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
        />
      </div>
      <div>
        <label htmlFor="companySize" className="sr-only">
          Company size
        </label>
        <select
          id="companySize"
          name="companySize"
          required
          defaultValue=""
          className="w-full rounded-md border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900 sm:w-auto"
        >
          <option value="" disabled>
            Company size
          </option>
          {COMPANY_SIZE_BANDS.map((band) => (
            <option key={band.id} value={band.id}>
              {band.label} employees
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-neutral-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Get my free scan"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="basis-full text-sm text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
