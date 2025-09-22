const backend_URL = "https://clearflow-project.onrender.com";
// Logout function
async function logoutUser() {
  const token = localStorage.getItem("token");

  if (!token) {
    showModal("Logout", "You are not logged in!");
    return;
  }

  try {
    const res = await fetch(`${backend_URL}/api/auth/logout`, {
      method: "POST",  // Same as backend logout method
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok) {
      // Clear all user data
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");

      // Optional: Add logout toast message
      localStorage.setItem("toastMessage", JSON.stringify({
        text: data.message || "Logged out successfully.",
        type: "success"
      }));

      // Redirect to login
      window.location.href = "login.html";
    } else {
      showModal("Logout Failed", data.error || "Unable to logout.");
    }
  } catch (err) {
    console.error("Logout error:", err);
    showModal("Error", "Something went wrong. Try again later.");
  }
}

// Attach event listener
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}
