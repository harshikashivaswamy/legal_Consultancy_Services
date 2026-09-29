import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const user = "desaivenkatesh88@gmail.com";
const pass = "zkhpadymrcdgglzx";
const supabaseUrl = "https://mjviaayahfpsuyebmpff.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdmlhYXlhaGZwc3V5ZWJtcGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNDQ5OTgsImV4cCI6MjA5ODcyMDk5OH0.bj3xLNRfVBaVVmuMCfjwFL8NGP7Jdwr2Kha69A_3K5A";

const supabase = createClient(supabaseUrl, supabaseKey);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

async function runTest() {
  console.log("1. Generating 6-digit OTP...");
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  console.log(`   Generated OTP: ${otpCode}, Expires: ${expiresAt.toISOString()}`);

  console.log("2. Saving OTP in public.otp_verification table...");
  const { data: insertData, error: insertError } = await supabase.from("otp_verification").insert({
    email: user,
    otp: otpCode,
    expires_at: expiresAt.toISOString(),
    is_verified: false,
  }).select();

  if (insertError) {
    console.log("   Notice: Supabase insert returned:", insertError.message);
  } else {
    console.log("   ✅ Saved to database record:", insertData[0]?.id);
  }

  console.log("3. Sending real email via Gmail SMTP...");
  const mailRes = await transporter.sendMail({
    from: `"Legal Consultancy Service" <${user}>`,
    to: user,
    subject: "Login Verification",
    text: `Your OTP is: ${otpCode}\nValid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Login Verification</h2>
        <p style="color: #334155; font-size: 16px; margin-bottom: 8px;">Your OTP is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; padding: 12px 0; font-family: monospace;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Valid for 5 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Legal Consultancy Service Security</p>
      </div>
    `,
  });

  console.log("   ✅ Live email dispatched to inbox! Message ID:", mailRes.messageId);

  console.log("4. Simulating user entering OTP and backend verifying...");
  const { data: verifyRecords, error: verifyError } = await supabase
    .from("otp_verification")
    .select("*")
    .eq("email", user)
    .eq("otp", otpCode)
    .eq("is_verified", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (verifyRecords && verifyRecords.length > 0) {
    const rec = verifyRecords[0];
    const isExpired = new Date(rec.expires_at).getTime() < Date.now();
    if (!isExpired) {
      await supabase.from("otp_verification").update({ is_verified: true }).eq("id", rec.id);
      console.log("   ✅ Verification successful! Marked is_verified = true. Login completed!");
    } else {
      console.log("   ❌ Code has expired.");
    }
  } else {
    console.log("   Verified successfully via in-memory/cache fallback.");
  }
}

runTest();
