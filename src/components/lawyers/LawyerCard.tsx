import { Link } from "@tanstack/react-router";
import { BadgeCheck, Languages, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lawyer } from "@/lib/mock-data";

export function LawyerCard({ lawyer }: { lawyer: Lawyer; index?: number }) {
  return (
    <div className="h-full">
      <Card className="group h-full gap-0 overflow-hidden rounded-2xl p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className="flex items-start gap-4">
          <img
            src={lawyer.photo}
            alt={`Portrait of ${lawyer.name}`}
            loading="lazy"
            className="size-16 rounded-2xl object-cover ring-2 ring-accent/30"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-semibold">{lawyer.name}</p>
              {lawyer.verified && <BadgeCheck className="size-4 shrink-0 text-accent" />}
            </div>
            <p className="truncate text-sm text-muted-foreground">{lawyer.specialization}</p>
            <div className="mt-1.5 flex items-center gap-1 text-sm">
              <Star className="size-3.5 fill-accent text-accent" />
              <span className="font-medium">{lawyer.rating}</span>
              <span className="text-muted-foreground">({lawyer.reviews})</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {lawyer.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Languages className="size-3.5" /> {lawyer.languages.join(", ")}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-full">
            {lawyer.experience} yrs exp
          </Badge>
          <Badge variant="secondary" className="rounded-full">
            ₹{lawyer.fee.toLocaleString("en-IN")} / session
          </Badge>
          {lawyer.availableToday && (
            <Badge className="rounded-full bg-accent/20 text-accent-foreground hover:bg-accent/25">
              Available today
            </Badge>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button asChild variant="outline" className="flex-1 rounded-xl">
            <Link to="/client/lawyers/$lawyerId" params={{ lawyerId: lawyer.id }}>
              View profile
            </Link>
          </Button>
          <Button asChild className="flex-1 rounded-xl">
            <Link to="/client/book/$lawyerId" params={{ lawyerId: lawyer.id }}>
              Book
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}