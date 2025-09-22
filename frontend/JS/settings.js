import { showToast } from "./utils/notification.js";

const backend_URL = "https://clearflow-project.onrender.com/api";
const DEFAULT_PROFILE = "./default_profile_pic/default_user_img.png";

// DOM elements
const cancelEdit = document.getElementById("cancelEdit");
const UserOverviewFullname = document.getElementById("UserOverviewFullname");
const UserOverviewUname = document.querySelectorAll("#UserOverviewUname");
const UserOverviewEmail = document.querySelectorAll("#UserOverviewEmail");
const UserOverviewPhone = document.getElementById("UserOverviewPhone");
const uploadBox = document.getElementById("uploadBox");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("UploadBtn");
const preview = document.getElementById("preview");
const previewWrapper = document.getElementById("previewWrapper");
const uploadContent = document.getElementById("uploadContent");
const dropText = document.getElementById("dropText");
const profilePic = document.querySelectorAll("#userProfilePic");
const profileUpdateForm = document.getElementById("profileUpdateForm");
const saveBtn = document.getElementById("saveBtn"); // button for loading state

// Get user from localStorage
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
const token = localStorage.getItem("token");

// Redirect if not logged in
if (!currentUser || !token) {
  window.location.href = "login.html";
}

// ===== Utility: Button Loading =====
function setButtonLoading(btn, action = "set", text = "Saving...") {
  if (!btn) return;
  if (action === "set") {
    btn.dataset.originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add("loading");
    btn.innerHTML = `<div class="spinner"></div><span>${text}</span>`;
    btn.style.cursor = "not-allowed";
    btn.style.pointerEvents = "none";
    btn.style.opacity = ".7"
  } else if (action === "reset") {
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = btn.dataset.originalText || "Save";
    btn.style.cursor = "pointer";
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1"
  }
}

// ===== OTP Modal (4-Digit Inline) with timer, resend & auto-validate =====
async function showOtpModal(message, updates) {
  // Remove existing modal and any timers
  const existingModal = document.querySelector(".custom-modal");
  if (existingModal) existingModal.remove();

  let countdown = 60; 
  let timerInterval = null;
  let isVerifying = false;
  let isResending = false;

  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay custom-modal";

  // Modal box
  const modalBox = document.createElement("div");
  modalBox.className = "modal-box otp-modal";

  // Message
  const msg = document.createElement("p");
  msg.textContent = message;
  msg.className = "message";

  // Timer & resend container
  const timerRow = document.createElement("div");
  timerRow.className = "otp-timer-row";
  const timerText = document.createElement("span");
  timerText.className = "otp-timer-text";
  timerText.textContent = `Remaining Time: ${formatTime(countdown)}`;

  const resendText = document.createElement("span");
  resendText.className = "resend-text";
  resendText.textContent = "didn’t get the code? ";

  const resendBtn = document.createElement("button");
  resendBtn.className = "resend-button";
  resendBtn.textContent = "Resend";

  resendBtn.disabled = true;
  resendText.style.display = "none";

  resendText.appendChild(resendBtn);

  timerRow.appendChild(timerText);
  timerRow.appendChild(resendText);

  // OTP input container
  const otpWrapper = document.createElement("div");
  otpWrapper.className = "otp-inputs";
  const inputs = [];
  for (let i = 0; i < 4; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.pattern = "[0-9]*";
    input.maxLength = 1;
    input.className = "otp-box";
    input.autocomplete = "one-time-code";
    otpWrapper.appendChild(input);
    inputs.push(input);
  }

  // Helper: format mm:ss
  function formatTime(s) {
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }

  // Helper: set border style for inputs
  function setInputsState(state) {
    // state: "neutral" | "error" | "success"
    inputs.forEach((inp) => {
      inp.classList.remove("otp-error", "otp-success");
      inp.style.borderColor = "";
    });
    if (state === "error") {
      inputs.forEach((inp) => {
        inp.classList.add("otp-error");
        inp.style.borderColor = "var(--danger, #e74c3c)"; // uses CSS var if present
      });
    } else if (state === "success") {
      inputs.forEach((inp) => {
        inp.classList.add("otp-success");
        inp.style.borderColor = "var(--success, #2ecc71)";
      });
    }
  }

  // Clear input styling on typing
  function clearErrorOnTyping() {
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        // remove error styling as user types again
        if (input.classList.contains("otp-error")) setInputsState("neutral");
      }, { once: false });
    });
  }

  clearErrorOnTyping();

  // Move focus / backspace logic + auto-trigger verify when full
  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value.replace(/[^0-9]/g, "");
      e.target.value = value;
      if (value && idx < inputs.length - 1) inputs[idx + 1].focus();

      // If all digits filled, auto-verify (but avoid firing multiple times)
      const otp = inputs.map(i => i.value).join("");
      if (otp.length === inputs.length) {
        // small debounce to allow last char to render
        setTimeout(() => autoVerifyOtp(otp), 150);
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) {
        inputs[idx - 1].focus();
      }
      // If user starts typing after error, clear error
      if (input.classList.contains("otp-error")) {
        setInputsState("neutral");
      }
    });
  });

  // Verify button (manual)
  const verifyBtn = document.createElement("button");
  verifyBtn.className = "verify-button";
  verifyBtn.textContent = "Verify";

  // Shared verify function
  async function performVerify(otp) {
    if (isVerifying) return;
    isVerifying = true;
    setButtonLoading(verifyBtn, "set", "Verifying...");
    try {
      const res = await fetch(`${backend_URL}/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      // success
      setInputsState("success");
      // apply the updates to currentUser and UI
      currentUser = { ...currentUser, ...updates };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      loadUserProfile();
      showToast("Profile updated successfully!", "success");

      cleanupAndClose();
    } catch (err) {
      console.error(err);
      // show red border & toast
      setInputsState("error");
      showToast(err.message || "OTP verification failed", "error");
    } finally {
      setButtonLoading(verifyBtn, "reset");
      isVerifying = false;
    }
  }

  // Auto-verify wrapper (prevents double-calls if verifyBtn already clicked)
  let autoVerifyTimeout = null;
  function autoVerifyOtp(otp) {
    if (isVerifying) return;
    // debounce auto verify a tiny bit
    if (autoVerifyTimeout) clearTimeout(autoVerifyTimeout);
    autoVerifyTimeout = setTimeout(() => performVerify(otp), 200);
  }

  verifyBtn.addEventListener("click", () => {
    const otp = inputs.map(i => i.value).join("");
    if (otp.length < inputs.length) {
      showToast("Please enter all 4 digits of the OTP.", "error");
      return;
    }
    performVerify(otp);
  });

  // Resend logic
  async function resendOtp() {
    if (isResending) return;
    isResending = true;
    resendBtn.disabled = true;
    resendBtn.textContent = "Resending...";
    try {
      // Try to send updates to backend so it knows context if needed
      const res = await fetch(`${backend_URL}/user/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");

      showToast(data.message || "OTP has been resent to your email.", "success");

      // reset inputs and states
      inputs.forEach(i => i.value = "");
      setInputsState("neutral");
      inputs[0].focus();

      // restart timer
      countdown = 60;
      startTimer();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to resend OTP", "error");
      // allow user to try resend again
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend";
    } finally {
      isResending = false;
    }
  }

  resendBtn.addEventListener("click", () => {
    resendOtp();
  });

  // Timer function
  function startTimer() {
    // reset UI
    resendBtn.disabled = true;
    resendText.style.display = "none";
    timerText.style.display = "inline";
    timerText.textContent = `Remaining Time: ${formatTime(countdown)}`;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(timerInterval);
        timerText.style.display = "none";
        resendText.style.display = "inline-block";
        resendBtn.disabled = false;
        resendBtn.textContent = "Resend";
      } else {
        timerText.textContent = `Remaining Time: ${formatTime(countdown)}`;
      }
    }, 1000);
  }

  // Cleanup
  function cleanupAndClose() {
    if (timerInterval) clearInterval(timerInterval);
    overlay.remove();
  }

  // If user clicks outside modal or we want close (you may want to prevent closing by outside click if desired)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      // optional: prevent closing while verifying/resending
      if (!isVerifying && !isResending) cleanupAndClose();
    }
  });

  // Compose modal
  modalBox.appendChild(msg);
  modalBox.appendChild(otpWrapper);
  modalBox.appendChild(timerRow);
  modalBox.appendChild(verifyBtn);
  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  // initial focus
  inputs[0].focus();
  // start timer
  startTimer();
}

// ===== Upload preview =====
uploadBtn.addEventListener("click", (e) => { e.preventDefault(); fileInput.click(); });
fileInput.addEventListener("change", handleFile);
uploadBox.addEventListener("dragover", (e) => { e.preventDefault(); uploadBox.classList.add("dragover"); uploadContent.classList.add("hidden"); dropText.style.display = "block"; });
uploadBox.addEventListener("dragleave", (e) => { e.preventDefault(); uploadBox.classList.remove("dragover"); uploadContent.classList.remove("hidden"); dropText.style.display = "none"; });
uploadBox.addEventListener("drop", (e) => { e.preventDefault(); uploadBox.classList.remove("dragover"); dropText.style.display = "none"; const file = e.dataTransfer.files[0]; if (file) showPreview(file); });
function handleFile(e) { const file = e.target.files[0]; if (file) showPreview(file); }
function showPreview(file) {
  const MAX_SIZE = 2 * 1024 * 1024;
  if (!["image/png", "image/jpeg"].includes(file.type)) { showToast("Only PNG and JPEG files are allowed!", "error"); return; }
  if (file.size > MAX_SIZE) { showToast("File size must be less than 2MB!", "error"); return; }
  const reader = new FileReader();
  reader.onload = function (e) { preview.src = e.target.result; previewWrapper.style.display = "flex"; uploadContent.classList.add("hidden"); };
  reader.readAsDataURL(file);
}

// ===== Load user profile =====
function loadUserProfile() {
  UserOverviewFullname.textContent = `${currentUser.firstname || ""} ${currentUser.lastname || ""}`;
  //UserOverviewEmail.textContent = currentUser.email || "";
  UserOverviewEmail.forEach((Ovemail) => (Ovemail.textContent = currentUser.email || ""));
  UserOverviewPhone.textContent = currentUser.phoneNumber || "";
  UserOverviewUname.forEach((name) => (name.textContent = `@${currentUser.username}` || ""));
  profilePic.forEach((pic) => { pic.src = currentUser.profilePicture || DEFAULT_PROFILE; pic.onerror = () => (pic.src = DEFAULT_PROFILE); });
}
loadUserProfile();

// ===== Upload profile picture =====
async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append("profilePicture", file);
  try {
    const res = await fetch(`${backend_URL}/user/profile-picture`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to upload profile picture");
    currentUser.profilePicture = data.profilePicture;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    loadUserProfile();
    showToast("Profile picture updated successfully!", "success");
    preview.src = "";
    previewWrapper.style.display = "none";
    uploadContent.classList.remove("hidden");
    dropText.style.display = "none";
    fileInput.value = "";
  } catch (err) { console.error(err); showToast(err.message || "Failed to upload profile picture", "error"); }
}

// ===== Update profile (with inline OTP) =====
profileUpdateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setButtonLoading(saveBtn, "set", "Saving...");

  const fname = document.getElementById("fname").value.trim();
  const lname = document.getElementById("lname").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const phoneNumber = document.getElementById("phone-number").value.trim();
  const file = fileInput.files[0];

  const updates = {};
  if (fname) updates.firstname = fname;
  if (lname) updates.lastname = lname;
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (phoneNumber) updates.phoneNumber = phoneNumber;

  if (Object.keys(updates).length === 0 && !file) {
    showToast("Please fill at least one field or upload a profile picture.", "error");
    setButtonLoading(saveBtn, "reset");
    return;
  }

  try {
    if (file) await uploadProfilePicture(file);

    if (Object.keys(updates).length > 0) {
      const res = await fetch(`${backend_URL}/user/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      if (data.otpRequired) {
        showOtpModal("An OTP has been sent to your email. Enter it below to update your profile.", updates);
        return;
      }

      currentUser = { ...currentUser, ...updates };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      loadUserProfile();
      showToast("Profile updated successfully!", "success");
    }
  } catch (err) { console.error(err); showToast(err.message || "Failed to update profile", "error"); }
  finally { setButtonLoading(saveBtn, "reset"); }
});

// ===== Cancel Edit =====
cancelEdit.addEventListener("click", () => {
  preview.src = "";
  previewWrapper.style.display = "none";
  uploadContent.classList.remove("hidden");
  dropText.style.display = "none";
  fileInput.value = "";
});
