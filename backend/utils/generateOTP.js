module.exports = function generateOTP() {
  // generate a 4-digit numeric OTP
  return Math.floor(1000 + Math.random() * 9000).toString();
};
