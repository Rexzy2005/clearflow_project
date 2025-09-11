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
  document.querySelectorAll(".form-section").forEach(form => {
    form.style.display = "none";
  });
  const section = document.getElementById(sectionId);
  if (section) section.style.display = "block";
}

// Toggle back button
function goBack() {
  showSection("login");
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
  showSection("signup");
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

  if (!fname) { setHint("fname-hint", "First name is required", false); valid = false; }
  else { setHint("fname-hint", "", true); }

  if (!lname) { setHint("lname-hint", "Last name is required"); valid = false; }
  else { setHint("lname-hint", "", true); }

  if (!username) { setHint("uname-hint", "Username is required"); valid = false; }
  else { setHint("uname-hint", "", true); }

  if (!/^\S+@\S+\.\S+$/.test(email)) { setHint("signUpEmail-hint", "Enter a valid email"); valid = false; }
  else { setHint("signUpEmail-hint", "", true); }

  if (!password) { setHint("signUpPassword-hint", "Passwords is required"); valid = false; }
  else { setHint("uname-hint", "", true); }

  if (!confirmPassword) { setHint("signupConfirmPassword-hint", "Passwords is required"); valid = false; }
  else { setHint("uname-hint", "", true); }

  if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    setHint("signUpPassword-hint", "Password must be 6+ chars, include uppercase & number");
    valid = false;
  } else {
    setHint("signUpPassword-hint", "", true);
  }

  if (password !== confirmPassword) {
    setHint("signupConfirmPassword-hint", "Passwords do not match");
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

// ADDED: OTP auto-move and backspace
document.querySelectorAll("#otp input").forEach((box, idx, arr) => {
  box.addEventListener("input", () => {
    if (box.value && idx < arr.length - 1) arr[idx + 1].focus();
  });
  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !box.value && idx > 0) arr[idx - 1].focus();
  });
});

otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("otpBtn");
  setButtonLoading(btn, "set", "Processing...");

  const otp = [
    document.getElementById("otp1").value,
    document.getElementById("otp2").value,
    document.getElementById("otp3").value,
    document.getElementById("otp4").value
  ].join("");
  const email = otpContext === "signup" ? document.getElementById("signupEmail").value.trim() : document.getElementById("femail").value.trim();
  // const email = document.getElementById("signupEmail").value.trim();
  

  if (otp.length !== 4) {
    setHint("otp-hint", "Enter 4-digit OTP");
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
      // modal on OTP success
      if (otpContext === "signup") {
        showModal("OTP Verified", "You can now login.", () => showSection("login"));
        clearFormInputs(otpForm);
        document.querySelectorAll("#otp input").forEach(i => i.style.borderColor = "green"); // green on correct
      } else if (otpContext === "forgot-password") {
        showModal("OTP Verified", "You can now reset your password.", () => showSection("resetpassword"));
        document.querySelectorAll("#otp input").forEach(i => i.style.borderColor = "green"); // green on correct
      }
    } else {
      document.querySelectorAll("#otp input").forEach(i => i.style.borderColor = "red"); // red on wrong
      setHint("otp-hint", data.message || "Invalid OTP");
    }
  } catch (err) {
    console.error(err);
    setHint("otp-hint", "Error connecting to server");
  } finally {
    setButtonLoading(btn, "reset");
    clearFormInputs(otpForm);
  }
});

// ADDED: OTP countdown + resend
let otpInterval;
function startOtpTimer() {
  let time = 60;
  const timerEl = document.getElementById("otp-countdown");
  const resendEl = document.getElementById("resend-otp");
  const resendText = document.querySelector('.send-again');
  resendText.style.display = "none";

  const signupEmail = document.getElementById("signupEmail").value.trim();
  const forgotPassEmail = document.getElementById("femail").value.trim();
  const email = otpContext === "signup" ? signupEmail : forgotPassEmail;

  otpInterval = setInterval(() => {
    if (time > 0) {
      timerEl.textContent = `${time--}s`;
    } else {
      clearInterval(otpInterval);
      timerEl.textContent = "Expired";
      resendText.style.display = "block";
    }
  }, 1000);

  resendEl.onclick = async (e) => {
    e.preventDefault();
    resendEl.style.pointerEvents = "none";
    resendEl.style.opacity = ".8";
    try {
      await fetch(`${backend_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      showModal("Resent", "A new OTP has been sent.", startOtpTimer);
    } catch {
      showModal("Error", "Could not resend OTP");
    } finally{
      resendEl.style.pointerEvents = "all";
      resendEl.style.cursor = "pointer";
      resendEl.style.opacity = "1";
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


