/* ============================================
   DASHBOARD PEGAWAI — E-Office SKSDA
   Semua data dari pgDashboardData,
   render via JS. Siap diganti fetch API.
   ============================================ */

/* ===== MOCK DATA ===== */
/* ===== DATA: diisi loadDashboard() — API saat LIVE, mock saat belum ===== */
let pgDashboardData = null;

const PG_DASHBOARD_MOCK = {
  stats: [
    {
      label: "Tugas Aktif",
      value: "12",
      note: { text: "+2 minggu ini", icon: "trendUp", tone: "green" },
      icon: "clipboard",
      tone: "blue",
      accent: "#DBEAFE"
    },
    {
      label: "Deadline Hari Ini",
      value: "3",
      note: { text: "Segera selesaikan", icon: "alert", tone: "amber" },
      icon: "calendar",
      tone: "amber",
      accent: "#FEF3C7"
    },
    {
      label: "Disposisi Baru",
      value: "5",
      note: { text: "Belum dibaca", icon: "mail", tone: "gray" },
      icon: "mail",
      tone: "blue",
      accent: "#DBEAFE"
    },
    {
      label: "Menunggu Review",
      value: "8",
      note: { text: "Sedang diproses", tone: "gray" },
      icon: "clipboardCheck",
      tone: "gray",
      accent: "#F1F5F9"
    }
  ],

  prioritas: [
    {
      id: 1,
      badge: { text: "MENDESAK", tone: "red" },
      judul: "Laporan Akhir Patroli",
      deskripsi: "Menyusun laporan akhir hasil patroli kawasan hutan lindung blok utara.",
      waktu: "14:00 WIB",
      waktuTone: "red",
      progress: 75,
      progressColor: "#2563EB"
    },
    {
      id: 2,
      badge: { text: "TINGGI", tone: "amber" },
      judul: "Verifikasi Berkas CV. Fauna Lestari",
      deskripsi: "Pemeriksaan kelengkapan berkas administrasi CV. Fauna Lestari.",
      waktu: "16:30 WIB",
      waktuTone: "orange",
      progress: 30,
      progressColor: "#F59E0B"
    }
  ],

  disposisi: [
    {
      icon: "mail",
      judul: "Surat Undangan Rapat K",
      waktu: "09:00",
      dari: "Dari: Kepala SKSDA",
      badge: { text: "INFORMASI", tone: "blue" }
    },
    {
      icon: "file",
      judul: "Tindak Lanjut Laporan",
      waktu: "Kemarin",
      dari: "Dari: Kasi Konservasi Wilayah",
      badge: { text: "TINDAKAN", tone: "red" }
    },
    {
      icon: "file",
      judul: "SK Penugasan Tim Mon",
      waktu: "22 Okt",
      dari: "Dari: Subbag Tata Usaha",
      badge: { text: "BIASA", tone: "gray" }
    }
  ]
};

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  clipboardCheck: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  trendUp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
  alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>'
};

/* ===== RENDER: stat card (teks kiri, icon kanan) ===== */
function renderStats() {
  document.getElementById("pgd-stats").innerHTML = pgDashboardData.stats
    .map((s) => {
      const noteIcon = s.note.icon ? ICONS[s.note.icon] : "";
      const noteTone = s.note.tone && s.note.tone !== "gray" ? ` pgd-stat-note--${s.note.tone}` : "";
      return `
      <article class="pgd-stat" style="--stat-accent:${s.accent}">
        <div class="pgd-stat-body">
          <p class="pgd-stat-label">${s.label}</p>
          <p class="pgd-stat-value">${s.value}</p>
          <p class="pgd-stat-note${noteTone}">${noteIcon}${s.note.text}</p>
        </div>
        <span class="pgd-stat-icon pgd-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
      </article>`;
    })
    .join("");
}

/* ===== RENDER: prioritas hari ini ===== */
function renderPrioritas() {
  document.getElementById("pgd-priority").innerHTML = pgDashboardData.prioritas
    .map(
      (p) => `
      <article class="pgd-priority-item">
        <div class="pgd-priority-body">
          <div class="pgd-priority-top">
            <span class="pgd-badge pgd-badge--${p.badge.tone}">${p.badge.text}</span>
            <h3 class="pgd-priority-title">${p.judul}</h3>
          </div>
          <p class="pgd-priority-desc">${p.deskripsi}</p>
          <div class="pgd-priority-bottom">
            <div class="pgd-progress-wrap">
              <div class="pgd-progress-label-row">
                <span class="pgd-progress-label">Progress</span>
                <span class="pgd-progress-percent">${p.progress}%</span>
              </div>
              <div class="pgd-progress-bar">
                <span style="width:${p.progress}%; background:${p.progressColor}"></span>
              </div>
            </div>
            <a href="detail-tugas.html?id=${p.id}" class="pgd-work-btn">Kerjakan</a>
          </div>
        </div>
        <div class="pgd-priority-side">
          <span class="pgd-priority-time pgd-priority-time--${p.waktuTone}">${ICONS.clock}${p.waktu}</span>
        </div>
      </article>`
    )
    .join("");
}

/* ===== RENDER: disposisi terbaru ===== */
function renderDisposisi() {
  document.getElementById("pgd-disposisi").innerHTML = pgDashboardData.disposisi
    .map(
      (d) => `
      <div class="pgd-disposisi-item">
        <span class="pgd-disposisi-icon">${ICONS[d.icon]}</span>
        <div class="pgd-disposisi-body">
          <p class="pgd-disposisi-title">${d.judul}</p>
          <p class="pgd-disposisi-from">${d.dari}</p>
          <span class="pgd-badge pgd-badge--${d.badge.tone}">${d.badge.text}</span>
        </div>
        <span class="pgd-disposisi-time">${d.waktu}</span>
      </div>`
    )
    .join("");
}

/* ===== RENDER UTAMA ===== */
function renderDashboard() {
  renderStats();
  renderPrioritas();
  renderDisposisi();
}

async function loadDashboard() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getDashboardPegawai();
  }
  return PG_DASHBOARD_MOCK;
}

async function init() {
  try {
    pgDashboardData = await loadDashboard();
  } catch (e) {
    console.error("Gagal memuat dashboard:", e);
    return;
  }
  renderDashboard();
}

init();

/* ============================================
   RUNNING TEXT (PENGUMUMAN) — utilitas bersama
   assets/js/utils/running-text.js
   ============================================ */

import { initRunningText, listenRunningText } from "../utils/running-text.js";

initRunningText("pegawai");
listenRunningText("pegawai");
