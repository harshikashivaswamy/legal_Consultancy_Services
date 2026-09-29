import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Video,
} from "lucide-react";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLawyer } from "@/lib/mock-data";
import { getStoredBookings, type Booking } from "@/lib/bookings";
import { toast } from "sonner";

export const Route = createFileRoute("/client/bookings")({
  head: () => ({
    meta: [
      { title: "My Bookings — Legal Consultancy Service" },
      { name: "description", content: "All your upcoming and past legal consultations in one place." },
      { property: "og:title", content: "My Bookings — Legal Consultancy Service" },
      { property: "og:description", content: "Track consultation status, mode and payments." },
    ],
  }),
  component: Bookings,
});

function getModeIcon(mode: string) {
  if (mode === "Video") return <Video className="size-4 text-blue-500" />;
  if (mode === "Audio") return <Phone className="size-4 text-emerald-500" />;
  if (mode === "Chat") return <MessageSquare className="size-4 text-purple-500" />;
  return <MapPin className="size-4 text-amber-500" />;
}

function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setBookings(getStoredBookings());
  }, []);

  const handleDownloadReceipt = (b: Booking) => {
    const lawyer = getLawyer(b.lawyerId);
    const receiptText = `LEGAL CONSULTANCY SERVICE - OFFICIAL CONSULTATION RECEIPT\n=======================================================\nReceipt ID: RCP-${b.id}\nBooking ID: ${b.id}\nClient: ${b.client}\nAdvocate: ${lawyer?.name || "Verified Advocate"}\nSpecialization: ${b.category}\nScheduled Date: ${b.date} at ${b.time}\nConsultation Mode: ${b.mode}\nStatus: ${b.status}\nTotal Paid: INR ${b.amount.toLocaleString("en-IN")}\nGST (18% Included): Paid\nPayment Mode: 256-bit Encrypted Fast Settlement\n=======================================================\nThank you for choosing Legal Consultancy Service.`;
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt_${b.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Receipt for ${b.id} downloaded!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="My Bookings & Consultations"
          subtitle="View scheduled appointments, join secure consultation rooms, and download invoices."
        />
        <Button asChild className="rounded-xl gap-2 shrink-0 shadow-soft">
          <Link to="/client/lawyers">
            <Plus className="size-4" /> Book New Consultation
          </Link>
        </Button>
      </div>

      <SectionCard title="All Consultations">
        {bookings.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarCheck className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-base font-semibold">No bookings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Find an advocate and schedule your first consultation in just a few minutes.
            </p>
            <Button asChild className="mt-4 rounded-xl">
              <Link to="/client/lawyers">Browse Advocates</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const lawyer = getLawyer(b.lawyerId);
              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-card/70 p-4.5 transition-all hover:bg-card hover:shadow-soft"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={lawyer?.photo}
                      alt={lawyer?.name}
                      loading="lazy"
                      className="size-12 rounded-xl object-cover border shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary">{b.id}</span>
                        <p className="truncate text-sm font-semibold text-foreground">{lawyer?.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground/90">
                          {getModeIcon(b.mode)} {b.mode}
                        </span>
                        <span>•</span>
                        <span>{b.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {b.date} · {b.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{b.amount.toLocaleString("en-IN")}</p>
                      <Badge
                        variant={b.status === "Confirmed" ? "default" : b.status === "Pending" ? "secondary" : "outline"}
                        className="rounded-full text-[10px] px-2.5"
                      >
                        {b.status}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(b)}
                      className="rounded-xl h-8 px-2.5 text-xs gap-1.5"
                      title="Download Receipt"
                    >
                      <Download className="size-3.5" />
                      <span className="hidden md:inline">Receipt</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}