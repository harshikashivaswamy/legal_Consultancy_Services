import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  CreditCard,
  Download,
  Search,
  DollarSign,
  Lock,
  Wallet,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPlatformTransactions, type PlatformTransaction } from "@/lib/database";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({ meta: [{ title: "Transactions & Financial Ledger — Admin Portal" }] }),
  component: AdminTransactionsPage,
  errorComponent: ({ error, reset }) => (
    <div className="flex flex-col items-center justify-center min-h-[45vh] gap-4 text-center p-8">
      <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">Error Loading Financial Ledger</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          {error?.message || "There was an issue parsing the transaction ledger."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => reset()}>
          <RefreshCw className="size-3.5 mr-1.5" /> Try Again
        </Button>
        <Button size="sm" className="rounded-xl" onClick={() => window.location.reload()}>
          Full Refresh
        </Button>
      </div>
    </div>
  ),
});

function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Completed" | "Escrow Hold" | "Refunded">("ALL");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPlatformTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalGMV = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalPlatformFees = transactions.reduce((sum, t) => sum + (Number(t.platformFee) || 0), 0);
  const totalLawyerPayouts = transactions.reduce((sum, t) => sum + (Number(t.netPayout) || 0), 0);
  const totalEscrowHold = transactions
    .filter((t) => t.status === "Escrow Hold")
    .reduce((sum, t) => sum + (Number(t.netPayout) || 0), 0);

  const filtered = transactions.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const client = (t.client || "").toLowerCase();
      const lawyer = (t.lawyer || "").toLowerCase();
      const category = (t.category || "").toLowerCase();
      const id = (t.id || "").toLowerCase();
      const method = (t.paymentMethod || "").toLowerCase();
      return client.includes(q) || lawyer.includes(q) || category.includes(q) || id.includes(q) || method.includes(q);
    }
    return true;
  });

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const headers = ["Transaction ID", "Date", "Client", "Advocate", "Category", "Gross Amount (INR)", "Platform Fee (INR)", "Net Payout (INR)", "Payment Method", "Status"];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      `"${(t.client || "").replace(/"/g, '""')}"`,
      `"${(t.lawyer || "").replace(/"/g, '""')}"`,
      `"${(t.category || "").replace(/"/g, '""')}"`,
      t.amount,
      t.platformFee,
      t.netPayout,
      t.paymentMethod,
      t.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Platform financial ledger exported successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Platform Financial Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time consultation revenue, escrow disbursements, and 5% platform fee accruals.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-semibold gap-1.5"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1.5 shadow-soft"
            onClick={handleExportCSV}
          >
            <Download className="size-3.5" /> Export Ledger (.CSV)
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Gross Platform Volume",
            value: `₹${totalGMV.toLocaleString("en-IN")}`,
            subtext: "Total consultations booked",
            icon: TrendingUp,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Retained Revenue (5%)",
            value: `₹${totalPlatformFees.toLocaleString("en-IN")}`,
            subtext: "Platform convenience fee",
            icon: DollarSign,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Advocate Disbursements (95%)",
            value: `₹${totalLawyerPayouts.toLocaleString("en-IN")}`,
            subtext: "Direct counsel earnings",
            icon: Wallet,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
          },
          {
            label: "Active Escrow Hold",
            value: `₹${totalEscrowHold.toLocaleString("en-IN")}`,
            subtext: "Pending session delivery",
            icon: Lock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((m) => (
          <Card key={m.label} className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
              <div className={`grid size-9 place-items-center rounded-xl ${m.bg}`}>
                <m.icon className={`size-4.5 ${m.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{m.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.subtext}</p>
          </Card>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "Completed", "Escrow Hold", "Refunded"] as const).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={statusFilter === tab ? "default" : "outline"}
              className="rounded-xl text-xs font-semibold"
              onClick={() => setStatusFilter(tab)}
            >
              {tab === "ALL" ? `All Transactions (${transactions.length})` : tab}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transaction ID, client, lawyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-xl h-9"
          />
        </div>
      </div>

      {/* Transactions Table / States */}
      {loading ? (
        <Card className="rounded-2xl p-12 text-center text-muted-foreground space-y-3 border border-border/60 bg-card shadow-soft">
          <RefreshCw className="size-8 mx-auto animate-spin text-primary opacity-60" />
          <p className="font-semibold text-sm text-foreground">Synchronizing Platform Ledger...</p>
          <p className="text-xs text-muted-foreground">Fetching transaction records from Supabase and payment vaults.</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl p-12 shadow-soft text-center text-muted-foreground space-y-3 border border-border/60">
          <CreditCard className="size-12 mx-auto opacity-30 text-muted-foreground" />
          <p className="font-semibold text-base text-foreground">
            {transactions.length === 0 ? "No transactions recorded yet" : "No matching transactions found"}
          </p>
          <p className="text-sm max-w-sm mx-auto">
            {transactions.length === 0
              ? "When a client books and pays for a consultation, transactions will automatically reflect here in real-time."
              : "Try adjusting your search query or status filter to find the transactions you're looking for."}
          </p>
        </Card>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Advocate</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">5% Fee Retained</th>
                  <th className="py-3 px-4">Net Payout (95%)</th>
                  <th className="py-3 px-4 text-right">Escrow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((t) => {
                  const amount = Number(t.amount) || 0;
                  const fee = Number(t.platformFee) || 0;
                  const net = Number(t.netPayout) || (amount - fee);

                  return (
                    <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        {t.id}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {t.date || "2026-08-05"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {t.client || "Client User"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {t.lawyer || "Advocate"}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 bg-secondary/40">
                          {t.paymentMethod || "UPI"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                        ₹{amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        + ₹{fee.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                        ₹{net.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold gap-1 ${
                            t.status === "Completed"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : t.status === "Escrow Hold"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : t.status === "Refunded"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                          }`}
                        >
                          {t.status === "Completed" ? (
                            <>
                              <CheckCircle2 className="size-3" /> Settled
                            </>
                          ) : t.status === "Escrow Hold" ? (
                            <>
                              <Clock className="size-3" /> In Escrow
                            </>
                          ) : t.status === "Refunded" ? (
                            <>
                              <RotateCcw className="size-3" /> Refunded
                            </>
                          ) : (
                            t.status
                          )}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
