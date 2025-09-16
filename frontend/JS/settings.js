import { showToast } from "./utils/notification.js";

const backend_URL = "https://clearflow-project.onrender.com/api";

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

// Get user from localStorage
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const token = localStorage.getItem("token");

// Redirect if not logged in
if (!currentUser || !token) {
  window.location.href = "login.html";
}

// ===== Upload preview =====
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

// ===== Load user profile =====
function loadUserProfile() {
  UserOverviewFullname.textContent = `${currentUser.firstname} ${currentUser.lastname}`;
  UserOverviewEmail.textContent = currentUser.email;
  UserOverviewPhone.textContent = currentUser.phoneNumber || "";
  UserOverviewUname.forEach((name) => (name.textContent = currentUser.username));
  profilePic.forEach((pic) => (pic.src = currentUser.profilePicture || "/images/default-profile.png"));
}
loadUserProfile();

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
    let profilePicUrl = currentUser.profilePicture || "/images/default-profile.png";

    // Upload new picture if selected
    if (file) {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const uploadRes = await fetch(`${backend_URL}/user/profile-picture`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(data.message || "Failed to upload profile picture");
      profilePicUrl = data.profilePicture || profilePicUrl;
    }

    // Update user info
    const updateRes = await fetch(`${backend_URL}/user/${currentUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstname: fname, lastname: lname, username, email, phoneNumber }),
    });
    const updatedUser = await updateRes.json();
    if (!updateRes.ok) throw new Error(updatedUser.message || "Failed to update profile");

    // Update localStorage
    const newUser = { ...currentUser, ...updatedUser, profilePicture: profilePicUrl };
    localStorage.setItem("currentUser", JSON.stringify(newUser));

    // Update UI
    loadUserProfile();

    showToast("Profile updated successfully!", "success");

    // Reset upload box
    preview.src = "";
    previewWrapper.style.display = "none";
    uploadContent.classList.remove("hidden");
    dropText.style.display = "none";
    fileInput.value = "";
  } catch (err) {
    console.error("Error updating profile:", err);
    showToast(err.message || "Failed to update profile", "error");
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
