import { showToast } from "./notification.js";

document.querySelectorAll(".notification-card").forEach(card => {
  const toggleBtn = card.querySelector(".toggle-btn");

  toggleBtn.addEventListener("click", () => {
    const outerBox = toggleBtn.querySelector(".outer-box");
    const innerBox = toggleBtn.querySelector(".inner-circle");

    // toggle active/inactive
    outerBox.classList.toggle("inactive");
    innerBox.classList.toggle("inactive");

    // get label text (e.g., "Email Notifications")
    const label = card.querySelector("p").textContent;

    // show toast with type
    if (!outerBox.classList.contains("inactive")) {
      showToast(`${label} enabled`, "success");  // ✅ green success
    } else {
      showToast(`${label} disabled`, "warning"); // ⚠️ yellow warning
    }
  });
});
