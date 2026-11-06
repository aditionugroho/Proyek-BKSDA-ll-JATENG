/* ============================================
   DASHBOARD ADMIN â€” E-Office SKSDA
   Semua angka dari mock data di bawah;
   render dinamis via JS (siap diganti fetch API)
   ============================================ */

/* ===== MOCK DATA ===== */

/* Kartu statistik */
const STATS_MOCK = [

  {
    label: "Total Pengguna",
    value: 148,
    unit: "Akun",
    icon: "users",
    note: { text: "+12 bulan ini", tone: "green" }
  },
  {
    label: "Pengguna Aktif",
    value: 132,
    unit: "Aktif",
    icon: "userCheck",
    cornerBadge: { text: "STATUS", tone: "green" },
    note: { text: "16 Nonaktif / Cuti", tone: "gray" }
  },
  {
    label: "Surat Masuk",
    value: 1248,
    unit: "Berkas",
    icon: "inbox",
    note: { text: "42 butuh telaah", tone: "blue" }
  },
  {
    label: "Surat Keluar",
    value: 856,
    unit: "Terbit",
    icon: "send",
    note: { text: "18 verifikasi paraf", tone: "orange" }
  },
  {
    label: "Surat Bulan Ini",
    value: 342,
    unit: "Total",
    icon: "calendar",
    cornerBadge: { text: "94%", tone: "green" },
    progress: 94
  },
  {
    label: "Aktivitas Sistem",
    value: 2840,
    unit: "Log",
    icon: "activity",
    cornerIcon: "gear",
    note: { text: "Audit trail terenkripsi", tone: "gray" }
  }
];

/* Tab & data chart (angka absolut; tinggi batang dihitung %) */
let CHART_TABS = ["Surat Masuk", "Surat Keluar", "Draft Konsep", "Selesai Disposisi"];

const CHART_DATA_MOCK = [

  { month: "Mei", verified: 210, pending: 50 },
  { month: "Jun", verified: 250, pending: 48 },
  { month: "Jul", verified: 225, pending: 51 },
  { month: "Agu", verified: 262, pending: 48 },
  { month: "Sep", verified: 274, pending: 50 },
  { month: "Okt", verified: 292, pending: 50 }
];

/* Audit trail */
const AUDIT_TRAIL_MOCK = [

  {
    icon: "userPlus",
    tone: "blue",
    text: "Admin menambahkan pengguna baru: Budi Santoso",
    detail: "Polhut Wilayah I Surakarta",
    time: "10 Menit yang lalu"
  },
  {
    icon: "inbox",
    tone: "green",
    text: "Surat masuk teregistrasi: S.892/SKSDA-JT/K.21/2023",
    detail: "Pengirim: Ditjen KSDAE Kementerian LHK",
    time: "25 Menit yang lalu"
  },
  {
    icon: "send",
    tone: "blue",
    text: "Surat keluar diinput: ND.104/SKSDA-JT/Kasi-II/2023",
    detail: "Nota Dinas Seksi Konservasi Wilayah II",
    time: "1 Jam yang lalu"
  },
  {
    icon: "download",
    tone: "gray",
    text: "Ekspor laporan bulanan berhasil diunduh",
    detail: "Format PDF (Rekapitulasi Triwulan III)",
    time: "2 Jam yang lalu"
  },
  {
    icon: "refresh",
    tone: "green",
    text: "Backup harian otomatis selesai",
    detail: "Ukuran arsip: 2.4 GB terenkripsi AES 256",
    time: "03:00 WIB"
  }
];

/* Kesehatan sistem */
const HEALTH_MOCK = [

  {
    label: "Database Cluster",
    badge: { text: "NORMAL", tone: "green" },
    title: "PostgreSQL 15 High-Availability",
    desc: "Latensi kueri: 12ms (Stabil)",
    bottom: { type: "check", text: "Replika Aktif: 2 Node" }
  },
  {
    label: "Penyimpanan Dokumen",
    badge: { text: "64% TERPAKAI", tone: "blue" },
    title: "Arsip Berkas Digital",
    progress: 64,
    bottom: { type: "pair", left: "1.28 TB terpakai", right: "Kapasitas 2.0 TB" }
  },
  {
    label: "Jadwal Backup",
    badge: { text: "SUKSES", tone: "green" },
    title: "Hari ini, 03:00 WIB",
    desc: "Snapshot tersimpan di Cloud Storage Off-site",
    bottom: { type: "button", text: "Kelola Backup", href: "backup-data.html" }
  },
  {
    label: "Server Uptime",
    badge: { text: "99.98%", tone: "green" },
    title: "SKSDA DC Semarang",
    desc: "Beban CPU 18% \u2022 RAM 38%",
    bottom: { type: "check", text: "Daring sejak 48 hari lalu" }
  }
];

/* ===== DATA: diisi loadDashboard() — API saat LIVE, mock saat belum ===== */
let STATS = STATS_MOCK;
let CHART_DATA = CHART_DATA_MOCK;
let AUDIT_TRAIL = AUDIT_TRAIL_MOCK;
let HEALTH = HEALTH_MOCK;

async function loadDashboard() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const res = await EOfficeAPI.getDashboardAdmin();
    return {
      stats: res.stats || STATS_MOCK,
      chartTabs: res.chartTabs || CHART_TABS,
      chartData: res.chartData || CHART_DATA_MOCK,
      auditTrail: res.auditTrail || AUDIT_TRAIL_MOCK,
      health: res.health || HEALTH_MOCK
    };
  }
  return {
    stats: STATS_MOCK,
    chartTabs: CHART_TABS,
    chartData: CHART_DATA_MOCK,
    auditTrail: AUDIT_TRAIL_MOCK,
    health: HEALTH_MOCK
  };
}

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  userCheck: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>',
  inbox: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  activity: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
  gear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
  arrowUpRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>',
  userPlus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  refresh: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  zap: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>'
};

/* ===== RENDER: tanggal hero (dinamis, format Indonesia) ===== */
function renderHeroDate() {
  const el = document.getElementById("hero-date");
  if (!el) return;

  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const now = new Date();

  el.textContent = `${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
}

/* ===== RENDER: kartu statistik ===== */
function renderStats() {
  const grid = document.getElementById("stat-grid");
  if (!grid) return;

  grid.innerHTML = STATS.map((stat) => {
    // Pojok kanan atas: badge / icon gear / panah â†—
    let corner = `<span class="stat-corner">${ICONS.arrowUpRight}</span>`;
    if (stat.cornerBadge) {
      corner = `<span class="stat-corner-badge">${stat.cornerBadge.text}</span>`;
    } else if (stat.cornerIcon) {
      corner = `<span class="stat-corner">${ICONS[stat.cornerIcon]}</span>`;
    }

    // Catatan bawah (dengan variasi warna / titik)
    let note = "";
    if (stat.note) {
      const dots = { blue: "note-dot--blue", orange: "note-dot--orange" };
      const dot = dots[stat.note.tone] ? `<span class="note-dot ${dots[stat.note.tone]}"></span>` : "";
      note = `<p class="stat-note stat-note--${stat.note.tone}">${dot}${stat.note.text}</p>`;
    }

    // Progress bar (jika ada)
    const progress = stat.progress
      ? `<div class="stat-progress"><span style="width:${stat.progress}%"></span></div>`
      : "";

    return `
      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-icon">${ICONS[stat.icon]}</span>
          ${corner}
        </div>
        <p class="stat-label">${stat.label}</p>
        <p class="stat-value">${stat.value.toLocaleString("id-ID")}</p>
        <p class="stat-sub">${stat.unit}</p>
        ${note}
        ${progress}
      </article>`;
  }).join("");
}

/* ===== RENDER: tab chart (klik = ganti state aktif, data mock) ===== */
function renderChartTabs() {
  const wrap = document.getElementById("chart-tabs");
  if (!wrap) return;

  wrap.innerHTML = CHART_TABS.map(
    (tab, i) => `<button type="button" class="chart-tab${i === 0 ? " is-active" : ""}">${tab}</button>`
  ).join("");

  wrap.addEventListener("click", (event) => {
    const btn = event.target.closest(".chart-tab");
    if (!btn) return;
    wrap.querySelectorAll(".chart-tab").forEach((t) => t.classList.remove("is-active"));
    btn.classList.add("is-active");
  });
}

/* ===== RENDER: bar chart CSS murni + animasi tinggi ===== */
function renderChart() {
  const plot = document.getElementById("chart-plot");
  if (!plot) return;

  const max = 400; // skala tinggi batang

  plot.innerHTML = CHART_DATA.map((d, i) => {
    const total = d.verified + d.pending;
    const isLast = i === CHART_DATA.length - 1;
    return `
      <div class="chart-col">
        <span class="chart-value">${isLast ? total.toLocaleString("id-ID") : ""}</span>
        <div class="chart-bar" data-verified="${(d.verified / max) * 100}" data-pending="${(d.pending / max) * 100}">
          <div class="seg seg--pending" style="height:0%"></div>
          <div class="seg seg--verified" style="height:0%"></div>
        </div>
        <span class="chart-month">${d.month}</span>
      </div>`;
  }).join("");

  // Animasi: tinggi 0 â†’ target setelah elemen dirender
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      plot.querySelectorAll(".chart-bar").forEach((bar) => {
        bar.querySelector(".seg--pending").style.height = `${bar.dataset.pending}%`;
        bar.querySelector(".seg--verified").style.height = `${bar.dataset.verified}%`;
      });
    });
  });
}

/* ===== RENDER: audit trail ===== */
function renderAuditTrail() {
  const list = document.getElementById("audit-list");
  if (!list) return;

  list.innerHTML = AUDIT_TRAIL.map(
    (item) => `
      <li class="audit-item">
        <span class="audit-icon audit-icon--${item.tone}">${ICONS[item.icon]}</span>
        <div>
          <p class="audit-text">${item.text}</p>
          <p class="audit-detail">${item.detail}</p>
          <p class="audit-time">${item.time}</p>
        </div>
      </li>`
  ).join("");
}

/* ===== RENDER: kesehatan sistem ===== */
function renderHealth() {
  const grid = document.getElementById("health-grid");
  if (!grid) return;

  grid.innerHTML = HEALTH.map((card) => {
    // Varian bagian bawah kartu
    let bottom = "";
    if (card.bottom.type === "check") {
      bottom = `<div class="health-check">${ICONS.check}<span>${card.bottom.text}</span></div>`;
    } else if (card.bottom.type === "pair") {
      bottom = `<div class="health-pair"><span>${card.bottom.left}</span><span>${card.bottom.right}</span></div>`;
    } else if (card.bottom.type === "button") {
      bottom = `<a href="${card.bottom.href}" class="btn-outline">${card.bottom.text}</a>`;
    }

    const progress = card.progress
      ? `<div class="health-progress"><span style="width:${card.progress}%"></span></div>`
      : "";

    const desc = card.desc ? `<p class="health-card-desc">${card.desc}</p>` : "";

    return `
      <article class="health-card">
        <div class="health-card-top">
          <span class="health-card-label">${card.label}</span>
          <span class="health-badge health-badge--${card.badge.tone}">${card.badge.text}</span>
        </div>
        <h3 class="health-card-title">${card.title}</h3>
        ${desc}
        ${progress}
        <div class="health-card-bottom">${bottom}</div>
      </article>`;
  }).join("");
}

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  try {
    const res = await loadDashboard();
    STATS = res.stats;
    CHART_TABS = res.chartTabs;
    CHART_DATA = res.chartData;
    AUDIT_TRAIL = res.auditTrail;
    HEALTH = res.health;
  } catch (e) {
    console.error("Gagal memuat dashboard:", e);
    return;
  }
  renderHeroDate();
  renderStats();
  renderChartTabs();
  renderChart();
  renderAuditTrail();
  renderHealth();
}

init();
