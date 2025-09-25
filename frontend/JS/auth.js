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
  }, 3000);
}

function clearFormInputs(form) {
  const inputs = form.querySelectorAll(
    "input[type='text'],[type='email'],[type='password'], [type='number']"
  );
  inputs.forEach((input) => {
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
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") closeModal();
    },
    { once: true }
  );
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
document.querySelectorAll(".toggle-password").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const wrapper = toggle.closest(".password-input") || toggle.parentElement;
    if (!wrapper) return;
    const input = wrapper.querySelector(
      "input[type='password'], input[type='text']"
    );
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
    const confirmPassword = document.getElementById("signupConfirmPassword")
      ?.value;
    const accept = document.getElementById("accept")?.checked;

    let valid = true;
    if (!fname) {
      setHint("fname-hint", "First name required");
      valid = false;
    }
    if (!lname) {
      setHint("lname-hint", "Last name required");
      valid = false;
    }
    if (!username) {
      setHint("uname-hint", "Username required");
      valid = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setHint("signUpEmail-hint", "Enter a valid email");
      valid = false;
    }
    if (!password) {
      setHint("signUpPassword-hint", "Password required");
      valid = false;
    }
    if (!confirmPassword) {
      setHint("signupConfirmPassword-hint", "Confirm password");
      valid = false;
    }

    if (
      password &&
      (password.length < 6 ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(password))
    ) {
      setHint(
        "signUpPassword-hint",
        "Password must be 6+ chars, include uppercase, number & special char"
      );
      valid = false;
    }

    if (password !== confirmPassword) {
      setHint("signupConfirmPassword-hint", "Passwords do not match");
      valid = false;
    }
    if (!accept) {
      setHint("accept-hint", "You must agree to terms");
      valid = false;
    }

    if (!valid) {
      setButtonLoading(btn, "reset");
      return;
    }

    try {
      const res = await fetch(`${backend_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: fname,
          lastname: lname,
          username,
          email,
          password,
        }),
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

// -------------------- LOGIN --------------------
const loginForm = document.getElementById("login");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("siginBtn");
    setButtonLoading(btn, "set", "Logging in...");

    const email = document.getElementById("lemail")?.value.trim();
    const password = document.getElementById("lpassword")?.value;

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setHint("loginEmail-hint", "Enter a valid email");
      setButtonLoading(btn, "reset");
      return;
    }
    if (!password) {
      setHint("loginPass-hint", "Password required");
      setButtonLoading(btn, "reset");
      return;
    }

    try {
      const res = await fetch(`${backend_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        // ✅ Save token + user securely before redirect
        localStorage.setItem("token", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));

        localStorage.setItem(
          "toastMessage",
          JSON.stringify({
            text: `Login Successful! Welcome back, ${data.user.username}.`,
            type: "success",
          })
        );

        clearFormInputs(loginForm);

        // ✅ Give localStorage time to persist before redirect
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 300);

      } else {
        showModal("Login Failed", data.message || "Invalid credentials");
      }
    } catch {
      showModal("Error", "Error connecting to server");
    } finally {
      setButtonLoading(btn, "reset");
    }
  });
}

// -------------------- AUTH FETCH (strict) --------------------
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    throw new Error("No token found");
  }

  options.headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, options);

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    showModal("Session Expired", "Please log in again.", () => {
      window.location.href = "login.html";
    });
    throw new Error("Unauthorized");
  }

  return res;
}
