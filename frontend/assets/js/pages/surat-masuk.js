/*
 * SURAT MASUK — KEPALA SEKSI
 * E-Office BKSDA
 *
 * GET /api/surat-masuk
 *
 * Sumber: backend CodeIgniter 4.
 * Tidak memakai data mock.
 * Hak akses resort diterapkan backend.
 */

import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "surat-masuk-ks";

const $ = (id) => document.getElementById(id);

const escapeHTML = (value) =>
  String(value ?? "").replace(
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

const formatNumber = (n) => Number(n ?? 0).toLocaleString("id-ID");

let suratData = [];
let currentFilter = "all";
let searchQuery = "";
let page = 1;

const PER_PAGE = 10;

const ICONS = {
  inbox: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2">
      <path d="M4 4h16l2 9v7H2v-7z"/>
      <path d="M2 13h6l2 3h4l2-3h6"/>
    </svg>
  `,
  clock: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l4 3"/>
    </svg>
  `,
  checkCircle: `
    <svg viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="m8 12 3 3 5-6"/>
    </svg>
  `,
};

/* ========== API ========== */

function api(method, path) {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error("API backend belum aktif.");
  }

  return EOfficeAPI.request(method, path);
}

/*
 * Ambil seluruh halaman yang diizinkan backend.
 * Backend membatasi per_page maksimal 50.
 *
 * Hal ini memungkinkan filter dan pagination
 * frontend menggunakan keseluruhan data
 * yang berhasil diambil.
 */
async function loadData() {
  const all = [];
  let currentPage = 1;
  let lastPage = 1;

  do {
    const result = await api(
      "GET",
      `/surat-masuk?page=${currentPage}&per_page=50`,
    );

    if (result?.status !== true || !Array.isArray(result.data)) {
      throw new Error("Format respons Surat Masuk tidak valid.");
    }

    all.push(...result.data);

    lastPage = Number(result.pagination?.last_page ?? 1);

    if (!Number.isFinite(lastPage)) {
      throw new Error("Informasi pagination tidak valid.");
    }

    currentPage++;

    // Batas pengamanan supaya tidak ada
    // request tanpa akhir.
    if (lastPage > 100) {
      throw new Error("Jumlah surat terlalu banyak untuk dimuat sekaligus.");
    }
  } while (currentPage <= lastPage);

  return all.map(normalizeSurat);
}

/* ========== NORMALISASI DATA ========== */

function normalizeSurat(item) {
  const rawStatus = String(item.status || "tidak_diketahui").toLowerCase();

  const statusLabels = {
    baru: "Baru",
    diproses: "Diproses",
    dalam_proses: "Dalam Proses",
    ditindaklanjuti: "Ditindaklanjuti",
    selesai: "Selesai",
    diarsipkan: "Diarsipkan",
  };

  const label = statusLabels[rawStatus] || rawStatus.replace(/_/g, " ");

  let tone = "gray";

  if (rawStatus === "baru") {
    tone = "blue";
  } else if (
    ["diproses", "dalam_proses", "ditindaklanjuti"].includes(rawStatus)
  ) {
    tone = "amber";
  } else if (["selesai", "diarsipkan"].includes(rawStatus)) {
    tone = "green";
  }

  return {
    id: Number(item.id),
    nomor: String(item.no_surat || item.no_agenda || "-"),
    tanggal: item.tanggal || "-",
    pengirim: String(item.asal || "-"),
    pengirimSub: String(item.klasifikasi || ""),
    perihal: String(item.perihal || "-"),
    statusRaw: rawStatus,
    status: {
      text: label,
      tone,
    },
    resortId: item.resort_id ?? null,
  };
}

/* ========== STATE ========== */

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

  currentFilter = ["all", "baru", "proses", "selesai"].includes(
    state.currentFilter,
  )
    ? state.currentFilter
    : "all";

  searchQuery = state.searchQuery || "";
  page = Number(state.page) || 1;

  if ($("kss-search")) {
    $("kss-search").value = searchQuery;
  }
}

/* ========== FILTER STATUS ========== */

function isProses(item) {
  return ["diproses", "dalam_proses", "ditindaklanjuti"].includes(
    item.statusRaw,
  );
}

function isSelesai(item) {
  return ["selesai", "diarsipkan"].includes(item.statusRaw);
}

function getFiltered() {
  return suratData.filter((item) => {
    let matchStatus = true;

    switch (currentFilter) {
      case "baru":
        matchStatus = item.statusRaw === "baru";
        break;

      case "proses":
        matchStatus = isProses(item);
        break;

      case "selesai":
        matchStatus = isSelesai(item);
        break;
    }

    const query = searchQuery.trim().toLowerCase();

    const text = [item.nomor, item.pengirim, item.perihal, item.pengirimSub]
      .join(" ")
      .toLowerCase();

    return matchStatus && (!query || text.includes(query));
  });
}

/* ========== STATISTIK ========== */

function renderStats() {
  const total = suratData.length;

  const baru = suratData.filter((item) => item.statusRaw === "baru").length;

  const proses = suratData.filter(isProses).length;

  const selesai = suratData.filter(isSelesai).length;

  const stats = [
    {
      label: "Total Surat Masuk",
      meta: "Dapat Diakses",
      value: total,
      icon: "inbox",
      tone: "blue",
    },
    {
      label: "Status Baru",
      meta: "Belum Diproses",
      value: baru,
      icon: "inbox",
      tone: "blue",
    },
    {
      label: "Dalam Proses",
      meta: "Tindak Lanjut",
      value: proses,
      icon: "clock",
      tone: "amber",
    },
    {
      label: "Selesai",
      meta: "Tercatat",
      value: selesai,
      icon: "checkCircle",
      tone: "green",
    },
  ];

  const target = $("kss-stats");
  if (!target) return;

  target.innerHTML = stats
    .map(
      (stat) => `
    <article class="kss-stat">
      <span class="kss-stat-icon kss-stat-icon--${stat.tone}">
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

/* ========== TAB STATUS ========== */

function setupTabs() {
  const tabs = $("kss-tabs");
  if (!tabs) return;

  const labels = [
    { key: "all", text: "Semua" },
    { key: "baru", text: "Baru" },
    { key: "proses", text: "Dalam Proses" },
    { key: "selesai", text: "Selesai" },
  ];

  tabs.innerHTML = labels
    .map(
      (item) => `
    <button
      type="button"
      class="kss-tab ${item.key === currentFilter ? "is-active" : ""}"
      data-filter="${item.key}"
    >
      ${item.text}
      <span
        class="kss-tab-badge"
        data-count="${item.key}"
      ></span>
    </button>
  `,
    )
    .join("");

  tabs.addEventListener("click", (event) => {
    const tab = event.target.closest("button[data-filter]");

    if (!tab) return;

    currentFilter = tab.dataset.filter;
    page = 1;

    tabs.querySelectorAll(".kss-tab").forEach((button) => {
      button.classList.toggle("is-active", button === tab);
    });

    refresh();
  });
}

function renderTabBadges() {
  const counts = {
    all: suratData.length,
    baru: suratData.filter((item) => item.statusRaw === "baru").length,
    proses: suratData.filter(isProses).length,
    selesai: suratData.filter(isSelesai).length,
  };

  Object.entries(counts).forEach(([key, count]) => {
    const element = document.querySelector(`[data-count="${key}"]`);

    if (element) {
      element.textContent = count;
    }
  });
}

/* ========== TABEL ========== */

function renderTable(rows) {
  const tbody = $("kss-tbody");
  if (!tbody) return;

  const start = (page - 1) * PER_PAGE;
  const current = rows.slice(start, start + PER_PAGE);

  if (!current.length) {
    tbody.innerHTML = `
      <tr class="kss-empty">
        <td colspan="6">
          Tidak ada surat masuk yang cocok.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = current
    .map((item) => {
      const id = Number(item.id);

      const href = `detail-surat-masuk.html?id=${encodeURIComponent(id)}`;

      return `
      <tr>
        <td>
          <input
            type="checkbox"
            class="row-check"
            aria-label="Pilih surat"
          />
        </td>

        <td>
          <div class="cell-nomor-wrap">
            <a
              href="${href}"
              class="cell-nomor"
            >
              ${escapeHTML(item.nomor)}
            </a>
          </div>

          <span class="cell-tanggal">
            ${escapeHTML(item.tanggal)}
          </span>
        </td>

        <td>
          <span class="cell-pengirim">
            ${escapeHTML(item.pengirim)}
          </span>

          <span class="cell-pengirim-sub">
            ${escapeHTML(item.pengirimSub)}
          </span>
        </td>

        <td>
          <span class="cell-perihal">
            ${escapeHTML(item.perihal)}
          </span>
        </td>

        <td>
          <span class="kss-badge kss-badge--gray">
            Tidak ditetapkan
          </span>
        </td>

        <td>
          <span class="kss-badge kss-badge--${item.status.tone}">
            ${escapeHTML(item.status.text)}
          </span>
        </td>
      </tr>
    `;
    })
    .join("");
}

/* ========== PAGINATION ========== */

function renderShowing(rows) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));

  page = Math.max(1, Math.min(page, totalPages));

  const start = rows.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;

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

  page = Math.min(page, totalPages);
  page = Math.max(1, page);

  renderTable(rows);
  renderShowing(rows);
  persistState();
}

/* ========== MODAL ========== */

function setupModal() {
  const backdrop = $("modal-backdrop");

  $("modal-close")?.addEventListener("click", () => {
    backdrop?.classList.remove("is-open");
  });

  backdrop?.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      backdrop.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      backdrop?.classList.remove("is-open");
    }
  });
}

/* ========== EVENT ========== */

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
    const pages = Math.max(1, Math.ceil(getFiltered().length / PER_PAGE));

    if (page < pages) {
      page++;
      refresh();
    }
  });

  $("kss-check-all")?.addEventListener("change", (event) => {
    document.querySelectorAll(".row-check").forEach((checkbox) => {
      checkbox.checked = event.target.checked;
    });
  });
}

/* ========== AKSES KEPALA SEKSI ========== */

function setupRoleUI() {
  // Backend tidak mengizinkan Kepala Seksi
  // membuat Surat Masuk melalui endpoint POST.
  const registrasi = $("btn-registrasi");

  if (registrasi) {
    registrasi.hidden = true;
    registrasi.style.display = "none";
  }

  // Tombol ekspor lama belum terintegrasi.
  const header = document.querySelector(".kss-head-actions");

  if (header) {
    header.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
      button.title = "Ekspor belum tersedia";
    });
  }
}

/* ========== INIT ========== */

async function init() {
  restoreState();

  setupTabs();
  setupEvents();
  setupModal();
  setupRoleUI();

  const tbody = $("kss-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr class="kss-empty">
        <td colspan="6">
          Memuat data dari backend...
        </td>
      </tr>
    `;
  }

  try {
    suratData = await loadData();

    renderStats();
    renderTabBadges();
    refresh();

    console.info("Surat Masuk berhasil dimuat:", suratData.length);
  } catch (error) {
    console.error("Surat Masuk gagal dimuat:", error.message);

    if (tbody) {
      tbody.innerHTML = `
        <tr class="kss-empty">
          <td colspan="6">
            Gagal mengambil data dari backend.
          </td>
        </tr>
      `;
    }

    const stats = $("kss-stats");

    if (stats) {
      stats.textContent = "Statistik surat tidak tersedia.";
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
