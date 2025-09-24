const nodemailer = require("nodemailer");

async function sendEmail(to, subject, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, // true for port 465, false for others
      auth: {
        user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"ClearFlow" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
      to,
      subject,
      text: `Your OTP is: ${otp}`,
      html: `<h2>ClearFlow Verification</h2>
             <p>Your OTP code is: <b>${otp}</b></p>
             <p>This code expires in 1 minute.</p>`,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error("Email failed to send"); // 👈 makes signup stop before saving
  }
}

module.exports = sendEmail;
