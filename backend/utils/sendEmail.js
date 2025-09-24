const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, otp) {
  try {
    await resend.emails.send({
      from: "ClearFlow <onboarding@resend.dev>",
      to,
      subject,
      html: `
        <h2>ClearFlow Verification</h2>
        <p>Your OTP code is: <b>${otp}</b></p>
        <p>This code expires in 1 minute.</p>
      `,
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error("Email failed to send");
  }
}

module.exports = sendEmail;
