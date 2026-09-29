/**
 * Client-side OTP helpers.
 *
 * All OTP generation, storage and verification happens on the SERVER (/api/send-otp and
 * /api/verify-otp). The browser never sees a code and never reads the OTP table.
 */

export interface OtpVerificationRecord {
  id?: string;
  user_id?: string | null;
  email: string;
  phone?: string | null;
  otp: string;
  expires_at: string;
  is_verified: boolean;
  created_at?: string;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Asks the server to email (and optionally SMS) a 6-digit verification code.
 * For logins the server also verifies the password first.
 * Throws an Error with a user-friendly message on any failure.
 */
export async function sendEmailOtp(
  email: string,
  role?: string,
  _userId?: string,
  password?: string,
  type?: "login" | "register",
  phone?: string
): Promise<{
  success: boolean;
  message: string;
  emailSent?: boolean;
  smsSent?: boolean;
  smsProvider?: string;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = (phone || "").trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  let res: Response;
  try {
    res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        phone: cleanPhone,
        password,
        role,
        type,
      }),
      signal: controller.signal,
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await readJson(res);

  if (!res.ok || !data["emailSent"]) {
    const message =
      typeof data["error"] === "string" && data["error"]
        ? data["error"]
        : "The verification email could not be delivered. Please try again.";
    throw new Error(message);
  }

  return {
    success: true,
    emailSent: true,
    smsSent: Boolean(data["smsSent"]),
    ...(typeof data["smsProvider"] === "string" ? { smsProvider: data["smsProvider"] } : {}),
    message:
      typeof data["message"] === "string" ? data["message"] : `Verification code sent to ${cleanEmail}`,
  };
}

/** Verifies the 6-digit code entered by the user, on the server. */
export async function verifyEmailOtp(
  email: string,
  enteredCode: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = enteredCode.trim().replace(/\D/g, "");

  if (cleanCode.length !== 6) {
    return { success: false, message: "Please enter a valid 6-digit verification code." };
  }

  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
    });
    const data = await readJson(res);

    if (res.ok && data["valid"] === true) {
      return { success: true, message: "Account verification confirmed!" };
    }
    return {
      success: false,
      message:
        typeof data["message"] === "string" && data["message"]
          ? data["message"]
          : "Invalid or expired verification code. Please check your email and try again.",
    };
  } catch {
    return {
      success: false,
      message: "Could not reach the server to verify the code. Please try again.",
    };
  }
}
