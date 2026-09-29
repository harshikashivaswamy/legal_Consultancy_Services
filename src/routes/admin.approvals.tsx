import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  Award,
  BookOpen,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadPendingLawyers,
  setLawyerVerificationStatus,
  type PendingLawyer,
} from "@/lib/database";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({ meta: [{ title: "Advocate Approvals — Admin Portal" }] }),
  component: AdminApprovalsPage,
});

function AdminApprovalsPage() {
  const [lawyers, setLawyers] = useState<PendingLawyer[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING" | "PROCESSED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      const data = await loadPendingLawyers();
      setLawyers(data);
    }
    load();
  }, []);

  const handleAction = async (id: string, name: string, status: "Approved" | "Rejected") => {
    await setLawyerVerificationStatus(id, status);
    setLawyers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    if (status === "Approved") {
      toast.success(`Advocate ${name} verified and approved for consultations.`);
    } else {
      toast.error(`Advocate ${name} application rejected.`);
    }
  };

  const pending = lawyers.filter((l) => l.status === "Pending");
  const processed = lawyers.filter((l) => l.status !== "Pending");

  const displayList = activeTab === "PENDING" ? pending : processed;
  const filtered = displayList.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.barNumber.toLowerCase().includes(q) ||
      l.specialization.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Advocate Verification & Approvals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review State Bar Council enrollments, experience credentials, and compliance dossiers.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 font-semibold flex items-center gap-1.5 self-start">
          <ShieldCheck className="size-3.5 text-primary" /> Official BCI Verification API Enabled
        </Badge>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeTab === "PENDING" ? "default" : "outline"}
            className="rounded-xl text-xs font-semibold"
            onClick={() => setActiveTab("PENDING")}
          >
            Pending Verification ({pending.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "PROCESSED" ? "default" : "outline"}
            className="rounded-xl text-xs font-semibold"
            onClick={() => setActiveTab("PROCESSED")}
          >
            Reviewed Archive ({processed.length})
          </Button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, Bar ID or domain..."
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
            {activeTab === "PENDING" ? "Queue is empty" : "No archived records"}
          </p>
          <p className="text-sm max-w-sm mx-auto">
            {activeTab === "PENDING"
              ? "All lawyer enrollment submissions have been verified and processed."
              : "No past verifications recorded in this session."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((l) => (
            <Card
              key={l.id}
              className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-base">{l.name}</h3>
                    <p className="text-xs text-muted-foreground">{l.specialization}</p>
                  </div>
                  <Badge
                    variant={
                      l.status === "Approved"
                        ? "default"
                        : l.status === "Rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px] font-bold"
                  >
                    {l.status}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bar Council Reg No:</span>
                    <span className="font-mono font-bold text-foreground">{l.barNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Years of Experience:</span>
                    <span className="font-semibold text-foreground">{l.experience}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Proposed Hourly Rate:</span>
                    <span className="font-bold text-foreground">₹{l.fee}/hour</span>
                  </div>
                </div>
              </div>

              {l.status === "Pending" ? (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleAction(l.id, l.name, "Approved")}
                  >
                    <CheckCircle2 className="size-3.5" /> Verify & Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-bold gap-1 text-destructive hover:bg-destructive/5"
                    onClick={() => handleAction(l.id, l.name, "Rejected")}
                  >
                    <XCircle className="size-3.5" /> Reject
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-1 border-t">
                  Application marked as <strong className="text-foreground">{l.status}</strong>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
