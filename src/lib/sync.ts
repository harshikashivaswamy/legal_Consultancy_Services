/**
 * sync.ts — Real-time Supabase Sync Service
 *
 * Strategy:
 *  1. Every data mutation writes to localStorage FIRST (instant, offline-safe).
 *  2. It THEN queues a Supabase write. If Supabase is unreachable, the item
 *     stays in the sync queue and is retried on next page load / reconnect.
 *  3. On app start, `flushSyncQueue()` drains any pending queue items.
 */

import { supabase, isSupabaseConfigured } from "./supabase";

// ─── Sync Queue ──────────────────────────────────────────────────────────────
const SYNC_QUEUE_KEY = "legalconsultancy.sync_queue";
const LOGIN_HISTORY_KEY = "legalconsultancy.login_history";

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert";
  payload: Record<string, unknown>;
  matchColumn?: string;
  matchValue?: string;
  createdAt: string;
  attempts: number;
}

function getQueue(): SyncQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(q: SyncQueueItem[]): void {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q));
}

function enqueue(item: Omit<SyncQueueItem, "id" | "createdAt" | "attempts">): void {
  const q = getQueue();
  q.push({
    ...item,
    id: `sq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  });
  saveQueue(q);
}

/** Flush the sync queue — call this on app mount */
export async function flushSyncQueue(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const q = getQueue();
  if (q.length === 0) return;

  const remaining: SyncQueueItem[] = [];

  for (const item of q) {
    try {
      let error: unknown = null;

      if (item.operation === "insert") {
        const res = await supabase.from(item.table).insert(item.payload as any);
        error = res.error;
      } else if (item.operation === "upsert") {
        const res = await supabase.from(item.table).upsert(item.payload as any);
        error = res.error;
      } else if (item.operation === "update" && item.matchColumn && item.matchValue) {
        const res = await supabase
          .from(item.table)
          .update(item.payload as any)
          .eq(item.matchColumn, item.matchValue);
        error = res.error;
      }

      if (error) {
        // Keep in queue, increment attempts
        remaining.push({ ...item, attempts: item.attempts + 1 });
      }
      // On success, item is removed from queue
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  // Remove items that have failed too many times (> 5 attempts)
  const filtered = remaining.filter((i) => i.attempts <= 5);
  saveQueue(filtered);
}

// ─── Login History ────────────────────────────────────────────────────────────
export interface LoginHistoryEntry {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  loginAt: string;
  provider: "email" | "google" | "demo";
  userAgent: string;
}

export function recordLoginHistory(entry: Omit<LoginHistoryEntry, "id" | "loginAt" | "userAgent">): void {
  const record: LoginHistoryEntry = {
    ...entry,
    id: `login_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    loginAt: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 120) : "unknown",
  };

  // Write to localStorage
  try {
    const raw = localStorage.getItem(LOGIN_HISTORY_KEY);
    const history: LoginHistoryEntry[] = raw ? JSON.parse(raw) : [];
    history.unshift(record);
    // Keep only last 100 logins
    localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch {/* ignore */}

  // Sync to Supabase notification table (login_history table may not exist, use notifications as audit log)
  if (isSupabaseConfigured) {
    enqueue({
      table: "login_history",
      operation: "insert",
      payload: {
        id: record.id,
        user_id: record.userId,
        user_email: record.userEmail,
        user_name: record.userName,
        role: record.role,
        login_at: record.loginAt,
        provider: record.provider,
        user_agent: record.userAgent,
      },
    });
    // Also fire immediately
    void supabase.from("login_history").insert({
      id: record.id,
      user_id: record.userId,
      user_email: record.userEmail,
      user_name: record.userName,
      role: record.role,
      login_at: record.loginAt,
      provider: record.provider,
      user_agent: record.userAgent,
    }).then(({ error }) => {
      if (error) {
        // Already queued above, no action needed
        console.debug("[sync] login_history queued for retry:", error.message);
      }
    });
  }
}

export function getLoginHistory(): LoginHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

// ─── Profile Sync ─────────────────────────────────────────────────────────────
export async function syncProfileToSupabase(profile: {
  id: string;
  name: string;
  email: string;
  role: "client" | "lawyer" | "admin";
  phone?: string;
  avatar_url?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;

  // NOTE: `role` is intentionally NOT sent. Roles are assigned by the database (see supabase/schema.sql)
  // and cannot be changed from the browser.
  const payload = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? null,
    avatar_url: profile.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    console.debug("[sync] profile upsert queued:", error.message);
    enqueue({ table: "profiles", operation: "upsert", payload });
  }
}

// ─── Document Sync ────────────────────────────────────────────────────────────
export async function syncDocumentToSupabase(doc: {
  id: string;
  userId: string;
  clientId?: string;
  lawyerId?: string;
  name: string;
  fileUrl?: string;
  fileSize?: string;
  category?: string;
  notes?: string;
  status?: string;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    id: doc.id,
    user_id: doc.userId,
    client_id: doc.clientId ?? null,
    lawyer_id: doc.lawyerId ?? null,
    name: doc.name,
    file_url: doc.fileUrl ?? doc.name,
    file_size: doc.fileSize ?? "1 MB",
    category: doc.category ?? "Case File",
    notes: doc.notes ?? null,
    status: doc.status ?? "Uploaded",
    uploaded_time: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase.from("documents").upsert(payload as any, { onConflict: "id" });
    if (error) {
      console.debug("[sync] document queued:", error.message);
      enqueue({ table: "documents", operation: "upsert", payload });
    }
  } else {
    enqueue({ table: "documents", operation: "upsert", payload });
  }
}

// ─── Booking Sync ─────────────────────────────────────────────────────────────
export async function syncBookingToSupabase(booking: {
  id: string;
  clientId?: string;
  lawyerId?: string;
  clientName: string;
  lawyerName: string;
  date: string;
  timeSlot: string;
  mode: string;
  fee: number;
  category?: string;
  notes?: string;
  paymentId?: string;
}): Promise<void> {
  const payload: Record<string, unknown> = {
    id: booking.id,
    client_id: booking.clientId ?? null,
    lawyer_id: booking.lawyerId ?? null,
    client_name: booking.clientName,
    lawyer_name: booking.lawyerName,
    date: booking.date,
    time_slot: booking.timeSlot,
    mode: booking.mode,
    status: "Confirmed",
    fee: booking.fee,
    payment_status: "Paid",
    payment_id: booking.paymentId ?? null,
    notes: booking.notes ?? null,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase.from("bookings").upsert(payload as any, { onConflict: "id" });
    if (error) {
      console.debug("[sync] booking queued:", error.message);
      enqueue({ table: "bookings", operation: "upsert", payload });
    }
  } else {
    enqueue({ table: "bookings", operation: "upsert", payload });
  }
}

// ─── Payment Sync ─────────────────────────────────────────────────────────────
export async function syncPaymentToSupabase(payment: {
  id: string;
  paymentId: string;
  orderId: string;
  bookingId?: string;
  clientId?: string;
  lawyerId?: string;
  clientName: string;
  lawyerName: string;
  amount: number;
  method: "UPI" | "Card" | "Netbanking" | "Razorpay";
  status: "Completed" | "Escrow Hold" | "Refunded" | "Disputed" | "Failed";
}): Promise<void> {
  const platformFee = Math.round(payment.amount * 0.1);
  const payload: Record<string, unknown> = {
    payment_id: payment.paymentId,
    order_id: payment.orderId,
    booking_id: payment.bookingId ?? null,
    client_id: payment.clientId ?? null,
    lawyer_id: payment.lawyerId ?? null,
    client_name: payment.clientName,
    lawyer_name: payment.lawyerName,
    amount: payment.amount,
    platform_fee: platformFee,
    net_payout: payment.amount - platformFee,
    currency: "INR",
    status: payment.status,
    payment_method: payment.method,
    transaction_time: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase.from("payments").upsert(payload as any, { onConflict: "payment_id" });
    if (error) {
      console.debug("[sync] payment queued:", error.message);
      enqueue({ table: "payments", operation: "upsert", payload });
    }
  } else {
    enqueue({ table: "payments", operation: "upsert", payload });
  }
}

// ─── Notification Sync ────────────────────────────────────────────────────────
export async function syncNotificationToSupabase(notif: {
  id: string;
  userId?: string;
  role: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;

  const payload: Record<string, unknown> = {
    id: notif.id,
    user_id: notif.userId ?? null,
    role: notif.role,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    link: notif.link ?? null,
    read: false,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("notifications").upsert(payload as any, { onConflict: "id" });
  if (error) {
    enqueue({ table: "notifications", operation: "upsert", payload });
  }
}

// ─── Lawyer Profile Sync ──────────────────────────────────────────────────────
export async function syncLawyerProfileToSupabase(lawyer: {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  barId: string;
  stateBar: string;
  specializations: string[];
  city?: string;
  experience: number;
  fee: number;
  bio?: string;
  certificateUrl?: string;
  status?: "Pending" | "Approved" | "Rejected";
}): Promise<void> {
  const payload: Record<string, unknown> = {
    user_id: lawyer.userId ?? null,
    name: lawyer.name,
    email: lawyer.email ?? null,
    phone: lawyer.phone ?? null,
    bar_id: lawyer.barId,
    state_bar: lawyer.stateBar,
    specialisations: lawyer.specializations,
    city: lawyer.city ?? "India",
    languages: ["English", "Hindi"],
    experience_years: lawyer.experience,
    consultation_fee: lawyer.fee,
    bio: lawyer.bio ?? null,
    certificate_url: lawyer.certificateUrl ?? null,
    verified: false,
    status: lawyer.status ?? "Pending",
    submitted_date: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("lawyers")
      .upsert(payload as any, { onConflict: "bar_id" });
    if (error) {
      console.debug("[sync] lawyer profile queued:", error.message);
      enqueue({ table: "lawyers", operation: "upsert", payload });
    }
  } else {
    enqueue({ table: "lawyers", operation: "upsert", payload });
  }
}

// ─── Connection Test ──────────────────────────────────────────────────────────
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tablesExist: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { connected: false, tablesExist: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) {
      return {
        connected: true,
        tablesExist: false,
        error: error.message,
      };
    }
    return { connected: true, tablesExist: true };
  } catch (err: any) {
    return {
      connected: false,
      tablesExist: false,
      error: err?.message ?? "Network error",
    };
  }
}
