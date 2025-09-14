export function showToast(message, type = "info", duration = 1500) {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  const progress = document.createElement("div");
  progress.className = "progress";
  toast.appendChild(progress);

  container.appendChild(toast);

  // show toast
  setTimeout(() => toast.classList.add("show"), 100);

  // animate progress bar
  progress.style.transition = `transform ${duration}ms linear`;
  setTimeout(() => {
    progress.style.transform = "scaleX(0)";
  }, 200);

  // remove toast after duration
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
