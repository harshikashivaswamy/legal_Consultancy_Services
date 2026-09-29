import { createClient } from "@supabase/supabase-js";

// Read from Vite import.meta.env or standard environment variables
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env as Record<string, string | undefined>)[key]) {
    return (import.meta.env as Record<string, string | undefined>)[key] || "";
  }
  if (typeof process !== "undefined" && process.env && (process.env as Record<string, string | undefined>)[key]) {
    return (process.env as Record<string, string | undefined>)[key] || "";
  }
  return "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL") || getEnvVar("SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY");

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project-id")
);

// When Supabase is not configured we still create a client (so imports never crash), but it points at a
// non-routable placeholder and every caller checks `isSupabaseConfigured` before using it.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.invalid",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: "client" | "lawyer" | "admin";
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Lawyer = {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  bar_id: string;
  state_bar?: string;
  specialisations: string[];
  city: string;
  languages: string[];
  experience_years: number;
  consultation_fee: number;
  rating: number;
  review_count: number;
  bio?: string;
  courts?: string[];
  certificate_url?: string;
  verified: boolean;
  status?: "Pending" | "Approved" | "Rejected";
  avatar_url?: string;
  submitted_date?: string;
  created_at: string;
};

export type Booking = {
  id: string;
  client_id?: string;
  lawyer_id?: string;
  client_name: string;
  lawyer_name: string;
  date: string;
  time_slot: string;
  mode: "Video" | "Audio" | "Chat" | "In-person";
  status: "Confirmed" | "Completed" | "Cancelled" | "Pending";
  payment_status?: "Paid" | "Escrow Hold" | "Refunded" | "Pending";
  payment_id?: string;
  fee: number;
  notes?: string;
  document_ids?: string[];
  created_at: string;
};

export type PaymentRecord = {
  id: string;
  payment_id: string;
  order_id: string;
  booking_id?: string;
  client_id?: string;
  lawyer_id?: string;
  client_name: string;
  lawyer_name: string;
  amount: number;
  platform_fee: number;
  net_payout: number;
  currency: string;
  status: "Completed" | "Escrow Hold" | "Refunded" | "Disputed" | "Failed";
  payment_method: "UPI" | "Card" | "Netbanking" | "Razorpay";
  transaction_time: string;
  notes?: Record<string, any>;
  created_at?: string;
};

export type DocumentRecord = {
  id: string;
  user_id: string;
  client_id?: string;
  lawyer_id?: string;
  booking_id?: string;
  client_name?: string;
  lawyer_name?: string;
  name: string;
  file_name?: string;
  file_url: string;
  file_size: string;
  category?: string;
  status: "Reviewed" | "In review" | "Uploaded" | "Pending review";
  notes?: string;
  uploaded_time?: string;
  created_at: string;
};

export type NotificationRecord = {
  id: string;
  user_id?: string;
  role: "client" | "lawyer" | "admin";
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "booking" | "payment" | "document";
  read: boolean;
  link?: string;
  created_at: string;
};

export type DisputeRecord = {
  id: string;
  booking_id: string;
  client_name: string;
  lawyer_name: string;
  amount: number;
  reason: string;
  status: "Open" | "Refunded" | "Released" | "Under Review";
  filed_date: string;
  resolution_notes?: string;
  created_at?: string;
};

export type ReviewRecord = {
  id: string;
  lawyer_id: string;
  client_id?: string;
  client_name: string;
  rating: number;
  comment?: string;
  created_at: string;
};
