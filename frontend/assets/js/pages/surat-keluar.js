/*
==================================================
SURAT KELUAR - KEPALA SEKSI
E-OFFICE BKSDA

Backend CodeIgniter 4
Endpoint: GET /api/surat-keluar

Fitur:
- Data langsung dari API
- Pagination API
- Pencarian
- Filter lampiran dan klasifikasi
- Statistik asli
- Navigasi detail surat
- Tidak menggunakan data mock
- Kepala Seksi hanya membaca data
==================================================
*/

import { saveListState, loadListState } from "../utils/state.js";

("use strict");

const STATE_KEY = "surat-keluar-ks";

const PER_PAGE = 10;
const API_PER_PAGE = 50;

const $ = (id) => document.getElementById(id);

let suratKeluarData = [];
let currentFilter = "all";
let searchQuery = "";
let page = 1;

/* ==========================================
   HELPERS
========================================== */

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function formatDate(value) {
  if (!value) return "-";

  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return raw;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return raw;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function hasFile(item) {
  return Boolean(String(item.file_path || "").trim());
}

function hasClassification(item) {
  return Boolean(String(item.klasifikasi || "").trim());
}

/* ==========================================
   ICONS
========================================== */

const ICONS = {
  send: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  `,

  file: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16
        a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  `,

  clock: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  `,

  checkCircle: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  `,
};

/* ==========================================
   API
========================================== */

function apiRequest(method, endpoint) {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error("API backend belum aktif.");
  }

  return EOfficeAPI.request(method, endpoint);
}

async function loadData() {
  const allData = [];

  let currentPage = 1;
  let lastPage = 1;

  do {
    const result = await apiRequest(
      "GET",
      `/surat-keluar?page=${currentPage}&per_page=${API_PER_PAGE}`,
    );

    if (result?.status !== true || !Array.isArray(result.data)) {
      throw new Error("Format respons Surat Keluar tidak valid.");
    }

    allData.push(...result.data);

    const pagination = result.pagination || {};

    lastPage = Number(pagination.last_page ?? 1);

    if (!Number.isInteger(lastPage) || lastPage < 1) {
      throw new Error("Informasi pagination API tidak valid.");
    }

    if (lastPage > 100) {
      throw new Error(
        "Jumlah halaman melebihi batas tampilan. " +
          "Gunakan pencarian API untuk data lebih besar.",
      );
    }

    currentPage++;
  } while (currentPage <= lastPage);

  return allData.map(normalizeSurat);
}

/* ==========================================
   NORMALISASI DATA BACKEND
========================================== */

function normalizeSurat(item) {
  return {
    id: Number(item.id),

    no_agenda: String(item.no_agenda || "-"),

    no_surat: String(item.no_surat || "-"),

    tanggal: item.tanggal || "",

    tujuan: String(item.tujuan || "-"),

    perihal: String(item.perihal || "-"),

    klasifikasi: String(item.klasifikasi || ""),

    file_path: String(item.file_path || ""),

    created_by_name: String(item.created_by_name || ""),

    resort_id: item.resort_id ?? null,
  };
}

/* ==========================================
   STATE
========================================== */

function persistState() {
  saveListState(STATE_KEY, {
    currentFilter,
    searchQuery,
    page,
  });
}

function restoreState() {
  const state = loadListState(STATE_KEY);

  if (!state) return;

  const allowedFilters = ["all", "with-file", "without-file", "classified"];

  currentFilter = allowedFilters.includes(state.currentFilter)
    ? state.currentFilter
    : "all";

  searchQuery = String(state.searchQuery || "");

  page = Math.max(1, Number(state.page) || 1);

  if ($("kss-search")) {
    $("kss-search").value = searchQuery;
  }
}

/* ==========================================
   FILTER
========================================== */

const FILTERS = [
  {
    key: "all",
    text: "Semua",
  },
  {
    key: "with-file",
    text: "Ada Lampiran",
  },
  {
    key: "without-file",
    text: "Tanpa Lampiran",
  },
  {
    key: "classified",
    text: "Terklasifikasi",
  },
];

function matchesFilter(item) {
  switch (currentFilter) {
    case "with-file":
      return hasFile(item);

    case "without-file":
      return !hasFile(item);

    case "classified":
      return hasClassification(item);

    default:
      return true;
  }
}

function getFiltered() {
  const query = searchQuery.trim().toLowerCase();

  return suratKeluarData.filter((item) => {
    if (!matchesFilter(item)) {
      return false;
    }

    if (!query) {
      return true;
    }

    const searchableText = [
      item.no_agenda,
      item.no_surat,
      item.tanggal,
      item.tujuan,
      item.perihal,
      item.klasifikasi,
      item.created_by_name,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });
}

/* ==========================================
   STATISTIK
========================================== */

function renderStats() {
  const total = suratKeluarData.length;

  const withFile = suratKeluarData.filter(hasFile).length;

  const withoutFile = suratKeluarData.filter((item) => !hasFile(item)).length;

  const classified = suratKeluarData.filter(hasClassification).length;

  const stats = [
    {
      label: "Total Surat Keluar",
      meta: "Dapat Diakses",
      value: total,
      icon: "send",
      tone: "blue",
    },
    {
      label: "Ada Lampiran",
      meta: "Dokumen Terunggah",
      value: withFile,
      icon: "file",
      tone: "green",
    },
    {
      label: "Tanpa Lampiran",
      meta: "Belum Ada Berkas",
      value: withoutFile,
      icon: "clock",
      tone: "amber",
    },
    {
      label: "Terklasifikasi",
      meta: "Memiliki Klasifikasi",
      value: classified,
      icon: "checkCircle",
      tone: "blue",
    },
  ];

  const container = $("kss-stats");

  if (!container) return;

  container.innerHTML = stats
    .map(
      (stat) => `
      <article class="kss-stat">

        <span
          class="kss-stat-icon kss-stat-icon--${stat.tone}"
        >
          ${ICONS[stat.icon]}
        </span>

        <div class="kss-stat-body">

          <div class="kss-stat-top">

            <p class="kss-stat-label">
              ${stat.label}
            </p>

            <span class="kss-stat-meta">
              ${stat.meta}
            </span>

          </div>

          <p class="kss-stat-value">
            ${formatNumber(stat.value)}
          </p>

        </div>

      </article>
    `,
    )
    .join("");
}

/* ==========================================
   TAB FILTER
========================================== */

function setupTabs() {
  const container = $("kss-tabs");

  if (!container) return;

  container.innerHTML = FILTERS.map(
    (filter) => `
      <button
        type="button"
        class="kss-tab ${currentFilter === filter.key ? "is-active" : ""}"
        data-filter="${filter.key}"
      >
        ${filter.text}

        <span
          class="kss-tab-badge"
          data-count="${filter.key}"
        ></span>
      </button>
    `,
  ).join("");

  container.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");

    if (!button) return;

    currentFilter = button.dataset.filter;

    page = 1;

    container.querySelectorAll(".kss-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab === button);
    });

    refresh();
  });
}

function renderTabBadges() {
  const counts = {
    all: suratKeluarData.length,

    "with-file": suratKeluarData.filter(hasFile).length,

    "without-file": suratKeluarData.filter((item) => !hasFile(item)).length,

    classified: suratKeluarData.filter(hasClassification).length,
  };

  Object.entries(counts).forEach(([key, count]) => {
    const badge = document.querySelector(`[data-count="${key}"]`);

    if (badge) {
      badge.textContent = count;
    }
  });
}

/* ==========================================
   TABLE
========================================== */

function renderTable(rows) {
  const tbody = $("kss-tbody");

  if (!tbody) return;

  const start = (page - 1) * PER_PAGE;

  const currentRows = rows.slice(start, start + PER_PAGE);

  if (!currentRows.length) {
    tbody.innerHTML = `
      <tr class="kss-empty">
        <td colspan="6">
          Tidak ada Surat Keluar yang cocok.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = currentRows
    .map((item) => {
      const id = Number(item.id);

      const detailURL = `detail-surat-keluar.html?id=${encodeURIComponent(id)}`;

      const fileBadge = hasFile(item)
        ? `
          <span class="kss-badge kss-badge--green">
            Ada Lampiran
          </span>
        `
        : `
          <span class="kss-badge kss-badge--amber">
            Tanpa Lampiran
          </span>
        `;

      return `
        <tr>

          <td>
            <input
              type="checkbox"
              class="row-check"
              aria-label="Pilih surat ${escapeHTML(item.no_surat)}"
            />
          </td>

          <td>

            <div class="cell-nomor-wrap">
              <a
                class="cell-nomor"
                href="${detailURL}"
              >
                ${escapeHTML(item.no_surat)}
              </a>
            </div>

            <span class="cell-tanggal">
              ${escapeHTML(formatDate(item.tanggal))}
            </span>

            <span class="cell-pengirim-sub">
              Agenda:
              ${escapeHTML(item.no_agenda)}
            </span>

          </td>

          <td>

            <span class="cell-pengirim">
              ${escapeHTML(item.tujuan)}
            </span>

            <span class="cell-pengirim-sub">
              Tujuan Surat
            </span>

          </td>

          <td>
            <span class="cell-perihal">
              ${escapeHTML(item.perihal)}
            </span>
          </td>

          <td>

            <span class="kss-badge kss-badge--gray">
              ${escapeHTML(item.klasifikasi || "Belum Diklasifikasikan")}
            </span>

          </td>

          <td>
            ${fileBadge}
          </td>

        </tr>
      `;
    })
    .join("");

  if ($("kss-check-all")) {
    $("kss-check-all").checked = false;
  }
}

/* ==========================================
   PAGINATION
========================================== */

function renderShowing(rows) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));

  page = Math.max(1, Math.min(page, totalPages));

  const start = rows.length ? (page - 1) * PER_PAGE + 1 : 0;

  const end = Math.min(page * PER_PAGE, rows.length);

  const showing = $("kss-showing");

  if (showing) {
    showing.textContent = `Menampilkan ${start}-${end} dari ${rows.length} surat`;
  }

  if ($("kss-prev")) {
    $("kss-prev").disabled = page <= 1;
  }

  if ($("kss-next")) {
    $("kss-next").disabled = page >= totalPages;
  }
}

function refresh() {
  const rows = getFiltered();

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));

  page = Math.max(1, Math.min(page, totalPages));

  renderTable(rows);
  renderShowing(rows);
  persistState();
}

/* ==========================================
   EVENTS
========================================== */

function setupEvents() {
  $("kss-search")?.addEventListener("input", (event) => {
    searchQuery = event.target.value;

    page = 1;

    refresh();
  });

  $("kss-prev")?.addEventListener("click", () => {
    if (page > 1) {
      page--;

      refresh();
    }
  });

  $("kss-next")?.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getFiltered().length / PER_PAGE));

    if (page < totalPages) {
      page++;

      refresh();
    }
  });

  $("kss-check-all")?.addEventListener("change", (event) => {
    const checked = event.target.checked;

    document.querySelectorAll(".row-check").forEach((checkbox) => {
      checkbox.checked = checked;
    });
  });
}

/* ==========================================
   HAK AKSES KEPALA SEKSI
========================================== */

function setupRoleUI() {
  // Route POST Surat Keluar saat ini
  // hanya mengizinkan admin dan staf.
  //
  // Kepala Seksi hanya membaca data.

  const addButton = $("btn-registrasi");

  if (addButton) {
    addButton.hidden = true;
    addButton.style.display = "none";
  }

  // Tombol Unduh Rekap belum terhubung
  // dengan endpoint ekspor yang valid.
  const header = document.querySelector(".kss-head-actions");

  if (header) {
    header.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
      button.title = "Fitur ekspor belum diintegrasikan.";
    });
  }

  // Kolom tabel asli merupakan:
  // checkbox, nomor, pengirim, perihal,
  // prioritas, status.
  //
  // Karena backend Surat Keluar memiliki
  // tujuan, klasifikasi dan lampiran,
  // judul kolom diperjelas.

  const table = $("kss-tbody")?.closest("table");

  const headers = table?.querySelectorAll("thead th");

  if (headers && headers.length >= 6) {
    headers[1].textContent = "Nomor Surat";
    headers[2].textContent = "Tujuan";
    headers[3].textContent = "Perihal";
    headers[4].textContent = "Klasifikasi";
    headers[5].textContent = "Lampiran";
  }
}

/* ==========================================
   LOADING & ERROR
========================================== */

function showLoading() {
  const tbody = $("kss-tbody");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr class="kss-empty">
      <td colspan="6">
        Memuat data Surat Keluar dari backend...
      </td>
    </tr>
  `;
}

function showError(error) {
  console.error("Gagal memuat Surat Keluar:", error);

  const tbody = $("kss-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr class="kss-empty">
        <td colspan="6">
          Gagal mengambil data Surat Keluar
          dari server.
        </td>
      </tr>
    `;
  }

  const stats = $("kss-stats");

  if (stats) {
    stats.textContent = "Statistik Surat Keluar tidak tersedia.";
  }
}

/* ==========================================
   INIT
========================================== */

async function init() {
  restoreState();

  setupTabs();
  setupEvents();
  setupRoleUI();

  showLoading();

  try {
    suratKeluarData = await loadData();

    renderStats();
    renderTabBadges();
    refresh();

    console.info("✅ Surat Keluar berhasil dimuat:", {
      total: suratKeluarData.length,
      adaLampiran: suratKeluarData.filter(hasFile).length,
      tanpaLampiran: suratKeluarData.filter((item) => !hasFile(item)).length,
    });
  } catch (error) {
    showError(error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
