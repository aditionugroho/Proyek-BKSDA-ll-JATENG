
/* ============================================
   DASHBOARD ADMIN — E-OFFICE BKSDA
   Integrasi CodeIgniter 4 + MySQL

   API:
   GET /api/dashboard/summary
   GET /api/dashboard/trend?year=2026

   Database mengikuti konfigurasi backend.
   Tidak menggunakan data mock.
   ============================================ */

"use strict";

/* ========== STATE ========== */

let STATS = [];
let CHART_DATA = [];
let activeChart = "masuk";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr",
  "Mei", "Jun", "Jul", "Agu",
  "Sep", "Okt", "Nov", "Des"
];

/* ========== ICON SVG ========== */

function makeIcon(paths) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="2"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true">
      ${paths}
    </svg>
  `;
}

const ICONS = {
  users: makeIcon(`
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  `),

  userCheck: makeIcon(`
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <polyline points="17 11 19 13 23 9"/>
  `),

  inbox: makeIcon(`
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  `),

  send: makeIcon(`
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  `),

  calendar: makeIcon(`
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  `),

  activity: makeIcon(`
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  `),

  arrowUpRight: makeIcon(`
    <line x1="7" y1="17" x2="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  `)
};

/* ========== HELPERS ========== */

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("id-ID");
}

function localDate(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSession() {
  try {
    const raw =
      sessionStorage.getItem("eoffice_session") ||
      localStorage.getItem("eoffice_session");

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ========== API BACKEND ========== */

async function loadDashboard() {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error(
      "API E-Office belum tersedia atau mode LIVE belum aktif."
    );
  }

  const now = new Date();

  const firstDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const lastDay = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  );

  const params = new URLSearchParams({
    tanggal_mulai: localDate(firstDay),
    tanggal_akhir: localDate(lastDay)
  });

  const [summary, trendResponse] =
    await Promise.all([
      EOfficeAPI.request(
        "GET",
        `/dashboard/summary?${params.toString()}`
      ),
      EOfficeAPI.request(
        "GET",
        `/dashboard/trend?year=${now.getFullYear()}`
      )
    ]);

  if (
    summary?.status !== true ||
    !summary.data
  ) {
    throw new Error(
      "Respons ringkasan dashboard tidak valid."
    );
  }

  if (
    trendResponse?.status !== true ||
    !Array.isArray(trendResponse.data?.trend)
  ) {
    throw new Error(
      "Respons grafik dashboard tidak valid."
    );
  }

  const d = summary.data;

  const number = (value) => Number(value ?? 0);

  const stats = [
    {
      label: "Total Pengguna",
      value: number(d.pengguna?.total),
      unit: "Akun",
      icon: "users"
    },
    {
      label: "Pengguna Aktif",
      value: number(d.pengguna?.aktif),
      unit: "Aktif",
      icon: "userCheck",
      cornerBadge: {
        text: "STATUS",
        tone: "green"
      },
      note: {
        text:
          `${number(d.pengguna?.nonaktif)} pengguna nonaktif`,
        tone: "gray"
      }
    },
    {
      label: "Surat Masuk",
      value: number(d.surat_masuk?.total),
      unit: "Berkas",
      icon: "inbox"
    },
    {
      label: "Surat Keluar",
      value: number(d.surat_keluar?.total),
      unit: "Berkas",
      icon: "send"
    },
    {
      label: "Surat Bulan Ini",
      value:
        number(d.surat_masuk?.periode) +
        number(d.surat_keluar?.periode),
      unit: "Masuk + Keluar",
      icon: "calendar"
    },
    {
      label: "Disposisi Aktif",
      value: number(d.disposisi?.aktif),
      unit: "Disposisi",
      icon: "activity",
      note: {
        text:
          `${number(d.disposisi?.selesai)} disposisi selesai`,
        tone: "gray"
      }
    }
  ];

  const currentMonth = now.getMonth() + 1;

  const chartData = trendResponse.data.trend
    .filter((item) => {
      const month = Number(item.bulan);
      return month >= 1 && month <= currentMonth;
    })
    .slice(-6)
    .map((item) => {
      const index = Number(item.bulan) - 1;

      return {
        month: MONTH_NAMES[index],
        masuk: number(item.surat_masuk),
        keluar: number(item.surat_keluar)
      };
    });

  return {
    stats,
    chartData
  };
}

/* ========== TANGGAL DASHBOARD ========== */

function renderHeroDate() {
  const el = document.getElementById("hero-date");

  if (!el) return;

  el.textContent = new Date().toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}

/* ========== IDENTITAS ADMIN ========== */

function renderIdentity() {
  const session = getSession();

  const title = document.querySelector(
    ".hero-title"
  );

  if (title) {
    title.textContent = session?.name
      ? `Selamat Datang, ${session.name}`
      : "Dashboard Administrator";
  }
}

/* ========== STATISTIK ========== */

function renderStats() {
  const grid = document.getElementById(
    "stat-grid"
  );

  if (!grid) return;

  grid.innerHTML = STATS.map((stat) => {
    let corner = `
      <span class="stat-corner">
        ${ICONS.arrowUpRight}
      </span>
    `;

    if (stat.cornerBadge) {
      corner = `
        <span class="stat-corner-badge">
          ${stat.cornerBadge.text}
        </span>
      `;
    }

    let note = "";

    if (stat.note) {
      note = `
        <p class="stat-note stat-note--${stat.note.tone}">
          ${stat.note.text}
        </p>
      `;
    }

    return `
      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-icon">
            ${ICONS[stat.icon] || ICONS.activity}
          </span>
          ${corner}
        </div>

        <p class="stat-label">
          ${stat.label}
        </p>

        <p class="stat-value">
          ${formatNumber(stat.value)}
        </p>

        <p class="stat-sub">
          ${stat.unit}
        </p>

        ${note}
      </article>
    `;
  }).join("");
}

/* ========== TAB GRAFIK ========== */

function renderChartTabs() {
  const container = document.getElementById(
    "chart-tabs"
  );

  if (!container) return;

  const tabs = [
    { key: "masuk", label: "Surat Masuk" },
    { key: "keluar", label: "Surat Keluar" }
  ];

  container.innerHTML = tabs.map((tab) => `
    <button
      type="button"
      class="chart-tab ${
        activeChart === tab.key ? "is-active" : ""
      }"
      data-type="${tab.key}"
    >
      ${tab.label}
    </button>
  `).join("");

  container.onclick = (event) => {
    const button = event.target.closest(
      "button[data-type]"
    );

    if (!button) return;

    activeChart = button.dataset.type;

    renderChartTabs();
    renderChart();
  };
}

/* ========== GRAFIK SURAT ========== */

function renderChart() {
  const plot = document.getElementById(
    "chart-plot"
  );

  if (!plot) return;

  if (CHART_DATA.length === 0) {
    plot.textContent =
      "Belum ada data grafik untuk periode ini.";
    return;
  }

  const values = CHART_DATA.map((item) =>
    Number(item[activeChart] ?? 0)
  );

  const maxValue = Math.max(1, ...values);

  plot.innerHTML = CHART_DATA.map(
    (item, index) => {
      const value = values[index];

      const height =
        (value / maxValue) * 100;

      return `
        <div class="chart-col">
          <span class="chart-value">
            ${formatNumber(value)}
          </span>

          <div
            class="chart-bar"
            role="img"
            aria-label="${item.month}: ${value} surat"
          >
            <div
              class="seg seg--verified"
              style="height:${height}%"
            ></div>
          </div>

          <span class="chart-month">
            ${item.month}
          </span>
        </div>
      `;
    }
  ).join("");
}

/* ========== PANEL NONAKTIF ========== */

function hideUnintegratedPanels() {
  // Audit trail masih menggunakan data contoh.
  const audit = document.getElementById(
    "audit-list"
  );

  const auditPanel = audit?.closest(".panel");

  if (auditPanel) {
    auditPanel.hidden = true;
    auditPanel.style.display = "none";
  }

  // Data kesehatan sistem belum tersedia dari API.
  const healthPanel = document.querySelector(
    ".health-section"
  );

  if (healthPanel) {
    healthPanel.hidden = true;
    healthPanel.style.display = "none";
  }

  // Legend lama menggambarkan data mock.
  const legend = document.querySelector(
    ".chart-legend"
  );

  if (legend) {
    legend.hidden = true;
    legend.style.display = "none";
  }

  // Ekspor PDF belum diintegrasikan.
  const exportButton = document.querySelector(
    ".dash-columns .panel .btn-outline"
  );

  if (exportButton) {
    exportButton.hidden = true;
    exportButton.style.display = "none";
  }
}

/* ========== ERROR STATE ========== */

function renderError(error) {
  console.error(
    "Dashboard Admin gagal dimuat:",
    error
  );

  const grid = document.getElementById(
    "stat-grid"
  );

  const plot = document.getElementById(
    "chart-plot"
  );

  if (grid) {
    grid.textContent =
      "Gagal mengambil statistik dari backend. Periksa koneksi API.";
  }

  if (plot) {
    plot.textContent =
      "Grafik belum dapat ditampilkan.";
  }
}

/* ========== INISIALISASI ========== */

async function initDashboard() {
  renderHeroDate();
  renderIdentity();
  hideUnintegratedPanels();

  const grid = document.getElementById(
    "stat-grid"
  );

  const plot = document.getElementById(
    "chart-plot"
  );

  if (grid) {
    grid.textContent = "Memuat statistik...";
  }

  if (plot) {
    plot.textContent = "Memuat grafik...";
  }

  try {
    const result = await loadDashboard();

    STATS = result.stats;
    CHART_DATA = result.chartData;

    renderStats();
    renderChartTabs();
    renderChart();

    console.info(
      "Dashboard Admin berhasil dimuat dari backend.",
      {
        jumlahStatistik: STATS.length,
        jumlahBulan: CHART_DATA.length
      }
    );

  } catch (error) {
    renderError(error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initDashboard,
    { once: true }
  );
} else {
  initDashboard();
}
