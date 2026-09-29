import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  Clock,
  Video,
  MessageSquare,
  Phone,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
  Users,
  Search,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { getLawyerBookings, updateBookingStatus } from "@/lib/database";
import type { Booking } from "@/lib/bookings";
import { toast } from "sonner";

export const Route = createFileRoute("/lawyer/schedule")({
  head: () => ({ meta: [{ title: "My Schedule — Lawyer Dashboard" }] }),
  component: LawyerSchedulePage,
});

function LawyerSchedulePage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const lawyerName = user?.name || "Adv. Ananya Iyer";

  useEffect(() => {
    async function load() {
      const data = await getLawyerBookings(lawyerName);
      setBookings(data);
    }
    load();
  }, [lawyerName]);

  const handleStatusChange = async (
    id: string,
    newStatus: "Confirmed" | "Completed" | "Cancelled"
  ) => {
    await updateBookingStatus(id, newStatus);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    toast.success(`Booking status updated to ${newStatus}`);
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === "UPCOMING" && b.status !== "Confirmed" && b.status !== "Pending") return false;
    if (activeTab === "COMPLETED" && b.status !== "Completed") return false;
    if (activeTab === "CANCELLED" && b.status !== "Cancelled") return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.client.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.date.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Consultation Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your booked hearings, client sessions, and consultation room access.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 font-semibold flex items-center gap-1.5 self-start">
          <Clock className="size-3.5 text-primary" /> Active Practice Hours: 09:00 AM - 07:00 PM
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {(["ALL", "UPCOMING", "COMPLETED", "CANCELLED"] as const).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={activeTab === tab ? "default" : "outline"}
              className="rounded-xl text-xs font-semibold"
              onClick={() => setActiveTab(tab)}
            >
              {tab === "ALL" && `All Sessions (${bookings.length})`}
              {tab === "UPCOMING" && `Upcoming (${bookings.filter((b) => b.status === "Confirmed" || b.status === "Pending").length})`}
              {tab === "COMPLETED" && `Completed (${bookings.filter((b) => b.status === "Completed").length})`}
              {tab === "CANCELLED" && `Cancelled (${bookings.filter((b) => b.status === "Cancelled").length})`}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search client or matter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-xl h-9"
          />
        </div>
      </div>

      {/* Appointments List */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl p-12 shadow-soft text-center text-muted-foreground space-y-3 border border-border/60">
          <CalendarCheck className="size-12 mx-auto opacity-30 text-muted-foreground" />
          <p className="font-semibold text-base text-foreground">No matching sessions found</p>
          <p className="text-sm max-w-sm mx-auto">
            {activeTab === "UPCOMING"
              ? "You have no upcoming sessions scheduled. New client bookings will appear here automatically."
              : "No appointments match your current filter settings."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Card
              key={b.id}
              className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="grid size-12 place-items-center rounded-2xl bg-secondary shrink-0">
                  {b.mode === "Video" ? (
                    <Video className="size-6 text-blue-500" />
                  ) : b.mode === "Chat" ? (
                    <MessageSquare className="size-6 text-emerald-500" />
                  ) : (
                    <Phone className="size-6 text-violet-500" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground text-base">{b.client}</h3>
                    <Badge variant="outline" className="text-[11px] font-medium bg-secondary/50">
                      {b.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        b.status === "Confirmed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : b.status === "Completed"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      }`}
                    >
                      {b.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Calendar className="size-3.5 text-primary" /> {b.date}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Clock className="size-3.5 text-primary" /> {b.time}
                    </span>
                    <span>Fee: <strong className="text-foreground">₹{b.amount}</strong></span>
                    <span>Booking ID: <code className="font-mono text-[11px]">{b.id}</code></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {b.status === "Confirmed" && (
                  <>
                    <Button
                      size="sm"
                      className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm"
                      onClick={() =>
                        toast.info(
                          `Launching secure end-to-end encrypted consultation with ${b.client}...`
                        )
                      }
                    >
                      <Video className="size-3.5" /> Start Consultation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs font-semibold gap-1 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                      onClick={() => handleStatusChange(b.id, "Completed")}
                    >
                      <CheckCircle2 className="size-3.5" /> Mark Done
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => handleStatusChange(b.id, "Cancelled")}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {b.status === "Completed" && (
                  <Badge variant="outline" className="text-xs text-muted-foreground gap-1 px-3 py-1 bg-secondary/30">
                    <CheckCircle2 className="size-3 text-emerald-500" /> Settled & Archived
                  </Badge>
                )}

                {b.status === "Cancelled" && (
                  <Badge variant="outline" className="text-xs text-muted-foreground gap-1 px-3 py-1 bg-destructive/5 text-destructive">
                    <XCircle className="size-3" /> Slot Released
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
