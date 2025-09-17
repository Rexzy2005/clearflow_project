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
  } else if (action === "reset") {
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.textContent = btn.dataset.originalText || "Save";
  }
}

// ===== OTP Modal (4-Digit Inline) =====
async function showOtpModal(message, updates) {
  // Remove existing modal
  const existingModal = document.querySelector(".custom-modal");
  if (existingModal) existingModal.remove();

  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay custom-modal";

  // Modal box
  const modalBox = document.createElement("div");
  modalBox.className = "modal-box otp-modal";

  // Message
  const msg = document.createElement("p");
  msg.textContent = message;

  // OTP input container
  const otpWrapper = document.createElement("div");
  otpWrapper.className = "otp-inputs";
  const inputs = [];
  for (let i = 0; i < 4; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.className = "otp-box";
    otpWrapper.appendChild(input);
    inputs.push(input);
  }

  // Auto-focus logic
  inputs.forEach((input, idx) => {
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value && idx < inputs.length - 1) inputs[idx + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) inputs[idx - 1].focus();
    });
  });

  // Verify button
  const verifyBtn = document.createElement("button");
  verifyBtn.textContent = "Verify OTP";
  verifyBtn.addEventListener("click", async () => {
    const otp = inputs.map((input) => input.value).join("");
    if (otp.length < 4) {
      showToast("Please enter all 4 digits of the OTP.", "error");
      return;
    }

    try {
      setButtonLoading(verifyBtn, "set", "Verifying...");
      const res = await fetch(`${backend_URL}/user/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      // Update local user after verification
      currentUser = { ...currentUser, ...updates };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      loadUserProfile();
      showToast("Profile updated successfully!", "success");
      overlay.remove();
    } catch (err) {
      console.error(err);
      showToast(err.message || "OTP verification failed", "error");
    } finally {
      setButtonLoading(verifyBtn, "reset");
    }
  });

  modalBox.appendChild(msg);
  modalBox.appendChild(otpWrapper);
  modalBox.appendChild(verifyBtn);
  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  inputs[0].focus();
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
        showOtpModal("An OTP has been sent to your email/phone. Enter it below to update your profile.", updates);
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
