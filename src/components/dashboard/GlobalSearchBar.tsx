import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Lock,
  Search,
  Settings,
  Star,
  UserCheck,
  Users,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { LAWYERS, BOOKINGS, getLawyer } from "@/lib/mock-data";
import { getStoredDocuments, type StoredDocument } from "@/lib/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalSearchBarProps {
  role?: "client" | "lawyer" | "admin";
}

const QUICK_PAGES = [
  { label: "Client Dashboard", to: "/client", icon: LayoutDashboard, category: "Navigation" },
  { label: "Find Lawyers & Advocates", to: "/client/lawyers", icon: Users, category: "Navigation" },
  { label: "My Consultations & Bookings", to: "/client/bookings", icon: CalendarCheck, category: "Navigation" },
  { label: "Encrypted Document Vault", to: "/client/documents", icon: FileText, category: "Navigation" },
  { label: "Payments & Invoices", to: "/client/payments", icon: CreditCard, category: "Navigation" },
  { label: "Reviews & Ratings", to: "/client/reviews", icon: Star, category: "Navigation" },
  { label: "Account Settings", to: "/client/settings", icon: Settings, category: "Navigation" },
];

export function GlobalSearchBar({ role = "client" }: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        lawyers: [],
        bookings: [],
        documents: [],
        pages: QUICK_PAGES.slice(0, 4),
      };
    }

    const matchedLawyers = LAWYERS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.specialization.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.court.toLowerCase().includes(q),
    ).slice(0, 4);

    const matchedBookings = BOOKINGS.filter(
      (b) => {
        const lawyer = getLawyer(b.lawyerId);
        return (
          b.id.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.mode.toLowerCase().includes(q) ||
          b.status.toLowerCase().includes(q) ||
          (lawyer && lawyer.name.toLowerCase().includes(q))
        );
      },
    ).slice(0, 3);

    const storedDocs = getStoredDocuments();
    const matchedDocs = storedDocs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.sharedWith.toLowerCase().includes(q),
    ).slice(0, 3);

    const matchedPages = QUICK_PAGES.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 3);

    return {
      lawyers: matchedLawyers,
      bookings: matchedBookings,
      documents: matchedDocs,
      pages: matchedPages,
    };
  }, [query]);

  const hasResults =
    results.lawyers.length > 0 ||
    results.bookings.length > 0 ||
    results.documents.length > 0 ||
    results.pages.length > 0;

  const handleSelect = (to: string) => {
    setIsOpen(false);
    setQuery("");
    navigate({ to });
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search lawyers, bookings, documents…"
          className="h-10 w-full rounded-xl border border-input bg-background/80 pl-10 pr-20 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card/90"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground select-none pointer-events-none">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Interactive Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-[75vh] w-full min-w-[320px] sm:min-w-[420px] overflow-y-auto rounded-2xl border bg-popover shadow-2xl animate-in fade-in-50 zoom-in-95 p-3">
          {/* If query is empty: Show Suggested Quick Actions */}
          {!query && (
            <div className="space-y-3">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Navigation
              </p>
              <div className="grid gap-1">
                {results.pages.map((p) => (
                  <button
                    key={p.to}
                    onClick={() => handleSelect(p.to)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/15 hover:text-accent-foreground group"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="grid size-7 place-items-center rounded-lg bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <p.icon className="size-4" />
                      </span>
                      <span className="font-medium">{p.label}</span>
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If query is present and has results */}
          {query && (
            <div className="space-y-4">
              {/* Lawyers Section */}
              {results.lawyers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" /> Advocates & Lawyers
                    </p>
                    <button
                      onClick={() => handleSelect("/client/lawyers")}
                      className="text-[11px] text-primary hover:underline"
                    >
                      View all ({LAWYERS.length})
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.lawyers.map((lawyer) => (
                      <button
                        key={lawyer.id}
                        onClick={() => handleSelect(`/client/book/${lawyer.id}`)}
                        className="flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-accent/15 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={lawyer.photo}
                            alt={lawyer.name}
                            className="size-9 rounded-xl object-cover border shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate group-hover:text-primary">
                              {lawyer.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {lawyer.specialization} · {lawyer.city}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            ★ {lawyer.rating}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            ₹{lawyer.fee.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookings Section */}
              {results.bookings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarCheck className="size-3.5 text-emerald-500" /> Bookings & Consultations
                    </p>
                    <button
                      onClick={() => handleSelect("/client/bookings")}
                      className="text-[11px] text-primary hover:underline"
                    >
                      All Bookings
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.bookings.map((b) => {
                      const lawyer = getLawyer(b.lawyerId);
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleSelect("/client/bookings")}
                          className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-accent/15 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary">{b.id}</span>
                              <span className="text-xs font-medium text-foreground truncate">
                                {lawyer?.name || "Advocate"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {b.date} · {b.time} ({b.mode})
                            </p>
                          </div>
                          <Badge
                            variant={b.status === "Confirmed" ? "default" : "secondary"}
                            className="text-[10px] rounded-full"
                          >
                            {b.status}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {results.documents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 pb-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="size-3.5 text-amber-500" /> Vault Documents
                    </p>
                    <button
                      onClick={() => handleSelect("/client/documents")}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Open Vault
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSelect("/client/documents")}
                        className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-accent/15 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Lock className="size-3 text-emerald-500 shrink-0" />
                            <p className="font-medium text-xs text-foreground truncate">{doc.name}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {doc.type} · {doc.sharedWith}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {doc.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Pages matched by query */}
              {results.pages.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Matching Pages
                  </p>
                  <div className="space-y-1">
                    {results.pages.map((p) => (
                      <button
                        key={p.to}
                        onClick={() => handleSelect(p.to)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-accent/15 group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <p.icon className="size-3.5 text-muted-foreground" /> {p.label}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If no matches found */}
          {query && !hasResults && (
            <div className="py-8 text-center">
              <Search className="size-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold">No results for "{query}"</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Try searching for an advocate name (e.g. "Ananya"), a legal field (e.g. "Property", "Criminal"), or document category.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelect("/client/lawyers")}
                  className="rounded-xl text-xs"
                >
                  Browse All Lawyers
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
