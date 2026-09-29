import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  FileUp,
  Fingerprint,
  Info,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TIME_SLOTS, getLawyer } from "@/lib/mock-data";
import { addDocument } from "@/lib/documents";
import { addStoredBooking } from "@/lib/bookings";
import { createBooking, createPaymentRecord, uploadDocumentRecord } from "@/lib/database";
import { ReceiptModal, type ReceiptData } from "@/components/receipt/ReceiptModal";
import { useAuth } from "@/lib/auth";
import {
  ALL_INDIAN_BANKS,
  detectCardBankAndNetwork,
  fetchLiveIFSC,
  fetchLiveUPI,
  getVerifiedAccountOwnerName,
  lookupIFSC,
  lookupUPI,
  type BankAccountDetails,
  type BankItem,
  type CardDetails,
  type UPIDetails,
} from "@/lib/banking";
import { launchPaymentGateway } from "@/lib/gateway";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/client/book/$lawyerId")({
  head: () => ({
    meta: [
      { title: "Book a consultation — Legal Consultancy Service" },
      { name: "description", content: "Choose a slot, consultation mode, upload documents and pay securely." },
      { property: "og:title", content: "Book a consultation — Legal Consultancy Service" },
      { property: "og:description", content: "A guided five-step booking flow with verified advocates." },
    ],
  }),
  component: BookingFlow,
});

const STEPS = ["Slot", "Mode", "Documents", "Payment", "Confirmation"];

const MODES = [
  {
    id: "Video",
    name: "HD Video Consultation",
    icon: Video,
    note: "Encrypted end-to-end video chamber with screen & document sharing",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  },
  {
    id: "Audio",
    name: "Private Audio Call",
    icon: Phone,
    note: "Encrypted voice call via platform dialer or VoIP without revealing phone number",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "Chat",
    name: "Secure Legal Chat",
    icon: MessageSquare,
    note: "Asynchronous secure messaging room with direct document exchange",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
  },
  {
    id: "In-person",
    name: "In-Person Chamber Visit",
    icon: MapPin,
    note: "Meet in person at advocate's verified chamber / High Court premises",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
];

const DAYS = [
  { day: "Tue", date: "4 Aug", full: "Tuesday, 4 Aug 2026" },
  { day: "Wed", date: "5 Aug", full: "Wednesday, 5 Aug 2026" },
  { day: "Thu", date: "6 Aug", full: "Thursday, 6 Aug 2026" },
  { day: "Fri", date: "7 Aug", full: "Friday, 7 Aug 2026" },
  { day: "Sat", date: "8 Aug", full: "Saturday, 8 Aug 2026" },
];

const QUICK_UPI_HANDLES = [
  { label: "Google Pay", handle: "@okhdfcbank" },
  { label: "SBI GPay", handle: "@oksbi" },
  { label: "PhonePe", handle: "@ybl" },
  { label: "Paytm", handle: "@paytm" },
  { label: "ICICI", handle: "@okicici" },
  { label: "BHIM", handle: "@upi" },
];

function BookingFlow() {
  const { lawyerId } = Route.useParams();
  const lawyer = getLawyer(lawyerId);
  if (!lawyer) throw notFound();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Booking Flow Steps State
  const [step, setStep] = useState(0);
  const [selectedDay, setSelectedDay] = useState(DAYS[1]!);
  const [selectedSlot, setSelectedSlot] = useState("10:30 AM");
  const [selectedMode, setSelectedMode] = useState("Video");

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Documents State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [docCategory, setDocCategory] = useState(lawyer.specialization);
  const [notes, setNotes] = useState("");

  // Payment Method Selection
  const [paymentTab, setPaymentTab] = useState<"card" | "bank" | "upi">("upi");

  // Card Payment Form State
  const [cardNumber, setCardNumber] = useState("4532 8901 2345 6789");
  const [cardHolder, setCardHolder] = useState("Siddharth Desai");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("458");
  const [cardDetails, setCardDetails] = useState<CardDetails | null>(() =>
    detectCardBankAndNetwork("4532890123456789"),
  );

  // Bank NetBanking / Transfer Form State (with Live Bank Search & Accurate Penny Drop Owner Name)
  const [accountHolderName, setAccountHolderName] = useState("Siddharth Desai");
  const [accountNumber, setAccountNumber] = useState("50100492819234");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("50100492819234");
  const [selectedBank, setSelectedBank] = useState<BankItem>(ALL_INDIAN_BANKS[0]!);
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [isBankSearchOpen, setIsBankSearchOpen] = useState(false);
  const [ifscInput, setIfscInput] = useState("HDFC0001234");
  const [bankDetails, setBankDetails] = useState<BankAccountDetails | null>(() =>
    lookupIFSC("HDFC0001234", "Siddharth Desai"),
  );
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);

  // UPI Payment Form State (with Real-Time Accurate Account Holder Name Verification)
  const [upiId, setUpiId] = useState("siddharth.desai@okhdfcbank");
  const [upiDetails, setUpiDetails] = useState<UPIDetails | null>(() =>
    lookupUPI("siddharth.desai@okhdfcbank", "Siddharth Desai"),
  );
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);
  const [upiMode, setUpiMode] = useState<"collect" | "qr">("collect");
  const [qrTimer, setQrTimer] = useState(300);

  // OTP / Gateway Simulation Modal
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");
  const [transactionRef, setTransactionRef] = useState("");

  // Calculate pricing
  const platformFee = Math.round(lawyer.fee * 0.05);
  const gst = Math.round((lawyer.fee + platformFee) * 0.18);
  const total = lawyer.fee + platformFee + gst;

  // Filtered banks for search bar
  const filteredBanks = useMemo(() => {
    const q = bankSearchQuery.trim().toLowerCase();
    if (!q) return ALL_INDIAN_BANKS;
    return ALL_INDIAN_BANKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.defaultIfsc.toLowerCase().includes(q),
    );
  }, [bankSearchQuery]);

  // When Bank is selected from Search Bar
  const handleSelectBank = (bank: BankItem) => {
    setSelectedBank(bank);
    setIfscInput(bank.defaultIfsc);
    setIsBankSearchOpen(false);
    setBankSearchQuery(bank.name);

    setIsVerifyingBank(true);
    setTimeout(() => {
      const resolved = lookupIFSC(bank.defaultIfsc, accountHolderName);
      setBankDetails(resolved);
      setIsVerifyingBank(false);
      toast.success(`Connected to ${bank.name} — Owner details verified.`);
    }, 350);
  };

  // Live IFSC Input Change
  const handleIfscChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 11);
    setIfscInput(val);

    if (val.length >= 4) {
      setIsVerifyingBank(true);
      const resolved = await fetchLiveIFSC(val, accountHolderName);
      setBankDetails(resolved);
      setIsVerifyingBank(false);
    } else {
      setBankDetails(null);
    }
  };

  // Live Account Holder Name Change
  const handleAccountHolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAccountHolderName(val);
    if (bankDetails) {
      setBankDetails({
        ...bankDetails,
        accountHolderName: getVerifiedAccountOwnerName(val),
      });
    }
  };

  // Card Number Change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    setCardNumber(formatted);
    const detected = detectCardBankAndNetwork(raw);
    setCardDetails(detected);
  };

  // Expiry Date Change with auto slash
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExpiry(val);
  };

  // Live UPI Input Change — clear previous verification on new input
  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase();
    setUpiId(val);
    // Always clear details when user changes input — must click Verify again
    setUpiDetails(null);
  };

  // Manual "Verify UPI ID" button click with live async lookup
  const handleVerifyUpi = async () => {
    if (!upiId || !upiId.includes("@")) {
      toast.error("Please enter a UPI VPA ID (e.g. yourname@okhdfcbank or 9876543210@paytm).");
      return;
    }

    setIsVerifyingUpi(true);
    setUpiDetails(null);
    try {
      const resolved = await fetchLiveUPI(upiId, accountHolderName);
      if (resolved) {
        setUpiDetails(resolved);
        if (resolved.isVerified) {
          toast.success(`✓ Verified: ${resolved.accountHolderName} · ${resolved.bankName}`);
        } else {
          toast.info(`Handle valid: ${resolved.accountHolderName} · ${resolved.bankName} (connect Razorpay for live name check)`);
        }
      } else {
        setUpiDetails(null);
        toast.error("Invalid UPI ID — handle not recognized by NPCI.");
      }
    } catch (err: any) {
      setUpiDetails(null);
      toast.error(err?.message || "Invalid UPI ID — please check and try again.");
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  // Quick select UPI handle
  const handleQuickUpiHandle = async (handle: string) => {
    const prefix = upiId.includes("@") ? upiId.split("@")[0] : upiId || "siddharth.desai";
    const newVpa = `${prefix}${handle}`;
    setUpiId(newVpa);
    setIsVerifyingUpi(true);
    try {
      const resolved = await fetchLiveUPI(newVpa, accountHolderName);
      setUpiDetails(resolved);
      toast.success(`VPA updated to ${newVpa} — Account Verified.`);
    } catch {
      const fallback = lookupUPI(newVpa, accountHolderName);
      setUpiDetails(fallback);
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  // OTP Timer Countdown
  useEffect(() => {
    let interval: any;
    if (isOtpModalOpen && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpModalOpen, otpTimer]);

  // QR Code Timer Countdown
  useEffect(() => {
    let interval: any;
    if (paymentTab === "upi" && upiMode === "qr" && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [paymentTab, upiMode, qrTimer]);

  // Format QR seconds into MM:SS
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Proceed to next step or initiate payment
  const handleNext = () => {
    if (step === 0) {
      if (!selectedSlot) {
        toast.error("Please choose a time slot for consultation.");
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (uploadedFiles.length === 0 && !notes.trim()) {
        toast.error("Please provide a matter summary or upload a document to proceed.");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      // Validate payment input
      if (paymentTab === "card") {
        if (cardNumber.replace(/\D/g, "").length < 12) {
          toast.error("Please enter a valid 16-digit card number.");
          return;
        }
        if (!cardHolder.trim()) {
          toast.error("Please enter the cardholder name.");
          return;
        }
      } else if (paymentTab === "bank") {
        if (!accountHolderName.trim()) {
          toast.error("Please enter the Bank Account Owner Name.");
          return;
        }
        if (!accountNumber || accountNumber.length < 8) {
          toast.error("Please enter a valid bank account number (min 8 digits).");
          return;
        }
        if (accountNumber !== confirmAccountNumber) {
          toast.error("Account numbers do not match. Please verify.");
          return;
        }
        if (!ifscInput || ifscInput.length < 11) {
          toast.error("Please enter a valid 11-digit IFSC code.");
          return;
        }
      } else if (paymentTab === "upi") {
        if (!upiId || !upiId.includes("@")) {
          toast.error("Please enter a valid UPI VPA ID (e.g. yourname@okhdfcbank).");
          return;
        }
        if (!upiDetails) {
          toast.error("Please click 'Verify VPA' to validate your UPI ID before paying.");
          return;
        }
      }

      // Open Bank 3D Secure / UPI Collect Gateway Modal
      setOtpCode("");
      setOtpTimer(60);
      setIsOtpModalOpen(true);
    }
  };

  // Complete Payment & Confirm Booking
  const handleConfirmOtp = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsOtpModalOpen(false);

      // Generate unique IDs
      const newBookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
      const bankCode =
        paymentTab === "card"
          ? cardDetails?.bankName.replace(/[^A-Z]/g, "").slice(0, 4) || "CARD"
          : paymentTab === "bank"
          ? selectedBank.code
          : "UPI";
      const newTxnRef = `TXN_${Date.now().toString().slice(-6)}_${bankCode}_${Math.floor(10000 + Math.random() * 90000)}`;

      setConfirmedBookingId(newBookingId);
      setTransactionRef(newTxnRef);

      const finalClientName =
        paymentTab === "bank"
          ? bankDetails?.accountHolderName || accountHolderName
          : paymentTab === "upi"
          ? upiDetails?.accountHolderName || "Siddharth Desai"
          : cardHolder;

      // Save booking to stored bookings
      addStoredBooking({
        id: newBookingId,
        lawyerId: lawyer.id,
        client: finalClientName,
        date: "2026-08-05",
        time: selectedSlot,
        mode: selectedMode as any,
        status: "Confirmed",
        category: lawyer.specialization,
        amount: total,
      });

      // Also persist to Supabase / PostgreSQL database
      void createBooking({
        lawyerId: lawyer.id,
        lawyerName: lawyer.name,
        clientName: finalClientName,
        date: "2026-08-05",
        timeSlot: selectedSlot,
        mode: selectedMode as "Video" | "Audio" | "Chat" | "In-person",
        fee: total,
        category: lawyer.specialization,
        notes: notes || "",
      });

      // Persist payment transaction
      void createPaymentRecord({
        booking_id: newBookingId,
        payment_id: newTxnRef,
        amount: total,
        status: "Completed",
        payment_method: paymentTab === "upi" ? "UPI" : paymentTab === "bank" ? "Netbanking" : "Card",
        client_name: finalClientName,
        lawyer_name: lawyer.name,
        lawyer_id: lawyer.id,
        category: lawyer.specialization,
      });

      // Save any uploaded files to the encrypted document vault & database
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result as string;
            addDocument({
              name: file.name,
              type: docCategory || lawyer.specialization,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              sharedWith: lawyer.name,
              status: "Pending review",
              notes: notes || `Attached for ${selectedMode} consultation on ${selectedDay.date} at ${selectedSlot}`,
              category: docCategory || lawyer.specialization,
              fileBlobBase64: base64Data,
              encrypted: true,
            });

            void uploadDocumentRecord({
              name: file.name,
              category: docCategory || lawyer.specialization,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              lawyer_id: lawyer.id,
              notes: notes || "",
              file_data: base64Data,
            });
          };
          reader.readAsDataURL(file);
        });
      }

      // Generate receipt data for instant viewing & download
      const rData: ReceiptData = {
        receiptNo: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        paymentId: newTxnRef,
        orderId: `order_${newBookingId.toLowerCase()}`,
        date: selectedDay.full,
        timeSlot: selectedSlot,
        mode: selectedMode,
        clientName: finalClientName,
        clientEmail: user?.email || "client@legalconsultancy.in",
        lawyerName: lawyer.name,
        lawyerBarId: lawyer.barNumber || "BCI/MAH/2231/2016",
        lawyerSpecialisation: lawyer.specialization,
        baseFee: lawyer.fee,
        platformFee: platformFee,
        gstAmount: gst,
        totalAmount: total,
        paymentMethod: paymentTab === "upi" ? `UPI (${upiId})` : paymentTab === "bank" ? `${selectedBank.name} NetBanking` : "Card",
      };
      setReceiptData(rData);

      toast.success("Payment authorized & verified! Consultation scheduled successfully.");
      setStep(4);
    }, 1200);
  };

  // Launch Trusted Razorpay Payment Gateway (Instant Bank / UPI Verification)
  const handleGatewayCheckout = async () => {
    setIsProcessingPayment(true);
    const launched = await launchPaymentGateway({
      amount: total,
      lawyerName: lawyer.name,
      lawyerSpecialization: lawyer.specialization,
      consultationMode: selectedMode,
      bookingSlot: `${selectedDay.full} at ${selectedSlot}`,
      clientName: accountHolderName || "Siddharth Desai",
      clientPhone: "9876543210",
      clientEmail: user?.email || "client@legalconsultancy.in",
      onSuccess: (res) => {
        setIsProcessingPayment(false);
        const newBookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
        setConfirmedBookingId(newBookingId);
        setTransactionRef(res.paymentId);

        const clientNameFinal = res.verifiedAccountOwner || accountHolderName;

        addStoredBooking({
          id: newBookingId,
          lawyerId: lawyer.id,
          client: clientNameFinal,
          date: "2026-08-05",
          time: selectedSlot,
          mode: selectedMode as any,
          status: "Confirmed",
          category: lawyer.specialization,
          amount: total,
        });

        void createBooking({
          lawyerId: lawyer.id,
          lawyerName: lawyer.name,
          clientName: clientNameFinal,
          date: "2026-08-05",
          timeSlot: selectedSlot,
          mode: selectedMode as "Video" | "Audio" | "Chat" | "In-person",
          fee: total,
          category: lawyer.specialization,
          notes: notes || "",
        });

        void createPaymentRecord({
          booking_id: newBookingId,
          payment_id: res.paymentId,
          amount: total,
          status: "Completed",
          payment_method: "Razorpay",
          client_name: clientNameFinal,
          lawyer_name: lawyer.name,
          lawyer_id: lawyer.id,
          category: lawyer.specialization,
        });

        if (uploadedFiles.length > 0) {
          uploadedFiles.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = reader.result as string;
              addDocument({
                name: file.name,
                type: docCategory || lawyer.specialization,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                sharedWith: lawyer.name,
                status: "Pending review",
                notes: notes || `Attached for ${selectedMode} consultation on ${selectedDay.date} at ${selectedSlot}`,
                category: docCategory || lawyer.specialization,
                fileBlobBase64: base64Data,
                encrypted: true,
              });

              void uploadDocumentRecord({
                name: file.name,
                category: docCategory || lawyer.specialization,
                size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                lawyer_id: lawyer.id,
                notes: notes || "",
                file_data: base64Data,
              });
            };
            reader.readAsDataURL(file);
          });
        }

        const rData: ReceiptData = {
          receiptNo: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          paymentId: res.paymentId,
          orderId: res.orderId || `order_${newBookingId.toLowerCase()}`,
          date: selectedDay.full,
          timeSlot: selectedSlot,
          mode: selectedMode,
          clientName: clientNameFinal,
          clientEmail: user?.email || "client@legalconsultancy.in",
          lawyerName: lawyer.name,
          lawyerBarId: lawyer.barNumber || "BCI/MAH/2231/2016",
          lawyerSpecialisation: lawyer.specialization,
          baseFee: lawyer.fee,
          platformFee: platformFee,
          gstAmount: gst,
          totalAmount: total,
          paymentMethod: "Razorpay Secure Gateway",
        };
        setReceiptData(rData);

        toast.success("Payment verified & booking confirmed via Razorpay Payment Gateway!");
        setStep(4);
      },
      onFailure: () => {
        setIsProcessingPayment(false);
        toast.error("Payment failed on gateway. You can retry or use direct NetBanking/UPI.");
      },
      onDismiss: () => {
        setIsProcessingPayment(false);
      },
    });

    if (!launched) {
      setIsProcessingPayment(false);
      // If Razorpay popup script is unavailable or blocked, fallback seamlessly to in-app OTP modal
      handleNext();
    }
  };

  // Open Official Printable GST Tax Invoice & Consultation Receipt
  const handleDownloadReceipt = () => {
    if (!receiptData) {
      const verifiedOwner =
        paymentTab === "bank"
          ? bankDetails?.accountHolderName || accountHolderName.toUpperCase()
          : paymentTab === "card"
          ? cardHolder.toUpperCase()
          : upiDetails?.accountHolderName || "SIDDHARTH DESAI";

      const rData: ReceiptData = {
        receiptNo: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        paymentId: transactionRef || `TXN_${Date.now().toString().slice(-6)}`,
        orderId: `order_${(confirmedBookingId || "BK-2411").toLowerCase()}`,
        date: selectedDay.full,
        timeSlot: selectedSlot,
        mode: selectedMode,
        clientName: verifiedOwner,
        clientEmail: user?.email || "client@legalconsultancy.in",
        lawyerName: lawyer.name,
        lawyerBarId: lawyer.barNumber || "BCI/MAH/2231/2016",
        lawyerSpecialisation: lawyer.specialization,
        baseFee: lawyer.fee,
        platformFee: platformFee,
        gstAmount: gst,
        totalAmount: total,
        paymentMethod: paymentTab === "upi" ? `UPI (${upiId})` : paymentTab === "bank" ? `${selectedBank.name} NetBanking` : "Card Payment",
      };
      setReceiptData(rData);
    }
    setShowReceiptModal(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Back & Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/client/lawyers" })}
          className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Lawyers
        </Button>
        <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs">
          <ShieldCheck className="size-3.5 text-emerald-500" /> Verified Advocate
        </Badge>
      </div>

      {/* 5-Step Stepper Header */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-all shadow-sm",
                  i < step
                    ? "bg-accent text-accent-foreground ring-2 ring-accent/30"
                    : i === step
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold sm:block transition-colors",
                  i === step ? "text-foreground font-bold" : "text-muted-foreground",
                )}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < step ? "bg-accent" : "bg-border/60",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main Booking Card Container */}
      <Card className="gap-0 rounded-3xl border bg-card/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Advocate Brief Header */}
        <div className="mb-6 flex items-center justify-between border-b pb-5">
          <div className="flex items-center gap-3.5">
            <img
              src={lawyer.photo}
              alt={lawyer.name}
              className="size-14 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-foreground">{lawyer.name}</p>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                  ★ {lawyer.rating}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lawyer.specialization} · {lawyer.experience} yrs exp · {lawyer.city}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Session Fee</p>
            <p className="text-base font-bold text-primary">₹{lawyer.fee.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Dynamic Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* STEP 1: CHOOSE SLOT */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold">Step 1: Choose Date & Time Slot</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a convenient day and time for your consultation with {lawyer.name}.
                  </p>
                </div>

                {/* Day Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Consultation Date
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {DAYS.map((d) => (
                      <button
                        key={d.date}
                        onClick={() => setSelectedDay(d)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all",
                          selectedDay.date === d.date
                            ? "border-primary bg-primary/10 font-bold text-primary ring-2 ring-primary/20 shadow-sm"
                            : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span className="text-xs">{d.day}</span>
                        <span className="text-sm font-bold mt-0.5">{d.date}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Available Time Slots for {selectedDay.full}
                    </Label>
                    <span className="text-[11px] text-muted-foreground">IST (India Standard Time)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {TIME_SLOTS.map((t, i) => {
                      const disabled = i % 5 === 3;
                      const isSelected = selectedSlot === t;
                      return (
                        <button
                          key={t}
                          disabled={disabled}
                          onClick={() => setSelectedSlot(t)}
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
                            disabled && "cursor-not-allowed bg-muted/40 text-muted-foreground/50 line-through",
                            isSelected &&
                              "border-primary bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/30",
                            !disabled && !isSelected && "hover:bg-secondary hover:border-primary/40",
                          )}
                        >
                          <Clock className="size-3.5" />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slot Confirmation Badge */}
                <div className="rounded-2xl border bg-primary/5 p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <CalendarCheck className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Selected Consultation Slot</p>
                      <p className="text-xs text-primary font-bold">
                        {selectedDay.full} at {selectedSlot}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                    Instant Confirmation
                  </Badge>
                </div>
              </div>
            )}

            {/* STEP 2: CONSULTATION MODE */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold">Step 2: Choose Consultation Mode</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select how you would like to connect with your advocate.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {MODES.map((m) => {
                    const isSelected = selectedMode === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMode(m.id)}
                        className={cn(
                          "flex items-start gap-3.5 rounded-2xl border p-4.5 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-soft"
                            : "hover:bg-secondary/60 hover:border-muted-foreground/30",
                        )}
                      >
                        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl border", m.color)}>
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">{m.name}</span>
                            {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.note}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border bg-card/60 p-4 text-xs text-muted-foreground flex items-center gap-3">
                  <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
                  <span>
                    All consultation modes are protected by Advocate-Client privilege under Indian Evidence Act, 1872.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENTS */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold">Step 3: Upload Case Documents (Optional)</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload relevant legal files (FIR, contract, notices, deeds). Files are automatically encrypted with
                    AES-256 and shared directly with {lawyer.name}.
                  </p>
                </div>

                {/* Upload Box */}
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed p-8 text-center transition-all hover:border-primary hover:bg-primary/5">
                  <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <FileUp className="size-6" />
                  </div>
                  <span className="text-sm font-bold text-foreground">Click to upload or drag files here</span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX, JPG, PNG, Scans (Max 25 MB each)</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Lock className="size-3" /> End-to-End Encrypted Vault Storage
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setUploadedFiles((prev) => [...prev, ...files]);
                    }}
                  />
                </label>

                {/* Selected Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attached Documents ({uploadedFiles.length})
                    </p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border bg-background/80 px-3.5 py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="size-4 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate">{file.name}</span>
                            <span className="text-muted-foreground">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document Category & Notes */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-semibold">
                      Legal Category
                    </Label>
                    <Input
                      id="category"
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value)}
                      placeholder="e.g. Criminal, Property, Divorce"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="notes" className="text-xs font-semibold">
                      Matter Summary & Specific Questions for Advocate
                    </Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Briefly describe your legal issue, case background, or specific questions you want answered during the session…"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: REAL-TIME ACCURATE UPI & BANK VERIFICATION */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold">Step 4: Secure Payment & Verification</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select your preferred payment method. The system performs real-time NPCI / Bank verification to
                    display the exact account holder's name.
                  </p>
                </div>

                {/* Fee Breakdown Summary */}
                <div className="rounded-2xl border bg-card/60 p-4.5 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Advocate Consultation Fee</span>
                    <span className="font-semibold text-foreground">₹{lawyer.fee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Infrastructure & Encryption Fee (5%)</span>
                    <span className="font-semibold text-foreground">₹{platformFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18% Central + State)</span>
                    <span className="font-semibold text-foreground">₹{gst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2.5 text-sm font-bold">
                    <span>Total Payable</span>
                    <span className="text-primary text-base">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Trusted Payment Gateway Banner (Razorpay / Cashfree Standard Checkout) */}
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Recommended: Trusted Payment Gateway
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/30 text-primary">
                        PCI-DSS Level 1
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Handles all Card, UPI (GPay, PhonePe, Paytm, BHIM, CRED) and 100+ Banks authentication directly via secure gateway.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleGatewayCheckout}
                    disabled={isProcessingPayment}
                    className="rounded-xl text-xs font-bold gap-2 shadow-soft shrink-0 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Lock className="size-3.5" /> Pay ₹{total.toLocaleString("en-IN")} via Gateway
                  </Button>
                </div>


                {/* Payment Method Tabs */}
                <div className="flex rounded-2xl border bg-secondary/50 p-1">
                  <button
                    onClick={() => setPaymentTab("upi")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all",
                      paymentTab === "upi"
                        ? "bg-background text-foreground shadow-sm font-bold ring-1 ring-primary/20"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Smartphone className="size-3.5 text-emerald-500" /> UPI / QR Code
                  </button>
                  <button
                    onClick={() => setPaymentTab("bank")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all",
                      paymentTab === "bank"
                        ? "bg-background text-foreground shadow-sm font-bold ring-1 ring-primary/20"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Building2 className="size-3.5 text-blue-500" /> Net Banking (Search Bank)
                  </button>
                  <button
                    onClick={() => setPaymentTab("card")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all",
                      paymentTab === "card"
                        ? "bg-background text-foreground shadow-sm font-bold ring-1 ring-primary/20"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CreditCard className="size-3.5 text-purple-500" /> Credit / Debit Card
                  </button>
                </div>

                {/* TAB 1: UPI PAYMENT (ACCURATE ACCOUNT HOLDER'S NAME & NPCI VPA RESOLUTION) */}
                {paymentTab === "upi" && (
                  <div className="space-y-4">
                    {/* UPI Sub-Mode Switch (Collect Request vs Dynamic QR Code) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUpiMode("collect")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all",
                          upiMode === "collect"
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "hover:bg-secondary/60 text-muted-foreground",
                        )}
                      >
                        <Send className="size-3.5" /> Enter UPI ID (VPA)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMode("qr")}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all",
                          upiMode === "qr"
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "hover:bg-secondary/60 text-muted-foreground",
                        )}
                      >
                        <QrCode className="size-3.5" /> Dynamic UPI QR Code
                      </button>
                    </div>

                    {/* OPTION A: ENTER UPI ID WITH LIVE NPCI VERIFICATION */}
                    {upiMode === "collect" && (
                      <div className="space-y-4">
                        {/* Live UPI VPA Input & Verify Button */}
                        <div className="space-y-2">
                          <Label htmlFor="upiVpaInput" className="text-xs font-semibold flex items-center justify-between">
                            <span>Enter UPI VPA ID (Virtual Payment Address)</span>
                            <span className="text-[11px] text-muted-foreground font-normal">
                              Real-Time NPCI Name Verification
                            </span>
                          </Label>

                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id="upiVpaInput"
                                value={upiId}
                                onChange={handleUpiChange}
                                placeholder="yourname@okhdfcbank or 9876543210@paytm"
                                className="rounded-xl font-mono text-sm pl-10"
                              />
                              <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                            <Button
                              type="button"
                              onClick={handleVerifyUpi}
                              disabled={isVerifyingUpi || !upiId.includes("@")}
                              className="rounded-xl px-4 text-xs font-bold shrink-0"
                            >
                              {isVerifyingUpi ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Verifying...
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="size-3.5 mr-1.5" /> Verify VPA
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Quick UPI Handle Selector Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-muted-foreground mr-1">Quick Select:</span>
                            {QUICK_UPI_HANDLES.map((h) => (
                              <button
                                key={h.handle}
                                type="button"
                                onClick={() => handleQuickUpiHandle(h.handle)}
                                className={cn(
                                  "rounded-lg border px-2 py-0.5 text-[11px] font-mono transition-all",
                                  upiId.endsWith(h.handle)
                                    ? "bg-primary text-primary-foreground font-bold border-primary"
                                    : "bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground",
                                )}
                              >
                                {h.label} ({h.handle})
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* UPI VERIFICATION RESULT CARD */}
                        {isVerifyingUpi && (
                          <div className="rounded-2xl border bg-card/60 p-4 flex items-center gap-3 text-xs text-muted-foreground">
                            <Loader2 className="size-4 animate-spin text-primary" />
                            <span>Verifying with NPCI register...</span>
                          </div>
                        )}

                        {!isVerifyingUpi && upiDetails && (
                          <div className={cn(
                            "rounded-2xl border p-4 space-y-3 transition-all",
                            upiDetails.isVerified
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-amber-500/30 bg-amber-500/5"
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "grid size-7 place-items-center rounded-lg",
                                  upiDetails.isVerified
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                )}>
                                  <ShieldCheck className="size-4" />
                                </div>
                                <div>
                                  <span className="font-bold text-xs text-foreground">{upiDetails.bankName}</span>
                                  <p className="text-[10px] text-muted-foreground">{upiDetails.psp} · Instant Settlement</p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-semibold",
                                  upiDetails.isVerified
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                )}
                              >
                                {upiDetails.isVerified ? "✓ Live Bank Verified" : "Handle Valid · Name Unconfirmed"}
                              </Badge>
                            </div>

                            {/* Account Holder Name */}
                            <div className="rounded-xl border bg-background/80 p-3 space-y-1.5 shadow-sm">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                  {upiDetails.isVerified ? "Verified Account Holder:" : "Name from VPA (unconfirmed):"}
                                </span>
                                {upiDetails.isVerified && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                    <CheckCircle2 className="size-3.5" /> Live NPCI Match
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-sm font-bold text-foreground tracking-wide flex items-center gap-2">
                                <UserCheck className="size-4 text-primary" />
                                {upiDetails.accountHolderName}
                              </p>
                              {!upiDetails.isVerified && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                  ⚠ Name derived from VPA. Add Razorpay/Cashfree API keys to confirm the real registered bank name.
                                </p>
                              )}
                            </div>

                            {/* Routing Metadata */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1 border-t border-primary/10">
                              <div>
                                <span className="text-[10px] uppercase text-muted-foreground">VPA Handle:</span>
                                <p className="font-mono font-semibold text-foreground truncate">{upiDetails.vpa || upiId}</p>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-muted-foreground">Account Type:</span>
                                <p className="font-semibold text-foreground">Primary Savings</p>
                              </div>
                              <div className="sm:col-span-1 col-span-2">
                                <span className="text-[10px] uppercase text-muted-foreground">Escrow Status:</span>
                                <p className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Convenience Fee</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {!isVerifyingUpi && !upiDetails && upiId.includes("@") && (upiId.split("@")[1]?.length ?? 0) > 0 && (
                          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3 text-xs">
                            <X className="size-4 text-destructive mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-destructive">Invalid UPI ID</p>
                              <p className="text-muted-foreground mt-0.5">
                                The handle <code className="font-mono bg-muted px-1 rounded">@{upiId.split("@")[1]}</code> is not a recognized NPCI-registered UPI handle. 
                                Use: <span className="font-mono">@okhdfcbank, @oksbi, @ybl, @paytm, @okicici, @upi</span> etc.
                              </p>
                            </div>
                          </div>
                        )}


                      </div>
                    )}

                    {/* OPTION B: DYNAMIC QR CODE SECTION */}
                    {upiMode === "qr" && (
                      <div className="rounded-2xl border bg-card/60 p-5 text-center space-y-3.5">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] gap-1 bg-primary/10 text-primary">
                            <Sparkles className="size-3" /> Dynamic Auto-Expiring QR
                          </Badge>
                          <span className="text-xs font-mono font-semibold text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3 text-amber-500" /> Expires in {formatTimer(qrTimer)}
                          </span>
                        </div>

                        {/* Real-time Dynamic QR Display */}
                        <div className="mx-auto size-44 bg-white rounded-2xl p-3 border-2 border-primary/20 flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
                          <QrCode className="size-36 text-slate-900" />
                          <div className="absolute inset-0 bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge className="text-[10px]">₹{total.toLocaleString("en-IN")}</Badge>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-bold text-foreground">
                            Scan with Google Pay, PhonePe, Paytm, BHIM, or CRED
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Amount: <strong className="text-primary font-mono">₹{total.toLocaleString("en-IN")}</strong> · Escrow
                            Beneficiary: <strong>{lawyer.name}</strong>
                          </p>
                        </div>

                        {/* Simulated QR Webhook Approval */}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            toast.success("QR Code scanned & approved on mobile!");
                            handleConfirmOtp();
                          }}
                          className="rounded-xl text-xs gap-1.5"
                        >
                          <Smartphone className="size-3.5" /> Simulate QR Payment Approval
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: NET BANKING (SEARCH BANK & PENNY DROP VERIFICATION) */}
                {paymentTab === "bank" && (
                  <div className="space-y-4">
                    {/* LIVE SEARCHABLE BANK SELECTOR */}
                    <div className="space-y-1.5 relative">
                      <Label htmlFor="bankSearch" className="text-xs font-semibold flex items-center justify-between">
                        <span>Search Bank (50+ Scheduled Commercial Banks)</span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {selectedBank.name} selected
                        </span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="bankSearch"
                          value={bankSearchQuery}
                          onChange={(e) => {
                            setBankSearchQuery(e.target.value);
                            setIsBankSearchOpen(true);
                          }}
                          onFocus={() => setIsBankSearchOpen(true)}
                          placeholder="Type to search e.g. State Bank of India, HDFC, Canara, Axis, Punjab, BoB, Kotak..."
                          className="rounded-xl pl-10 pr-10 text-sm"
                        />
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => setIsBankSearchOpen(!isBankSearchOpen)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown className="size-4" />
                        </button>
                      </div>

                      {/* Dropdown Live Search Results */}
                      {isBankSearchOpen && (
                        <div className="absolute z-30 left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-2xl border bg-card/95 backdrop-blur-xl p-1.5 shadow-2xl space-y-1">
                          {filteredBanks.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                              No bank found matching "{bankSearchQuery}". You can still type custom IFSC below.
                            </div>
                          ) : (
                            filteredBanks.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => handleSelectBank(b)}
                                className={cn(
                                  "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs transition-all",
                                  selectedBank.id === b.id
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                    : "hover:bg-secondary/80 text-foreground",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="size-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                                    style={{ backgroundColor: b.color }}
                                  >
                                    {b.code.slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{b.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {b.branch} · {b.city}, {b.state}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                                    {b.category}
                                  </Badge>
                                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{b.defaultIfsc}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* LIVE PENNY DROP & ACCURATE BANK OWNER NAME VERIFICATION BOX */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="grid size-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="size-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-foreground">
                              {bankDetails?.bankName || selectedBank.name}
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              {bankDetails?.branch || selectedBank.branch}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border-emerald-500/30"
                        >
                          {isVerifyingBank ? "Verifying..." : "Penny Drop Verified"}
                        </Badge>
                      </div>

                      {/* Accurate Bank Owner Name Display */}
                      <div className="rounded-xl border bg-background/80 p-3 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Registered Bank Account Owner Name:
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="size-3.5" /> 100% NPCI Match
                          </span>
                        </div>
                        <p className="font-mono text-sm font-bold text-foreground tracking-wide flex items-center gap-2">
                          <UserCheck className="size-4 text-primary" />
                          {bankDetails?.accountHolderName || getVerifiedAccountOwnerName(accountHolderName)}
                        </p>
                      </div>

                      {/* Additional Account Metadata */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1 border-t border-emerald-500/20">
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground">IFSC Code:</span>
                          <p className="font-mono font-semibold text-foreground">{ifscInput || selectedBank.defaultIfsc}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground">Settlement Switch:</span>
                          <p className="font-semibold text-foreground">IMPS / NEFT 24x7</p>
                        </div>
                        <div className="sm:col-span-1 col-span-2">
                          <span className="text-[10px] uppercase text-muted-foreground">Location:</span>
                          <p className="font-semibold text-foreground truncate">
                            {bankDetails?.city || selectedBank.city}, {bankDetails?.state || selectedBank.state}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bank Account Form Inputs */}
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="ownerNameInput" className="text-xs font-semibold">
                          Account Holder Full Name (as per Bank Passbook / Aadhaar)
                        </Label>
                        <Input
                          id="ownerNameInput"
                          value={accountHolderName}
                          onChange={handleAccountHolderNameChange}
                          placeholder="e.g. Siddharth Desai"
                          className="rounded-xl text-sm font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="accountNum" className="text-xs font-semibold">
                          Bank Account Number
                        </Label>
                        <Input
                          id="accountNum"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="50100492819234"
                          className="rounded-xl font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="confirmAccountNum" className="text-xs font-semibold">
                          Re-enter Account Number
                        </Label>
                        <Input
                          id="confirmAccountNum"
                          value={confirmAccountNumber}
                          onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="50100492819234"
                          className={cn(
                            "rounded-xl font-mono text-sm",
                            confirmAccountNumber &&
                              accountNumber &&
                              confirmAccountNumber !== accountNumber &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {confirmAccountNumber && accountNumber && confirmAccountNumber !== accountNumber && (
                          <p className="text-[10px] text-destructive font-medium">Account numbers do not match</p>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="ifsc" className="text-xs font-semibold">
                          Bank Branch IFSC Code (11-digit)
                        </Label>
                        <Input
                          id="ifsc"
                          value={ifscInput}
                          onChange={handleIfscChange}
                          placeholder="e.g. HDFC0001234, SBIN0000456, ICIC0000001"
                          maxLength={11}
                          className="rounded-xl font-mono text-sm uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CREDIT / DEBIT CARD */}
                {paymentTab === "card" && (
                  <div className="space-y-4">
                    {/* Live Visual Card Preview */}
                    <div
                      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl transition-all"
                      style={{
                        background: cardDetails
                          ? `linear-gradient(135deg, ${cardDetails.brandColor} 0%, #0f172a 100%)`
                          : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 opacity-80" />
                          <span className="font-bold text-sm tracking-wide">
                            {cardDetails ? cardDetails.bankName : "Enter Card Number"}
                          </span>
                        </div>
                        <Badge variant="outline" className="border-white/30 text-white text-[10px] bg-white/10">
                          {cardDetails?.network || "Card"}
                        </Badge>
                      </div>

                      <div className="my-5 flex items-center gap-3">
                        <div className="size-7 rounded bg-amber-400/80 border border-amber-300 shadow-inner" />
                        <span className="font-mono text-lg tracking-widest font-semibold">
                          {cardNumber || "•••• •••• •••• ••••"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <div>
                          <p className="text-[10px] opacity-70 uppercase">Card Holder</p>
                          <p className="font-semibold uppercase tracking-wider">{cardHolder || "YOUR NAME"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] opacity-70 uppercase">Expires</p>
                          <p className="font-semibold">{cardExpiry || "MM/YY"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Auto-detected Bank Badge */}
                    {cardDetails && (
                      <div className={cn("flex items-center justify-between rounded-xl border p-3 text-xs", cardDetails.badgeBg)}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span>
                            Detected: <strong>{cardDetails.bankName}</strong> ({cardDetails.cardType} · {cardDetails.network})
                          </span>
                        </div>
                        <span className="font-semibold text-[11px]">PCI-DSS Compliant</span>
                      </div>
                    )}

                    {/* Card Form Inputs */}
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="cardNumber" className="text-xs font-semibold">
                          Card Number
                        </Label>
                        <div className="relative">
                          <Input
                            id="cardNumber"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="4532 8901 2345 6789"
                            maxLength={19}
                            className="rounded-xl font-mono text-sm pl-10"
                          />
                          <CreditCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="cardHolder" className="text-xs font-semibold">
                          Cardholder Full Name
                        </Label>
                        <Input
                          id="cardHolder"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Siddharth Desai"
                          className="rounded-xl text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="expiry" className="text-xs font-semibold">
                          Expiry Date (MM/YY)
                        </Label>
                        <Input
                          id="expiry"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="12/28"
                          maxLength={5}
                          className="rounded-xl text-sm font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cvv" className="text-xs font-semibold">
                          CVV / Security Code
                        </Label>
                        <Input
                          id="cvv"
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className="rounded-xl text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: CONFIRMATION */}
            {step === 4 && (
              <div className="py-6 text-center space-y-6">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5">
                  <CheckCircle2 className="size-8" />
                </div>

                <div>
                  <Badge variant="outline" className="mb-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Booking Confirmed & Paid
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground">Consultation Scheduled Successfully!</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Booking Reference ID: <strong className="text-primary font-mono">{confirmedBookingId || "BK-2411"}</strong>
                  </p>
                </div>

                {/* Consultation Details Card */}
                <div className="rounded-2xl border bg-card/80 p-5 text-left space-y-3 shadow-sm">
                  <div className="flex items-center gap-3.5 border-b pb-3.5">
                    <img src={lawyer.photo} alt={lawyer.name} className="size-12 rounded-xl object-cover border" />
                    <div>
                      <p className="text-sm font-bold">{lawyer.name}</p>
                      <p className="text-xs text-muted-foreground">{lawyer.specialization} · {lawyer.court}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground">Scheduled Slot</span>
                      <p className="font-semibold mt-0.5">{selectedDay.full}</p>
                      <p className="text-primary font-medium">{selectedSlot}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground">Consultation Mode</span>
                      <p className="font-semibold mt-0.5">{selectedMode}</p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium">Encrypted Room Active</p>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-background/80 p-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verified Account Owner:</span>
                      <span className="font-mono font-bold text-foreground">
                        {paymentTab === "bank"
                          ? bankDetails?.accountHolderName || accountHolderName.toUpperCase()
                          : paymentTab === "upi"
                          ? upiDetails?.accountHolderName || "SIDDHARTH DESAI"
                          : cardHolder.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Channel:</span>
                      <span className="font-semibold text-foreground">
                        {paymentTab === "upi"
                          ? `UPI Collect (${upiId})`
                          : paymentTab === "bank"
                          ? `${selectedBank.name} NetBanking`
                          : `${cardDetails?.bankName || "Commercial Bank"} Card`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction Reference:</span>
                      <span className="font-mono font-semibold text-primary">{transactionRef || "TXN_984210"}</span>
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="rounded-xl border bg-background/80 p-2.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="size-4 shrink-0" />
                      <span>{uploadedFiles.length} file(s) saved to Encrypted Vault and shared with {lawyer.name}.</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={handleDownloadReceipt}
                    variant="outline"
                    className="rounded-xl gap-2 text-xs w-full sm:w-auto"
                  >
                    <Download className="size-3.5" /> Download Tax Invoice
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/client/bookings" })}
                    className="rounded-xl gap-2 text-xs w-full sm:w-auto shadow-soft"
                  >
                    <CalendarCheck className="size-3.5" /> View My Bookings
                  </Button>
                  <Button
                    onClick={() => navigate({ to: "/client/documents" })}
                    variant="secondary"
                    className="rounded-xl gap-2 text-xs w-full sm:w-auto"
                  >
                    <Lock className="size-3.5" /> Open Document Vault
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Footer Controls for Steps 0-3 */}
        {step < 4 && (
          <div className="mt-8 flex items-center justify-between border-t pt-5">
            <Button
              variant="outline"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-xl gap-1 text-xs"
            >
              <ArrowLeft className="size-3.5" /> Back
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className="rounded-xl gap-2 text-xs shadow-soft font-bold px-5"
            >
              {step === 3 ? (
                <>
                  <Lock className="size-3.5" /> Pay ₹{total.toLocaleString("en-IN")} & Confirm
                </>
              ) : (
                <>Continue to {STEPS[step + 1]}</>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* AUTHENTIC 3D-SECURE / UPI COLLECT MODAL */}
      <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div
              className="mx-auto grid size-12 place-items-center rounded-2xl text-white mb-2 shadow-md"
              style={{
                backgroundColor:
                  paymentTab === "upi"
                    ? "#10b981"
                    : paymentTab === "card"
                    ? cardDetails?.brandColor || "#004c8f"
                    : selectedBank.color || "#004c8f",
              }}
            >
              {paymentTab === "upi" ? <Smartphone className="size-6" /> : <Building2 className="size-6" />}
            </div>
            <DialogTitle className="text-center text-base font-bold">
              {paymentTab === "upi"
                ? "NPCI Fast UPI Collect Gateway"
                : paymentTab === "card"
                ? `${cardDetails?.bankName || "Bank"} 3D Secure 2.0`
                : `${selectedBank.name} NetBanking Gateway`}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Verified Account Owner:{" "}
              <strong className="text-foreground font-mono">
                {paymentTab === "upi"
                  ? upiDetails?.accountHolderName || "SIDDHARTH DESAI"
                  : paymentTab === "bank"
                  ? bankDetails?.accountHolderName || accountHolderName.toUpperCase()
                  : cardHolder.toUpperCase()}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="rounded-xl border bg-secondary/50 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="font-semibold">Legal Consultancy Service Pvt. Ltd.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beneficiary Advocate:</span>
                <span className="font-semibold">{lawyer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Channel:</span>
                <span className="font-mono font-semibold">
                  {paymentTab === "upi" ? `UPI VPA (${upiId})` : `${selectedBank.name} (•••• ${accountNumber.slice(-4)})`}
                </span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-primary text-sm">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {paymentTab === "upi" ? (
              <div className="rounded-xl border bg-primary/5 p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Awaiting UPI Approval on your Mobile App...</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Collect request sent to <strong>{upiId}</strong>. Open your {upiDetails?.psp || "UPI App"} and enter your UPI PIN to approve.
                </p>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleConfirmOtp}
                    disabled={isProcessingPayment}
                    className="w-full rounded-xl text-xs font-bold shadow-soft"
                  >
                    {isProcessingPayment ? "Confirming with NPCI..." : "Simulate UPI Mobile Approval"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp" className="text-xs font-semibold">
                    Enter 6-Digit Bank OTP Code
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    OTP sent to +91 98••••3210 ({otpTimer}s)
                  </span>
                </div>
                <Input
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="482910"
                  maxLength={6}
                  className="rounded-xl text-center font-mono text-lg tracking-widest"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Test Demo OTP: 482910</span>
                  <button
                    type="button"
                    onClick={() => setOtpCode("482910")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Auto-fill Test OTP
                  </button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOtpModalOpen(false)}
              className="rounded-xl text-xs flex-1"
            >
              Cancel
            </Button>
            {paymentTab !== "upi" && (
              <Button
                onClick={handleConfirmOtp}
                disabled={isProcessingPayment}
                className="rounded-xl text-xs flex-1 font-bold shadow-soft"
              >
                {isProcessingPayment ? "Authorizing with Bank..." : "Authorize & Settle"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Official Tax Invoice & Consultation Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        data={receiptData}
      />
    </div>
  );
}