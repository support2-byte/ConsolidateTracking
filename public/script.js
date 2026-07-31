"use strict";

const CONFIG = {
  API_BASE:
    document.querySelector('meta[name="api-base-url"]')?.content ||
    "https://trackorder.royalgulfshipping.com",

  TRACKING_API_BASE:
    document.querySelector('meta[name="tracking-api-url"]')?.content ||
    "https://consolidate.onrender.com",

  SITE_KEY:
    document.querySelector('meta[name="recaptcha-site-key"]')?.content ||
    "6LfsWmstAAAAAGY8xEVZH0XwQ087Un-NU5BIE8dX",

  VERIFY_RECAPTCHA_ENDPOINT: null,
  TRACK_ITEM_ENDPOINT: null,
  NOTIFY_ME_ENDPOINT: null,
};

CONFIG.VERIFY_RECAPTCHA_ENDPOINT = `${CONFIG.TRACKING_API_BASE}/api/internal/verify-recaptcha`;
CONFIG.TRACK_ITEM_ENDPOINT = `${CONFIG.TRACKING_API_BASE}/api/orders/track/item`;
CONFIG.NOTIFY_ME_ENDPOINT = `${CONFIG.TRACKING_API_BASE}/api/orders/notify/me/`;

const RGS_PHASES = [
  {
    label: "Order Created",
    tip: "Your order has been created and is being processed.",
    msg: "Your order has been created successfully.",
  },
  {
    label: "Ready for Loading",
    tip: "Your shipment is being prepared at origin facility.",
    msg: "Your order is being prepared for loading.",
  },
  {
    label: "Loaded Into Container",
    tip: "Your cargo is loaded and sealed in container.",
    msg: "Your container is now ready to depart from origin.",
  },
  {
    label: "Shipment Processing",
    tip: "Shipment documentation is under verification.",
    msg: "Documentation is being processed for departure.",
  },
  {
    label: "Shipment In Transit",
    tip: "Your shipment is now en route to destination.",
    msg: "Your shipment is reaching to you soon!",
  },
  {
    label: "Under Processing",
    tip: "Customs and clearance being arranged at destination.",
    msg: "Your shipment has reached destination and is under customs processing.",
  },
  {
    label: "Arrived at Sort Facility",
    tip: "Shipment arrived at destination port facility.",
    msg: "Shipment is at destination port facility and being sorted.",
  },
  {
    label: "Ready for Delivery",
    tip: "Cargo ready for dispatch.",
    msg: "Your cargo is ready for dispatch to your location.",
  },
  {
    label: "Shipment Delivered",
    tip: "Shipment successfully delivered.",
    msg: "Your shipment has been successfully delivered. Thank you for choosing RGSL.",
  },
];

const USER_TIME_ZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time";

function getTimezoneLabel() {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
      timeZone: USER_TIME_ZONE,
    }).formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart ? `${USER_TIME_ZONE} (${tzPart.value})` : USER_TIME_ZONE;
  } catch (e) {
    return USER_TIME_ZONE;
  }
}

function rgsFmtTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: USER_TIME_ZONE,
    })
      .format(date)
      .replace(",", ",");
  } catch (e) {
    return date.toLocaleString();
  }
}

function rgsFmtDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: USER_TIME_ZONE,
    }).format(date);
  } catch (e) {
    return date.toLocaleDateString();
  }
}

const rgsEl = (s, p = document) => p.querySelector(s);

function showToast(message, type = "info") {
  document.querySelectorAll(".toast").forEach((toast) => toast.remove());

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#3b82f6"};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 350px;
    font-size: 14px;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    word-wrap: break-word;
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

let rgsCurrentReferenceId = "";
let currentShipmentData = null;

function loadRecaptchaScript(siteKey) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
}

async function initRecaptcha() {
  const loader = document.getElementById("loader");
  const loaderH2 = loader ? loader.querySelector("h2") : null;
  const loaderP = loader ? loader.querySelector("p") : null;

  try {
    await loadRecaptchaScript(CONFIG.SITE_KEY);

    grecaptcha.ready(async () => {
      const token = await grecaptcha.execute(CONFIG.SITE_KEY, {
        action: "homepage",
      });

      const res = await fetch(CONFIG.VERIFY_RECAPTCHA_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.success) {
        if (loader) loader.style.display = "none";
        document.getElementById("content").style.display = "block";

        const urlParams = new URLSearchParams(window.location.search);
        const refId = urlParams.get("ref");
        if (refId) {
          document.getElementById("refInput").value = refId;
          trackShipment();
        }
      } else {
        if (loaderH2) loaderH2.textContent = "Verification failed!";
        if (loaderP) loaderP.textContent = "Please refresh and try again.";
        console.error("reCAPTCHA failed:", data);
      }
    });
  } catch (err) {
    if (loaderH2) loaderH2.textContent = "Error verifying!";
    if (loaderP) loaderP.textContent = "Check console for details.";
    console.error("reCAPTCHA verification error:", err);
  }
}

async function trackShipment() {
  const refInput = document.getElementById("refInput").value.trim();
  const errorDiv = document.getElementById("errorMessage");
  const btn = document.getElementById("searchBtn");
  const originalText = btn.textContent;

  if (!refInput) {
    showError("Please enter a reference ID");
    return;
  }

  hideResults();
  errorDiv.style.display = "none";

  btn.textContent = "Loading...";
  btn.disabled = true;

  try {
    const url = `${CONFIG.TRACK_ITEM_ENDPOINT}/${encodeURIComponent(refInput)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("No shipment found with this reference ID");
      }
      if (response.status >= 500) {
        throw new Error("Server error — please try again later");
      }
      throw new Error(
        `Request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (data.success) {
      currentShipmentData = data.data;
      displayResults(data.data, refInput);
    } else {
      showError(data.message || "No shipment found with this reference ID");
    }
  } catch (error) {
    console.error("Track shipment error:", error);
    const message =
      error.name === "TypeError" && error.message.includes("fetch")
        ? "Network error — check your internet or try again later"
        : error.message || "Failed to fetch shipment data. Please try again.";
    showError(message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function displayResults(data, inputRef) {
  rgsCurrentReferenceId =
    inputRef ||
    data.receivers?.[0]?.items?.[0]?.item_ref ||
    data.booking_ref ||
    "";

  let totalWeight = 0;
  let totalQty = 0;
  const eta = data.receivers[0]?.eta || data.eta;

  document.getElementById("pol").textContent =
    `POL: ${data.place_of_loading ?? "—"}`;
  document.getElementById("pod").textContent =
    `POD: ${data.place_of_delivery ?? "—"}`;
  document.getElementById("route").style.display = "flex";
  document.getElementById("refId").textContent =
    data.receivers?.[0]?.items?.[0]?.item_ref || data.booking_ref || "—";
  document.getElementById("orderId").textContent =
    data.rgl_booking_number || "—";
  document.getElementById("etaTop").textContent = eta ? rgsFmtDate(eta) : "—";
  document.getElementById("orderInfo").style.display = "flex";
  document.getElementById("lastUpdated").textContent =
    `Last updated: ${rgsFmtTime(new Date())}`;
  document.getElementById("lastUpdated").style.display = "block";
  document.getElementById("actions").style.display = "flex";

  const tzWrap = document.getElementById("timezoneNoteWrap");
  const tzNote = document.getElementById("timezoneNote");
  if (tzWrap && tzNote) {
    tzNote.innerHTML = `<i class="fas fa-clock"></i> All dates and times are shown in your local timezone: ${getTimezoneLabel()}`;
    tzWrap.style.display = "block";
  }

  buildTimeline(data);
  buildDetailsPanel(data);

  data.receivers.forEach((receiver) => {
    receiver.items.forEach((item) => {
      totalWeight += item.weight || 0;
      totalQty += item.total_number || 0;
    });
  });

  document.getElementById("qty").textContent = totalQty > 0 ? totalQty : "—";
  document.getElementById("wgt").textContent =
    totalWeight > 0 ? `${totalWeight} kg` : "—";

  buildVerticalTimeline(data.receivers[0]);
}

function buildTimeline(data) {
  const container = document.getElementById("steps-h");
  const timelineContainer = document.getElementById("timelineContainer");
  const progress = document.getElementById("progress");
  const statusMsg = document.getElementById("statusMsg");

  if (!container) return;

  container.innerHTML = "";

  let currentStatus = "Order Created";

  if (data?.receivers?.length > 0) {
    const receiver = data.receivers[0];
    currentStatus =
      receiver.current_status?.trim() ||
      receiver.status?.trim() ||
      data.status?.trim() ||
      "Order Created";
  }

  const currentPhase =
    RGS_PHASES.find((phase) => phase.label === currentStatus) || RGS_PHASES[0];

  const activeIndex = RGS_PHASES.findIndex(
    (phase) => phase.label === currentStatus,
  );
  const realIndex = activeIndex === -1 ? 0 : activeIndex;

  let stepsHtml = "";
  RGS_PHASES.forEach((phase, index) => {
    const stepClass =
      index < realIndex ? "done" : index === realIndex ? "active" : "";
    stepsHtml += `
      <div class="step ${stepClass}" data-status="${phase.label}">
          <div class="node" title="${phase.tip}"></div>
          <label style="font-weight: bold">${phase.label}</label>
      </div>
    `;
  });
  container.innerHTML = stepsHtml;

  const totalPhases = RGS_PHASES.length;
  const stepProgress =
    totalPhases > 1 ? ((realIndex + 1) / totalPhases) * 100 : 0;

  setTimeout(() => {
    if (progress) progress.style.width = `${stepProgress}%`;
    const ship = document.getElementById("ship");
    if (ship) {
      ship.style.left = `${stepProgress}%`;
      ship.style.transform = "translateX(-50%)";
    }
  }, 100);

  if (timelineContainer) timelineContainer.style.display = "block";

  if (statusMsg) {
    const tipText = currentPhase.tip || "Tracking your shipment...";
    statusMsg.innerHTML = `
      <strong>Current Status:</strong> ${currentStatus}<br>
      <span style="color: #666; font-size: 0.95em;">${tipText}</span>
    `;
  }
}

function buildVerticalTimeline(receiver) {
  const panel = document.getElementById("timelinePanel");
  if (!panel) return;

  panel.innerHTML = "";

  let currentStatus = (
    receiver.current_status ||
    receiver.status ||
    "Order Created"
  ).trim();

  const activeIndex = RGS_PHASES.findIndex(
    (phase) => phase.label === currentStatus,
  );
  let realActiveIndex = activeIndex === -1 ? 0 : activeIndex;

  if (activeIndex === -1) {
    console.warn("Status not found in RGS_PHASES:", currentStatus);
    if (
      currentStatus.toLowerCase().includes("process") ||
      currentStatus.toLowerCase().includes("in process")
    ) {
      realActiveIndex = 0;
    }
  }

  const phasesToShow = RGS_PHASES.slice(0, realActiveIndex + 1);

  const trackLine = document.createElement("div");
  trackLine.className = "track-line";
  trackLine.style.height = `${phasesToShow.length * 75}px`;
  panel.appendChild(trackLine);

  const historyAsc = [...(receiver.status_history || [])].sort(
    (a, b) => new Date(a.time) - new Date(b.time),
  );

  const historyDesc = [...(receiver.status_history || [])].sort(
    (a, b) => new Date(b.time) - new Date(a.time),
  );

  let lastUpdatedFormatted = rgsFmtTime(new Date());
  if (historyDesc[0]?.time) {
    lastUpdatedFormatted = rgsFmtTime(historyDesc[0].time);
  }

  phasesToShow.forEach((phase, index) => {
    const isActive = index === realActiveIndex;
    const isCompleted = index < realActiveIndex;
    const itemClass = isActive ? "active" : isCompleted ? "completed" : "";

    let historyMatch = historyDesc.find(
      (h) => h.status?.trim().toLowerCase() === phase.label.toLowerCase(),
    );

    if (!historyMatch && historyAsc[index]) {
      historyMatch = historyAsc[index];
    }

    const timeDisplay = historyMatch
      ? `<div class="time">Updated: ${rgsFmtTime(historyMatch.time)}</div>`
      : "";

    const item = document.createElement("div");
    item.className = `timeline-item ${itemClass}`;
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
          <div class="status">${phase.label}</div>
          ${timeDisplay}
      </div>
    `;

    panel.appendChild(item);
  });

  if (receiver.eta) {
    const etaFormatted = rgsFmtDate(receiver.eta);
    const etaBox = document.createElement("div");
    etaBox.style.textAlign = "center";
    etaBox.style.marginTop = "18px";
    etaBox.innerHTML = `
      <span class="eta">Expected Arrival: ${etaFormatted}</span>
      <p style="margin-top:10px;font-size:13px;color:var(--rg-subtext); font-family: 'Inter', Arial, sans-serif;">
          Are you looking to schedule your delivery? <br>
          Please call us at <strong style="color:var(--rg-orange);">+971555658321</strong> and book your delivery with best competitive prices.
      </p>`;
    panel.appendChild(etaBox);
  }

  panel.style.display = "block";
}

function buildDetailsPanel(data) {
  const panel = document.getElementById("timelinePanel");
  let html = '<div class="track-line" style="height: 100%;"></div>';
  data.receivers.forEach((receiver, idx) => {
    const isLast = idx === data.receivers.length - 1;
    if (receiver.status_history && receiver.status_history.length > 0) {
      const sortedHistory = [...receiver.status_history].sort(
        (a, b) => new Date(b.time) - new Date(a.time),
      );
      sortedHistory.forEach((historyItem, historyIdx) => {
        const historyDate = rgsFmtTime(historyItem.time);
        const isLatest = historyIdx === 0;
        const historyClass = isLatest ? "active" : "done";
        html += `<div class="item ${historyClass}">
                      <div class="dot"></div>
                      <div class="content">
                          <div class="status">${historyItem.status}</div>
                          <div class="time">${historyDate}</div>
                      </div>
                  </div>`;
      });
    }
  });
  panel.innerHTML = html;
  panel.style.display = "";
}

function hideResults() {
  document.getElementById("route").style.display = "none";
  document.getElementById("orderInfo").style.display = "none";
  document.getElementById("timelineContainer").style.display = "none";
  document.getElementById("timelinePanel").style.display = "none";
  document.getElementById("actions").style.display = "none";
  document.getElementById("lastUpdated").style.display = "none";
  document.getElementById("statusMsg").textContent = "";
  const tzWrap = document.getElementById("timezoneNoteWrap");
  if (tzWrap) tzWrap.style.display = "none";
}

function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

function rgsOpenNotifyModal() {
  document.getElementById("rgsNotifyModal").classList.add("active");
}

function rgsCloseNotifyModal() {
  document.getElementById("rgsNotifyModal").classList.remove("active");
}

async function rgsSubmitNotifyForm(e) {
  e.preventDefault();
  const emailEl = rgsEl("#rgsEmail");
  const email = emailEl ? emailEl.value.trim() : "";
  if (!email || !email.includes("@")) {
    showToast("Please enter a valid email address.", "error");
    return;
  }

  const submitText = rgsEl("#rgsSubmitText");
  const submitLoading = rgsEl("#rgsSubmitLoading");
  const submitBtn = rgsEl("#rgsSubmitBtn");
  if (submitText) submitText.style.display = "none";
  if (submitLoading) submitLoading.style.display = "inline";
  if (submitBtn) submitBtn.disabled = true;

  try {
    const response = await fetch(CONFIG.NOTIFY_ME_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveNotification",
        email: email,
        referenceId: rgsCurrentReferenceId,
        orderId: rgsEl("#orderId") ? rgsEl("#orderId").textContent.trim() : "",
        place_of_loading: rgsEl("#pol").textContent,
        place_of_delivery: rgsEl("#pod").textContent,
        eta: rgsEl("#etaTop") ? rgsEl("#etaTop").textContent.trim() : "",
        timestamp: new Date().toISOString(),
        userTimeZone: USER_TIME_ZONE,
      }),
    });

    const responseText = await response.text();
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${responseText}`);

    const result = JSON.parse(responseText);
    if (result.success) {
      showToast(
        "✅ Thank you! You will now receive updates on your shipment status.",
        "success",
      );
      rgsCloseNotifyModal();
      e.target.reset();
    } else {
      throw new Error(result.message || result.error || "Unknown server error");
    }
  } catch (error) {
    console.error("Full error details:", error);
    showToast(`Error: ${error.message}. Check console for details.`, "error");
  } finally {
    if (submitText) submitText.style.display = "inline";
    if (submitLoading) submitLoading.style.display = "none";
    if (submitBtn) submitBtn.disabled = false;
  }
}

window.onload = initRecaptcha;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get("ref");
  if (refParam) {
    const input = rgsEl("#refInput");
    if (input) input.value = refParam.trim();
  }

  const searchBtn = rgsEl("#searchBtn");
  if (searchBtn) searchBtn.addEventListener("click", trackShipment);

  const refInput = rgsEl("#refInput");
  if (refInput) {
    refInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") trackShipment();
    });
  }

  const notifyMeBtn = rgsEl("#notifyMeBtn");
  if (notifyMeBtn) notifyMeBtn.addEventListener("click", rgsOpenNotifyModal);

  const modalCloseBtn = rgsEl("#rgsModalCloseBtn");
  if (modalCloseBtn)
    modalCloseBtn.addEventListener("click", rgsCloseNotifyModal);

  const modalCancelBtn = rgsEl("#rgsModalCancelBtn");
  if (modalCancelBtn)
    modalCancelBtn.addEventListener("click", rgsCloseNotifyModal);

  const notifyModal = rgsEl("#rgsNotifyModal");
  if (notifyModal) {
    notifyModal.addEventListener("click", function (e) {
      if (e.target === this) rgsCloseNotifyModal();
    });
  }

  const notifyForm = rgsEl("#rgsNotifyForm");
  if (notifyForm) notifyForm.addEventListener("submit", rgsSubmitNotifyForm);

  const mobileToggle = rgsEl("#mobile-menu-toggle");
  const mobileNav = rgsEl("#mobileNav");
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("change", () => {
      mobileNav.classList.toggle("active", mobileToggle.checked);
    });
  }

  const mobileNavClose = rgsEl("#mobileNavClose");
  if (mobileNavClose && mobileToggle) {
    mobileNavClose.addEventListener("click", () => {
      mobileToggle.checked = false;
      if (mobileNav) mobileNav.classList.remove("active");
    });
  }

  const yearEl = rgsEl("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

window.addEventListener("beforeunload", () => {
  if (window.currentUpdateInterval) {
    clearInterval(window.currentUpdateInterval);
  }
});
