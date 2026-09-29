import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-gold shadow-soft">
        <Scale className="size-5 text-[oklch(0.24_0.05_262)]" strokeWidth={2.2} />
      </span>
      <span
        className={cn(
          "text-lg tracking-tight",
          inverted ? "text-[oklch(0.98_0.004_250)]" : "text-foreground",
        )}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Legal Consultancy <span className="text-gold">Service</span>
      </span>
    </span>
  );
}