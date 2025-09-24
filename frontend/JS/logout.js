const backend_URL = "https://clearflow-project.onrender.com";
import { showToast } from "./utils/notification.js";

// Logout function
async function logoutUser() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("You are not logged in!", "warning");
    return;
  }

  try {
    const res = await fetch(`${backend_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      // Clear user data
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");

      // Reset section state to default (dashboard)
      localStorage.setItem("activeSection", "dashboard");

      // Optional: toast for logout
      localStorage.setItem("toastMessage", JSON.stringify({
        text: data.message || "Logged out successfully.",
        type: "success"
      }));

      // Redirect to login page
      window.location.href = "login.html";
    } else {
      showToast(data.error || "Unable to logout.", "error");
    }
  } catch (err) {
    console.error("Logout error:", err);
    showToast("Something went wrong. Try again later.","error" );
  }
}

// Attach logout to button
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}
