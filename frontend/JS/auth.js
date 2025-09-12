// === Backend URL
const backend_URL = "https://clearflow-project.onrender.com";

// ======================== UTILITIES FUNCTIONS =========================
// ======================== UTILITIES FUNCTIONS =========================
// Show hints under inputs
function setHint(id, message, success = false) {
  const hint = document.getElementById(id);
  if (!hint) return;

  hint.textContent = message;
  hint.style.color = success ? "green" : "red";
  hint.style.display = "block";

  // find input
  const inputGroup = hint.closest(".input-group");
  let target = inputGroup ? inputGroup.querySelector("input") : null;

  // if inside password wrapper, use the wrapper div instead
  if (target && target.parentElement.classList.contains("password-input")) {
    target = target.parentElement;
  }

  if (target) {
    target.style.border = success ? "1px solid green" : "1px solid red";
  }

  // clear after 1s
  setTimeout(() => {
    if (target) target.style.border = "";
    hint.style.display = "none";
  }, 1500);
}



// clear form input
function clearFormInputs(form) {
  const inputs = form.querySelectorAll("input[type='text'],[type='email'],[type='password'], [type='number']");

  inputs.forEach(input => {
    input.value = "";
    input.style.border = "";
  });
}

// custom modal
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

// Switch between forms
function showSection(sectionId) {
  const currentSection = document.querySelector(".form-section[style*='block']")?.id;
  if (currentSection) localStorage.setItem("previousAuthSection", currentSection);

  document.querySelectorAll(".form-section").forEach(form => {
    form.style.display = "none";
  });

  const section = document.getElementById(sectionId);
  if (section) section.style.display = "block";

  // Save the current section to localStorage
  localStorage.setItem("currentAuthSection", sectionId);

  // Toggle back button visibility
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    if (sectionId === "otp") {
      backBtn.style.display = "none"; // hide back button on OTP screen
    } else {
      backBtn.style.display = "inline-block"; // show back button on other screens
    }
  }
}






// Toggle back button
const backBtn = document.getElementById("back-btn");
if (backBtn) {
  backBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // Go back to previous section
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

// Show signup form by default on first load
document.addEventListener("DOMContentLoaded", () => {
  const lastSection = localStorage.getItem("currentAuthSection") || "signup";
  showSection(lastSection);
});

// loading button
function setButtonLoading(btn, action = "set", text = "Processing...") {
  if (action === "set") {
    btn.dataset.originalText = btn.textContent; // store old text
    btn.disabled = true;
    btn.classList.add("loading");
    btn.innerHTML = `<div class="spinner"></div><span>${text}</span>`;
  } else if (action === "reset") {
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = btn.dataset.originalText || "Submit";
  }
}


// ======================== UTILITIES FUNCTIONS END =========================
// ======================== UTILITIES FUNCTIONS END =========================



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

  if (!fname) { setHint("fname-hint", "", false); valid = false; }
  else { setHint("fname-hint", "", true); }

  if (!lname) { setHint("lname-hint", ""); valid = false; }
  else { setHint("lname-hint", "", true); }

  if (!username) { setHint("uname-hint", ""); valid = false; }
  else { setHint("uname-hint", "", true); }

  if (!/^\S+@\S+\.\S+$/.test(email)) { setHint("signUpEmail-hint", ""); valid = false; }
  else { setHint("signUpEmail-hint", "", true); }

  if (!password) { setHint("signUpPassword-hint", ""); valid = false; }
  else { setHint("uname-hint", "", true); }

  if (!confirmPassword) { setHint("signupConfirmPassword-hint", ""); valid = false; }
  else { setHint("uname-hint", "", true); }

  if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    setHint("signUpPassword-hint", "Password must be 6+ chars, include uppercase & number");
    valid = false;
  } else {
    setHint("signUpPassword-hint", "", true);
  }

  if (password !== confirmPassword) {
    setHint("signupConfirmPassword-hint", "");
    valid = false;
  } else {
    setHint("signupConfirmPassword-hint", "", true);
  }

  if (!accept) { setHint("accept-hint", "You must agree to terms"); valid = false; }
  else { setHint("accept-hint", "", true); }

  if (!valid) {
    setButtonLoading(btn, "reset");
    return;
  }

  try {
    const res = await fetch(`${backend_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (res.ok) {
      otpContext = "signup";
      // ADDED: modal instead of alert
      showModal("Signup Successful", "OTP sent to your email.", () => {
        showSection("otp");
        startOtpTimer();
        // clearFormInputs(signupForm);
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

// ======================== OTP =========================
const otpForm = document.getElementById("otp");
const otpInputs = document.querySelectorAll("#otp input");

// Auto-move, backspace, and paste
otpInputs.forEach((box, idx, arr) => {
  // Auto-move to next input
  box.addEventListener("input", () => {
    if (box.value && idx < arr.length - 1) arr[idx + 1].focus();
    box.style.border = ""; // remove red border on input
  });

  // Backspace moves to previous input
  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && idx > 0) arr[idx - 1].focus();
  });

  // Paste feature
  box.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pasteData)) return; // only digits
    const digits = pasteData.split("").slice(0, arr.length); // max 4 digits
    digits.forEach((digit, i) => {
      arr[i].value = digit;
    });
    arr[digits.length - 1].focus(); // focus last filled input
  });
});

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("otpBtn");

  // Check if all inputs are filled
  const otp = Array.from(otpInputs).map(i => i.value).join("");
  let allFilled = Array.from(otpInputs).every(i => i.value !== "");

  if (!allFilled) {
    otpInputs.forEach(i => {
      if (!i.value) i.style.border = "1px solid red";
    });
    setHint("otp-hint", "All fields must be filled");
    return; // do not start loading
  }

  setButtonLoading(btn, "set", "Processing...");

  const email = otpContext === "signup"
    ? document.getElementById("signupEmail").value.trim()
    : document.getElementById("femail").value.trim();

  if (otp.length !== 4) {
    setHint("otp-hint", "Enter 4-digit OTP");
    setButtonLoading(btn, "reset");
    return;
  }

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

// OTP countdown + resend
let otpInterval;
function startOtpTimer() {
  let time = 60;
  const timerEl = document.getElementById("otp-countdown");
  const resendEl = document.getElementById("resend-otp");
  const resendText = document.querySelector('.send-again');

  resendText.style.display = "none";
  timerEl.textContent = `${time}s`;

  clearInterval(otpInterval); // clear previous interval if any
  otpInterval = setInterval(() => {
    if (time > 0) {
      timerEl.textContent = `${time--}s`;
    } else {
      clearInterval(otpInterval);
      timerEl.textContent = "Expired";
      resendText.style.display = "block";
    }
  }, 1000);

  // Remove previous click listeners to avoid duplicates
  resendEl.replaceWith(resendEl.cloneNode(true));
  const newResendEl = document.getElementById("resend-otp");

  newResendEl.addEventListener("click", async (e) => {
    e.preventDefault();
    resendText.style.display = "none"; // hide resend while waiting
    newResendEl.style.pointerEvents = "none";
    newResendEl.style.opacity = ".8";

    const email = otpContext === "signup"
      ? document.getElementById("signupEmail").value.trim()
      : document.getElementById("femail").value.trim();

    try {
      const res = await fetch(`${backend_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      showModal("Resent", "A new OTP has been sent.", startOtpTimer);
    } catch {
      showModal("Error", "Could not resend OTP");
    } finally {
      newResendEl.style.pointerEvents = "all";
      newResendEl.style.opacity = "1";
    }
  });
}



// ======================== LOGIN =========================
const loginForm = document.getElementById("login");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("siginBtn");
  setButtonLoading(btn, "set", "Logging in...");


  const email = document.getElementById("lemail").value.trim();
  const password = document.getElementById("lpassword").value;

  if (!/^\S+@\S+\.\S+$/.test(email)) { setHint("loginEmail-hint", "Enter a valid email"); return; }
  if (!password) { setHint("loginPass-hint", "Password required"); return; }

  try {
    const res = await fetch(`${backend_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
      // ADDED: redirect after modal
      showModal("Login Successful", "Redirecting to dashboard...", () => {
        window.location.href = "/dashboard.html";
      });
      clearFormInputs(loginForm);
    } else {
      setHint("loginPass-hint", data.message || "Invalid credentials");
    }
  } catch (err) {
    console.error(err);
    showModal("Error", "Error connecting to server.");
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
      otpContext = "forgot-password"
      // ADDED: modal then redirect to OTP section
      showModal("OTP Sent", "Check your email for the code.", () => showSection("otp"));
      startOtpTimer();
      // clearFormInputs(forgotForm);
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

  if (newPassword.length < 6) { setHint("npass-hint", "Password too short"); return; }
  if (newPassword !== confirmPassword) { setHint("cnpass-hint", "Passwords do not match"); return; }

  try {
    const res = await fetch(`${backend_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ email, newPassword })
    });

    const data = await res.json();
    if (res.ok) {
      // ADDED: modal then redirect
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


