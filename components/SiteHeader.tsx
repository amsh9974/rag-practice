import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white text-sm">
            M
          </span>
          <span>M365 License &amp; Cost Optimizer</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
          <a href="/#how-it-works" className="hover:text-ink">
            How it works
          </a>
          <a href="/#pricing" className="hover:text-ink">
            Pricing
          </a>
          <a href="/#risk" className="hover:text-ink">
            Risk &amp; verification
          </a>
        </nav>
        <Link
          href="/scan"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        >
          Run a free scan
        </Link>
      </div>
    </header>
  );
}
