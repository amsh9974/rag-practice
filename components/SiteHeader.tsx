"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#risk", label: "Risk & verification" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-ink"
          onClick={() => setMenuOpen(false)}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white text-sm">
            M
          </span>
          <span>M365 License &amp; Cost Optimizer</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/scan"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Run a free scan
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-ink"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              {menuOpen ? (
                <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path strokeLinecap="round" d="M3 5h14M3 10h14M3 15h14" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1 text-sm text-slate-600"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-2 py-2 hover:bg-slate-50 hover:text-ink"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
