/* ============================================
   PROFIL ADMIN (READ-ONLY) — E-Office SKSDA
   Data dibaca dari shared constant
   assets/js/data/admin-profile.js
   ============================================ */

import { ADMIN_PROFILE } from "../data/admin-profile.js";

const PROFILE = ADMIN_PROFILE;
const AKSES = ADMIN_PROFILE.akses;
const AKTIVITAS = ADMIN_PROFILE.aktivitas;
const LOGIN_INFO = ADMIN_PROFILE.loginInfo;

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  building: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="9" y1="22" x2="9" y2="18"></line><line x1="15" y1="22" x2="15" y2="18"></line><line x1="9" y1="6" x2="9" y2="10"></line><line x1="15" y1="6" x2="15" y2="10"></line></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  phone: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
  logIn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>',
  export: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  database: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
  user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  laptop: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
};

/* ===== RENDER: hero profil ===== */
function renderHero() {
  const meta = PROFILE.meta.map(
    (m, i) => `
      ${i > 0 ? '<span class="hero-meta-sep" aria-hidden="true"></span>' : ""}
      <span class="hero-meta-item">${ICONS[m.icon]}${m.text}</span>`
  ).join("");

  document.getElementById("profil-hero").innerHTML = `
    <div class="hero-left">
      <span class="hero-avatar">
        ${ICONS.shield}
        <span class="hero-avatar-check" aria-hidden="true">${ICONS.check}</span>
      </span>
      <div>
        <div class="hero-name-row">
          <h1 class="hero-name">${PROFILE.nama}</h1>
          <span class="active-pill"><span class="dot"></span>${PROFILE.statusPill}</span>
        </div>
        <p class="hero-role">${PROFILE.jabatan}</p>
        <div class="hero-meta">${meta}</div>
      </div>
    </div>
    <div class="hero-right">
      <div class="hero-box">
        <p class="hero-box-label">ROLE OTORITAS</p>
        <p class="hero-box-value">${PROFILE.roleOtoritas}</p>
      </div>
      <div class="hero-box">
        <p class="hero-box-label">TERAKHIR LOGIN</p>
        <p class="hero-box-value hero-box-value--dark">${PROFILE.terakhirLogin}</p>
      </div>
    </div>`;
}

/* ===== RENDER: grid informasi akun ===== */
function renderInfo() {
  document.getElementById("info-grid").innerHTML = PROFILE.info
    .map((item) => {
      const toneClass = item.tone === "blue" ? " info-value--blue" : item.tone === "green" ? " info-value--green" : "";
      const monoClass = item.mono ? " mono" : "";
      const dot = item.dot ? '<span class="dot"></span>' : "";
      return `
        <div class="info-item">
          <p class="info-label">${item.label}</p>
          <p class="info-value${toneClass}${monoClass}">${dot}${item.value}</p>
        </div>`;
    })
    .join("");

  document.getElementById("info-updated").textContent = PROFILE.terakhirDiperbarui;
}

/* ===== RENDER: grid hak akses ===== */
function renderAkses() {
  document.getElementById("akses-grid").innerHTML = AKSES.map(
    (a) => `
      <div class="akses-item">
        ${ICONS.checkCircle}
        <span>${a}</span>
      </div>`
  ).join("");
}

/* ===== RENDER: list aktivitas ===== */
function renderAktivitas() {
  document.getElementById("aktivitas-list").innerHTML = AKTIVITAS.map(
    (a) => `
      <div class="aktivitas-item">
        <span class="aktivitas-icon aktivitas-icon--${a.tone}">${ICONS[a.icon]}</span>
        <div class="aktivitas-body">
          <div class="aktivitas-top">
            <p class="aktivitas-title">${a.title}</p>
            <span class="aktivitas-meta">
              <span class="aktivitas-time">${a.time}</span>
              <span class="badge badge--${a.badge.tone}">${a.badge.text}</span>
            </span>
          </div>
          <p class="aktivitas-detail">${a.detail}</p>
        </div>
      </div>`
  ).join("");
}

/* ===== RENDER: informasi login ===== */
function renderLogin() {
  document.getElementById("login-list").innerHTML = LOGIN_INFO.map((row) => {
    let value;
    if (row.badge) {
      value = `<span class="badge badge--${row.badge.tone}">${row.badge.text}</span>`;
    } else {
      const icon = row.icon ? ICONS[row.icon] : "";
      const dot = row.dot ? '<span class="kv-dot"></span>' : "";
      const cls = row.bold ? "kv-value kv-value--bold" : row.green ? "kv-value kv-value--green" : "kv-value";
      value = `<span class="${cls}">${dot}${icon}${row.value}</span>`;
    }
    return `
      <div class="kv-row">
        <span class="kv-label">${row.label}</span>
        ${value}
      </div>`;
  }).join("");
}

/* ===== Inisialisasi ===== */
renderHero();
renderInfo();
renderAkses();
renderAktivitas();
renderLogin();
