const fetch = require("node-fetch");

async function sendEmail(to, otp, expiryMinutes = 1) {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          user_email: to,
          otp: otp,
          expiry: expiryMinutes
        }
      }),
    });

    if (!response.ok) throw new Error("EmailJS request failed");

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error("Email failed to send");
  }
}

module.exports = sendEmail;
