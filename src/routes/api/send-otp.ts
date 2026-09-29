import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env.server";
import {
  generateOtp,
  getAnonClient,
  isAdminEmailAllowed,
  isProduction,
  isSupabaseConfiguredServer,
  storeOtp,
  type OtpPurpose,
} from "@/lib/otp.server";

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
}

function getMailTransporter() {
  const smtpHost = getEnv("SMTP_HOST");
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASS");
  const gmailUser = getEnv("GMAIL_USER");
  const gmailPass = getEnv("GMAIL_APP_PASS");

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: Number(getEnv("SMTP_PORT") || 587),
      secure: getEnv("SMTP_SECURE") === "true" || getEnv("SMTP_PORT") === "465",
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
  }

  return null;
}

/**
 * Dispatches 6-digit OTP via configured SMS Gateway:
 * - Fast2SMS (India)
 * - Twilio (Global)
 * - MSG91 (India)
 * - Textlocal (India/Global)
 */
async function sendSmsOtp(
  phone: string,
  otpCode: string
): Promise<{ sent: boolean; provider?: string; error?: string; message?: string }> {
  if (!phone || phone.trim().length < 6) {
    return { sent: false, error: "No phone number provided" };
  }

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const fast2smsKey = getEnv("FAST2SMS_API_KEY");
  const twilioSid = getEnv("TWILIO_ACCOUNT_SID");
  const twilioToken = getEnv("TWILIO_AUTH_TOKEN");
  const twilioFrom = getEnv("TWILIO_PHONE_NUMBER");
  const msg91Key = getEnv("MSG91_AUTH_KEY");
  const msg91Template = getEnv("MSG91_TEMPLATE_ID");
  const textlocalKey = getEnv("TEXTLOCAL_API_KEY");

  // 1. Fast2SMS (Popular in India - Supports route=otp and route=q Quick SMS)
  if (fast2smsKey) {
    try {
      const tenDigit = cleanPhone.slice(-10);
      const message = `Your Legal Consultancy verification OTP is ${otpCode}. Valid for 5 minutes.`;

      // 1a. Try standard OTP route
      const otpUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
        fast2smsKey
      )}&route=otp&variables_values=${encodeURIComponent(otpCode)}&numbers=${encodeURIComponent(
        tenDigit
      )}`;
      let res = await fetch(otpUrl, {
        method: "GET",
        headers: { authorization: fast2smsKey },
      });
      let data = await res.json();

      // 1b. If route=otp returns non-success, fallback to route=q (Quick SMS)
      if (!data.return) {
        const quickUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(
          fast2smsKey
        )}&route=q&message=${encodeURIComponent(message)}&language=english&numbers=${encodeURIComponent(
          tenDigit
        )}`;
        res = await fetch(quickUrl, {
          method: "GET",
          headers: { authorization: fast2smsKey },
        });
        data = await res.json();
      }

      console.log("[Fast2SMS] Response:", data && (data.return ?? data.status ?? "received"));
      return {
        sent: Boolean(data.return),
        provider: "Fast2SMS",
        message: data.message
          ? Array.isArray(data.message)
            ? data.message.join(", ")
            : String(data.message)
          : "SMS dispatched via Fast2SMS",
      };
    } catch (err: any) {
      console.error("[Fast2SMS] Error:", err?.message);
    }
  }

  // 2. Twilio (Global SMS API)
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const formattedTo = phone.startsWith("+")
        ? phone
        : `+${cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone}`;
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams({
        From: twilioFrom,
        To: formattedTo,
        Body: `Your Legal Consultancy Service verification OTP is ${otpCode}. Valid for 5 minutes.`,
      });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      const data = await res.json();
      console.log("[Twilio SMS] Response:", data && (data.return ?? data.status ?? "received"));
      return { sent: res.ok, provider: "Twilio", message: res.ok ? "SMS dispatched via Twilio" : "Twilio rejected the request" };
    } catch (err: any) {
      console.error("[Twilio SMS] Error:", err?.message);
    }
  }

  // 3. MSG91 (India)
  if (msg91Key && msg91Template) {
    try {
      const targetNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
        msg91Template
      )}&mobile=${encodeURIComponent(targetNumber)}&authkey=${encodeURIComponent(
        msg91Key
      )}&otp=${encodeURIComponent(otpCode)}`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      console.log("[MSG91 SMS] Response:", data && (data.return ?? data.status ?? "received"));
      return { sent: res.ok, provider: "MSG91", message: res.ok ? "SMS dispatched via MSG91" : "MSG91 rejected the request" };
    } catch (err: any) {
      console.error("[MSG91 SMS] Error:", err?.message);
    }
  }

  // 4. Textlocal (India)
  if (textlocalKey) {
    try {
      const targetNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const msg = encodeURIComponent(`Your Legal Consultancy OTP is ${otpCode}`);
      const url = `https://api.textlocal.in/send/?apikey=${encodeURIComponent(
        textlocalKey
      )}&numbers=${encodeURIComponent(targetNumber)}&message=${msg}&sender=TXTLCL`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      console.log("[Textlocal] Response:", data && (data.return ?? data.status ?? "received"));
      return { sent: res.ok, provider: "Textlocal", message: res.ok ? "SMS dispatched via Textlocal" : "Textlocal rejected the request" };
    } catch (err: any) {
      console.error("[Textlocal] Error:", err?.message);
    }
  }

  console.log("[SMS Gateway] No SMS provider configured; skipping SMS.");
  return {
    sent: false,
    provider: "Simulated",
    message: "SMS Gateway ready (add FAST2SMS_API_KEY or TWILIO credentials in .env to activate live SMS)",
  };
}

export const Route = createFileRoute("/api/send-otp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: {
            email?: string;
            phone?: string;
            password?: string;
            role?: string;
            type?: string;
          };
          try {
            body = (await request.json()) as typeof body;
          } catch {
            return json({ error: "Invalid request body." }, 400);
          }

          // NOTE: any client-supplied `code` is deliberately ignored. Codes are server-generated only.
          const { email, phone, password, role, type } = body;
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim())) {
            return json({ error: "Enter a valid email address, for example name@example.com." }, 400);
          }

          const cleanEmail = email.trim().toLowerCase();
          const cleanPhone = (phone || "").trim().slice(0, 25);
          const isRegister = type === "register" || type === "registration";
          const purpose: OtpPurpose = isRegister ? "register" : "login";

          // 1. Admin accounts are invitation-only (checked against public.admin_allowlist).
          if (isRegister && role === "admin" && (isSupabaseConfiguredServer() || isProduction())) {
            const allowed = await isAdminEmailAllowed(cleanEmail);
            if (allowed !== true) {
              return json(
                {
                  error:
                    "Administrator accounts are created by invitation only. Ask an existing administrator to add your email.",
                },
                403,
              );
            }
          }

          // 2. Login: verify the password on the server before any code is sent.
          if (!isRegister && isSupabaseConfiguredServer()) {
            if (!password) {
              return json({ error: "Password is required." }, 400);
            }
            const anon = getAnonClient();
            if (anon) {
              const { error: authErr } = await anon.auth.signInWithPassword({
                email: cleanEmail,
                password: String(password),
              });
              if (authErr) {
                return json({ error: "Invalid email or password. Please check your credentials." }, 401);
              }
            }
          }

          // 3. Generate + store a hashed, single-use code (rate limited).
          const code = generateOtp();
          const stored = await storeOtp({
            email: cleanEmail,
            ...(cleanPhone ? { phone: cleanPhone } : {}),
            purpose,
            code,
          });
          if (!stored.ok) {
            return json(
              {
                error: stored.error,
                ...(stored.retryAfterSeconds ? { retryAfterSeconds: stored.retryAfterSeconds } : {}),
              },
              stored.status,
              stored.retryAfterSeconds ? { "Retry-After": String(stored.retryAfterSeconds) } : {},
            );
          }

          // 4. Deliver by email.
          const transporter = getMailTransporter();
          const emailSubject = isRegister ? "Account Verification Code" : "Login Verification Code";
          const senderEmail = getEnv("SMTP_FROM_EMAIL") || getEnv("GMAIL_USER") || getEnv("SMTP_USER") || "no-reply@legalconsultancy.in";

          if (!transporter) {
            // Local development convenience only: print the code to the SERVER console.
            if (!isProduction() && getEnv("OTP_DEV_LOG") === "true") {
              console.log(`[OTP DEV] Code for ${cleanEmail}: ${code} (OTP_DEV_LOG=true, development only)`);
              return json({
                success: true,
                message: "Development mode: code printed in the server console.",
                emailSent: true,
                smsSent: false,
                expiresInSeconds: 300,
              });
            }
            await stored.discard();
            return json(
              {
                error:
                  "Email OTP is not configured. Set GMAIL_USER + GMAIL_APP_PASS (or SMTP_HOST/SMTP_USER/SMTP_PASS) on the server.",
                emailSent: false,
              },
              503,
            );
          }

          try {
            await transporter.sendMail({
              from: `"Legal Consultancy Service" <${senderEmail}>`,
              to: cleanEmail,
              subject: emailSubject,
              text: `Your OTP is: ${code}\nValid for 5 minutes. If you did not request this, you can ignore this email.`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
                  <h2 style="color: #0f172a; margin-top: 0;">${emailSubject}</h2>
                  <p style="color: #334155; font-size: 16px; margin-bottom: 8px;">Your verification OTP is:</p>
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; padding: 12px 0; font-family: monospace;">${code}</div>
                  <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Valid for 5 minutes. Never share this code with anyone.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">Legal Consultancy Service Security</p>
                </div>
              `,
            });
          } catch (mailErr: unknown) {
            const msg = mailErr instanceof Error ? mailErr.message : String(mailErr);
            console.error("[2FA OTP Route] Mail send error:", msg);
            await stored.discard();
            return json(
              { error: "Could not deliver the verification email. Please try again in a moment.", emailSent: false },
              502,
            );
          }

          // 5. Optional SMS (never blocks the flow).
          let smsResult: { sent: boolean; provider?: string } = { sent: false, provider: "none" };
          if (cleanPhone) {
            try {
              smsResult = await sendSmsOtp(cleanPhone, code);
            } catch (smsErr) {
              console.error("[2FA OTP Route] SMS error:", smsErr instanceof Error ? smsErr.message : smsErr);
            }
          }

          return json({
            success: true,
            message: smsResult.sent
              ? `OTP sent to email (${cleanEmail}) and mobile`
              : `OTP sent to email (${cleanEmail})`,
            emailSent: true,
            smsSent: smsResult.sent,
            ...(smsResult.provider ? { smsProvider: smsResult.provider } : {}),
            expiresInSeconds: 300,
          });
        } catch (err: unknown) {
          console.error("[2FA OTP Route Error]:", err instanceof Error ? err.message : err);
          return json({ error: "Failed to process the OTP request. Please try again." }, 500);
        }
      },
    },
  },
});
