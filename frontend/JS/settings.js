import { showToast } from "./utils/notification.js";

const cancelEdit = document.getElementById('cancelEdit');

// profile overview elements
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
const profileUpdateForm = document.getElementById('profileUpdateForm')

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
  // uploadContent.classList.remove("hidden");
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

// On submission, move image to profile pic
profileUpdateForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // user personal info
  const fname = document.getElementById("fname").value.trim();
  const lname = document.getElementById("lname").value.trim();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const phoneNumber = document.getElementById("phone-number").value.trim();

  if (preview.src) {
    profilePic.forEach(pic => {
      pic.src = `${preview.src}`
    })
    // profilePic.innerHTML = `<img src="${preview.src}" alt="Profile">`;
  }
  // Reset upload box
  preview.src = "";
  previewWrapper.style.display = "none";
  uploadContent.classList.remove("hidden");
  dropText.style.display = "none";
  fileInput.value = "";

  UserOverviewUname.forEach(name => {
    name.textContent = username;
  })
  
  UserOverviewFullname.textContent = `${fname} ${lname}`;
  UserOverviewEmail.textContent = email;
  UserOverviewPhone.textContent = phoneNumber;

  fname.value = ""
   lname.value = ""
   username.value = ""
   email.value = ""
   phoneNumber.value = ""
});


cancelEdit.addEventListener("click", (e) => {
  // Reset upload box
  preview.src = "";
  previewWrapper.style.display = "none";
  uploadContent.classList.remove("hidden");
  dropText.style.display = "none";
  fileInput.value = "";

   fname.value = ""
   lname.value = ""
   username.value = ""
   email.value = ""
   phoneNumber.value = ""
  
})


