import { createFileRoute } from "@tanstack/react-router";
import { checkOtp } from "@/lib/otp.server";

const JSON_HEADERS = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export const Route = createFileRoute("/api/verify-otp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          let body: { email?: string; code?: string };
          try {
            body = (await request.json()) as typeof body;
          } catch {
            return json({ valid: false, success: false, message: "Invalid request body." }, 400);
          }

          const { email, code } = body;
          if (!email || !code) {
            return json({ valid: false, success: false, message: "Email and code are required." }, 400);
          }

          // Fails closed: anything other than an exact, unexpired, single-use match is rejected.
          const result = await checkOtp(String(email), String(code));
          if (result.valid) {
            return json({ valid: true, success: true, message: "Verification successful." });
          }
          return json({ valid: false, success: false, message: result.message }, result.status);
        } catch (err: unknown) {
          console.error("[Verify OTP Route Error]:", err instanceof Error ? err.message : err);
          return json(
            { valid: false, success: false, message: "Could not verify the code. Please try again." },
            500,
          );
        }
      },
    },
  },
});
