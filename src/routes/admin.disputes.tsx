import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  Gavel,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisputes, resolveDispute, type Dispute } from "@/lib/database";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/disputes")({
  head: () => ({ meta: [{ title: "Disputes & Escrow Arbitration — Admin Portal" }] }),
  component: AdminDisputesPage,
});

function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"OPEN" | "RESOLVED">("OPEN");

  useEffect(() => {
    async function load() {
      const data = await getDisputes();
      setDisputes(data);
    }
    load();
  }, []);

  const handleResolve = async (
    id: string,
    decision: "Refunded" | "Released"
  ) => {
    resolveDispute(id, decision);
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: decision,
            }
          : d
      )
    );
    toast.success(`Dispute ${id} resolved: Escrow ${decision}.`);
  };

  const openDisputes = disputes.filter((d) => d.status === "Open" || d.status === "Under Review");
  const resolvedDisputes = disputes.filter((d) => d.status === "Refunded" || d.status === "Released");

  const displayList = filterTab === "OPEN" ? openDisputes : resolvedDisputes;
  const filtered = displayList.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.clientName.toLowerCase().includes(q) ||
      d.lawyerName.toLowerCase().includes(q) ||
      d.reason.toLowerCase().includes(q) ||
      d.bookingId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Disputes & Escrow Arbitration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arbitrate client complaints, investigate consultation delivery, and disburse held escrow funds.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 font-semibold flex items-center gap-1.5 self-start">
          <Gavel className="size-3.5 text-primary" /> Multi-Sig Escrow Vault Active
        </Badge>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filterTab === "OPEN" ? "default" : "outline"}
            className="rounded-xl text-xs font-semibold"
            onClick={() => setFilterTab("OPEN")}
          >
            Active Disputes ({openDisputes.length})
          </Button>
          <Button
            size="sm"
            variant={filterTab === "RESOLVED" ? "default" : "outline"}
            className="rounded-xl text-xs font-semibold"
            onClick={() => setFilterTab("RESOLVED")}
          >
            Resolved Cases ({resolvedDisputes.length})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search booking ID, client or lawyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-xl h-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-2xl p-12 shadow-soft text-center text-muted-foreground space-y-3 border border-border/60">
          <CheckCircle2 className="size-12 mx-auto text-emerald-500" />
          <p className="font-semibold text-base text-foreground">
            {filterTab === "OPEN" ? "All Clear! No Active Disputes" : "No Resolved Records"}
          </p>
          <p className="text-sm max-w-sm mx-auto">
            {filterTab === "OPEN"
              ? "All platform consultations have concluded satisfactorily with zero pending client disputes."
              : "No past arbitration decisions to show."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Booking: {d.bookingId}
                    </Badge>
                    <h3 className="font-bold text-foreground text-sm">Dispute: {d.id}</h3>
                  </div>
                  <Badge
                    variant={d.status === "Open" ? "destructive" : "secondary"}
                    className="text-[10px] font-bold"
                  >
                    {d.status}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Complainant Client:</span>
                    <span className="font-bold text-foreground">{d.clientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned Advocate:</span>
                    <span className="font-bold text-foreground">{d.lawyerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Escrow Amount Held:</span>
                    <span className="font-bold text-foreground">₹{d.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="border-t pt-2 mt-1">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Dispute Cause</span>
                    <p className="text-foreground/90 italic mt-0.5">"{d.reason}"</p>
                  </div>
                </div>
              </div>

              {d.status === "Open" || d.status === "Under Review" ? (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleResolve(d.id, "Released")}
                  >
                    <CheckCircle2 className="size-3.5" /> Release to Lawyer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-bold gap-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => handleResolve(d.id, "Refunded")}
                  >
                    <XCircle className="size-3.5" /> Refund Client
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-1 border-t">
                  Case settled as <strong className="text-foreground">{d.status}</strong> by Super Admin
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
