export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-slate-500 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-white text-[10px] font-semibold shrink-0">
            M
          </span>
          M365 License &amp; Cost Optimizer — a lead-magnet scan backed by a paid Microsoft 365 licensing
          assessment service.
        </p>
        <p>Not affiliated with or endorsed by Microsoft. &quot;Microsoft 365&quot; is a trademark of Microsoft Corporation.</p>
      </div>
    </footer>
  );
}
