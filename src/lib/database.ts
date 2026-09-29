import {
  isSupabaseConfigured,
  supabase,
  type Lawyer,
  type Booking,
  type NotificationRecord,
  type DisputeRecord as SupabaseDispute,
} from "./supabase";
import {
  LAWYERS as MOCK_LAWYERS,
  BOOKINGS as MOCK_BOOKINGS,
  DOCUMENTS as MOCK_DOCS,
  PAYMENTS as MOCK_PAYMENTS,
} from "./mock-data";
import {
  getStoredBookings,
  saveBookings,
  updateStoredBookingStatus,
  type Booking as StoredBooking,
} from "./bookings";
import {
  getStoredDocuments,
  saveDocuments,
  updateDocumentReview as updateDocReviewStorage,
  type StoredDocument,
} from "./documents";

const ADMIN_APPROVALS_KEY = "legalconsultancy.admin.approvals";
const ADMIN_DISPUTES_KEY = "legalconsultancy.admin.disputes";
const ADMIN_LAWYER_EDITS_KEY = "legalconsultancy.admin.lawyer_edits";
const NOTIFICATIONS_KEY = "legalconsultancy.notifications";
const PAYMENTS_KEY = "legalconsultancy.payments";

// ── Local DB-layer types ──────────────────────────────────────────────────────
export interface PaymentRecord {
  id: string;
  booking_id: string;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "Completed" | "Escrow Hold" | "Refunded" | "Disputed" | "Failed";
  payment_method: "UPI" | "Card" | "Netbanking" | "Razorpay";
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  name: string;
  file_type: string;
  file_size_bytes: number;
  category: string;
  notes: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface PendingLawyerApproval {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  barNumber: string;
  stateBar?: string;
  fee: number;
  city?: string;
  email?: string;
  phone?: string;
  submittedDate?: string;
  certificateUrl?: string;
  status?: "Pending" | "Approved" | "Rejected";
}

export interface PlatformTransaction {
  id: string;
  date: string;
  client: string;
  lawyer: string;
  category: string;
  amount: number;
  platformFee: number;
  netPayout: number;
  paymentMethod: "UPI" | "Card" | "Netbanking" | "Razorpay";
  status: "Completed" | "Escrow Hold" | "Refunded" | "Disputed";
}

export interface DisputeRecord {
  id: string;
  bookingId: string;
  clientName: string;
  lawyerName: string;
  amount: number;
  reason: string;
  filedDate: string;
  status: "Open" | "Refunded" | "Released" | "Under Review";
  resolutionNotes?: string;
}

export type PendingLawyer = PendingLawyerApproval;
export type Dispute = DisputeRecord;

const DEFAULT_PENDING: PendingLawyerApproval[] = [
  {
    id: "lw-pending-1",
    name: "Adv. Rajesh Kumar",
    specialization: "Criminal & Constitutional Law",
    experience: "12 years",
    barNumber: "BCI/DL/9021/2012",
    stateBar: "Bar Council of Delhi",
    fee: 3500,
    city: "New Delhi",
    email: "rajesh.kumar@legaladv.in",
    phone: "+91 98112 34567",
    submittedDate: "2026-08-04",
    status: "Pending",
  },
  {
    id: "lw-pending-2",
    name: "Adv. Sneha Deshmukh",
    specialization: "Corporate & Startup Consulting",
    experience: "7 years",
    barNumber: "BCI/MH/5831/2017",
    stateBar: "Bar Council of Maharashtra & Goa",
    fee: 2000,
    city: "Mumbai",
    email: "sneha.deshmukh@mumbailegal.com",
    phone: "+91 98201 98765",
    submittedDate: "2026-08-05",
    status: "Pending",
  },
  {
    id: "lw-pending-3",
    name: "Adv. Vikram Singhania",
    specialization: "Real Estate & Land Acquisition",
    experience: "15 years",
    barNumber: "BCI/KA/4412/2009",
    stateBar: "Karnataka State Bar Council",
    fee: 4500,
    city: "Bengaluru",
    email: "v.singhania@blrchambers.org",
    phone: "+91 94480 12345",
    submittedDate: "2026-08-06",
    status: "Pending",
  },
];

const DEFAULT_DISPUTES: DisputeRecord[] = [
  {
    id: "DSP-401",
    bookingId: "BK-2390",
    clientName: "Sara Khan",
    lawyerName: "Adv. Kavita Deshmukh",
    amount: 1500,
    reason: "Technical audio issue during consultation slot. Requested reschedule or refund.",
    filedDate: "2026-08-02",
    status: "Open",
  },
  {
    id: "DSP-398",
    bookingId: "BK-2344",
    clientName: "Harish Pillai",
    lawyerName: "Adv. Farhan Qureshi",
    amount: 3200,
    reason: "Advocate joined 25 minutes late and consultation cut short.",
    filedDate: "2026-07-29",
    status: "Open",
  },
];

// -------------------------------------------------------------
// 1. Lawyers & Advocate Directory
// -------------------------------------------------------------
export async function getLawyers(): Promise<any[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .order("rating", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((l: Lawyer) => ({
          id: l.id,
          name: l.name,
          specialization: Array.isArray(l.specialisations) ? l.specialisations[0] || "General Law" : "General Law",
          specialisations: l.specialisations || [],
          experience: l.experience_years || 10,
          city: l.city || "Mumbai",
          rating: Number(l.rating) || 4.9,
          reviews: l.review_count || 100,
          fee: Number(l.consultation_fee) || 2000,
          barCouncilId: l.bar_id || "BAR-000",
          stateBar: l.state_bar || "State Bar Council",
          verified: l.verified ?? true,
          status: l.status || (l.verified ? "Approved" : "Pending"),
          bio: l.bio || "",
          languages: l.languages || ["English", "Hindi"],
          courts: l.courts || ["High Court"],
          avatar: l.avatar_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
          availableToday: true,
          nextSlot: "Today · 4:00 PM",
        }));
      }
    } catch (err) {
      console.warn("Could not fetch lawyers from Supabase, using fallback:", err);
    }
  }

  return MOCK_LAWYERS;
}

export async function getLawyerById(id: string): Promise<any | null> {
  const lawyers = await getLawyers();
  return lawyers.find((l) => l.id === id || l.id === `lw-${id}`) || lawyers[0] || null;
}

export async function getAdminLawyers(): Promise<any[]> {
  const base = await getLawyers();

  // With a database configured, `base` already contains every application (admins can read all rows),
  // so the browser-local demo list is only merged in offline demo mode.
  const localPending = isSupabaseConfigured ? [] : getAdminPendingLawyers();
  const pending = localPending.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email || "",
    phone: l.phone || "",
    specialization: l.specialization,
    specialisations: [l.specialization],
    experience: l.experience,
    experience_years: Number.parseInt(l.experience, 10) || 0,
    city: l.city || "",
    fee: Number(l.fee) || 0,
    consultation_fee: Number(l.fee) || 0,
    barCouncilId: l.barNumber,
    bar_id: l.barNumber,
    stateBar: l.stateBar || "",
    bio: "",
    status: l.status || "Pending",
    verified: l.status === "Approved",
    certificateUrl: l.certificateUrl || "",
  }));

  const merged = [...base];
  for (const lawyer of pending) {
    if (!merged.some((item) => item.id === lawyer.id)) merged.push(lawyer);
  }

  try {
    const raw = localStorage.getItem(ADMIN_LAWYER_EDITS_KEY);
    if (raw) {
      const edits = JSON.parse(raw) as Record<string, Record<string, unknown>>;
      return merged.map((lawyer) => ({
        ...lawyer,
        ...(edits[lawyer.id] || {}),
      }));
    }
  } catch {
    // Ignore malformed local admin edits.
  }

  return merged;
}

export async function updateLawyerProfile(
  id: string,
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    specialization?: string;
    experience?: number;
    fee?: number;
    barCouncilId?: string;
    stateBar?: string;
    bio?: string;
    status?: "Pending" | "Approved" | "Rejected";
    verified?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const normalized = {
    ...updates,
    ...(updates.specialization !== undefined
      ? { specialisations: [updates.specialization] }
      : {}),
    ...(updates.experience !== undefined
      ? { experience_years: Number(updates.experience) || 0 }
      : {}),
    ...(updates.fee !== undefined
      ? { consultation_fee: Number(updates.fee) || 0 }
      : {}),
    ...(updates.barCouncilId !== undefined
      ? { bar_id: updates.barCouncilId }
      : {}),
  };

  try {
    const raw = localStorage.getItem(ADMIN_LAWYER_EDITS_KEY);
    const edits = raw ? (JSON.parse(raw) as Record<string, Record<string, unknown>>) : {};
    edits[id] = { ...(edits[id] || {}), ...normalized };
    localStorage.setItem(ADMIN_LAWYER_EDITS_KEY, JSON.stringify(edits));

    const approvals = getAdminPendingLawyers();
    if (approvals.some((lawyer) => lawyer.id === id)) {
      const updatedApprovals = approvals.map((lawyer) =>
        lawyer.id === id
          ? {
              ...lawyer,
              ...(updates.name !== undefined ? { name: updates.name } : {}),
              ...(updates.email !== undefined ? { email: updates.email } : {}),
              ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
              ...(updates.city !== undefined ? { city: updates.city } : {}),
              ...(updates.specialization !== undefined ? { specialization: updates.specialization } : {}),
              ...(updates.experience !== undefined ? { experience: `${updates.experience} years` } : {}),
              ...(updates.fee !== undefined ? { fee: updates.fee } : {}),
              ...(updates.barCouncilId !== undefined ? { barNumber: updates.barCouncilId } : {}),
              ...(updates.stateBar !== undefined ? { stateBar: updates.stateBar } : {}),
              ...(updates.status !== undefined ? { status: updates.status } : {}),
            }
          : lawyer
      );
      localStorage.setItem(ADMIN_APPROVALS_KEY, JSON.stringify(updatedApprovals));
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("lawyers")
        .update({
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.email !== undefined ? { email: updates.email } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
          ...(updates.city !== undefined ? { city: updates.city } : {}),
          ...(updates.specialization !== undefined ? { specialisations: [updates.specialization] } : {}),
          ...(updates.experience !== undefined ? { experience_years: Number(updates.experience) || 0 } : {}),
          ...(updates.fee !== undefined ? { consultation_fee: Number(updates.fee) || 0 } : {}),
          ...(updates.barCouncilId !== undefined ? { bar_id: updates.barCouncilId } : {}),
          ...(updates.stateBar !== undefined ? { state_bar: updates.stateBar } : {}),
          ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
          ...(updates.status !== undefined ? { status: updates.status } : {}),
          ...(updates.verified !== undefined ? { verified: updates.verified } : {}),
        })
        .eq("id", id);

      if (error) {
        console.warn("Supabase lawyer update warning:", error.message);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update lawyer profile.",
    };
  }
}

// -------------------------------------------------------------
// 2. Advocate Registrations & Admin Approvals
// -------------------------------------------------------------
export function getAdminPendingLawyers(): PendingLawyerApproval[] {
  try {
    const raw = localStorage.getItem(ADMIN_APPROVALS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_APPROVALS_KEY, JSON.stringify(DEFAULT_PENDING));
      return DEFAULT_PENDING;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PENDING;
  }
}

/**
 * Advocate applications for the admin "Approvals" screen.
 * When the database is configured it is the single source of truth (so an application submitted from a
 * lawyer's browser shows up for the admin, on any device). Without a database we fall back to the
 * browser-local demo list.
 */
export async function loadPendingLawyers(): Promise<PendingLawyerApproval[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return (data as Lawyer[]).map((l) => ({
          id: l.id,
          name: l.name,
          specialization: Array.isArray(l.specialisations) ? l.specialisations[0] || "General Law" : "General Law",
          experience: `${l.experience_years ?? 0} years`,
          barNumber: l.bar_id,
          stateBar: l.state_bar ?? "",
          fee: Number(l.consultation_fee) || 0,
          city: l.city ?? "",
          email: l.email ?? "",
          phone: l.phone ?? "",
          submittedDate: l.submitted_date ?? (l.created_at ? (l.created_at.split("T")[0] ?? "") : ""),
          certificateUrl: l.certificate_url ?? "",
          status: l.status ?? (l.verified ? "Approved" : "Pending"),
        }));
      }
      if (error) console.warn("Could not load advocate applications from Supabase:", error.message);
    } catch (err) {
      console.warn("Could not load advocate applications from Supabase:", err);
    }
  }
  return getAdminPendingLawyers();
}

export async function submitLawyerRegistration(advocate: {
  name: string;
  email: string;
  phone?: string;
  barNumber: string;
  stateBar?: string;
  specialization: string;
  experience: string;
  fee?: number;
  certificateUrl?: string;
}): Promise<void> {
  const newPending: PendingLawyerApproval = {
    id: `lw-pending-${Date.now().toString(36)}`,
    name: advocate.name,
    email: advocate.email,
    phone: advocate.phone ?? "",
    barNumber: advocate.barNumber,
    stateBar: advocate.stateBar || "State Bar Council",
    specialization: advocate.specialization,
    experience: advocate.experience,
    fee: advocate.fee || 2000,
    submittedDate: new Date().toISOString().split("T")[0]!,
    certificateUrl: advocate.certificateUrl ?? "",
    status: "Pending",
  };

  const list = getAdminPendingLawyers();
  localStorage.setItem(ADMIN_APPROVALS_KEY, JSON.stringify([newPending, ...list]));

  if (isSupabaseConfigured) {
    try {
      await supabase.from("lawyers").insert({
        name: advocate.name,
        email: advocate.email,
        phone: advocate.phone,
        bar_id: advocate.barNumber,
        state_bar: advocate.stateBar || "State Bar Council",
        specialisations: [advocate.specialization],
        experience_years: parseInt(advocate.experience, 10) || 5,
        consultation_fee: advocate.fee || 2000,
        city: "Mumbai",
        verified: false,
        status: "Pending",
        certificate_url: advocate.certificateUrl || null,
      });
    } catch (err) {
      console.warn("Could not sync new advocate registration to Supabase:", err);
    }
  }

  // Notify admin
  await createNotification({
    role: "admin",
    title: "New Advocate Verification Request",
    message: `${advocate.name} (${advocate.barNumber}) has submitted credentials for verification.`,
    type: "warning",
    link: "/admin/approvals",
  });
}

export async function setLawyerVerificationStatus(
  id: string,
  status: "Approved" | "Rejected"
): Promise<void> {
  const current = getAdminPendingLawyers();
  const updated = current.map((l) => (l.id === id ? { ...l, status } : l));
  localStorage.setItem(ADMIN_APPROVALS_KEY, JSON.stringify(updated));

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("lawyers")
        .update({
          verified: status === "Approved",
          status,
        })
        .eq("id", id);
    } catch (err) {
      console.warn("Could not sync verification to Supabase:", err);
    }
  }

  // Send real-time notification
  const lawyer = current.find((l) => l.id === id);
  if (lawyer) {
    await createNotification({
      role: "lawyer",
      title: status === "Approved" ? "✓ Profile Verification Approved!" : "Verification Update",
      message:
        status === "Approved"
          ? "Congratulations! Your Bar Council credentials have been verified by Admin. You are now live on the platform."
          : "Your advocate application status was updated. Please contact support or resubmit credentials.",
      type: status === "Approved" ? "success" : "warning",
      link: "/lawyer",
    });
  }
}

// -------------------------------------------------------------
// 3. Bookings & Appointments
// -------------------------------------------------------------
export async function createBooking(booking: {
  clientId?: string | undefined;
  lawyerId: string;
  clientName: string;
  lawyerName: string;
  date: string;
  timeSlot: string;
  mode: "Video" | "Audio" | "Chat" | "In-person";
  fee: number;
  paymentId?: string | undefined;
  notes?: string | undefined;
  category?: string | undefined;
  documentIds?: string[];
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const newBookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;

  const newStoredBooking: StoredBooking = {
    id: newBookingId,
    lawyerId: booking.lawyerId,
    client: booking.clientName,
    date: booking.date,
    time: booking.timeSlot,
    mode: booking.mode,
    status: "Confirmed",
    category: booking.category || "Legal Consultation",
    amount: booking.fee,
  };

  const stored = getStoredBookings();
  saveBookings([newStoredBooking, ...stored]);

  // Record payment in financial ledger
  await recordPayment({
    paymentId: booking.paymentId || `pay_${Date.now().toString(36)}`,
    orderId: `ord_${Date.now().toString(36)}`,
    bookingId: newBookingId,
    clientId: booking.clientId ?? "",
    lawyerId: booking.lawyerId ?? "",
    clientName: booking.clientName,
    lawyerName: booking.lawyerName,
    amount: booking.fee,
    paymentMethod: "Razorpay",
    status: "Completed",
  });

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          client_id: booking.clientId || null,
          lawyer_id: booking.lawyerId.length > 20 ? booking.lawyerId : null,
          client_name: booking.clientName,
          lawyer_name: booking.lawyerName,
          date: booking.date,
          time_slot: booking.timeSlot,
          mode: booking.mode,
          status: "Confirmed",
          fee: booking.fee,
          payment_status: "Paid",
          payment_id: booking.paymentId || null,
          notes: booking.notes || null,
          document_ids: booking.documentIds || [],
        })
        .select()
        .single();

      if (!error && data) {
        // Dispatch notifications
        await createNotification({
          role: "lawyer",
          title: "New Consultation Scheduled",
          message: `${booking.clientName} booked a ${booking.mode} session for ${booking.date} at ${booking.timeSlot}.`,
          type: "booking",
          link: "/lawyer/schedule",
        });

        await createNotification({
          role: "client",
          title: "Booking Confirmed",
          message: `Your consultation with ${booking.lawyerName} is scheduled for ${booking.date} at ${booking.timeSlot}.`,
          type: "booking",
          link: "/client/bookings",
        });

        return { success: true, data };
      }
    } catch (err: any) {
      console.warn("Supabase booking creation fallback:", err);
    }
  }

  return { success: true, data: newStoredBooking };
}

export async function getUserBookings(userId?: string): Promise<any[]> {
  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((b: Booking) => ({
          id: b.id,
          lawyer: b.lawyer_name,
          date: b.date,
          time: b.time_slot,
          mode: b.mode,
          status: b.status,
          fee: Number(b.fee),
        }));
      }
    } catch (err) {
      console.warn("Could not fetch user bookings from Supabase:", err);
    }
  }

  return getStoredBookings();
}

export async function getLawyerBookings(lawyerIdOrName?: string): Promise<StoredBooking[]> {
  if (isSupabaseConfigured && lawyerIdOrName && lawyerIdOrName.length > 20) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("lawyer_id", lawyerIdOrName)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((b: Booking) => ({
          id: b.id,
          lawyerId: b.lawyer_id || "lw-1",
          client: b.client_name,
          date: b.date,
          time: b.time_slot,
          mode: (b.mode as any) || "Video",
          status: (b.status as any) || "Confirmed",
          category: "Legal Consultation",
          amount: Number(b.fee) || 2000,
        }));
      }
    } catch (err) {
      console.warn("Could not fetch lawyer bookings from Supabase:", err);
    }
  }

  const all = getStoredBookings();
  if (!lawyerIdOrName) return all;
  const search = lawyerIdOrName.toLowerCase();
  const matched = all.filter(
    (b) =>
      (b.lawyerId && b.lawyerId.toLowerCase() === search) ||
      (b.client && b.client.toLowerCase().includes(search))
  );
  return matched.length > 0 ? matched : all;
}

export async function updateBookingStatus(
  bookingId: string,
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled"
): Promise<void> {
  updateStoredBookingStatus(bookingId, status);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("bookings").update({ status }).eq("id", bookingId);
    } catch (err) {
      console.warn("Failed to sync booking status to Supabase:", err);
    }
  }
}

// -------------------------------------------------------------
// 4. Payments & Financial Ledger
// -------------------------------------------------------------
export async function recordPayment(payment: {
  paymentId: string;
  orderId: string;
  bookingId?: string;
  clientId?: string;
  lawyerId?: string;
  clientName: string;
  lawyerName: string;
  amount: number;
  paymentMethod?: "UPI" | "Card" | "Netbanking" | "Razorpay";
  status?: "Completed" | "Escrow Hold" | "Refunded" | "Disputed";
}): Promise<void> {
  const platformFee = Math.round(payment.amount * 0.1);
  const netPayout = payment.amount - platformFee;

  const newTxn: PlatformTransaction = {
    id: payment.paymentId,
    date: new Date().toISOString().split("T")[0]!,
    client: payment.clientName,
    lawyer: payment.lawyerName,
    category: "Consultation Fee",
    amount: payment.amount,
    platformFee,
    netPayout,
    paymentMethod: payment.paymentMethod || "Razorpay",
    status: payment.status || "Completed",
  };

  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    const existing: PlatformTransaction[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify([newTxn, ...existing]));
  } catch (err) {
    console.error("Local payment storage error:", err);
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from("payments").insert({
        payment_id: payment.paymentId,
        order_id: payment.orderId,
        booking_id: payment.bookingId || null,
        client_id: payment.clientId || null,
        lawyer_id: payment.lawyerId || null,
        client_name: payment.clientName,
        lawyer_name: payment.lawyerName,
        amount: payment.amount,
        platform_fee: platformFee,
        net_payout: netPayout,
        currency: "INR",
        status: payment.status || "Completed",
        payment_method: payment.paymentMethod || "Razorpay",
      });
    } catch (err) {
      console.warn("Could not sync payment record to Supabase:", err);
    }
  }
}

export async function getPlatformTransactions(): Promise<PlatformTransaction[]> {
  const normalize = (item: any): PlatformTransaction => {
    const fee = Number(item.amount) || 0;
    const platformFee = Number(item.platform_fee ?? item.platformFee) || Math.round(fee * 0.05);
    const netPayout = Number(item.net_payout ?? item.netPayout) || (fee - platformFee);
    const date = item.date || (item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
    const status = (item.status === "Completed" || item.status === "Settled")
      ? "Completed"
      : item.status === "Refunded"
        ? "Refunded"
        : item.status === "Disputed"
          ? "Disputed"
          : "Escrow Hold";

    return {
      id: String(item.payment_id || item.paymentId || item.id || `TXN-${Date.now()}`),
      date: String(date),
      client: String(item.client_name || item.clientName || item.client || "Client"),
      lawyer: String(item.lawyer_name || item.lawyerName || item.lawyer || "Advocate"),
      category: String(item.category || "Consultation Fee"),
      amount: fee,
      platformFee,
      netPayout,
      paymentMethod: (item.payment_method || item.paymentMethod || "UPI") as any,
      status,
    };
  };

  // 1. Fetch real transactions from Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(normalize);
      }
    } catch (err) {
      console.warn("Could not fetch payments from Supabase, checking local storage:", err);
    }
  }

  // 2. Fetch real transactions from localStorage (created during actual client bookings)
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(PAYMENTS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalize);
      }
    }
  } catch (err) {
    console.warn("Error reading local payments:", err);
  }

  // 3. Return empty list if no transactions have been made yet (no fake data)
  return [];
}

// -------------------------------------------------------------
// 5. Cross-Role Document Vault
// -------------------------------------------------------------
export async function getClientDocuments(clientId?: string, clientName?: string): Promise<StoredDocument[]> {
  const docs = getStoredDocuments();
  return docs;
}

export async function getLawyerDocuments(lawyerName?: string): Promise<StoredDocument[]> {
  const allDocs = getStoredDocuments();
  if (!lawyerName) return allDocs;

  const search = lawyerName.toLowerCase();
  const filtered = allDocs.filter(
    (d) => d.sharedWith && d.sharedWith.toLowerCase().includes(search)
  );

  return filtered.length > 0 ? filtered : allDocs;
}

export async function uploadDocument(doc: {
  userId?: string;
  clientId?: string;
  lawyerId?: string;
  bookingId?: string;
  clientName?: string;
  lawyerName?: string;
  name: string;
  fileUrl: string;
  fileSize: string;
  category?: string;
  notes?: string;
}): Promise<StoredDocument> {
  const newDocId = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
  const newDoc: StoredDocument = {
    id: newDocId,
    name: doc.name,
    type: doc.category || "Court Notice / Summons",
    size: doc.fileSize,
    uploaded: new Date().toISOString().split("T")[0]!,
    sharedWith: doc.lawyerName || "Assigned Advocate",
    status: "Pending review",
    fileUrl: doc.fileUrl,
    category: doc.category,
    notes: doc.notes,
    encrypted: true,
  };

  const docs = getStoredDocuments();
  saveDocuments([newDoc, ...docs]);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("documents").insert({
        id: newDocId,
        user_id: doc.userId || "guest-user",
        client_id: doc.clientId || null,
        lawyer_id: doc.lawyerId || null,
        booking_id: doc.bookingId || null,
        client_name: doc.clientName || "Client",
        lawyer_name: doc.lawyerName || null,
        name: doc.name,
        file_name: doc.name,
        file_url: doc.fileUrl,
        file_size: doc.fileSize,
        category: doc.category || "Court Notice / Summons",
        status: "Uploaded",
        notes: doc.notes || null,
      });

      if (doc.lawyerName) {
        await createNotification({
          role: "lawyer",
          title: "New Document Attached",
          message: `${doc.clientName || "Client"} uploaded "${doc.name}" for your review.`,
          type: "document",
          link: "/lawyer/documents",
        });
      }
    } catch (err) {
      console.warn("Could not sync uploaded document to Supabase:", err);
    }
  }

  return newDoc;
}

export async function updateDocumentReviewStatus(
  id: string,
  status: "Reviewed" | "Pending review" | "Draft",
  notes?: string
): Promise<void> {
  updateDocReviewStorage(id, status, notes);

  if (isSupabaseConfigured) {
    try {
      await supabase.from("documents").update({ status, notes }).eq("id", id);
    } catch (err) {
      console.warn("Failed to update doc status in Supabase:", err);
    }
  }
}

// -------------------------------------------------------------
// 6. Real-Time Notifications
// -------------------------------------------------------------
export async function getNotifications(role?: string, userId?: string): Promise<NotificationRecord[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (role) query = query.eq("role", role);
      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query.limit(20);
      if (!error && data && data.length > 0) {
        return data as NotificationRecord[];
      }
    } catch (err) {
      console.warn("Could not fetch notifications from Supabase:", err);
    }
  }

  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const parsed: NotificationRecord[] = JSON.parse(raw);
      if (role) {
        return parsed.filter((n) => n.role === role);
      }
      return parsed;
    }
  } catch {
    /* fallback to default */
  }

  return [
    {
      id: "notif-1",
      role: (role as any) || "client",
      title: "Welcome to Legal Consultancy Service",
      message: "Your profile is active. You can browse verified advocates and book instant consultations.",
      type: "info",
      read: false,
      created_at: new Date().toISOString(),
    },
  ];
}

export async function createNotification(notif: {
  userId?: string;
  role: "client" | "lawyer" | "admin";
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "booking" | "payment" | "document";
  link?: string;
}): Promise<void> {
  const newNotif: NotificationRecord = {
    id: `notif-${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: notif.userId ?? "",
    role: notif.role,
    title: notif.title,
    message: notif.message,
    type: notif.type || "info",
    read: false,
    link: notif.link ?? "",
    created_at: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const existing: NotificationRecord[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([newNotif, ...existing]));
  } catch (err) {
    console.error("Local notification storage error:", err);
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from("notifications").insert({
        id: newNotif.id,
        user_id: notif.userId || null,
        role: notif.role,
        title: notif.title,
        message: notif.message,
        type: notif.type || "info",
        link: notif.link || null,
        read: false,
      });
    } catch (err) {
      console.warn("Could not sync notification to Supabase:", err);
    }
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const list: NotificationRecord[] = JSON.parse(raw);
      const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Local notification update error:", err);
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch (err) {
      console.warn("Failed to mark notification read in Supabase:", err);
    }
  }
}

// -------------------------------------------------------------
// 7. Disputes & Arbitration
// -------------------------------------------------------------
export function getAdminDisputes(): DisputeRecord[] {
  try {
    const raw = localStorage.getItem(ADMIN_DISPUTES_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_DISPUTES_KEY, JSON.stringify(DEFAULT_DISPUTES));
      return DEFAULT_DISPUTES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DISPUTES;
  }
}

export const getDisputes = getAdminDisputes;

export function resolveDispute(id: string, resolution: "Refunded" | "Released", notes?: string): void {
  const disputes = getAdminDisputes();
  const updated = disputes.map((d) =>
    d.id === id ? { ...d, status: resolution, resolutionNotes: notes } : d
  );
  localStorage.setItem(ADMIN_DISPUTES_KEY, JSON.stringify(updated));

  if (isSupabaseConfigured) {
    try {
      void supabase.from("disputes").update({ status: resolution, resolution_notes: notes }).eq("id", id);
    } catch (err) {
      console.warn("Could not sync dispute resolution to Supabase:", err);
    }
  }
}

// -------------------------------------------------------------
// 8. Payment & Document Creation
// -------------------------------------------------------------

export interface CreatePaymentParams {
  booking_id: string;
  payment_id: string;
  order_id?: string;
  client_id?: string;
  lawyer_id?: string;
  client_name?: string;
  lawyer_name?: string;
  category?: string;
  amount: number;
  status: "Completed" | "Escrow Hold" | "Refunded" | "Disputed" | "Failed";
  payment_method: "UPI" | "Card" | "Netbanking" | "Razorpay";
}

export async function createPaymentRecord(params: CreatePaymentParams): Promise<PaymentRecord> {
  const platformFee = Math.round(params.amount * 0.05);
  const netPayout = params.amount - platformFee;

  const newRecord: PaymentRecord & { client_name?: string; lawyer_name?: string; category?: string; platform_fee?: number; net_payout?: number } = {
    id: `pay_rec_${Date.now()}`,
    booking_id: params.booking_id,
    payment_id: params.payment_id,
    order_id: params.order_id ?? `order_${Date.now()}`,
    amount: params.amount,
    currency: "INR",
    status: params.status,
    payment_method: params.payment_method,
    created_at: new Date().toISOString(),
    client_name: params.client_name || "Client User",
    lawyer_name: params.lawyer_name || "Adv. Legal Counsel",
    category: params.category || "Consultation Fee",
    platform_fee: platformFee,
    net_payout: netPayout,
  };

  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(PAYMENTS_KEY) : null;
    const list: any[] = raw ? JSON.parse(raw) : [];
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PAYMENTS_KEY, JSON.stringify([newRecord, ...list]));
    }
  } catch (err) {
    console.error("Local payment storage error:", err);
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from("payments").insert({
        booking_id: params.booking_id,
        payment_id: params.payment_id,
        order_id: params.order_id || `order_${Date.now()}`,
        client_id: params.client_id || null,
        lawyer_id: params.lawyer_id || null,
        client_name: params.client_name || "Client User",
        lawyer_name: params.lawyer_name || "Adv. Legal Counsel",
        amount: params.amount,
        platform_fee: platformFee,
        net_payout: netPayout,
        currency: "INR",
        status: params.status,
        payment_method: params.payment_method,
      });
    } catch (err) {
      console.warn("Failed to sync payment to Supabase:", err);
    }
  }

  return newRecord;
}

export interface UploadDocumentParams {
  name: string;
  category?: string | undefined;
  size: string;
  lawyer_id?: string | undefined;
  client_id?: string | undefined;
  notes?: string | undefined;
  file_data?: string | undefined;
}

export async function uploadDocumentRecord(params: UploadDocumentParams): Promise<DocumentRecord> {
  const newDocId = `doc_${Date.now()}`;
  const docRec: DocumentRecord = {
    id: newDocId,
    name: params.name,
    file_type: params.category || "Legal Brief",
    file_size_bytes: 1024 * 1024,
    category: params.category || "Case File",
    notes: params.notes ?? "",
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from("documents").insert({
        id: newDocId,
        name: params.name,
        file_path: params.name,
        file_type: params.category || "Legal Brief",
        category: params.category || "Case File",
        notes: params.notes || null,
        file_data: params.file_data || null,
      });
    } catch (err) {
      console.warn("Failed to sync document record to Supabase:", err);
    }
  }

  return docRec;
}

