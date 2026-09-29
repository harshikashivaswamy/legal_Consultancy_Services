import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { LEGAL_CATEGORIES } from "@/lib/mock-data";

const COLUMNS = [
  {
    title: "Platform",
    links: ["Find a lawyer", "How it works", "Pricing", "TekoraAI", "For law firms"],
  },
  {
    title: "Company",
    links: ["About us", "Careers", "Press", "Contact", "Partner with us"],
  },
  {
    title: "Legal",
    links: ["Terms of use", "Privacy policy", "Refund policy", "Grievance redressal", "Disclaimer"],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-hero pt-16 pb-8 text-[oklch(0.9_0.015_250)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo inverted />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[oklch(0.82_0.02_250)]">
              Legal Consultancy Service brings verified advocates, secure document exchange, online consultations
              and AI-guided legal help together in one trusted platform built for India.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {LEGAL_CATEGORIES.slice(0, 6).map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-[oklch(0.86_0.02_250)]"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-[oklch(0.98_0.004_250)]">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      to="/get-started"
                      className="text-sm text-[oklch(0.82_0.02_250)] transition-colors hover:text-gold"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-[oklch(0.78_0.02_250)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Legal Consultancy Service Pvt. Ltd. All rights reserved.</p>
          <p>Information on this platform is not legal advice. Consultations are with independent advocates.</p>
        </div>
      </div>
    </footer>
  );
}