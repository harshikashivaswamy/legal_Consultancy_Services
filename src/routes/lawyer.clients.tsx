import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { getLawyerBookings, getLawyerDocuments } from "@/lib/database";
import type { Booking } from "@/lib/bookings";
import type { StoredDocument } from "@/lib/documents";
import { toast } from "sonner";

export const Route = createFileRoute("/lawyer/clients")({
  head: () => ({ meta: [{ title: "My Clients — Lawyer Dashboard" }] }),
  component: LawyerClientsPage,
});

interface ClientRecord {
  name: string;
  email: string;
  phone: string;
  totalSessions: number;
  lastSessionDate: string;
  primaryCategory: string;
  totalSpent: number;
  documentsCount: number;
  status: "Active" | "Past";
  bookings: Booking[];
}

function LawyerClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  const lawyerName = user?.name || "Adv. Ananya Iyer";

  useEffect(() => {
    async function load() {
      const bookings = await getLawyerBookings(lawyerName);
      const docs = await getLawyerDocuments(lawyerName);

      // Group bookings by client
      const map = new Map<string, Booking[]>();
      for (const b of bookings) {
        const list = map.get(b.client) || [];
        list.push(b);
        map.set(b.client, list);
      }

      const clientList: ClientRecord[] = [];
      map.forEach((bList, name) => {
        const sorted = [...bList].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const last = sorted[0]!;
        const totalSpent = bList.reduce((sum, b) => sum + (b.amount || 2000), 0);
        const clientDocs = docs.filter((d) =>
          d.name.toLowerCase().includes(name.toLowerCase().split(" ")[0] || "")
        );

        // Generate synthetic contact for demo
        const cleanName = name.toLowerCase().replace(/[^a-z]/g, "");
        clientList.push({
          name,
          email: `${cleanName}@client.in`,
          phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
          totalSessions: bList.length,
          lastSessionDate: last.date,
          primaryCategory: last.category || "General Advisory",
          totalSpent,
          documentsCount: Math.max(1, clientDocs.length),
          status: bList.some((b) => b.status === "Confirmed" || b.status === "Pending")
            ? "Active"
            : "Past",
          bookings: bList,
        });
      });

      setClients(clientList);
      if (clientList.length > 0) {
        setSelectedClient(clientList[0] || null);
      }
    }
    load();
  }, [lawyerName]);

  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.primaryCategory.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Client Roster & Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track client relationships, case consultation histories, and shared matter files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold">
            {clients.length} Total Client Relationships
          </Badge>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by client name, email, or legal domain..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 text-xs rounded-xl h-9"
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="rounded-2xl p-12 shadow-soft text-center text-muted-foreground space-y-3 border border-border/60">
          <Users className="size-12 mx-auto opacity-30 text-muted-foreground" />
          <p className="font-semibold text-base text-foreground">No clients found</p>
          <p className="text-sm max-w-sm mx-auto">
            Once clients complete consultation bookings with you, their profiles and histories will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Clients List */}
          <div className="lg:col-span-5 space-y-3">
            {filteredClients.map((c) => {
              const isSelected = selectedClient?.name === c.name;
              return (
                <Card
                  key={c.name}
                  onClick={() => setSelectedClient(c)}
                  className={`rounded-2xl p-4 shadow-soft border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border/60 bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-base">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          {c.name}
                          {c.status === "Active" && (
                            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground">{c.primaryCategory}</p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        c.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs border-t pt-3 mt-3">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Sessions</span>
                      <span className="font-bold text-foreground">{c.totalSessions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Total Fees</span>
                      <span className="font-bold text-foreground">₹{c.totalSpent}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase">Last Met</span>
                      <span className="font-medium text-foreground">{c.lastSessionDate}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Client Details Pane */}
          {selectedClient && (
            <div className="lg:col-span-7">
              <Card className="rounded-2xl p-6 shadow-soft border border-border/60 bg-card space-y-6 sticky top-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground font-bold text-xl shadow-md">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {selectedClient.name}
                        <Badge variant="secondary" className="text-xs">
                          {selectedClient.status} Client
                        </Badge>
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="size-3 text-primary" /> {selectedClient.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="size-3 text-primary" /> {selectedClient.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs gap-1 font-semibold"
                      onClick={() => toast.info(`Starting instant chat with ${selectedClient.name}...`)}
                    >
                      <MessageSquare className="size-3.5" /> Message
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl text-xs gap-1 font-semibold"
                      asChild
                    >
                      <Link to="/lawyer/schedule">
                        <Calendar className="size-3.5" /> Schedule Call
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Consultation History */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="size-3.5 text-primary" /> Consultation & Booking History
                  </h3>

                  <div className="space-y-2">
                    {selectedClient.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">{b.category}</p>
                          <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
                            <span>{b.date} · {b.time}</span>
                            <span>•</span>
                            <span className="font-medium text-foreground">{b.mode} Consultation</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              b.status === "Confirmed"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : b.status === "Completed"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {b.status}
                          </Badge>
                          <p className="font-bold text-foreground mt-0.5">₹{b.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Case Documents Access */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="size-3.5 text-violet-500" /> Attached Case Files & Vault
                    </h3>
                    <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-primary h-7">
                      <Link to="/lawyer/documents">
                        Open Vault <ArrowRight className="size-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedClient.documentsCount} documents uploaded and shared under legal privilege for this matter.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
