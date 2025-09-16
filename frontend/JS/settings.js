import { showToast } from "./utils/notification.js";

const backend_URL = "https://clearflow-project.onrender.com/api"; // backend

// DOM elements
const cancelEdit = document.getElementById("cancelEdit");
const UserOverviewFullname = document.getElementById("UserOverviewFullname");
const UserOverviewUname = document.querySelectorAll("#UserOverviewUname");
const UserOverviewEmail = document.getElementById("UserOverviewEmail");
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

// Simulating logged-in user (id = "1")
const currentUserId = "1";

uploadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFile);

uploadBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadBox.classList.add("dragover");
  uploadContent.classList.add("hidden");
  dropText.style.display = "block";
});

uploadBox.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadBox.classList.remove("dragover");
  uploadContent.classList.remove("hidden");
  dropText.style.display = "none";
});

uploadBox.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadBox.classList.remove("dragover");
  dropText.style.display = "none";
  const file = e.dataTransfer.files[0];
  if (file) showPreview(file);
});

function handleFile(e) {
  const file = e.target.files[0];
  if (file) showPreview(file);
}

function showPreview(file) {
  if (file.type === "image/png" || file.type === "image/jpeg") {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      previewWrapper.style.display = "flex";
      uploadContent.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  } else {
    showToast("Only PNG and JPEG files are allowed!", "error");
  }
}

// ===== Update Profile =====
profileUpdateForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fname = document.getElementById("fname").value.trim();
  const lname = document.getElementById("lname").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const phoneNumber = document.getElementById("phone-number").value.trim();
  const file = fileInput.files[0];

  try {
    let profilePicUrl = null;

    // If new picture selected → upload to backend
    if (file) {
      const formData = new FormData();
      formData.append("profilePic", file);

      const uploadRes = await fetch(`${backend_URL}/users/profile-pic`, {
        method: "POST",
        body: formData,
      });
      const data = await uploadRes.json();
      profilePicUrl = data.profilePicUrl;
    }

    // Update user details in backend
    await fetch(`${backend_URL}/users/${currentUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fname, lname, username, email, phoneNumber }),
    });

    // Update UI
    UserOverviewUname.forEach((name) => (name.textContent = username));
    UserOverviewFullname.textContent = `${fname} ${lname}`;
    UserOverviewEmail.textContent = email;
    UserOverviewPhone.textContent = phoneNumber;
    profilePic.forEach(
      (pic) => (pic.src = profilePicUrl || "/images/default-profile.png")
    );

    showToast("Profile updated successfully!", "success");

    // Reset upload box
    preview.src = "";
    previewWrapper.style.display = "none";
    uploadContent.classList.remove("hidden");
    dropText.style.display = "none";
    fileInput.value = "";
  } catch (error) {
    console.error("Error updating profile:", error);
    showToast("Failed to update profile", "error");
  }
});

// ===== Cancel Edit =====
cancelEdit.addEventListener("click", () => {
  preview.src = "";
  previewWrapper.style.display = "none";
  uploadContent.classList.remove("hidden");
  dropText.style.display = "none";
  fileInput.value = "";
});

// ===== Load User on Login =====
async function loadUserProfile() {
  try {
    const res = await fetch(`${backend_URL}/users/${currentUserId}`);
    const user = await res.json();

    UserOverviewFullname.textContent = `${user.fname} ${user.lname}`;
    UserOverviewEmail.textContent = user.email;
    UserOverviewPhone.textContent = user.phoneNumber;
    UserOverviewUname.forEach((name) => (name.textContent = user.username));
    profilePic.forEach(
      (pic) => (pic.src = user.profilePicUrl || "/images/default-profile.png")
    );
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Call when user logs in
loadUserProfile();
