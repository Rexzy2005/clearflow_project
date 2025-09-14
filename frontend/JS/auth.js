// === Backend URL
const backend_URL = "https://clearflow-project.onrender.com";

// ======================== UTILITIES FUNCTIONS =========================
function setHint(id, message, success = false) {
  const hint = document.getElementById(id);
  if (!hint) return;

  hint.textContent = message;
  hint.style.color = success ? "green" : "red";
  hint.style.display = "block";

  const inputGroup = hint.closest(".input-group");
  let target = inputGroup ? inputGroup.querySelector("input") : null;

  if (target && target.parentElement.classList.contains("password-input")) {
    target = target.parentElement;
  }

  if (target) {
    target.style.border = success ? "1px solid green" : "1px solid red";
  }

  setTimeout(() => {
    if (target) target.style.border = "";
    hint.style.display = "none";
  }, 1500);
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
  modal.className = "modal-overlay ";
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
  document.getElementById("modal-ok").onclick = () => {
    modal.remove();
    if (callback) callback();
  };
}

// ======================== AUTH STATE MANAGEMENT =========================
function saveAuthState(sectionId, expirySeconds = 60) {
  const expiryTime = Date.now() + expirySeconds * 1000;
  localStorage.setItem("authState", JSON.stringify({ section: sectionId, expires: expiryTime }));
}

function getAuthState() {
  const state = localStorage.getItem("authState");
  if (!state) return null;
  const { section, expires } = JSON.parse(state);
  if (Date.now() > expires) {
    localStorage.removeItem("authState");
    return null;
  }
  return section;
}

// ======================== SWITCH SECTIONS =========================
function showSection(sectionId) {
  const currentSection = document.querySelector(".form-section[style*='block']")?.id;
  if (currentSection) localStorage.setItem("previousAuthSection", currentSection);

  document.querySelectorAll(".form-section").forEach(f => f.style.display = "none");
  const section = document.getElementById(sectionId);
  if (section) section.style.display = "block";

  saveAuthState(sectionId, 60);

  const backBtn = document.getElementById("back-btn");
  if (backBtn) backBtn.style.display = sectionId === "otp" ? "none" : "grid";
}

// ======================== BACK BUTTON =========================
const backBtn = document.getElementById("back-btn");
if (backBtn) {
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const prevSection = localStorage.getItem("previousAuthSection") || "login";
    showSection(prevSection);
  });
}

// ======================== PASSWORD TOGGLE =========================
document.querySelectorAll(".toggle-password").forEach(toggle => {
  toggle.addEventListener("click", () => {
    const input = toggle.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
    toggle.classList.toggle("fa-eye-slash");
  });
});

// ======================== BUTTON LOADING =========================
function setButtonLoading(btn, action = "set", text = "Processing...") {
  if (action === "set") {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add("loading");
    btn.innerHTML = `<div class="spinner"></div><span>${text}</span>`;
  } else if (action === "reset") {
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = btn.dataset.originalText || "Submit";
  }
}

// ======================== OTP CONTEXT =========================
let otpContext = "";

// ======================== SIGNUP =========================
const signupForm = document.getElementById("signup");
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("signupBtn");
  setButtonLoading(btn, "set", "Processing...");

  const fname = document.getElementById("fname").value.trim();
  const lname = document.getElementById("lname").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("signupConfirmPassword").value;
  const accept = document.getElementById("accept").checked;

  let valid = true;
  if (!fname) { setHint("fname-hint", ""); valid = false; } else { setHint("fname-hint", "", true); }
  if (!lname) { setHint("lname-hint", ""); valid = false; } else { setHint("lname-hint", "", true); }
  if (!username) { setHint("uname-hint", ""); valid = false; } else { setHint("uname-hint", "", true); }
  if (!/^\S+@\S+\.\S+$/.test(email)) { setHint("signUpEmail-hint", ""); valid = false; } else { setHint("signUpEmail-hint", "", true); }
  if (!password) { setHint("signUpPassword-hint", ""); valid = false; } else { setHint("signUpPassword-hint", "", true); }
  if (!confirmPassword) { setHint("signupConfirmPassword-hint", ""); valid = false; } else { setHint("signupConfirmPassword-hint", "", true); }

  if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    setHint("signUpPassword-hint", "Password must be 6+ chars, include uppercase & number"); valid = false;
  } else { setHint("signUpPassword-hint", "", true); }

  if (password !== confirmPassword) { setHint("signupConfirmPassword-hint", ""); valid = false; } else { setHint("signupConfirmPassword-hint", "", true); }
  if (!accept) { setHint("accept-hint", "You must agree to terms"); valid = false; } else { setHint("accept-hint", "", true); }

  if (!valid) { setButtonLoading(btn, "reset"); return; }

  try {
    const res = await fetch(`${backend_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (res.ok) {
      otpContext = "signup";
      showModal("Signup Successful", "OTP sent to your email.", () => {
        showSection("otp");
        startOtpTimer();
      });
    } else if (data.message && data.message.includes("already registered but not verified")) {
      otpContext = "signup";
      showModal("Email Not Verified", "OTP sent to your email.", () => {
        showSection("otp");
        startOtpTimer();
      });
    } else {
      showModal("Error", data.message || "Signup failed");
    }
  } catch (err) {
    console.error(err);
    showModal("Error", "Error connecting to server.");
  } finally {
    setButtonLoading(btn, "reset");
  }
});

// ======================== OTP LOGIC =========================
const otpForm = document.getElementById("otp");
const otpInputs = document.querySelectorAll("#otp input");

otpInputs.forEach((box, idx, arr) => {
  box.setAttribute("maxlength", 1);

  box.addEventListener("input", () => {
    if (box.value.length > 1) box.value = box.value.slice(-1);
    if (box.value && idx < arr.length - 1) arr[idx + 1].focus();
  });

  box.addEventListener("keydown", e => {
    if (e.key === "Backspace" && !box.value && idx > 0) arr[idx - 1].focus();
  });

  box.addEventListener("paste", e => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\s/g, '').slice(0, arr.length);
    pasteData.split('').forEach((char, i) => { if (arr[i]) arr[i].value = char; });
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i].value) { arr[i].focus(); return; }
    }
    arr[arr.length - 1].focus();
  });
});

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("otpBtn");

  const otp = Array.from(otpInputs).map(i => i.value).join("");
  if (otp.length !== otpInputs.length) {
    otpInputs.forEach(i => { if (!i.value) i.style.border = "1px solid red"; });
    return;
  }

  setButtonLoading(btn, "set", "Processing...");

  const email = otpContext === "signup"
    ? document.getElementById("signupEmail").value.trim()
    : document.getElementById("femail").value.trim();

  try {
    const res = await fetch(`${backend_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    if (res.ok) {
      otpInputs.forEach(i => i.style.border = "1px solid green");
      if (otpContext === "signup") {
        showModal("OTP Verified", "You can now login.", () => showSection("login"));
      } else if (otpContext === "forgot-password") {
        showModal("OTP Verified", "You can now reset your password.", () => showSection("resetpassword"));
      }
      clearFormInputs(otpForm);
      sessionStorage.removeItem("otpTimeLeft");
    } else {
      otpInputs.forEach(i => i.style.border = "1px solid red");
      setHint("otp-hint", data.message || "Invalid OTP");
    }
  } catch (err) {
    console.error(err);
    setHint("otp-hint", "Error connecting to server");
  } finally {
    setButtonLoading(btn, "reset");
  }
});

// ======================== OTP TIMER =========================
let otpInterval;
function startOtpTimer() {
  let time = 60;
  const savedTime = sessionStorage.getItem("otpTimeLeft");
  if (savedTime) time = parseInt(savedTime, 10);

  const timerEl = document.getElementById("otp-countdown");
  const resendEl = document.getElementById("resend-otp");
  const resendText = document.querySelector('.send-again');
  resendText.style.display = "none";

  const signupEmail = document.getElementById("signupEmail").value.trim();
  const forgotPassEmail = document.getElementById("femail").value.trim();
  const email = otpContext === "signup" ? signupEmail : forgotPassEmail;

  if (otpInterval) clearInterval(otpInterval);

  otpInterval = setInterval(() => {
    if (time > 0) {
      timerEl.textContent = `${time--}s`;
      sessionStorage.setItem("otpTimeLeft", time);
    } else {
      clearInterval(otpInterval);
      timerEl.textContent = "Expired";
      resendText.style.display = "block";
      sessionStorage.removeItem("otpTimeLeft");
    }
  }, 1000);

  resendEl.onclick = async (e) => {
    e.preventDefault();
    resendText.style.display = "block";
    try {
      await fetch(`${backend_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      showModal("Resent", "A new OTP has been sent.", startOtpTimer);
    } catch {
      showModal("Error", "Could not resend OTP");
    }
  };
}

// ======================== LOGIN =========================
const loginForm = document.getElementById("login");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("siginBtn");
  setButtonLoading(btn, "set", "Logging in...");

  const email = document.getElementById("lemail").value.trim();
  const password = document.getElementById("lpassword").value;

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
      // save toast message in localStorage
      localStorage.setItem("toastMessage", JSON.stringify({
        text: "Login Successful! Welcome back.",
        type: "success"
      }));

      clearFormInputs(loginForm);
      window.location.href = "dashboard.html";
    } else {
      showToast(data.message || "Invalid credentials", {
        type: "error",
        duration: 3000
      });
      setHint("loginPass-hint", data.message || "Invalid credentials");
    }
  } catch (err) {
    console.error(err);
    showToast("Error connecting to server", {
      type: "error",
      duration: 3000
    });
  } finally {
    setButtonLoading(btn, "reset");
  }
});

// ======================== FORGOT PASSWORD =========================
const forgotForm = document.getElementById("fogottenpassword");
forgotForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("resetPassBtn");
  setButtonLoading(btn, "set", "Processing...");

  const email = document.getElementById("femail").value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    setHint("femail-hint", "Enter a valid email");
    setButtonLoading(btn, "reset");
    return;
  }

  try {
    const res = await fetch(`${backend_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (res.ok) {
      otpContext = "forgot-password";
      showModal("OTP Sent", "Check your email for the code.", () => showSection("otp"));
      startOtpTimer();
    } else {
      setHint("femail-hint", data.message || "Failed to send reset link");
    }
  } catch (err) {
    console.error(err);
    setHint("femail-hint", "Error connecting to server");
  } finally {
    setButtonLoading(btn, "reset");
  }
});

// ======================== RESET PASSWORD =========================
const resetForm = document.getElementById("resetpassword");
resetForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("newPassBtn");
  setButtonLoading(btn, "set", "Processing...");

  const email = document.getElementById("femail").value.trim();
  const newPassword = document.getElementById("npassword").value;
  const confirmPassword = document.getElementById("cnpassword").value;

  if (newPassword.length < 6) { setHint("npass-hint", "Password too short"); setButtonLoading(btn, "reset"); return; }
  if (newPassword !== confirmPassword) { setHint("cnpass-hint", "Passwords do not match"); setButtonLoading(btn, "reset"); return; }

  try {
    const res = await fetch(`${backend_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ email, newPassword })
    });

    const data = await res.json();
    if (res.ok) {
      showModal("Password Reset", "Please login with your new password.", () => showSection("login"));
      clearFormInputs(resetForm);
    } else {
      setHint("cnpass-hint", data.message || "Reset failed");
    }
  } catch (err) {
    console.error(err);
    setHint("cnpass-hint", "Error connecting to server");
  } finally {
    setButtonLoading(btn, "reset");
  }
});

// ======================== PAGE LOAD =========================
document.addEventListener("DOMContentLoaded", () => {
  const section = getAuthState() || "signup";
  showSection(section);

  if (document.getElementById("otp").style.display !== "none") {
    startOtpTimer();
  }
});