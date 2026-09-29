import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart2, CalendarCheck, Users, FileText, Video, MessageSquare, Phone, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { getLawyerBookings, getLawyerDocuments, updateBookingStatus } from "@/lib/database";
import type { Booking } from "@/lib/bookings";
import type { StoredDocument } from "@/lib/documents";
import { toast } from "sonner";

export const Route = createFileRoute("/lawyer/")({
  head: () => ({
    meta: [{ title: "Lawyer Dashboard — Legal Consultancy Service" }],
  }),
  component: LawyerDashboard,
});

function LawyerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const lawyerName = user?.name || "Adv. Ananya Iyer";

  useEffect(() => {
    async function loadData() {
      setLoading(false);
      const b = await getLawyerBookings(lawyerName);
      const d = await getLawyerDocuments(lawyerName);
      setBookings(b);
      setDocuments(d);
    }
    loadData();
  }, [lawyerName]);

  const upcomingBookings = bookings.filter(
    (b) => b.status === "Confirmed" || b.status === "Pending"
  );
  const completedBookings = bookings.filter((b) => b.status === "Completed");

  // Calculate distinct clients
  const uniqueClients = new Set(bookings.map((b) => b.client)).size;

  // Calculate gross and net earnings
  const grossEarnings = bookings
    .filter((b) => b.status === "Confirmed" || b.status === "Completed")
    .reduce((sum, b) => sum + (b.amount || 2000), 0);
  const netEarnings = Math.round(grossEarnings * 0.95);

  const handleMarkComplete = async (bookingId: string) => {
    await updateBookingStatus(bookingId, "Completed");
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Completed" } : b))
    );
    toast.success("Consultation marked as Completed. Escrow payout scheduled.");
  };

  const stats = [
    { label: "Active Clients", value: uniqueClients.toString(), icon: Users, color: "text-blue-500" },
    { label: "Upcoming Sessions", value: upcomingBookings.length.toString(), icon: CalendarCheck, color: "text-emerald-500" },
    { label: "Case Documents", value: documents.length.toString(), icon: FileText, color: "text-violet-500" },
    { label: "Net Earnings", value: `₹${netEarnings.toLocaleString("en-IN")}`, icon: BarChart2, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lawyer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{lawyerName}</span>. Practice overview is active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full text-xs px-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
            ✓ Verified Advocate
          </Badge>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 font-semibold">
            <Link to="/lawyer/settings">Edit Profile & Fees</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl p-5 shadow-soft flex items-center gap-4 border border-border/60 bg-card">
            <div className="grid size-11 place-items-center rounded-xl bg-secondary">
              <s.icon className={`size-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Upcoming Consultations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarCheck className="size-5 text-primary" /> Upcoming Consultations ({upcomingBookings.length})
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs font-semibold gap-1 text-primary">
            <Link to="/lawyer/schedule">
              View Schedule <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {upcomingBookings.length === 0 ? (
          <Card className="rounded-2xl p-8 shadow-soft text-center text-muted-foreground space-y-2 border border-border/60">
            <CalendarCheck className="size-10 mx-auto opacity-30 text-muted-foreground" />
            <p className="font-semibold text-base text-foreground">No upcoming consultations</p>
            <p className="text-sm">
              Once clients book a session with you, they will appear here in real-time.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingBookings.map((b) => (
              <Card key={b.id} className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card space-y-4 hover:border-primary/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-base">{b.client}</h3>
                    <p className="text-xs text-muted-foreground">{b.category}</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex items-center gap-1 font-medium bg-secondary/50">
                    {b.mode === "Video" ? <Video className="size-3 text-blue-500" /> : b.mode === "Chat" ? <MessageSquare className="size-3 text-emerald-500" /> : <Phone className="size-3 text-violet-500" />}
                    {b.mode} Consultation
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 bg-secondary/20 p-2.5 rounded-xl">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Date & Slot</span>
                    <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3 text-primary" /> {b.date} · {b.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Consultation Fee</span>
                    <span className="font-bold text-foreground block mt-0.5">₹{b.amount} (Paid)</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm"
                    onClick={() => toast.info(`Connecting to secure consultation room with ${b.client}...`)}
                  >
                    <Video className="size-3.5" /> Start Consultation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-semibold gap-1 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                    onClick={() => handleMarkComplete(b.id)}
                  >
                    <CheckCircle2 className="size-3.5" /> Mark Done
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Case Documents Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="size-5 text-violet-500" /> Recent Client Documents ({documents.length})
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs font-semibold gap-1 text-primary">
            <Link to="/lawyer/documents">
              Document Vault <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.slice(0, 3).map((d) => (
            <Card key={d.id} className="rounded-2xl p-4 shadow-soft border border-border/60 bg-card space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-lg bg-violet-500/10 text-violet-600">
                    <FileText className="size-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{d.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{d.size} · {d.uploaded}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t text-[11px]">
                <span className="text-muted-foreground">From Client</span>
                <Badge variant="outline" className="text-[10px] bg-secondary/50">
                  {d.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
