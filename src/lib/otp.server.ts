/**
 * Server-only OTP helpers.
 *
 * Security model:
 *  - Codes are generated on the server with a CSPRNG. The client can never choose or see a code.
 *  - Only an HMAC of the code is stored (never the plain code), and it is never written to logs.
 *  - Codes expire after 5 minutes, are single-use, allow 5 wrong attempts, and sends are rate limited.
 *  - Storage is the Supabase `otp_verification` table, accessed with the SERVICE ROLE key
 *    (the table has RLS enabled and no public policies, so the browser can never read it).
 *  - In local development only (NODE_ENV !== "production") an in-memory store is used when the
 *    service role key is not configured. In production the DB is mandatory.
 */
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env.server";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 45 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_SENDS_PER_HOUR = 6;

export type OtpPurpose = "login" | "register";

export function isProduction(): boolean {
  return process.env["NODE_ENV"] === "production";
}

// ─── Supabase clients ────────────────────────────────────────────────────────
function supabaseUrl(): string {
  return getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL") || "";
}

/** True when a real Supabase project URL + anon key are configured for the server. */
export function isSupabaseConfiguredServer(): boolean {
  const url = supabaseUrl();
  const anon = getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY") || "";
  return Boolean(url && anon && !url.includes("your-project-id"));
}

/** Anon-key client used only to verify a user's password. Never persists a session. */
export function getAnonClient(): SupabaseClient | null {
  if (!isSupabaseConfiguredServer()) return null;
  const anon = getEnv("SUPABASE_ANON_KEY") || getEnv("VITE_SUPABASE_ANON_KEY") || "";
  return createClient(supabaseUrl(), anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Service-role client. Bypasses RLS — keep it strictly on the server. */
export function getAdminClient(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key || url.includes("your-project-id")) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// ─── Code generation + hashing ───────────────────────────────────────────────
export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

function hmacSecret(): string {
  const secret = getEnv("OTP_HMAC_SECRET") || getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (secret) return secret;
  if (isProduction()) {
    throw new Error("OTP_HMAC_SECRET is not configured");
  }
  return "dev-only-otp-secret";
}

export function hashOtp(email: string, code: string): string {
  return createHmac("sha256", hmacSecret()).update(`${email}:${code}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

// ─── In-memory fallback (development only) ───────────────────────────────────
type MemRecord = { hash: string; expiresAt: number; attempts: number; createdAt: number };
const memStore = new Map<string, MemRecord>();
const memSends = new Map<string, number[]>();

export type StoreResult =
  | { ok: true; discard: () => Promise<void> }
  | { ok: false; status: number; error: string; retryAfterSeconds?: number };

/** True when OTPs can be stored (DB, or memory in non-production). */
export function otpStorageAvailable(): boolean {
  return Boolean(getAdminClient()) || !isProduction();
}

export async function storeOtp(input: {
  email: string;
  phone?: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<StoreResult> {
  const { email, phone, purpose, code } = input;
  const admin = getAdminClient();

  if (!admin) {
    if (isProduction()) {
      return {
        ok: false,
        status: 503,
        error: "Verification service is not configured. Please contact support.",
      };
    }
    // Development-only in-memory path
    const now = Date.now();
    const sends = (memSends.get(email) ?? []).filter((t) => now - t < 60 * 60 * 1000);
    const last = sends[sends.length - 1];
    if (last !== undefined && now - last < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        status: 429,
        error: "Please wait before requesting another code.",
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - last)) / 1000),
      };
    }
    if (sends.length >= OTP_MAX_SENDS_PER_HOUR) {
      return { ok: false, status: 429, error: "Too many code requests. Try again in an hour." };
    }
    sends.push(now);
    memSends.set(email, sends);
    memStore.set(email, {
      hash: hashOtp(email, code),
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      createdAt: now,
    });
    return { ok: true, discard: async () => void memStore.delete(email) };
  }

  // Database path
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recent, error: recentErr } = await admin
    .from("otp_verification")
    .select("created_at")
    .eq("email", email)
    .gte("created_at", hourAgo)
    .order("created_at", { ascending: false });

  if (recentErr) {
    console.error("[otp] rate-limit lookup failed:", recentErr.message);
    return {
      ok: false,
      status: 503,
      error: "Verification service is temporarily unavailable. Please try again shortly.",
    };
  }

  const rows = (recent ?? []) as Array<{ created_at: string }>;
  const latest = rows[0];
  if (latest) {
    const age = Date.now() - new Date(latest.created_at).getTime();
    if (age < OTP_RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        status: 429,
        error: "Please wait before requesting another code.",
        retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - age) / 1000),
      };
    }
  }
  if (rows.length >= OTP_MAX_SENDS_PER_HOUR) {
    return { ok: false, status: 429, error: "Too many code requests. Try again in an hour." };
  }

  // Invalidate any earlier unused codes for this email so only the newest works.
  await admin
    .from("otp_verification")
    .update({ is_verified: true })
    .eq("email", email)
    .eq("is_verified", false);

  const { data: inserted, error: insertErr } = await admin
    .from("otp_verification")
    .insert({
      email,
      phone: phone || null,
      purpose,
      otp: hashOtp(email, code),
      attempts: 0,
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      is_verified: false,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    console.error("[otp] insert failed:", insertErr?.message);
    return {
      ok: false,
      status: 503,
      error: "Could not create a verification code. Please try again shortly.",
    };
  }

  // Best-effort housekeeping of old rows.
  try {
    await admin
      .from("otp_verification")
      .delete()
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  } catch {
    /* ignore */
  }

  const id = (inserted as { id: string }).id;
  return {
    ok: true,
    discard: async () => {
      await admin.from("otp_verification").delete().eq("id", id);
    },
  };
}

export type CheckResult = { valid: true } | { valid: false; status: number; message: string };

export async function checkOtp(emailRaw: string, codeRaw: string): Promise<CheckResult> {
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim().replace(/\D/g, "");
  if (code.length !== 6) {
    return { valid: false, status: 400, message: "Enter the 6-digit verification code." };
  }

  const admin = getAdminClient();

  if (!admin) {
    if (isProduction()) {
      return {
        valid: false,
        status: 503,
        message: "Verification service is not configured. Please contact support.",
      };
    }
    const rec = memStore.get(email);
    if (!rec) {
      return { valid: false, status: 400, message: "No active code. Please request a new one." };
    }
    if (Date.now() > rec.expiresAt) {
      memStore.delete(email);
      return { valid: false, status: 400, message: "This code has expired. Please request a new one." };
    }
    if (rec.attempts >= OTP_MAX_ATTEMPTS) {
      memStore.delete(email);
      return {
        valid: false,
        status: 429,
        message: "Too many incorrect attempts. Please request a new code.",
      };
    }
    if (!safeEqualHex(rec.hash, hashOtp(email, code))) {
      rec.attempts += 1;
      return {
        valid: false,
        status: 400,
        message: `Incorrect code. ${OTP_MAX_ATTEMPTS - rec.attempts} attempts remaining.`,
      };
    }
    memStore.delete(email);
    return { valid: true };
  }

  const { data, error } = await admin
    .from("otp_verification")
    .select("id, otp, expires_at, attempts")
    .eq("email", email)
    .eq("is_verified", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[otp] verify lookup failed:", error.message);
    return {
      valid: false,
      status: 503,
      message: "Verification service is temporarily unavailable. Please try again shortly.",
    };
  }

  const rec = (data ?? [])[0] as
    | { id: string; otp: string; expires_at: string; attempts: number | null }
    | undefined;
  if (!rec) {
    return { valid: false, status: 400, message: "No active code. Please request a new one." };
  }
  if (new Date(rec.expires_at).getTime() < Date.now()) {
    return { valid: false, status: 400, message: "This code has expired. Please request a new one." };
  }
  const attempts = rec.attempts ?? 0;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    return {
      valid: false,
      status: 429,
      message: "Too many incorrect attempts. Please request a new code.",
    };
  }

  if (!safeEqualHex(rec.otp, hashOtp(email, code))) {
    await admin
      .from("otp_verification")
      .update({ attempts: attempts + 1 })
      .eq("id", rec.id);
    return {
      valid: false,
      status: 400,
      message: `Incorrect code. ${Math.max(0, OTP_MAX_ATTEMPTS - attempts - 1)} attempts remaining.`,
    };
  }

  await admin.from("otp_verification").update({ is_verified: true }).eq("id", rec.id);
  return { valid: true };
}

// ─── Admin allowlist ─────────────────────────────────────────────────────────
/**
 * Admin accounts are invitation-only. An email may register as admin only if it exists in
 * `public.admin_allowlist` (managed via the Supabase SQL editor / service role).
 * Returns true/false, or null when the allowlist cannot be checked (no service-role key).
 */
export async function isAdminEmailAllowed(emailRaw: string): Promise<boolean | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("admin_allowlist")
    .select("email")
    .eq("email", emailRaw.trim().toLowerCase())
    .limit(1);
  if (error) {
    console.error("[otp] admin allowlist lookup failed:", error.message);
    return null;
  }
  return (data ?? []).length > 0;
}
