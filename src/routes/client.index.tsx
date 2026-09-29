import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, CalendarCheck, FileText, Search, Star, Wallet } from "lucide-react";
import { PageHeader, SectionCard, StatCard } from "@/components/dashboard/primitives";
import { LawyerCard } from "@/components/lawyers/LawyerCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BOOKINGS, DOCUMENTS, LAWYERS, getLawyer } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/client/")({
  head: () => ({
    meta: [
      { title: "Client Dashboard — Legal Consultancy Service" },
      { name: "description", content: "Your appointments, documents, payments and recommended lawyers." },
      { property: "og:title", content: "Client Dashboard — Legal Consultancy Service" },
      { property: "og:description", content: "Track consultations, documents and payments in one place." },
    ],
  }),
  component: ClientDashboard,
});

function ClientDashboard() {
  const { user } = useAuth();
  const upcoming = BOOKINGS.filter((b) => b.status === "Confirmed" || b.status === "Pending");

  return (
    <div>
      <PageHeader
        title={`Namaste, ${user?.name?.split(" ")[0] ?? "there"} 👋`}
        subtitle="Here's what's happening with your legal matters today."
        action={
          <Button asChild className="rounded-xl">
            <Link to="/client/lawyers">Find a lawyer</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Upcoming consultations" value="2" delta="Next: 5 Aug, 10:30 AM" icon={CalendarCheck} index={0} />
        <StatCard label="Active documents" value="4" delta="1 pending review" icon={FileText} index={1} />
        <StatCard label="Total spent" value="₹11,600" delta="Across 6 consultations" icon={Wallet} index={2} />
        <StatCard label="Reviews given" value="3" delta="Average 4.7 rating" icon={Star} index={3} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            title="Upcoming appointments"
            description="Join from here five minutes before your slot."
            action={
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link to="/client/bookings">View all</Link>
              </Button>
            }
          >
            <div className="space-y-3">
              {upcoming.map((b) => {
                const lawyer = getLawyer(b.lawyerId);
                return (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl border bg-background/60 p-4"
                  >
                    <img src={lawyer?.photo} alt={lawyer?.name} loading="lazy" className="size-11 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{lawyer?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.category} · {b.mode} consultation
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(b.date).toDateString().slice(4, 10)}</p>
                      <p className="text-xs text-muted-foreground">{b.time}</p>
                    </div>
                    <Badge variant={b.status === "Confirmed" ? "default" : "secondary"} className="rounded-full">
                      {b.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Recommended for you" description="Matched to your recent matters and location.">
            <div className="grid gap-4 sm:grid-cols-2">
              {LAWYERS.slice(0, 2).map((l, i) => (
                <LawyerCard key={l.id} lawyer={l} index={i} />
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Recent documents"
            action={
              <Button asChild variant="ghost" size="sm" className="rounded-lg">
                <Link to="/client/documents">All</Link>
              </Button>
            }
          >
            <ul className="space-y-3">
              {DOCUMENTS.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.status} · {d.size}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Recent bookings">
            <ul className="space-y-3">
              {BOOKINGS.slice(2, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{getLawyer(b.lawyerId)?.name}</p>
                    <p className="text-xs text-muted-foreground">{b.date} · {b.mode}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    ₹{b.amount.toLocaleString("en-IN")} <ArrowUpRight className="size-3" />
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}