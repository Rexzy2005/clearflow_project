const backend_URL = "https://clearflow-project.onrender.com";

// -------------------- Utilities --------------------
function setHint(id, message, success = false) {
  const hint = document.getElementById(id);
  if (!hint) return;
  hint.textContent = message;
  hint.style.color = success ? "green" : "red";
  hint.style.display = "block";

  const inputGroup = hint.closest(".input-group");
  let target = inputGroup ? inputGroup.querySelector("input") : null;

  if (target && target.parentElement.classList.contains("password-input")) {
    target = target.parentElement.querySelector("input");
  }

  if (target) target.style.border = success ? "1px solid green" : "1px solid red";

  setTimeout(() => {
    if (target) target.style.border = "";
    hint.style.display = "none";
  }, 3000); // ⬅ Extended to 3s
}

function clearFormInputs(form) {
  const inputs = form.querySelectorAll("input[type='text'],[type='email'],[type='password'], [type='number']");
  inputs.forEach(input => {
    input.value = "";
    input.style.border = "";
  });
}

function showModal(title, message, callback) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-box">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="row">
        <button id="modal-ok">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function closeModal() {
    modal.remove();
    if (callback) callback();
  }

  document.getElementById("modal-ok").onclick = closeModal;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  }, { once: true });
}

function setButtonLoading(btn, action = "set", text = "Processing...") {
  if (!btn) return;
  if (action === "set") {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add("loading");
    btn.innerHTML = `<div class="spinner"></div><span>${text}</span>`;
    btn.style.cursor = "not-allowed";
    btn.style.pointerEvents = "none";
  } else if (action === "reset") {
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = btn.dataset.originalText || "Submit";
    btn.style.cursor = "pointer"; 
    btn.style.pointerEvents = "auto";
  }
}

// -------------------- Password Eye Toggle --------------------
document.querySelectorAll(".toggle-password").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const wrapper = toggle.closest(".password-input") || toggle.parentElement;
    if (!wrapper) return;
    const input = wrapper.querySelector("input[type='password'], input[type='text']");
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      toggle.classList.add("fa-eye-slash");
      toggle.classList.remove("fa-eye");
    } else {
      input.type = "password";
      toggle.classList.add("fa-eye");
      toggle.classList.remove("fa-eye-slash");
    }
  });
});

// -------------------- OTP CONTEXT --------------------
function setOtpContext(ctx, identifier = "") {
  localStorage.setItem("otpContext", ctx);
  if (identifier) localStorage.setItem("otpIdentifier", identifier);
}
function getOtpContext() {
  return localStorage.getItem("otpContext") || "";
}
function getOtpIdentifier() {
  return localStorage.getItem("otpIdentifier") || "";
}
function clearOtpContext() {
  localStorage.removeItem("otpContext");
  localStorage.removeItem("otpIdentifier");
}
function getOtpEmail() {
  const ctx = getOtpContext();
  if (ctx === "signup") return localStorage.getItem("signupEmail") || "";
  if (ctx === "forgot-password") return localStorage.getItem("femail") || "";
  if (ctx === "profile-update") return getOtpIdentifier();
  return "";
}

// -------------------- SIGNUP --------------------
const signupForm = document.getElementById("signup");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("signupBtn");
    setButtonLoading(btn, "set", "Processing...");

    const fname = document.getElementById("fname")?.value.trim();
    const lname = document.getElementById("lname")?.value.trim();
    const username = document.getElementById("username")?.value.trim();
    const email = document.getElementById("signupEmail")?.value.trim();
    const password = document.getElementById("signupPassword")?.value;
    const confirmPassword = document.getElementById("signupConfirmPassword")?.value;
    const accept = document.getElementById("accept")?.checked;

    let valid = true;
    if (!fname) { setHint("fname-hint", "First name required"); valid = false; }
    if (!lname) { setHint("lname-hint", "Last name required"); valid = false; }
    if (!username) { setHint("uname-hint", "Username required"); valid = false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setHint("signUpEmail-hint", "Enter a valid email"); valid = false; }
    if (!password) { setHint("signUpPassword-hint", "Password required"); valid = false; }
    if (!confirmPassword) { setHint("signupConfirmPassword-hint", "Confirm password"); valid = false; }

    if (password && (
      password.length < 6 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    )) {
      setHint("signUpPassword-hint", "Password must be 6+ chars, include uppercase, number & special char");
      valid = false;
    }

    if (password !== confirmPassword) { setHint("signupConfirmPassword-hint", "Passwords do not match"); valid = false; }
    if (!accept) { setHint("accept-hint", "You must agree to terms"); valid = false; }

    if (!valid) { setButtonLoading(btn, "reset"); return; }

    try {
      const res = await fetch(`${backend_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname: fname, lastname: lname, username, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("signupEmail", email);
        setOtpContext("signup", email);
        showModal("Success", "OTP sent to your email.", () => {
          window.location.href = "otp.html";
        });
      } else {
        showModal("Error", data.message || "Signup failed");
      }
    } catch {
      showModal("Error", "Error connecting to server.");
    } finally {
      setButtonLoading(btn, "reset");
    }
  });
}

// -------------------- OTP PAGE --------------------
const otpForm = document.getElementById("otp");
let otpInterval = null;

if (window.location.pathname.includes("otp.html")) {
  const ctx = getOtpContext();
  const email = getOtpEmail();
  if (!ctx || !email) window.location.href = "login.html";
}

if (otpForm) {
  const otpInputs = otpForm.querySelectorAll("input");
  otpInputs.forEach((box, idx, arr) => {
    box.setAttribute("maxlength", 1);
    box.addEventListener("input", () => {
      if (box.value.length > 1) box.value = box.value.slice(-1);
      if (box.value && idx < arr.length - 1) arr[idx + 1].focus();

      // ⬅ Auto-submit when all fields filled
      if (Array.from(arr).every(i => i.value)) {
        otpForm.requestSubmit();
      }
    });
    box.addEventListener("keydown", e => {
      if (e.key === "Backspace" && !box.value && idx > 0) arr[idx - 1].focus();
    });
    box.addEventListener("paste", e => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text").replace(/\s/g, '').slice(0, arr.length);
      pasteData.split('').forEach((char, i) => { if (arr[i]) arr[i].value = char; });
    });
  });

  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("otpBtn");
    setButtonLoading(btn, "set", "Verifying...");

    const otp = Array.from(otpInputs).map(i => i.value).join("");
    if (otp.length !== otpInputs.length) {
      otpInputs.forEach(i => { if (!i.value) i.style.border = "1px solid red"; });
      setButtonLoading(btn, "reset");
      return;
    }

    const email = getOtpEmail();
    try {
      const res = await fetch(`${backend_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();

      if (res.ok) {
        otpInputs.forEach(i => i.style.border = "1px solid green");

        const ctx = getOtpContext();
        if (ctx === "signup") {
          showModal("OTP Verified", "You can now login.", () => {
            clearOtpContext();
            window.location.href = "login.html";
          });
        } else if (ctx === "forgot-password") {
          showModal("OTP Verified", "You can now reset your password.", () => {
            clearOtpContext();
            window.location.href = "new-password.html";
          });
        } else if (ctx === "profile-update") {
          showModal("OTP Verified", "Identity confirmed. Proceed with your changes.", () => {
            clearOtpContext();
            localStorage.setItem("openSettings", "true");
            window.location.href = "dashboard.html";
          });
        }

        clearFormInputs(otpForm);
        sessionStorage.removeItem("otpTimeLeft");
        if (otpInterval) clearInterval(otpInterval);
      } else {
        setHint("otp-hint", data.message || "Invalid OTP");
      }
    } catch {
      setHint("otp-hint", "Error connecting to server");
    } finally { setButtonLoading(btn, "reset"); }
  });

  startOtpTimer(60);
}

// -------------------- OTP TIMER --------------------
function startOtpTimer(initialSec = 60) {
  const timerEl = document.getElementById("otp-countdown");
  const resendEl = document.getElementById("resend-otp");
  const resendText = document.querySelector('.send-again');
  if (!timerEl || !resendEl) return;

  let time = initialSec;
  const savedTime = sessionStorage.getItem("otpTimeLeft");
  if (savedTime) { const parsed = parseInt(savedTime, 10); if (!isNaN(parsed) && parsed > 0) time = parsed; }

  if (resendText) resendText.style.display = "none";
  if (otpInterval) clearInterval(otpInterval);

  timerEl.textContent = `${time}s`;
  otpInterval = setInterval(() => {
    time--;
    if (time > 0) {
      timerEl.textContent = `${time}s`;
      sessionStorage.setItem("otpTimeLeft", time);
    } else {
      clearInterval(otpInterval);
      otpInterval = null;
      timerEl.textContent = "Expired";
      if (resendText) resendText.style.display = "block";
      sessionStorage.removeItem("otpTimeLeft");
    }
  }, 1000);

  resendEl.onclick = async (e) => {
    e.preventDefault();
    resendEl.disabled = true;
    const email = getOtpEmail();
    if (!email) { showModal("Error", "No identifier found to resend OTP."); resendEl.disabled = false; return; }

    try {
      const res = await fetch(`${backend_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("otpTimeLeft", initialSec);
        if (resendText) resendText.style.display = "none";
        showModal("Resent", "A new OTP has been sent.", () => { startOtpTimer(initialSec); });
      } else {
        showModal("Error", data.message || "Could not resend OTP");
      }
    } catch {
      showModal("Error", "Network error while resending OTP");
    } finally { resendEl.disabled = false; }
  };
}

// -------------------- LOGIN --------------------
const loginForm = document.getElementById("login");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("siginBtn");
    setButtonLoading(btn, "set", "Logging in...");

    const email = document.getElementById("lemail")?.value.trim();
    const password = document.getElementById("lpassword")?.value;

    if (!/^\S+@\S+\.\S+$/.test(email)) { setHint("loginEmail-hint", "Enter a valid email"); setButtonLoading(btn, "reset"); return; }
    if (!password) { setHint("loginPass-hint", "Password required"); setButtonLoading(btn, "reset"); return; }

    try {
      const res = await fetch(`${backend_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));

        localStorage.setItem("toastMessage", JSON.stringify({
          text: `Login Successful! Welcome back, ${data.user.username}.`,
          type: "success"
        }));
        clearFormInputs(loginForm);
        window.location.href = "dashboard.html";
      } else {
        showModal("Login Failed", data.message || "Invalid credentials");
      }
    } catch {
      showModal("Error", "Error connecting to server");
    } finally { setButtonLoading(btn, "reset"); }
  });
}

// -------------------- FORGOT PASSWORD --------------------
const forgotForm = document.getElementById("fogottenpassword");
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("resetPassBtn");
    setButtonLoading(btn, "set", "Processing...");

    const email = document.getElementById("femail")?.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setHint("femail-hint", "Enter a valid email"); setButtonLoading(btn, "reset"); return; }

    try {
      const res = await fetch(`${backend_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("femail", email);
        setOtpContext("forgot-password", email);
        showModal("OTP Sent", "Check your email for the code.", () => { window.location.href = "otp.html"; });
      } else {
        setHint("femail-hint", data.message || "Failed to send reset link");
      }
    } catch {
      setHint("femail-hint", "Error connecting to server");
    } finally { setButtonLoading(btn, "reset"); }
  });
}

// -------------------- RESET PASSWORD --------------------
const resetForm = document.getElementById("resetpassword");
if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("newPassBtn");
    setButtonLoading(btn, "set", "Processing...");

    const email = localStorage.getItem("femail");
    const newPassword = document.getElementById("npassword")?.value;
    const confirmPassword = document.getElementById("cnpassword")?.value;

    if (!newPassword || newPassword.length < 6) { setHint("npass-hint", "Password too short"); setButtonLoading(btn, "reset"); return; }
    if (newPassword !== confirmPassword) { setHint("cnpass-hint", "Passwords do not match"); setButtonLoading(btn, "reset"); return; }

    try {
      const res = await fetch(`${backend_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        showModal("Password Reset", "Please login with your new password.", () => window.location.href = "login.html");
        clearFormInputs(resetForm);
      } else {
        setHint("cnpass-hint", data.message || "Reset failed");
      }
    } catch {
      setHint("cnpass-hint", "Error connecting to server");
    } finally { setButtonLoading(btn, "reset"); }
  });
}

// -------------------- BACK BUTTON --------------------
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  if (backBtn && !window.location.pathname.includes("otp.html")) {
    backBtn.addEventListener("click", () => {
      if (document.referrer && document.referrer !== window.location.href) window.history.back();
      else window.location.href = "login.html";
    });
  }

  // Auto-open settings after OTP verification
  if (window.location.pathname.includes("dashboard.html")) {
    if (localStorage.getItem("openSettings") === "true") {
      localStorage.removeItem("openSettings");
      if (typeof openSettingsModal === "function") openSettingsModal();
    }
  }
});

// -------------------- AUTH FETCH (token auto-expiry) --------------------
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "login.html"; throw new Error("No token"); }

  options.headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };

  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    showModal("Session Expired", "Please log in again.", () => { window.location.href = "login.html"; });
    throw new Error("Unauthorized");
  }
  return res;
}
