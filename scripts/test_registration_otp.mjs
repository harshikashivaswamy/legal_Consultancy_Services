import nodemailer from "nodemailer";

const user = "desaivenkatesh88@gmail.com";
const pass = "zkhpadymrcdgglzx";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

async function testRegistrationOtp() {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const emailSubject = "Account Verification";
  
  console.log(`Sending ${emailSubject} OTP: ${otpCode} to ${user}...`);

  const info = await transporter.sendMail({
    from: `"Legal Consultancy Service" <${user}>`,
    to: user,
    subject: emailSubject,
    text: `Your OTP is: ${otpCode}\nValid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">${emailSubject}</h2>
        <p style="color: #334155; font-size: 16px; margin-bottom: 8px;">Your verification OTP is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7; padding: 12px 0; font-family: monospace;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 14px; margin-top: 8px;">Valid for 5 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Legal Consultancy Service Security</p>
      </div>
    `,
  });

  console.log("✅ Registration OTP Email dispatched successfully! MessageId:", info.messageId);
}

testRegistrationOtp();
