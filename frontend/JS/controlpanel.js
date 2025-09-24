import { showToast } from "./utils/notification.js";

document.addEventListener("DOMContentLoaded", () => {
  // device details elements
  const selectedDeviceWrapper = document.getElementById('selected-device');
  const deleteDevice = document.getElementById("delete-device");
  const backBtn = document.getElementById('detailsBackBtn');
  const selectedDeviceName = document.querySelector(".selected-device-name");
  const selectedDeviceModel = document.querySelector(".selected-device-model");
  const switchBtn = document.querySelector(".switch-btn");
  let currentDeviceCard = null;
  let currentDeviceId = null;

  const addDeviceWrapper = document.getElementById('add-device-wrapper');
  const addDeviceBtn = document.querySelectorAll("#add-device-btn");
  const closeBtn = document.getElementById('close-btn');
  const controlPanelTop = document.querySelector('.control-panel-section-top');

  const addDeviceFormWrapper = document.getElementById("add-device-form-wrapper");
  const addDeviceForm = document.getElementById('add-device-form');
  const deviceDetailsWrapper = document.getElementById('device-details-wrapper');

  // ================= LOCAL STORAGE HELPERS =================
  function saveDevices(devices) {
    localStorage.setItem("devices", JSON.stringify(devices));
  }

  function loadDevices() {
    return JSON.parse(localStorage.getItem("devices")) || [];
  }

  function updateDeviceHeartbeatInStorage(deviceId) {
    const devices = loadDevices();
    const idx = devices.findIndex(d => d.id === deviceId);
    if (idx !== -1) {
      devices[idx].lastSeen = Date.now();
      saveDevices(devices);
      return devices[idx].lastSeen;
    }
    return null;
  }

  // ================= TIME + STATUS HELPERS =================
  function getLastSeenText(timestamp) {
    if (!timestamp) return "Last seen: unknown";
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Last seen: just now";
    if (diffMinutes === 1) return "Last seen: 1 min ago";
    if (diffMinutes < 60) return `Last seen: ${diffMinutes} mins ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `Last seen: ${diffHours} hr(s) ago`;
  }

  function getStatus(timestamp, onlineFlag = false) {
    if (!timestamp) return "offline";
    const diffMs = Date.now() - timestamp;
    return (onlineFlag && diffMs < 5 * 60000) ? "online" : "offline";
  }

  // ================= UI HELPERS =================
  function toggleAddDeviceWrapper() {
    const devices = loadDevices();
    if (devices.length === 0) {
      if (addDeviceWrapper) addDeviceWrapper.style.display = "flex";
      if (deviceDetailsWrapper) deviceDetailsWrapper.style.display = "none";
    } else {
      if (addDeviceWrapper) addDeviceWrapper.style.display = "none";
      if (deviceDetailsWrapper) deviceDetailsWrapper.style.display = "block";
    }
  }

  // ================= RENDER DEVICE CARD =================
  function renderDeviceCard(device) {
    const deviceCard = document.createElement('div');
    deviceCard.className = 'device-card';
    deviceCard.dataset.id = device.id;

    deviceCard.innerHTML = `
      <div class="left-side">
        <div class="card-icon">
          <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                      d="M18.8999 10.66C18.7396 10.4775 18.6512 10.2429 18.6512 10C18.6512 9.75709 18.7396 9.52249 18.8999 9.34L20.1799 7.9C20.3209 7.74267 20.4085 7.54471 20.4301 7.33451C20.4516 7.12431 20.4061 6.91269 20.2999 6.73L18.2999 3.27C18.1948 3.08752 18.0348 2.94288 17.8426 2.85669C17.6505 2.7705 17.4361 2.74716 17.2299 2.79L15.3499 3.17C15.1107 3.21943 14.8616 3.17959 14.6498 3.058C14.4379 2.93641 14.2779 2.74149 14.1999 2.51L13.5899 0.680002C13.5228 0.481381 13.395 0.308867 13.2245 0.186844C13.0541 0.0648209 12.8495 -0.000539236 12.6399 1.92586e-06H8.6399C8.42183 -0.0113801 8.20603 0.0489283 8.02546 0.171716C7.84489 0.294504 7.70948 0.473021 7.6399 0.680002L7.0799 2.51C7.0019 2.74149 6.84187 2.93641 6.63001 3.058C6.41815 3.17959 6.16911 3.21943 5.9299 3.17L3.9999 2.79C3.80445 2.76238 3.6052 2.79322 3.42724 2.87864C3.24929 2.96406 3.1006 3.10023 2.9999 3.27L0.999896 6.73C0.891056 6.91065 0.842118 7.12109 0.860079 7.33123C0.878039 7.54136 0.961979 7.74044 1.0999 7.9L2.3699 9.34C2.53022 9.52249 2.61863 9.75709 2.61863 10C2.61863 10.2429 2.53022 10.4775 2.3699 10.66L1.0999 12.1C0.961979 12.2596 0.878039 12.4586 0.860079 12.6688C0.842118 12.8789 0.891056 13.0894 0.999896 13.27L2.9999 16.73C3.10499 16.9125 3.26502 17.0571 3.45715 17.1433C3.64928 17.2295 3.86372 17.2528 4.0699 17.21L5.9499 16.83C6.18911 16.7806 6.43815 16.8204 6.65001 16.942C6.86187 17.0636 7.0219 17.2585 7.0999 17.49L7.7099 19.32C7.77948 19.527 7.91489 19.7055 8.09546 19.8283C8.27603 19.9511 8.49183 20.0114 8.7099 20H12.7099C12.9195 20.0005 13.1241 19.9352 13.2945 19.8132C13.465 19.6911 13.5928 19.5186 13.6599 19.32L14.2699 17.49C14.3479 17.2585 14.5079 17.0636 14.7198 16.942C14.9316 16.8204 15.1807 16.7806 15.4199 16.83L17.2999 17.21C17.5061 17.2528 17.7205 17.2295 17.9126 17.1433C18.1048 17.0571 18.2648 16.9125 18.3699 16.73L20.3699 13.27C20.4761 13.0873 20.5216 12.8757 20.5001 12.6655C20.4785 12.4553 20.3909 12.2573 20.2499 12.1L18.8999 10.66ZM17.4099 12L18.2099 12.9L16.9299 15.12L15.7499 14.88C15.0297 14.7328 14.2805 14.8551 13.6445 15.2238C13.0085 15.5925 12.53 16.1818 12.2999 16.88L11.9199 18H9.3599L8.9999 16.86C8.76975 16.1618 8.29128 15.5725 7.6553 15.2038C7.01932 14.8351 6.27012 14.7128 5.5499 14.86L4.3699 15.1L3.0699 12.89L3.8699 11.99C4.36185 11.44 4.63383 10.7279 4.63383 9.99C4.63383 9.25207 4.36185 8.54002 3.8699 7.99L3.0699 7.09L4.3499 4.89L5.5299 5.13C6.25012 5.27722 6.99932 5.15488 7.6353 4.7862C8.27128 4.41752 8.74975 3.82816 8.9799 3.13L9.3599 2H11.9199L12.2999 3.14C12.53 3.83816 13.0085 4.42752 13.6445 4.7962C14.2805 5.16488 15.0297 5.28722 15.7499 5.14L16.9299 4.9L18.2099 7.12L17.4099 8.02C16.9235 8.56876 16.6549 9.27668 16.6549 10.01C16.6549 10.7433 16.9235 11.4512 17.4099 12ZM10.6399 6C9.84877 6 9.07541 6.2346 8.41761 6.67412C7.75982 7.11365 7.24713 7.73836 6.94438 8.46927C6.64163 9.20017 6.56241 10.0044 6.71675 10.7804C6.8711 11.5563 7.25206 12.269 7.81147 12.8284C8.37088 13.3878 9.08361 13.7688 9.85954 13.9231C10.6355 14.0775 11.4397 13.9983 12.1706 13.6955C12.9015 13.3928 13.5262 12.8801 13.9658 12.2223C14.4053 11.5645 14.6399 10.7911 14.6399 10C14.6399 8.93914 14.2185 7.92172 13.4683 7.17157C12.7182 6.42143 11.7008 6 10.6399 6ZM10.6399 12C10.2443 12 9.85765 11.8827 9.52876 11.6629C9.19986 11.4432 8.94351 11.1308 8.79214 10.7654C8.64076 10.3999 8.60116 9.99778 8.67833 9.60982C8.7555 9.22186 8.94598 8.86549 9.22568 8.58579C9.50539 8.30608 9.86175 8.1156 10.2497 8.03843C10.6377 7.96126 11.0398 8.00087 11.4053 8.15224C11.7707 8.30362 12.0831 8.55996 12.3028 8.88886C12.5226 9.21776 12.6399 9.60444 12.6399 10C12.6399 10.5304 12.4292 11.0391 12.0541 11.4142C11.679 11.7893 11.1703 12 10.6399 12Z"
                      fill="currentColor" />
          </svg>
        </div>
        
        <div class="card-details">
          <p class="device-name">${device.name}</p>
          <p class="location-model">${device.location} • ${device.model}</p>
          <div class="status-bar">
            <span class="signal"><img src="assets/icons/dashboard/signal.svg" alt="">Signal</span>
            <span class="battery"><img src="assets/icons/dashboard/battery.svg" alt="">100%</span>
            <p class="last-seen">${getLastSeenText(device.lastSeen)}</p>
          </div>
        </div>
      </div>

      <div class="card-cta">
        <span class="device-stats">${getStatus(device.lastSeen, device.online)}</span>
        <button class="viewMoreBtn">View Details</button>
      </div>
    `;
    
    const lastSeenEl = deviceCard.querySelector(".last-seen");
    const statusEl = deviceCard.querySelector(".device-stats");

    // set initial color
    statusEl.style.color = statusEl.textContent === "online" ? "#437509" : "#BF6A29";
    statusEl.style.background = statusEl.textContent === "online" ? "#F6FDE6" : "#FFFBEB";
    statusEl.style.borderColor = statusEl.textContent === "online" ? "#E3FAB8" : "#FDEEB1";

    // update every minute
    const intervalId = setInterval(() => {
      lastSeenEl.textContent = getLastSeenText(device.lastSeen);
      statusEl.textContent = getStatus(device.lastSeen, device.online);
      statusEl.style.color = statusEl.textContent === "online" ? "#437509" : "#BF6A29";
      statusEl.style.background = statusEl.textContent === "online" ? "#F6FDE6" : "#FFFBEB";
      statusEl.style.borderColor = statusEl.textContent === "online" ? "#E3FAB8" : "#FDEEB1";
    }, 60000);

    // Attach "View Details"
    deviceCard.querySelector('.viewMoreBtn').addEventListener('click', () => {
      currentDeviceCard = deviceCard;
      currentDeviceId = device.id;

      if (deviceDetailsWrapper) deviceDetailsWrapper.style.display = "none";
      if (controlPanelTop) controlPanelTop.style.display = "none";

      if (selectedDeviceName) selectedDeviceName.textContent = device.name;
      if (selectedDeviceModel) selectedDeviceModel.textContent = `${device.location} • ${device.model}`;
      if (selectedDeviceWrapper) selectedDeviceWrapper.style.display = 'block';

      const newTs = updateDeviceHeartbeatInStorage(device.id);
      if (newTs) {
        device.lastSeen = newTs;
        lastSeenEl.textContent = getLastSeenText(device.lastSeen);
        statusEl.textContent = getStatus(device.lastSeen, device.online);
        statusEl.style.color = statusEl.textContent === "online" ? "#437509" : "#BF6A29";
        statusEl.style.background = statusEl.textContent === "online" ? "#F6FDE6" : "#FFFBEB";
        statusEl.style.borderColor = statusEl.textContent === "online" ? "#E3FAB8" : "#FDEEB1";
      }

      // sync ON/OFF switch
      if (switchBtn) {
        switchBtn.textContent = device.online ? "ON" : "OFF";
        switchBtn.classList.toggle("off", device.online);

        switchBtn.onclick = () => {
          let devices = loadDevices();
          const idx = devices.findIndex(d => d.id === device.id);
          if (idx !== -1) {
            devices[idx].online = !devices[idx].online;
            devices[idx].lastSeen = Date.now();
            saveDevices(devices);

            // update UI
            device.online = devices[idx].online;
            switchBtn.textContent = device.online ? "ON" : "OFF";
            switchBtn.classList.toggle("off", device.online);
            statusEl.textContent = getStatus(device.lastSeen, device.online);
            statusEl.style.color = statusEl.textContent === "online" ? "#437509" : "#BF6A29";
            statusEl.style.background = statusEl.textContent === "online" ? "#F6FDE6" : "#FFFBEB";
            statusEl.style.borderColor = statusEl.textContent === "online" ? "#E3FAB8" : "#FDEEB1";

            // show toast
            if (device.online) {
              showToast(`${device.name} turned ON`, "success");
            } else {
              showToast(`${device.name} turned OFF`, "warning");
            }
          }
        };
      }
    });

    deviceDetailsWrapper.appendChild(deviceCard);
    deviceDetailsWrapper.style.display = "block";
  }

  // ================= ADD DEVICE FORM UI =================
  addDeviceBtn.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (addDeviceFormWrapper) addDeviceFormWrapper.style.display = "flex";
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (addDeviceFormWrapper) addDeviceFormWrapper.style.display = "none";
      if (addDeviceForm) addDeviceForm.reset();
    });
  }

  // ================= BACK + DELETE =================
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (selectedDeviceWrapper) selectedDeviceWrapper.style.display = "none";
      if (deviceDetailsWrapper) deviceDetailsWrapper.style.display = "block";
      if (controlPanelTop) controlPanelTop.style.display = "flex";
    });
  }

  if (deleteDevice) {
    deleteDevice.addEventListener("click", () => {
      if (currentDeviceId) {
        let devices = loadDevices();
        const deleted = devices.find(d => d.id === currentDeviceId);
        devices = devices.filter(d => d.id !== currentDeviceId);
        saveDevices(devices);

        const card = deviceDetailsWrapper.querySelector(`[data-id="${currentDeviceId}"]`);
        if (card) card.remove();

        showToast(`${deleted?.name || "Device"} deleted`, "error");

        currentDeviceCard = null;
        currentDeviceId = null;
      }

      if (selectedDeviceWrapper) selectedDeviceWrapper.style.display = "none";
      if (deviceDetailsWrapper) deviceDetailsWrapper.style.display = "block";
      if (controlPanelTop) controlPanelTop.style.display = "flex";

      toggleAddDeviceWrapper();
    });
  }

  // ================= ADD DEVICE FORM SUBMIT =================
  if (addDeviceForm) {
    addDeviceForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const deviceName = document.getElementById('deviceName').value.trim();
      const deviceId = document.getElementById('deviceId').value.trim();
      const location = document.getElementById('location').value.trim();
      const model = document.getElementById('model').value.trim();

      if (!deviceId || !deviceName) return;

      let devices = loadDevices();
      if (devices.find(d => d.id === deviceId)) {
        showToast(`Device ID "${deviceId}" already exists`, "error");
        return;
      }

      const newDevice = {
        id: deviceId,
        name: deviceName,
        location: location,
        model: model,
        online: false,
        lastSeen: Date.now()
      };

      devices.push(newDevice);
      saveDevices(devices);

      renderDeviceCard(newDevice);

      showToast(`${deviceName} added successfully`, "success");

      if (addDeviceFormWrapper) addDeviceFormWrapper.style.display = "none";
      if (addDeviceWrapper) addDeviceWrapper.style.display = "none";
      if (addDeviceForm) addDeviceForm.reset();

      toggleAddDeviceWrapper();
    });
  }

  // ================= LOAD DEVICES =================
  const savedDevices = loadDevices();
  savedDevices.forEach(device => renderDeviceCard(device));
  toggleAddDeviceWrapper();
});
