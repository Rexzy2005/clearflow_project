const nodemailer = require('nodemailer');

async function sendEmail(to, subject, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `"ClearFlow" <${process.env.NODE_CODE_SENDING_EMAIL_ADDRESS}>`,
    to,
    subject,
    text: `Your OTP is: ${otp}`, 
    html: `<h2>ClearFlow Verification</h2>
           <p>Your OTP code is: <b>${otp}</b></p>
           <p>This code expires in 1 minutes.</p>`
  });
}

module.exports = sendEmail;
