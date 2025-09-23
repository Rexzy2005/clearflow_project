import { showToast } from "./utils/notification.js";

document.addEventListener("DOMContentLoaded", () => {
  const scheduleFormWrapper = document.getElementById('schedule-form-wrapper');
  const scheduleBtn = document.getElementById("schedule-btn");
  const closeFormBtn = document.getElementById('close-form-btn');

  // const addDeviceFormWrapper = document.getElementById("schedule-form");
  const scheduleForm = document.getElementById('schedule-form');

  // ================= ADD DEVICE FORM UI =================
  scheduleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (scheduleFormWrapper) scheduleFormWrapper.style.display = "flex";
  });

  if (closeFormBtn) {
    closeFormBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (scheduleFormWrapper) scheduleFormWrapper.style.display = "none";
      if (scheduleForm) scheduleForm.reset();
    });
  }

  // ================= ADD DEVICE FORM SUBMIT =================
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const device = document.getElementById('device').value.trim();
      const deviceType = document.getElementById('device-type').value.trim();
      const description = document.getElementById('description').value.trim();
      const date = document.getElementById('date').value.trim();

      showToast(`Schedule booked successfully`, "success");

      if (scheduleFormWrapper) scheduleFormWrapper.style.display = "none";
      if (scheduleForm) scheduleForm.reset();
    });
  }
});
