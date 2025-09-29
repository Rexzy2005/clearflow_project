const nodemailer = require("nodemailer");

async function sendEmail(to, otp, expiryMinutes = 1) {
  try {
    // Create transporter for Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,   // "smtp.gmail.com"
      port: process.env.SMTP_PORT,   // 465
      secure: true,                  // ✅ true for 465
      auth: {
        user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS, // your Gmail
        pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD, // app password
      },
    });

    const mailOptions = {
      from: `"Clearflow Project" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
      to,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in ${expiryMinutes} minute(s).`,
      html: `
        <p>Your OTP code is:</p>
        <h2>${otp}</h2>
        <p>This code will expire in <strong>${expiryMinutes}</strong> minute(s).</p>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`, info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw err;
  }
}

module.exports = sendEmail;
