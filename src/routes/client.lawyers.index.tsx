import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal, Star } from "lucide-react";
import { PageHeader } from "@/components/dashboard/primitives";
import { LawyerCard } from "@/components/lawyers/LawyerCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CITIES, LANGUAGES, LAWYERS, LEGAL_CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/client/lawyers/")({
  head: () => ({
    meta: [
      { title: "Find a Lawyer — Legal Consultancy Service" },
      {
        name: "description",
        content: "Search verified Indian advocates by specialisation, city, language, experience, fee and rating.",
      },
      { property: "og:title", content: "Find a Lawyer — Legal Consultancy Service" },
      { property: "og:description", content: "Advanced search across 100+ verified advocates." },
    ],
  }),
  component: FindLawyers,
});

const ANY = "any";

function FindLawyers() {
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState(ANY);
  const [city, setCity] = useState(ANY);
  const [lang, setLang] = useState(ANY);
  const [minExp, setMinExp] = useState([0]);
  const [maxFee, setMaxFee] = useState([6000]);
  const [minRating, setMinRating] = useState([4]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState("rating");

  const results = useMemo(() => {
    const list = LAWYERS.filter((l) => {
      if (q && !`${l.name} ${l.specialization} ${l.city}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (spec !== ANY && l.specialization !== spec) return false;
      if (city !== ANY && l.city !== city) return false;
      if (lang !== ANY && !l.languages.includes(lang)) return false;
      if (l.experience < minExp[0]!) return false;
      if (l.fee > maxFee[0]!) return false;
      if (l.rating < minRating[0]!) return false;
      if (availableOnly && !l.availableToday) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "fee") return a.fee - b.fee;
      if (sort === "experience") return b.experience - a.experience;
      return b.rating - a.rating;
    });
  }, [q, spec, city, lang, minExp, maxFee, minRating, availableOnly, sort]);

  const reset = () => {
    setQ("");
    setSpec(ANY);
    setCity(ANY);
    setLang(ANY);
    setMinExp([0]);
    setMaxFee([6000]);
    setMinRating([4]);
    setAvailableOnly(false);
  };

  return (
    <div>
      <PageHeader
        title="Find a lawyer"
        subtitle={`${results.length} verified advocates match your filters`}
        action={
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-48 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Sort: Top rated</SelectItem>
              <SelectItem value="fee">Sort: Lowest fee</SelectItem>
              <SelectItem value="experience">Sort: Most experience</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit gap-0 rounded-2xl p-5 shadow-soft lg:sticky lg:top-24">
          <div className="mb-4 flex items-center justify-between">
            <p className="inline-flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="size-4" /> Filters
            </p>
            <Button variant="ghost" size="sm" onClick={reset} className="h-7 rounded-lg text-xs">
              Reset
            </Button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Keyword</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, city, area…" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Specialization</Label>
              <Select value={spec} onValueChange={setSpec}>
                <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All specializations</SelectItem>
                  {LEGAL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All cities</SelectItem>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any language</SelectItem>
                  {LANGUAGES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Minimum experience: {minExp[0]} yrs</Label>
              <Slider value={minExp} onValueChange={setMinExp} min={0} max={25} step={1} />
            </div>

            <div className="space-y-2">
              <Label>Max fee: ₹{maxFee[0]?.toLocaleString("en-IN")}</Label>
              <Slider value={maxFee} onValueChange={setMaxFee} min={500} max={6000} step={100} />
            </div>

            <div className="space-y-2">
              <Label className="inline-flex items-center gap-1.5">
                Minimum rating: {minRating[0]} <Star className="size-3.5 fill-accent text-accent" />
              </Label>
              <Slider value={minRating} onValueChange={setMinRating} min={3} max={5} step={0.1} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="avail">Available today</Label>
              <Switch id="avail" checked={availableOnly} onCheckedChange={setAvailableOnly} />
            </div>
          </div>
        </Card>

        <div>
          {results.length === 0 ? (
            <Card className="rounded-2xl p-12 text-center shadow-soft">
              <p className="font-medium">No advocates match these filters</p>
              <p className="mt-1 text-sm text-muted-foreground">Try widening the fee range or clearing the city filter.</p>
              <Button onClick={reset} variant="outline" className="mx-auto mt-5 rounded-xl">Reset filters</Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l, i) => (
                <LawyerCard key={l.id} lawyer={l} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}