const nodemailer = require("nodemailer");

async function sendEmail(to, otp, expiryMinutes = 1) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
      secure: true, // ✅ 465 requires secure:true
      auth: {
        user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD, // must be App Password
      },
    });

    const mailOptions = {
      from: `"ClearFlow Auth" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
      to,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It expires in ${expiryMinutes} minute(s).`,
      html: `<p>Your OTP is <b>${otp}</b>. It expires in <b>${expiryMinutes} minute(s)</b>.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("📧 Nodemailer response:", {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw err;
  }
}

module.exports = sendEmail;
