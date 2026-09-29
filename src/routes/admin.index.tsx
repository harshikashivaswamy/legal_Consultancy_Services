import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Gavel,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
} from "lucide-react";
import {
  loadPendingLawyers,
  getLawyers,
  setLawyerVerificationStatus,
  getPlatformTransactions,
  getDisputes,
  type PendingLawyer,
  type Dispute,
} from "@/lib/database";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Portal — Legal Consultancy Service" }],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const [pendingLawyers, setPendingLawyers] = useState<PendingLawyer[]>([]);
  const [activeAdvocates, setActiveAdvocates] = useState<number | null>(null);
  const [disputesCount, setDisputesCount] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const lawyers = await loadPendingLawyers();
      const directory = await getLawyers();
      const disputes = await getDisputes();
      const txs = await getPlatformTransactions();

      setPendingLawyers(lawyers.filter((l) => (l.status ?? "Pending") === "Pending"));
      setActiveAdvocates(directory.filter((l) => l.verified === true || l.status === "Approved").length);
      setDisputesCount(disputes.filter((d) => d.status === "Open").length);
      const gross = Array.isArray(txs) ? txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) : 0;
      setTotalVolume(gross);
      setLoading(false);
    }
    load();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    await setLawyerVerificationStatus(id, "Approved");
    setPendingLawyers((prev) => prev.filter((l) => l.id !== id));
    toast.success(`Advocate ${name} has been verified and approved.`);
  };

  const handleReject = async (id: string, name: string) => {
    await setLawyerVerificationStatus(id, "Rejected");
    setPendingLawyers((prev) => prev.filter((l) => l.id !== id));
    toast.error(`Advocate ${name} application rejected.`);
  };

  const platformRevenue = Math.round(totalVolume * 0.05);

  const stats = [
    { label: "Active Advocates", value: activeAdvocates === null ? "—" : activeAdvocates.toString(), icon: Users, color: "text-blue-500" },
    { label: "Pending Approvals", value: pendingLawyers.length.toString(), icon: CheckSquare, color: "text-amber-500" },
    { label: "Active Disputes", value: disputesCount.toString(), icon: AlertTriangle, color: "text-rose-500" },
    { label: "Platform Revenue (5%)", value: `₹${platformRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Control Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage advocate verifications, platform transactions, and support queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="rounded-full text-xs px-3">
            Super Admin Active
          </Badge>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
            <Link to="/admin/lawyers">Manage Lawyers</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
            <Link to="/admin/approvals">All Approvals</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
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

      {/* Verification Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CheckSquare className="size-4.5 text-primary" /> Pending Advocate Verifications ({pendingLawyers.length})
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-primary">
            <Link to="/admin/approvals">
              View Full Queue <ArrowRight className="size-3 ml-1" />
            </Link>
          </Button>
        </div>

        {pendingLawyers.length === 0 ? (
          <Card className="rounded-2xl p-8 shadow-soft text-center text-muted-foreground space-y-2 border border-border/60">
            <CheckCircle2 className="size-10 mx-auto text-emerald-500" />
            <p className="font-semibold text-base text-foreground">Verification Queue Clear</p>
            <p className="text-sm">All advocates have been verified and processed in Supabase.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingLawyers.map((l) => (
              <Card key={l.id} className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{l.name}</h3>
                    <p className="text-xs text-muted-foreground">{l.specialization}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono bg-secondary/50">
                    {l.barNumber}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 bg-secondary/20 p-2.5 rounded-xl">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Experience</span>
                    <span className="font-semibold text-foreground">{l.experience}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Requested Fee</span>
                    <span className="font-semibold text-foreground">₹{l.fee}/hr</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => handleApprove(l.id, l.name)}
                    className="flex-1 rounded-xl text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="size-3.5" /> Approve Advocate
                  </Button>
                  <Button
                    onClick={() => handleReject(l.id, l.name)}
                    variant="outline"
                    className="rounded-xl text-xs font-bold gap-1 text-destructive hover:bg-destructive/5"
                  >
                    <XCircle className="size-3.5" /> Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access to Disputes and Financials */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-500" /> Dispute Resolution Desk
            </h3>
            <Button asChild size="sm" variant="ghost" className="text-xs font-semibold text-primary">
              <Link to="/admin/disputes">Manage <ArrowRight className="size-3 ml-1" /></Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {disputesCount > 0
              ? `${disputesCount} active disputes require review for escrow disbursement or client refunds.`
              : "No active escrow complaints. All past cases resolved."}
          </p>
        </Card>

        <Card className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CreditCard className="size-4 text-emerald-500" /> Platform Financial Ledger
            </h3>
            <Button asChild size="sm" variant="ghost" className="text-xs font-semibold text-primary">
              <Link to="/admin/transactions">View Ledger <ArrowRight className="size-3 ml-1" /></Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Total consultation gross volume: <strong className="text-foreground">₹{totalVolume.toLocaleString("en-IN")}</strong> with 5% convenience fee accrued.
          </p>
        </Card>
      </div>
    </div>
  );
}
