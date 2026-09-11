export default function MethodologyPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 space-y-4">
      <h3 className="font-semibold text-ink text-base">Methodology &amp; verification</h3>

      <div>
        <p className="font-medium text-ink">Rules applied</p>
        <ul className="mt-2 space-y-2 list-disc list-inside">
          <li>
            <strong>Inactive:</strong> user holds at least one paid license and shows no activity across any
            tracked workload for at least the inactivity threshold (default 90 days) — recommended for full
            license reclaim.
          </li>
          <li>
            <strong>Duplicate:</strong> user holds two or more licenses where one SKU&apos;s functionality is
            already fully contained in another assigned SKU (e.g. Business Premium already includes Business
            Standard) — recommended to remove the redundant SKU.
          </li>
          <li>
            <strong>Over-specified:</strong> user holds an E5-tier license but their tracked activity in the
            lookback window (default 60 days) is limited to core workloads only, with no Yammer/Viva Engage or
            Skype for Business signal — flagged as an E5→E3 downgrade candidate. This is a proxy signal only;
            it does not check Microsoft Purview, Defender for Office 365, Power BI Pro or Teams Phone usage,
            which a Paid Assessment checks directly against admin center data.
          </li>
        </ul>
      </div>

      <div>
        <p className="font-medium text-ink">Why this is built to be disputed and survive it</p>
        <p className="mt-1">
          Every finding carries the evidence it was derived from (last-activity dates, the exact overlapping
          SKUs) and the CSV export contains the same row-level data. That is the traceability a gain-share
          invoice needs to hold up if a client or their incumbent CSP challenges a line item.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
        <div>
          <p className="font-medium text-ink">Rules change</p>
          <p className="text-xs mt-1">
            Microsoft SKUs, bundling and prices change without notice. Treat this scan as directional; a Paid
            Assessment re-verifies against current Microsoft pricing before anything is actioned.
          </p>
        </div>
        <div>
          <p className="font-medium text-ink">Verifiability</p>
          <p className="text-xs mt-1">
            Prices above are editable indicative list prices, not the client&apos;s contracted CSP rate. Replace
            them before quoting a gain-share fee.
          </p>
        </div>
        <div>
          <p className="font-medium text-ink">CSP channel conflict</p>
          <p className="text-xs mt-1">
            This scan only needs a self-service usage export — no incumbent CSP access is required to get a
            number. Actioning license changes may still need their cooperation.
          </p>
        </div>
      </div>
    </div>
  );
}
