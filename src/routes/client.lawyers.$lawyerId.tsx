import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { BadgeCheck, Briefcase, Gavel, Languages, MapPin, Star } from "lucide-react";
import { SectionCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { REVIEWS, TIME_SLOTS, getLawyer } from "@/lib/mock-data";

export const Route = createFileRoute("/client/lawyers/$lawyerId")({
  head: () => ({
    meta: [
      { title: "Lawyer profile — Legal Consultancy Service" },
      { name: "description", content: "Experience, specialisation, languages, fees, availability and reviews for this verified advocate." },
      { property: "og:title", content: "Lawyer profile — Legal Consultancy Service" },
      { property: "og:description", content: "Review credentials and book a consultation." },
    ],
  }),
  component: LawyerProfile,
});

const DAYS = ["Mon 4", "Tue 5", "Wed 6", "Thu 7", "Fri 8", "Sat 9"];

function LawyerProfile() {
  const { lawyerId } = Route.useParams();
  const lawyer = getLawyer(lawyerId);
  if (!lawyer) throw notFound();

  return (
    <div className="space-y-6">
      <Card className="gap-0 overflow-hidden rounded-3xl p-0 shadow-soft">
        <div className="h-28 bg-hero" />
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6">
          <img
            src={lawyer.photo}
            alt={`Portrait of ${lawyer.name}`}
            className="-mt-12 size-28 rounded-3xl object-cover ring-4 ring-card"
          />
          <div className="min-w-0 flex-1 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{lawyer.name}</h1>
              {lawyer.verified && (
                <Badge className="gap-1 rounded-full bg-accent/20 text-accent-foreground hover:bg-accent/25">
                  <BadgeCheck className="size-3.5" /> Verified
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lawyer.specialization} · {lawyer.court}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-accent text-accent" /> {lawyer.rating} ({lawyer.reviews} reviews)</span>
              <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4" /> {lawyer.experience} years</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {lawyer.city}</span>
              <span className="inline-flex items-center gap-1.5"><Languages className="size-4" /> {lawyer.languages.join(", ")}</span>
            </div>
          </div>
          <div className="pt-3 text-right">
            <p className="text-2xl font-semibold">₹{lawyer.fee.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted-foreground">per 45-min consultation</p>
            <Button asChild className="mt-3 rounded-xl" size="lg">
              <Link to="/client/book/$lawyerId" params={{ lawyerId: lawyer.id }}>Book appointment</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Biography">
            <p className="text-sm leading-relaxed text-muted-foreground">{lawyer.bio}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Cases handled", value: `${lawyer.cases}+` },
                { label: "Practising since", value: `${2026 - lawyer.experience}` },
                { label: "Response time", value: "< 2 hours" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border bg-background/60 p-4">
                  <p className="text-lg font-semibold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Specialisations">
            <div className="flex flex-wrap gap-2">
              {[lawyer.specialization, ...lawyer.extraSpecializations].map((s) => (
                <Badge key={s} variant="secondary" className="gap-1.5 rounded-full px-3 py-1.5">
                  <Gavel className="size-3.5" /> {s}
                </Badge>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Client reviews" description={`${lawyer.reviews} verified reviews`}>
            <div className="space-y-4">
              {REVIEWS.map((r) => (
                <div key={r.id} className="rounded-xl border bg-background/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{r.author}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.date}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Availability" description="Next 6 working days" className="h-fit">
          <div className="space-y-4">
            {DAYS.slice(0, 3).map((d) => (
              <div key={d}>
                <p className="text-sm font-medium">{d} August</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TIME_SLOTS.slice(0, 5).map((t, i) => (
                    <Link
                      key={t}
                      to="/client/book/$lawyerId"
                      params={{ lawyerId: lawyer.id }}
                      className={
                        i === 2
                          ? "cursor-not-allowed rounded-lg border bg-muted px-2.5 py-1.5 text-xs text-muted-foreground line-through"
                          : "rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:border-accent hover:bg-accent/10"
                      }
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}