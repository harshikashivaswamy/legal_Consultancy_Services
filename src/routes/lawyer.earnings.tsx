import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart2,
  TrendingUp,
  CreditCard,
  Building2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Download,
  DollarSign,
  Lock,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { getLawyerBookings } from "@/lib/database";
import type { Booking } from "@/lib/bookings";
import { toast } from "sonner";

export const Route = createFileRoute("/lawyer/earnings")({
  head: () => ({ meta: [{ title: "Earnings & Settlements — Lawyer Dashboard" }] }),
  component: LawyerEarningsPage,
});

function LawyerEarningsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("•••• •••• 9842");
  const [ifscCode, setIfscCode] = useState("HDFC0000128");

  const lawyerName = user?.name || "Adv. Ananya Iyer";

  useEffect(() => {
    async function load() {
      const data = await getLawyerBookings(lawyerName);
      setBookings(data);
    }
    load();
  }, [lawyerName]);

  const validBookings = bookings.filter((b) => b.status === "Confirmed" || b.status === "Completed");
  const grossEarnings = validBookings.reduce((sum, b) => sum + (b.amount || 2000), 0);
  const platformFee = Math.round(grossEarnings * 0.05);
  const netEarnings = grossEarnings - platformFee;

  const completedBookings = bookings.filter((b) => b.status === "Completed");
  const settledGross = completedBookings.reduce((sum, b) => sum + (b.amount || 2000), 0);
  const availableToWithdraw = Math.round(settledGross * 0.95);
  const escrowHold = netEarnings - availableToWithdraw;

  const handleWithdraw = () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }
    if (Number(payoutAmount) > availableToWithdraw) {
      toast.error(`Amount exceeds available balance (₹${availableToWithdraw.toLocaleString("en-IN")})`);
      return;
    }
    toast.success(`Withdrawal request of ₹${Number(payoutAmount).toLocaleString("en-IN")} initiated to Bank ending in 9842. Expected in 2-4 hours.`);
    setShowPayoutModal(false);
    setPayoutAmount("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Earnings & Settlements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Financial analytics, consultation revenue ledger, and automated bank settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => {
              setPayoutAmount(availableToWithdraw.toString());
              setShowPayoutModal(true);
            }}
          >
            <Wallet className="size-3.5" /> Request Bank Payout
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Net Practice Earnings",
            value: `₹${netEarnings.toLocaleString("en-IN")}`,
            subtext: "After 5% platform fee",
            icon: TrendingUp,
            color: "text-emerald-500",
          },
          {
            label: "Available for Payout",
            value: `₹${availableToWithdraw.toLocaleString("en-IN")}`,
            subtext: "Completed consultations",
            icon: Wallet,
            color: "text-blue-500",
          },
          {
            label: "Escrow Hold Balance",
            value: `₹${escrowHold.toLocaleString("en-IN")}`,
            subtext: "Releases after sessions",
            icon: Lock,
            color: "text-amber-500",
          },
          {
            label: "Total Consultations",
            value: validBookings.length.toString(),
            subtext: `${completedBookings.length} completed & verified`,
            icon: BarChart2,
            color: "text-violet-500",
          },
        ].map((m) => (
          <Card key={m.label} className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{m.label}</span>
              <div className="grid size-9 place-items-center rounded-xl bg-secondary">
                <m.icon className={`size-4.5 ${m.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{m.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.subtext}</p>
          </Card>
        ))}
      </div>

      {/* Bank Account Details Card */}
      <Card className="rounded-2xl p-5 shadow-soft border border-border/60 bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <Building2 className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-sm">HDFC Bank Limited — Current Account</h3>
              <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold">
                ✓ Verified for Auto-Payouts
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              A/C No: <span className="font-mono text-foreground">{accountNumber}</span> · IFSC: <span className="font-mono text-foreground">{ifscCode}</span>
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold self-start md:self-auto" onClick={() => toast.info("Contact support to update bank account details.")}>
          Update Bank Details
        </Button>
      </Card>

      {/* Transaction Ledger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="size-5 text-primary" /> Consultation Revenue & Payout Ledger
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-primary gap-1"
            onClick={() => toast.success("Downloading CSV earnings statement for FY 2026-27...")}
          >
            <Download className="size-3.5" /> Export Statement
          </Button>
        </div>

        {validBookings.length === 0 ? (
          <Card className="rounded-2xl p-8 shadow-soft text-center text-muted-foreground space-y-2 border border-border/60">
            <BarChart2 className="size-10 mx-auto opacity-30 text-muted-foreground" />
            <p className="font-semibold text-base text-foreground">No earnings recorded</p>
            <p className="text-sm">Revenue from client consultation bookings will appear here.</p>
          </Card>
        ) : (
          <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/50 text-muted-foreground font-semibold border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Gross Fee</th>
                    <th className="py-3 px-4">Platform Fee (5%)</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4 text-right">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {validBookings.map((b) => {
                    const gross = b.amount || 2000;
                    const fee = Math.round(gross * 0.05);
                    const net = gross - fee;
                    const isSettled = b.status === "Completed";
                    return (
                      <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">{b.id}</td>
                        <td className="py-3.5 px-4 text-muted-foreground">{b.date}</td>
                        <td className="py-3.5 px-4 font-bold text-foreground">{b.client}</td>
                        <td className="py-3.5 px-4 font-medium text-foreground">₹{gross.toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 text-muted-foreground">- ₹{fee}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">₹{net.toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              isSettled
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {isSettled ? "✓ Settled to Bank" : "In Escrow Hold"}
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

      {/* Payout Modal */}
      {showPayoutModal && (
        <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Wallet className="size-5 text-emerald-600" /> Request Payout Withdrawal
              </DialogTitle>
              <DialogDescription className="text-xs">
                Transfer your cleared consultation earnings directly to your verified bank account via IMPS/NEFT.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Available Cleared Balance:</span>
                  <span className="font-bold text-foreground">₹{availableToWithdraw.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Destination Account:</span>
                  <span className="font-mono text-foreground">{accountNumber} (HDFC)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Withdrawal Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setShowPayoutModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleWithdraw}
              >
                Confirm Payout Transfer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
