import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-ink shrink-0">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm shadow-sm">
            M
          </span>
          <span className="hidden sm:inline">M365 License &amp; Cost Optimizer</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="/#how-it-works" className="hover:text-ink transition-colors">
            How it works
          </a>
          <a href="/#pricing" className="hover:text-ink transition-colors">
            Pricing
          </a>
          <a href="/#risk" className="hover:text-ink transition-colors">
            Risk &amp; verification
          </a>
        </nav>
        <Link
          href="/scan"
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          Run a free scan
        </Link>
      </div>
    </header>
  );
}
