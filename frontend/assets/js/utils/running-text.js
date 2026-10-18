/* ============================================
   UTILITIES: RUNNING TEXT — E-Office SKSDA
   Dipakai bersama dashboard Pegawai & KS.
   Config: localStorage "runningText"
   { text, speed, enabled, audience[], updatedAt }
   ============================================ */

export const RUNNING_TEXT_DEFAULT = {
  text: "Selamat datang di e-Office BKSDA SKW II Pemalang. Segera selesaikan tugas dengan deadline hari ini. Rapat koordinasi seksi pukul 13:00 di Ruang Rapat Lt. 2.",
  speed: 30,
  enabled: true,
  audience: ["pegawai"],
  updatedAt: null
};

/* Baca config + migrasi lama (tanpa audience → ["pegawai"]) */
export function readRunningTextConfig() {
  let config;
  try {
    config = JSON.parse(localStorage.getItem("runningText") || "null") || { ...RUNNING_TEXT_DEFAULT };
  } catch {
    config = { ...RUNNING_TEXT_DEFAULT };
  }
  if (!Array.isArray(config.audience) || config.audience.length === 0) {
    config.audience = ["pegawai"];
  }
  return config;
}

/**
 * Render running text untuk role tertentu.
 * Bar disembunyikan bila disabled atau role tidak termasuk audiens.
 * @param {string} role "pegawai" | "kepala-seksi" | "admin"
 */
export function initRunningText(role) {
  const bar = document.getElementById("running-text-bar");
  if (!bar) return;

  const config = readRunningTextConfig();

  if (!config.enabled || !config.audience.includes(role)) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "";

  const track = document.getElementById("running-text-track");
  track.textContent = config.text;
  track.style.setProperty("--marquee-speed", (config.speed || 30) + "s");

  /* Teks lebih pendek dari viewport → statis center */
  track.classList.remove("is-static");
  track.style.animation = "none";
  requestAnimationFrame(() => {
    const viewport = track.parentElement;
    if (track.scrollWidth <= viewport.clientWidth) {
      track.classList.add("is-static");
    } else {
      track.style.animation = "";
    }
  });
}

/**
 * Pasang listener update otomatis antar-tab (event storage).
 * @param {string} role
 */
export function listenRunningText(role) {
  window.addEventListener("storage", (e) => {
    if (e.key === "runningText") initRunningText(role);
  });
}
