const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // since you’re using Gmail
  auth: {
    user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD,
  },
});

async function sendEmail(to, subject, otp) {
  try {
    await transporter.sendMail({
      from: `"ClearFlow" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
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
