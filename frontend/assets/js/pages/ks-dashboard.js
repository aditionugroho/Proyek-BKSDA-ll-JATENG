/* ============================================
   DASHBOARD KEPALA SEKSI — E-Office SKSDA
   Semua angka & list dari objek mock
   dashboardData, dirender oleh renderDashboard().
   Siap diganti fetch API.
   ============================================ */

/* ===== MOCK DATA ===== */
const dashboardData = {
  /* Baris stat card */
  stats: [
    { label: "Surat Masuk", value: 24, note: "+3 hari ini", noteIcon: "trendUp", tone: "blue", icon: "inbox" },
    { label: "Menunggu Persetujuan", value: 12, note: "Butuh aksi", noteIcon: "clock", tone: "amber", icon: "clock" },
    { label: "Disposisi Aktif", value: 8, note: "Dalam proses", noteIcon: "refresh", icon: "refresh" },
    { label: "Tugas Seksi", value: 36, note: "65%", progress: 65, icon: "clipboard" },
    { label: "Menunggu Review", value: 5, note: "Dari staf", noteIcon: "clock", icon: "clock" },
    { label: "Deadline Hari Ini", value: 3, valueRed: true, note: "Segera", noteIcon: "alert", notePrefix: "! ", tone: "red", icon: "alert" }
  ],

  /* Perlu tindakan */
  actions: [
    {
      icon: "mail",
      title: "Surat Dinas Kehutanan",
      desc: "Permohonan izin survei lahan kawasan konservasi Gunung Merbabu.",
      tags: [
        { text: "Batas: Hari Ini", tone: "gray" },
        { text: "High Priority", tone: "red" }
      ],
      btn: { text: "Review", href: "detail-surat-masuk.html", style: "blue" }
    },
    {
      icon: "file",
      title: "Laporan Kegiatan",
      desc: "Laporan patroli rutin resort wilayah utara periode bulan lalu.",
      tags: [{ text: "Dari: Budi Santoso", tone: "gray" }],
      btn: { text: "Review", href: "detail-tugas.html?id=3", style: "muted" }
    },
    {
      icon: "clipboard",
      title: "Tugas #TSK-021",
      desc: "Penyusunan draft anggaran seksi tahun depan.",
      tags: [{ text: "Batas: Besok", tone: "gray" }],
      btn: { text: "Buka", href: "tugas-seksi.html", style: "muted" }
    }
  ],

  /* Surat terbaru */
  letters: [
    { title: "Undangan Rapat Koordinasi Lintas Sektoral", meta: "10:30 WIB \u2022 Dari Sekda", accent: "blue" },
    { title: "Edaran Penetapan Hari Libur Nasional", meta: "09:15 WIB \u2022 Kemenpan RB", accent: "" },
    { title: "Tembusan Surat Penugasan Lapangan", meta: "Kemarin \u2022 Seksi Wilayah I", accent: "" }
  ],

  /* Jadwal hari ini */
  schedule: [
    {
      time: "13:00 - 15:00",
      accent: "blue",
      name: "Rapat Evaluasi Seksi",
      place: "Ruang Rapat Lt. 2",
      placeIcon: "pin"
    },
    {
      time: "15:30 - 16:30",
      accent: "",
      name: "Review Berkas Bulanan",
      place: "Meja Kerja",
      placeIcon: "monitor"
    }
  ],

  /* Progress pekerjaan seksi */
  progress: [
    { label: "Penyelesaian Disposisi", percent: 85, color: "#2563EB" },
    { label: "Tugas Rutin", percent: 92, color: "#10B981" },
    { label: "Laporan Bulanan", percent: 45, color: "#F59E0B" }
  ]
};

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  inbox: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  refresh: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  trendUp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  pin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  monitor: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
};

/* ===== RENDER: stat card ===== */
function renderStats() {
  document.getElementById("ksd-stats").innerHTML = dashboardData.stats.map((s) => {
    const noteClass = s.tone ? ` ksd-stat-note--${s.tone}` : "";
    const noteIcon = s.noteIcon ? ICONS[s.noteIcon] : "";
    const prefix = s.notePrefix || "";
    const progress = s.progress
      ? `<div class="ksd-stat-progress"><span style="width:${s.progress}%"></span></div>`
      : "";
    return `
      <article class="ksd-stat">
        <span class="ksd-stat-icon">${ICONS[s.icon]}</span>
        <p class="ksd-stat-label">${s.label}</p>
        <p class="ksd-stat-value${s.valueRed ? " ksd-stat-value--red" : ""}">${s.value}</p>
        <p class="ksd-stat-note${noteClass}">${noteIcon}${prefix}${s.note}</p>
        ${progress}
      </article>`;
  }).join("");
}

/* ===== RENDER: perlu tindakan ===== */
function renderActions() {
  const badge = document.getElementById("ksd-actions-badge");
  badge.textContent = `${dashboardData.actions.length} Item`;

  document.getElementById("ksd-actions").innerHTML = dashboardData.actions.map((a) => {
    const tags = a.tags
      .map((t) => `<span class="ksd-tag ksd-tag--${t.tone}">${t.text}</span>`)
      .join("");
    const btnClass = a.btn.style === "muted" ? "ksd-action-btn ksd-action-btn--muted" : "ksd-action-btn";
    return `
      <div class="ksd-action">
        <span class="ksd-action-icon">${ICONS[a.icon]}</span>
        <div class="ksd-action-body">
          <p class="ksd-action-title">${a.title}</p>
          <p class="ksd-action-desc">${a.desc}</p>
          <div class="ksd-action-meta">${tags}</div>
        </div>
        <a href="${a.btn.href}" class="${btnClass}">${a.btn.text}</a>
      </div>`;
  }).join("");
}

/* ===== RENDER: surat terbaru ===== */
function renderLetters() {
  document.getElementById("ksd-letters").innerHTML = dashboardData.letters.map(
    (l) => `
      <div class="ksd-letter${l.accent === "blue" ? " ksd-letter--blue" : ""}">
        <p class="ksd-letter-title">${l.title}</p>
        <span class="ksd-letter-meta">${l.meta}</span>
      </div>`
  ).join("");
}

/* ===== RENDER: jadwal hari ini ===== */
function renderSchedule() {
  document.getElementById("ksd-schedule").innerHTML = dashboardData.schedule.map(
    (s) => `
      <div class="ksd-schedule-item">
        <span class="ksd-schedule-dot${s.accent === "blue" ? " ksd-schedule-dot--blue" : ""}"></span>
        <div class="ksd-schedule-body">
          <span class="ksd-schedule-time${s.accent === "blue" ? " ksd-schedule-time--blue" : ""}">${s.time}</span>
          <div class="ksd-schedule-box">
            <p class="ksd-schedule-name">${s.name}</p>
            <span class="ksd-schedule-place">${ICONS[s.placeIcon]}${s.place}</span>
          </div>
        </div>
      </div>`
  ).join("");
}

/* ===== RENDER: progress pekerjaan (width dari mock, bukan hardcode) ===== */
function renderProgress() {
  document.getElementById("ksd-progress").innerHTML = dashboardData.progress.map(
    (p) => `
      <div class="ksd-progress-item">
        <div class="ksd-progress-label-row">
          <span class="ksd-progress-label">${p.label}</span>
          <span class="ksd-progress-percent" style="color:${p.color}">${p.percent}%</span>
        </div>
        <div class="ksd-progress-bar">
          <span style="width:${p.percent}%; background:${p.color}"></span>
        </div>
      </div>`
  ).join("");
}

/* ===== RENDER UTAMA ===== */
function renderDashboard() {
  renderStats();
  renderActions();
  renderLetters();
  renderSchedule();
  renderProgress();
}

renderDashboard();

/* ===== RUNNING TEXT (PENGUMUMAN) — utilitas bersama ===== */
import { initRunningText, listenRunningText } from "../utils/running-text.js";

initRunningText("kepala-seksi");
listenRunningText("kepala-seksi");
