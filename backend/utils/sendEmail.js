const fetch = require("node-fetch");

async function sendEmail(to, otp, expiryMinutes = 1) {
  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY, // ✅ FIXED: must be user_id
        template_params: {
          user_email: to,
          otp: otp,
          expiry: expiryMinutes,
        },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("❌ EmailJS request failed:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error(data?.error || `EmailJS request failed with ${response.status}`);
    }

    console.log(`✅ Email sent successfully to ${to}`, data);
    return data;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw err;
  }
}

module.exports = sendEmail;
