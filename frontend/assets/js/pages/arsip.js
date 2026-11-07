/*
==================================================
ARSIP KEPALA SEKSI - E-OFFICE BKSDA
Integrasi CodeIgniter 4

Endpoint:
GET /api/arsip

Fitur:
- Data arsip asli dari backend
- Tidak menggunakan mock
- Statistik
- Pencarian
- Filter jenis dan tahun
- Tampilan tabel dan grid
- Pagination berfungsi
- Sinkronisasi ulang dari API
- Navigasi halaman detail
- Tidak ada notifikasi sukses palsu

Catatan:
Akses resort ditentukan oleh backend.
==================================================
*/

import { showToast } from "../components/toast.js";

const $ = (id) => document.getElementById(id);

const PER_PAGE = 10;
const API_PER_PAGE = 50;

let arsipData = [];
let mode = "tabel";
let query = "";
let jenisFilter = "all";
let tahunFilter = "all";
let statusFilter = "all";
let page = 1;
let loading = false;

/* ==========================================
   UTILITIES
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

function extractYear(value) {
  const match = String(value || "").match(/^(\d{4})-/);

  return match ? match[1] : "";
}

function getFirstValue(...values) {
  const found = values.find(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

  return found ?? "";
}

/* ==========================================
   ICON SVG
========================================== */

const ICONS = {
  folder: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4
        a2 2 0 0 1-2-2V5
        a2 2 0 0 1 2-2h5l2 3h9
        a2 2 0 0 1 2 2z"/>
    </svg>
  `,

  inbox: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <polyline points="22 12 16 12 14 15
        10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6
        a2 2 0 0 0 2 2h16
        a2 2 0 0 0 2-2v-6
        l-3.45-6.89A2 2 0 0 0
        16.76 4H7.24
        a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  `,

  send: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  `,

  calendar: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <rect x="3" y="4" width="18"
        height="18" rx="2" ry="2"/>
      <line x1="16" y1="2"
        x2="16" y2="6"/>
      <line x1="8" y1="2"
        x2="8" y2="6"/>
      <line x1="3" y1="10"
        x2="21" y2="10"/>
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
    throw new Error("Koneksi API backend belum aktif.");
  }

  return EOfficeAPI.request(method, endpoint);
}

async function loadData() {
  const rows = [];

  let apiPage = 1;
  let lastPage = 1;

  do {
    const result = await apiRequest(
      "GET",
      `/arsip?page=${apiPage}&per_page=${API_PER_PAGE}`,
    );

    if (result?.status !== true || !Array.isArray(result.data)) {
      throw new Error("Respons data Arsip tidak valid.");
    }

    rows.push(...result.data);

    lastPage = Number(result.pagination?.last_page ?? 1);

    if (!Number.isInteger(lastPage) || lastPage < 0 || lastPage > 100) {
      throw new Error(
        "Pagination backend tidak valid " + "atau melebihi batas 100 halaman.",
      );
    }

    apiPage++;
  } while (apiPage <= lastPage);

  return rows.map(normalizeArsip);
}

/* ==========================================
   NORMALISASI FIELD BACKEND
========================================== */

function normalizeArsip(item) {
  const rawJenis = String(item.jenis || "").toLowerCase();

  const jenis =
    rawJenis === "surat_masuk"
      ? "Surat Masuk"
      : rawJenis === "surat_keluar"
        ? "Surat Keluar"
        : "Tidak diketahui";

  const tanggalArsip = getFirstValue(item.tanggal_arsip, item.created_at);

  const nomor = getFirstValue(
    item.no_surat,
    item.nomor_surat,
    item.surat_no_surat,
    item.no_agenda,
    item.nomor_agenda,
    item.surat_masuk_no_surat,
    item.surat_keluar_no_surat,
  );

  const perihal = getFirstValue(
    item.perihal,
    item.surat_perihal,
    item.surat_masuk_perihal,
    item.surat_keluar_perihal,
  );

  const asal = getFirstValue(
    item.asal,
    item.tujuan,
    item.surat_asal,
    item.surat_tujuan,
    item.surat_masuk_asal,
    item.surat_keluar_tujuan,
  );

  return {
    id: Number(item.id),

    referensi_id: Number(item.referensi_id || 0),

    jenis,

    jenisRaw: rawJenis,

    nomor: String(nomor || "-"),

    perihal: String(perihal || "Tidak tersedia"),

    asal: String(asal || "-"),

    kategori: String(item.kategori || "-"),

    tanggal: formatDate(tanggalArsip),

    tanggalRaw: String(tanggalArsip || ""),

    tahun: extractYear(tanggalArsip),

    // Keberadaan rekaman pada tabel arsip
    // berarti dokumen sudah diarsipkan.
    status: "Diarsipkan",
  };
}

/* ==========================================
   STATISTIK
========================================== */

function renderStats() {
  const now = new Date();

  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  const thisMonthCount = arsipData.filter((item) => {
    const match = item.tanggalRaw.match(/^(\d{4})-(\d{2})/);

    if (!match) return false;

    return Number(match[1]) === thisYear && Number(match[2]) === thisMonth;
  }).length;

  const suratMasuk = arsipData.filter(
    (item) => item.jenisRaw === "surat_masuk",
  ).length;

  const suratKeluar = arsipData.filter(
    (item) => item.jenisRaw === "surat_keluar",
  ).length;

  const stats = [
    {
      label: "Total Arsip",
      value: arsipData.length,
      sub: "dokumen dapat diakses",
      dot: "blue",
      icon: "folder",
      tone: "blue",
    },
    {
      label: "Surat Masuk",
      value: suratMasuk,
      sub: "arsip surat masuk",
      dot: "green",
      icon: "inbox",
      tone: "green",
    },
    {
      label: "Surat Keluar",
      value: suratKeluar,
      sub: "arsip surat keluar",
      dot: "blue",
      icon: "send",
      tone: "blue",
    },
    {
      label: "Arsip Bulan Ini",
      value: thisMonthCount,
      sub: "berdasarkan tanggal arsip",
      dot: "orange",
      icon: "calendar",
      tone: "amber",
    },
  ];

  const container = $("ar-stats");

  if (!container) return;

  container.innerHTML = stats
    .map(
      (stat) => `
      <article class="ar-stat">
        <div>
          <p class="ar-stat-label">
            ${stat.label}
          </p>

          <p class="ar-stat-value">
            ${formatNumber(stat.value)}
          </p>

          <p class="ar-stat-sub">
            <span
              class="ar-stat-dot ar-stat-dot--${stat.dot}"
            ></span>
            ${stat.sub}
          </p>
        </div>

        <span
          class="ar-stat-icon ar-stat-icon--${stat.tone}"
        >
          ${ICONS[stat.icon]}
        </span>
      </article>
    `,
    )
    .join("");
}

/* ==========================================
   SETUP FILTER
========================================== */

function setupFilters() {
  const jenis = $("ar-jenis");

  if (jenis) {
    jenis.replaceChildren();

    [
      ["all", "Semua Jenis"],
      ["surat_masuk", "Surat Masuk"],
      ["surat_keluar", "Surat Keluar"],
    ].forEach(([value, label]) => {
      jenis.add(new Option(label, value));
    });
  }

  const status = $("ar-status");

  if (status) {
    status.replaceChildren();

    status.add(new Option("Semua Status", "all"));

    status.add(new Option("Diarsipkan", "Diarsipkan"));
  }
}

function updateYearOptions() {
  const select = $("ar-tahun");

  if (!select) return;

  const years = [
    ...new Set(arsipData.map((item) => item.tahun).filter(Boolean)),
  ].sort((a, b) => Number(b) - Number(a));

  const previous = tahunFilter;

  select.replaceChildren();

  select.add(new Option("Semua Tahun", "all"));

  years.forEach((year) => {
    select.add(new Option(year, year));
  });

  if (previous !== "all" && years.includes(previous)) {
    select.value = previous;
  } else {
    tahunFilter = "all";
    select.value = "all";
  }
}

/* ==========================================
   FILTER DATA
========================================== */

function getFiltered() {
  const q = query.trim().toLowerCase();

  return arsipData.filter((item) => {
    const byJenis = jenisFilter === "all" || item.jenisRaw === jenisFilter;

    const byTahun = tahunFilter === "all" || item.tahun === tahunFilter;

    const byStatus = statusFilter === "all" || item.status === statusFilter;

    const searchable = [
      item.nomor,
      item.perihal,
      item.asal,
      item.kategori,
      item.jenis,
      String(item.referensi_id),
    ]
      .join(" ")
      .toLowerCase();

    const bySearch = !q || searchable.includes(q);

    return byJenis && byTahun && byStatus && bySearch;
  });
}

/* ==========================================
   TABEL
========================================== */

function renderTable(rows, startIndex) {
  const tbody = $("ar-tbody");

  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `
      <tr class="ar-empty">
        <td colspan="8">
          Tidak ada dokumen arsip
          yang cocok dengan filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (item, index) => `
      <tr>
        <td>
          <span class="ar-no">
            ${startIndex + index + 1}
          </span>
        </td>

        <td>
          <span class="ar-nomor">
            ${escapeHTML(item.nomor)}
          </span>
        </td>

        <td>
          <span class="ar-tanggal">
            ${escapeHTML(item.tanggal)}
          </span>
        </td>

        <td>
          <span class="ar-jenis-badge">
            ${escapeHTML(item.jenis)}
          </span>
        </td>

        <td>
          <span class="ar-perihal">
            ${escapeHTML(item.perihal)}
          </span>
        </td>

        <td>
          <span class="ar-asal">
            ${escapeHTML(item.asal)}
          </span>
        </td>

        <td>
          <span
            class="ar-status-badge ar-status-badge--arsip"
          >
            Diarsipkan
          </span>
        </td>

        <td class="th-actions">
          <button
            type="button"
            class="ar-lihat"
            data-detail="${item.id}"
          >
            Lihat
          </button>
        </td>
      </tr>
    `,
    )
    .join("");
}

/* ==========================================
   GRID
========================================== */

function renderGrid(rows) {
  const container = $("ar-grid");

  if (!container) return;

  if (!rows.length) {
    container.innerHTML = `
      <p class="ar-empty-text">
        Tidak ada dokumen yang cocok.
      </p>
    `;
    return;
  }

  container.innerHTML = rows
    .map(
      (item) => `
      <article class="ar-card-item">

        <span
          class="ar-jenis-badge"
          style="align-self:flex-start"
        >
          ${escapeHTML(item.jenis)}
        </span>

        <span class="ar-nomor">
          ${escapeHTML(item.nomor)}
        </span>

        <span class="ar-card-tanggal">
          ${escapeHTML(item.tanggal)}
          • Diarsipkan
        </span>

        <p class="ar-card-perihal">
          ${escapeHTML(item.perihal)}
        </p>

        <button
          type="button"
          class="ar-btn ar-btn--outline"
          data-detail="${item.id}"
        >
          Lihat Detail
        </button>

      </article>
    `,
    )
    .join("");
}

/* ==========================================
   PAGINATION
========================================== */

function renderPagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  page = Math.max(1, Math.min(page, totalPages));

  const container = $("ar-pagination");

  if (!container) return;

  const startPage = Math.max(
    1,
    Math.min(page - 2, Math.max(1, totalPages - 4)),
  );

  const endPage = Math.min(totalPages, startPage + 4);

  let buttons = "";

  for (let number = startPage; number <= endPage; number++) {
    buttons += `
      <button
        type="button"
        class="ar-page-num ${number === page ? "is-active" : ""}"
        data-page="${number}"
        ${number === page ? 'aria-current="page"' : ""}
      >
        ${number}
      </button>
    `;
  }

  container.innerHTML = `
    <button
      type="button"
      class="ar-page-nav"
      data-page="${page - 1}"
      ${page <= 1 ? "disabled" : ""}
    >
      ‹ Sebelumnya
    </button>

    ${buttons}

    <button
      type="button"
      class="ar-page-nav"
      data-page="${page + 1}"
      ${page >= totalPages ? "disabled" : ""}
    >
      Selanjutnya ›
    </button>
  `;
}

function renderFooter(total, start, end) {
  const countElement = document.querySelector(".ar-count");

  if (countElement) {
    countElement.innerHTML = `
      <strong id="ar-count-num">
        ${formatNumber(total)}
      </strong>
      dari ${formatNumber(arsipData.length)}
      dokumen diarsipkan
    `;
  }

  if ($("ar-showing")) {
    $("ar-showing").textContent =
      `Menampilkan ${start}-${end} dari ${formatNumber(total)} dokumen`;
  }
}

/* ==========================================
   REFRESH
========================================== */

function refresh() {
  const filtered = getFiltered();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  page = Math.max(1, Math.min(page, totalPages));

  const startIndex = (page - 1) * PER_PAGE;

  const currentRows = filtered.slice(startIndex, startIndex + PER_PAGE);

  if ($("ar-table-wrap")) {
    $("ar-table-wrap").hidden = mode !== "tabel";
  }

  if ($("ar-grid")) {
    $("ar-grid").hidden = mode !== "grid";
  }

  if (mode === "tabel") {
    renderTable(currentRows, startIndex);
  } else {
    renderGrid(currentRows);
  }

  const start = filtered.length ? startIndex + 1 : 0;

  const end = Math.min(startIndex + PER_PAGE, filtered.length);

  renderPagination(filtered.length);

  renderFooter(filtered.length, start, end);
}

/* ==========================================
   EVENTS
========================================== */

function setupEvents() {
  $("ar-search")?.addEventListener("input", (event) => {
    query = event.target.value;
    page = 1;
    refresh();
  });

  $("ar-jenis")?.addEventListener("change", (event) => {
    jenisFilter = event.target.value;
    page = 1;
    refresh();
  });

  $("ar-tahun")?.addEventListener("change", (event) => {
    tahunFilter = event.target.value;
    page = 1;
    refresh();
  });

  $("ar-status")?.addEventListener("change", (event) => {
    statusFilter = event.target.value;
    page = 1;
    refresh();
  });

  $("ar-reset")?.addEventListener("click", () => {
    query = "";
    jenisFilter = "all";
    tahunFilter = "all";
    statusFilter = "all";
    page = 1;

    $("ar-search").value = "";
    $("ar-jenis").value = "all";
    $("ar-tahun").value = "all";
    $("ar-status").value = "all";

    refresh();
  });

  document.querySelectorAll(".ar-toggle-pill").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;

      document.querySelectorAll(".ar-toggle-pill").forEach((tab) => {
        tab.classList.toggle("is-active", tab === button);
      });

      refresh();
    });
  });

  $("ar-pagination")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");

    if (!button || button.disabled) return;

    const nextPage = Number(button.dataset.page);

    if (Number.isInteger(nextPage) && nextPage >= 1) {
      page = nextPage;
      refresh();
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-detail]");

    if (!button) return;

    const id = Number(button.dataset.detail);

    if (Number.isSafeInteger(id) && id > 0) {
      window.location.href = `detail-arsip.html?id=${id}`;
    }
  });

  $("btn-cari-cepat")?.addEventListener("click", () => {
    $("ar-search")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    $("ar-search")?.focus();
  });

  $("btn-sinkron")?.addEventListener("click", async () => {
    try {
      await reloadData();

      showToast("Data arsip berhasil diperbarui dari backend.");
    } catch (error) {
      showToast("Gagal memperbarui data arsip.");
    }
  });
}

/* ==========================================
   LOAD ULANG DATA
========================================== */

async function reloadData() {
  if (loading) return;

  loading = true;

  const syncButton = $("btn-sinkron");

  if (syncButton) {
    syncButton.disabled = true;
  }

  const tbody = $("ar-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr class="ar-empty">
        <td colspan="8">
          Memuat data arsip dari backend...
        </td>
      </tr>
    `;
  }

  try {
    const data = await loadData();

    arsipData = data;

    updateYearOptions();
    renderStats();
    refresh();

    console.info("✅ Arsip Kepala Seksi berhasil dimuat:", {
      total: arsipData.length,
      suratMasuk: arsipData.filter((d) => d.jenisRaw === "surat_masuk").length,
      suratKeluar: arsipData.filter((d) => d.jenisRaw === "surat_keluar")
        .length,
    });
  } catch (error) {
    console.error("Gagal memuat arsip:", error);

    if (tbody) {
      tbody.innerHTML = `
        <tr class="ar-empty">
          <td colspan="8">
            Gagal mengambil data arsip.
            Periksa koneksi backend.
          </td>
        </tr>
      `;
    }

    throw error;
  } finally {
    loading = false;

    if (syncButton) {
      syncButton.disabled = false;
    }
  }
}

/* ==========================================
   INIT
========================================== */

async function init() {
  setupFilters();
  setupEvents();

  try {
    await reloadData();
  } catch {
    // Pesan kegagalan sudah ditampilkan.
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
