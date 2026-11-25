/* ============================================
   PENGUMUMAN BERJALAN (ADMIN) — E-Office SKSDA
   Kelola localStorage "runningText" yang
   dibaca dashboard pegawai
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { readRunningTextConfig, RUNNING_TEXT_DEFAULT } from "../utils/running-text.js";

/* ===== DEFAULT (sama dengan sisi pegawai — sudah termasuk audience) ===== */

/* ===== ELEMEN ===== */
const enabledToggle = document.getElementById("pgm-enabled");
const textInput = document.getElementById("pgm-text");
const textError = document.getElementById("pgm-text-error");
const counterNum = document.getElementById("pgm-counter-num");
const saveBtn = document.getElementById("pgm-save");
const saveLabel = document.getElementById("pgm-save-label");
const statusBadge = document.getElementById("pgm-status-badge");
const statusText = document.getElementById("pgm-status-text");
const updatedInfo = document.getElementById("pgm-updated");
const previewTrack = document.getElementById("pgm-preview-track");
const speedCards = document.querySelectorAll(".pgm-speed-card");
const audienceCards = document.querySelectorAll(".pgm-audience-card");
const audienceError = document.getElementById("pgm-audience-error");

/* ===== LOAD CONFIG (dengan migrasi audience) ===== */
function loadConfig() {
  return readRunningTextConfig();
}

/* ===== ISI FORM DARI CONFIG ===== */
function applyConfigToForm(config) {
  enabledToggle.checked = config.enabled;
  textInput.value = config.text;
  selectSpeed(config.speed);
  selectAudience(config.audience);

  counterNum.textContent = config.text.length;
  textInput.classList.remove("is-error");
  textError.hidden = true;
  audienceError.hidden = true;

  renderStatusBadge(config.enabled);
  renderUpdatedInfo(config.updatedAt);
  renderSaveLabel();
  renderPreview(config.text, config.speed);
}

function selectSpeed(speed) {
  speedCards.forEach((card) => {
    const radio = card.querySelector("input");
    const isActive = Number(radio.value) === Number(speed);
    radio.checked = isActive;
    card.classList.toggle("is-active", isActive);
  });
}

/* Audiens: array role → centang kartu terkait */
function selectAudience(audience) {
  audienceCards.forEach((card) => {
    const cb = card.querySelector("input");
    const isActive = audience.includes(cb.value);
    cb.checked = isActive;
    card.classList.toggle("is-active", isActive);
  });
}

function currentAudience() {
  return Array.from(audienceCards)
    .map((card) => card.querySelector("input"))
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
}

function currentSpeed() {
  const checked = document.querySelector('input[name="speed"]:checked');
  return Number(checked ? checked.value : 30);
}

/* ===== BADGE & LABEL ===== */
function renderStatusBadge(enabled) {
  statusBadge.className = `pgm-status-badge ${enabled ? "pgm-status-badge--on" : "pgm-status-badge--off"}`;
  statusText.textContent = enabled ? "Aktif" : "Nonaktif";
}

function renderSaveLabel() {
  saveLabel.textContent = enabledToggle.checked ? "Simpan & Terapkan" : "Simpan & Nonaktifkan";
}

function renderUpdatedInfo(updatedAt) {
  if (!updatedAt) {
    updatedInfo.textContent = "Belum pernah diperbarui (memakai teks default).";
    return;
  }
  const d = new Date(updatedAt);
  updatedInfo.textContent = `Terakhir diperbarui: ${d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} oleh Administrator`;
}

/* ===== PREVIEW LIVE (sebelum disimpan) ===== */
function renderPreview(text, speed) {
  previewTrack.textContent = text || "(kosong)";
  previewTrack.style.setProperty("--marquee-speed", speed + "s");

  previewTrack.classList.remove("is-static");
  previewTrack.style.animation = "none";
  requestAnimationFrame(() => {
    const viewport = previewTrack.parentElement;
    if (previewTrack.scrollWidth <= viewport.clientWidth) {
      previewTrack.classList.add("is-static");
    } else {
      previewTrack.style.animation = "";
    }
  });
}

/* ===== EVENT: toggle & textarea & speed → live update ===== */
enabledToggle.addEventListener("change", () => {
  renderSaveLabel();
  renderStatusBadge(enabledToggle.checked);
});

textInput.addEventListener("input", () => {
  counterNum.textContent = textInput.value.length;
  textInput.classList.remove("is-error");
  textError.hidden = true;
  renderPreview(textInput.value, currentSpeed());
});

speedCards.forEach((card) => {
  card.addEventListener("change", () => {
    selectSpeed(currentSpeed());
    renderPreview(textInput.value, currentSpeed());
  });
});

/* Kartu audiens: toggle visual saat checkbox berubah */
audienceCards.forEach((card) => {
  card.addEventListener("change", () => {
    const cb = card.querySelector("input");
    card.classList.toggle("is-active", cb.checked);
    if (currentAudience().length > 0) audienceError.hidden = true;
  });
});

/* ===== SIMPAN ===== */
saveBtn.addEventListener("click", () => {
  const text = textInput.value.trim();

  let valid = true;

  if (text.length < 5) {
    textInput.classList.add("is-error");
    textError.hidden = false;
    valid = false;
  }

  const audience = currentAudience();
  if (audience.length === 0) {
    audienceError.hidden = false;
    valid = false;
  }

  if (!valid) return;

  const config = {
    text,
    speed: currentSpeed(),
    enabled: enabledToggle.checked,
    audience,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem("runningText", JSON.stringify(config));

  applyConfigToForm(config);
  showToast(
    config.enabled
      ? "Pengumuman disimpan & aktif di dashboard pegawai"
      : "Pengumuman disimpan (status nonaktif)"
  );
});

/* ===== KEMBALIKAN DEFAULT ===== */
document.getElementById("pgm-reset").addEventListener("click", () => {
  openModal({
    title: "Kembalikan Default",
    desc: "Teks pengumuman akan dikembalikan ke pengaturan bawaan sistem. Lanjutkan?",
    confirmLabel: "Ya, Kembalikan",
    onConfirm: () => {
      const config = { ...RUNNING_TEXT_DEFAULT, audience: [...RUNNING_TEXT_DEFAULT.audience], updatedAt: new Date().toISOString() };
      localStorage.setItem("runningText", JSON.stringify(config));
      applyConfigToForm(config);
      showToast("Pengumuman dikembalikan ke default");
    }
  });
});

/* ===== Inisialisasi ===== */
applyConfigToForm(loadConfig());
