import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  FileText,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { getStoredBookings, type Booking } from "@/lib/bookings";
import { getLawyer } from "@/lib/mock-data";
import { ReceiptModal, type ReceiptData } from "@/components/receipt/ReceiptModal";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/client/payments")({
  head: () => ({
    meta: [
      { title: "Payment History & Invoices — Legal Consultancy Service" },
      { name: "description", content: "View consultation invoices, GST tax breakdowns and escrow settlements." },
    ],
  }),
  component: ClientPaymentsPage,
});

function ClientPaymentsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    setBookings(getStoredBookings());
  }, []);

  const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 2000), 0);

  const handleOpenReceipt = (b: Booking) => {
    const lawyer = getLawyer(b.lawyerId);
    const baseFee = lawyer?.fee || 2500;
    const platformFee = Math.round(baseFee * 0.05);
    const gst = Math.round((baseFee + platformFee) * 0.18);
    const total = baseFee + platformFee + gst;

    const data: ReceiptData = {
      receiptNo: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      paymentId: `pay_${b.id.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}`,
      orderId: `order_${b.id.toLowerCase()}`,
      date: b.date,
      timeSlot: b.time,
      mode: b.mode,
      clientName: user?.name || b.client,
      clientEmail: user?.email || "client@legalconsultancy.in",
      lawyerName: lawyer?.name || "Verified Legal Advocate",
      lawyerBarId: lawyer?.barNumber || "BCI/MAH/2231/2016",
      lawyerSpecialisation: b.category,
      baseFee,
      platformFee,
      gstAmount: gst,
      totalAmount: b.amount || total,
      paymentMethod: "Razorpay 256-bit Secure Switch",
    };

    setSelectedReceipt(data);
    setShowReceiptModal(true);
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const lawyer = getLawyer(b.lawyerId);
    return (
      b.id.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (lawyer && lawyer.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Payment History & Invoices"
          subtitle="Download GST-compliant tax invoices and track escrow fund protection."
        />
        <Badge variant="outline" className="text-xs px-3 py-1.5 font-semibold flex items-center gap-1.5 self-start">
          <ShieldCheck className="size-4 text-emerald-500" /> RBI & NPCI Escrow Protection Active
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 rounded-2xl border bg-card/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total Paid</span>
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">₹{totalSpent.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Across {bookings.length} consultation orders</span>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Settlement Guarantee</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">100% Escrowed</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">Funds disbursed only after hearing</span>
        </Card>

        <Card className="p-5 rounded-2xl border bg-card/80 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">GST Invoices Available</span>
            <div className="grid size-8 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <FileText className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{bookings.length}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">SAC: 998211 (Legal Representation)</span>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoice by lawyer or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs rounded-xl h-9"
          />
        </div>
      </div>

      {/* Transactions List */}
      <SectionCard title="Consultation Invoices & Payments">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CreditCard className="size-10 mx-auto opacity-30 mb-2" />
            <p className="font-semibold text-foreground text-sm">No payment records found</p>
            <p className="text-xs mt-1">Payments made during consultation bookings will be logged here with instant tax invoices.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((b) => {
              const lawyer = getLawyer(b.lawyerId);
              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/30 px-2 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      GST
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{b.id}</span>
                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="size-3 mr-1" /> Settled to Escrow
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lawyer?.name || "Advocate"} · {b.category} · {b.date} ({b.time})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <p className="font-bold text-sm">₹{b.amount.toLocaleString("en-IN")}</p>
                      <span className="text-[10px] text-muted-foreground">Incl. 18% GST</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReceipt(b)}
                      className="rounded-xl gap-1.5 text-xs font-semibold"
                    >
                      <Download className="size-3.5" /> View & Print Invoice
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Interactive Printable Tax Invoice Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        data={selectedReceipt}
      />
    </div>
  );
}
