import nodemailer from "nodemailer";

const sender = "desaivenkatesh88@gmail.com";
const pass = "zkhpadymrcdgglzx";
const recipient = "venkateshdesai92@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: sender, pass },
});

async function sendTest() {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Sending Account Verification OTP ${otpCode} to ${recipient}...`);

  const info = await transporter.sendMail({
    from: `"Legal Consultancy Service" <${sender}>`,
    to: recipient,
    subject: "Account Verification",
    text: `Your OTP is: ${otpCode}\nValid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Account Verification</h2>
        <p style="color: #334155; font-size: 16px; margin-bottom: 8px;">Hello Vicky Desai,</p>
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

  console.log("SUCCESS! MessageId:", info.messageId);
}

sendTest().catch(console.error);
