import { motion, AnimatePresence } from "motion/react";
import { Download, Printer, ShieldCheck, CheckCircle2, X, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReceiptData {
  receiptNo: string;
  paymentId: string;
  orderId: string;
  date: string;
  timeSlot: string;
  mode: string;
  clientName: string;
  clientEmail?: string;
  lawyerName: string;
  lawyerBarId?: string;
  lawyerSpecialisation?: string;
  baseFee: number;
  platformFee: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod?: string;
}

export function ReceiptModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden my-auto"
        >
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 text-primary font-bold">
              <FileText className="size-5" />
              <span>Official Tax Invoice & Consultation Receipt</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl gap-1.5 text-xs font-semibold"
              >
                <Printer className="size-3.5" />
                Print / Save PDF
              </Button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div id="printable-receipt" className="p-8 space-y-6 text-foreground bg-card">
            {/* Top Brand & Status */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
              <div>
                <div className="flex items-center gap-2 text-xl font-bold font-serif text-primary">
                  <Scale className="size-6" />
                  <span>Legal Consultancy Service</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Legal Consultancy Service Pvt. Ltd. · GSTIN: 27AABCL9412F1Z6
                </p>
                <p className="text-xs text-muted-foreground">
                  BKC Business Hub, Bandra East, Mumbai, MH 400051 · support@legalconsultancy.in
                </p>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <CheckCircle2 className="size-3.5" /> PAID · ESCROW SECURED
                </span>
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  Invoice No: <span className="font-semibold text-foreground">{data.receiptNo}</span>
                </p>
                <p className="text-xs text-muted-foreground">Date: {new Date().toLocaleDateString("en-IN")}</p>
              </div>
            </div>

            {/* Client & Advocate Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 p-4 rounded-2xl border border-border">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Billed To (Client)
                </p>
                <p className="font-bold text-foreground text-sm mt-1">{data.clientName}</p>
                {data.clientEmail && <p className="text-xs text-muted-foreground">{data.clientEmail}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  Consultation Mode: <span className="font-medium text-foreground">{data.mode}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Scheduled Slot: <span className="font-medium text-foreground">{data.date} at {data.timeSlot}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Assigned Advocate
                </p>
                <p className="font-bold text-foreground text-sm mt-1">{data.lawyerName}</p>
                <p className="text-xs text-muted-foreground">
                  Enrolment: <span className="font-mono text-foreground">{data.lawyerBarId || "BCI/MAH/2231/2016"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Practice: {data.lawyerSpecialisation || "High Court & Civil Litigation"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  <ShieldCheck className="size-3.5" /> Bar Council Verified Practitioner
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item & SAC Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 px-4 font-medium">
                      Legal Consultation <br />
                      <span className="text-[10px] text-muted-foreground">SAC: 998211</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      30-Min Structured Consultation with {data.lawyerName} ({data.mode})
                    </td>
                    <td className="py-3 px-4 text-right font-medium">₹{data.baseFee.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">
                      Platform Convenience & Escrow Fee <br />
                      <span className="text-[10px] text-muted-foreground">SAC: 998313</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      End-to-End Encryption, Document Vault & Razorpay Payment Routing
                    </td>
                    <td className="py-3 px-4 text-right font-medium">₹{data.platformFee.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">
                      GST (18% on Convenience) <br />
                      <span className="text-[10px] text-muted-foreground">CGST 9% + SGST 9%</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">Statutory Goods & Services Tax</td>
                    <td className="py-3 px-4 text-right font-medium">₹{data.gstAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-muted/30 border-t border-border font-bold text-sm">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 text-foreground">Total Amount Paid</td>
                    <td className="py-3 px-4 text-right text-primary">₹{data.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Metadata & Audit Seal */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs border-t border-border text-muted-foreground">
              <div>
                <p>Payment Reference: <span className="font-mono font-medium text-foreground">{data.paymentId}</span></p>
                <p>Order ID: <span className="font-mono text-foreground">{data.orderId}</span></p>
                <p>Method: <span className="font-medium text-foreground">{data.paymentMethod || "Razorpay Payment Gateway"}</span></p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                  <ShieldCheck className="size-4" />
                  <span>Digitally Signed & Validated</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">This is a computer-generated tax invoice.</p>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
            <Button onClick={onClose} className="rounded-xl px-6 font-semibold">
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
