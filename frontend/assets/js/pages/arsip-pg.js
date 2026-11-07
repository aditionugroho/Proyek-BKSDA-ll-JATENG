/*
 * ARSIP STAF - E-OFFICE BKSDA
 * Backend: GET /api/arsip
 *
 * Tidak menggunakan mock.
 * Hak akses resort ditentukan oleh backend.
 */

import { showToast } from "../components/toast.js";

const $ = (id) => document.getElementById(id);

const PAGE_SIZE = 10;
const API_PAGE_SIZE = 50;

let arsipData = [];
let currentPage = 1;
let tabJenis = "all";
let jenisFilter = "all";
let tahunFilter = "all";
let statusFilter = "all";
let searchQuery = "";
let selectedId = null;
let loading = false;

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

function formatDate(value) {
  if (!value) return "-";

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return String(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function firstValue(...values) {
  return (
    values.find(
      (value) =>
        value !== undefined && value !== null && String(value).trim() !== "",
    ) ?? ""
  );
}

function normalizeArsip(item) {
  const jenisRaw = String(item.jenis || "");

  const jenis =
    jenisRaw === "surat_masuk"
      ? "Surat Masuk"
      : jenisRaw === "surat_keluar"
        ? "Surat Keluar"
        : "Tidak Diketahui";

  const tanggalArsip = firstValue(item.tanggal_arsip, item.created_at);

  const tanggalSurat = firstValue(
    item.tanggal,
    item.tanggal_surat,
    tanggalArsip,
  );

  const nomor = firstValue(
    item.no_surat,
    item.nomor_surat,
    item.surat_no_surat,
    item.no_agenda,
  );

  const perihal = firstValue(item.perihal, item.surat_perihal);

  const pihak = firstValue(
    item.asal,
    item.tujuan,
    item.surat_asal,
    item.surat_tujuan,
  );

  return {
    id: Number(item.id),
    referensiId: Number(item.referensi_id),
    jenisRaw,
    jenis,
    nomor: String(nomor || "-"),
    perihal: String(perihal || "Tidak tersedia"),
    pihak: String(pihak || "-"),
    tanggal: formatDate(tanggalSurat),
    tahun: String(tanggalArsip).slice(0, 4),
    tanggalArsip: formatDate(tanggalArsip),
    kategori: String(item.kategori || "-"),
    status: "Diarsipkan",
    oleh: String(
      firstValue(item.created_by_name, item.archived_by_name, item.user_name) ||
        "Tidak tersedia",
    ),
  };
}

/* =========================
   API ARSIP
========================= */

async function loadArsip() {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error("API backend belum aktif.");
  }

  const result = [];

  let apiPage = 1;
  let lastPage = 1;

  do {
    const response = await EOfficeAPI.request(
      "GET",
      `/arsip?page=${apiPage}&per_page=${API_PAGE_SIZE}`,
    );

    if (response?.status !== true || !Array.isArray(response.data)) {
      throw new Error("Format respons API arsip tidak valid.");
    }

    result.push(...response.data);

    lastPage = Number(response.pagination?.last_page ?? 1);

    if (!Number.isInteger(lastPage) || lastPage < 0 || lastPage > 100) {
      throw new Error(
        "Pagination API arsip tidak valid atau " +
          "melampaui batas 100 halaman.",
      );
    }

    apiPage++;
  } while (apiPage <= lastPage);

  return result.map(normalizeArsip);
}

/* =========================
   FILTER
========================= */

function setupFilters() {
  const tabs = $("pga-tabs");

  if (tabs) {
    tabs.innerHTML = `
      <button type="button"
        class="pga-tab is-active"
        data-jenis="all">
        Semua Arsip
      </button>

      <button type="button"
        class="pga-tab"
        data-jenis="surat_masuk">
        Surat Masuk
      </button>

      <button type="button"
        class="pga-tab"
        data-jenis="surat_keluar">
        Surat Keluar
      </button>
    `;
  }

  const selectJenis = $("pga-jenis");

  if (selectJenis) {
    selectJenis.replaceChildren();

    [
      ["all", "Jenis Dokumen / Semua"],
      ["surat_masuk", "Surat Masuk"],
      ["surat_keluar", "Surat Keluar"],
    ].forEach(([value, label]) => {
      selectJenis.add(new Option(label, value));
    });
  }

  const selectStatus = $("pga-status");

  if (selectStatus) {
    selectStatus.replaceChildren();
    selectStatus.add(new Option("Status / Semua", "all"));
    selectStatus.add(new Option("Diarsipkan", "Diarsipkan"));
  }
}

function updateYearOptions() {
  const select = $("pga-tahun");
  if (!select) return;

  const years = [
    ...new Set(
      arsipData.map((d) => d.tahun).filter((year) => /^\d{4}$/.test(year)),
    ),
  ].sort((a, b) => Number(b) - Number(a));

  select.replaceChildren();
  select.add(new Option("Tahun / Semua", "all"));

  for (const year of years) {
    select.add(new Option(year, year));
  }

  if (tahunFilter !== "all" && years.includes(tahunFilter)) {
    select.value = tahunFilter;
  } else {
    tahunFilter = "all";
    select.value = "all";
  }
}

function getFiltered() {
  const query = searchQuery.trim().toLowerCase();

  return arsipData.filter((item) => {
    if (tabJenis !== "all" && item.jenisRaw !== tabJenis) return false;

    if (jenisFilter !== "all" && item.jenisRaw !== jenisFilter) return false;

    if (tahunFilter !== "all" && item.tahun !== tahunFilter) return false;

    if (statusFilter !== "all" && item.status !== statusFilter) return false;

    const searchable = [
      item.nomor,
      item.perihal,
      item.pihak,
      item.kategori,
      item.jenis,
    ]
      .join(" ")
      .toLowerCase();

    return !query || searchable.includes(query);
  });
}

/* =========================
   TABEL
========================= */

function renderTable() {
  const tbody = $("pga-tbody");
  if (!tbody) return;

  const filtered = getFiltered();

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  currentPage = Math.min(Math.max(1, currentPage), pageCount);

  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  if (!rows.length) {
    tbody.innerHTML = `
      <tr class="pga-empty">
        <td colspan="10">
          Tidak ada dokumen arsip yang cocok.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = rows
      .map(
        (d, index) => `
      <tr data-id="${d.id}"
        class="${selectedId === d.id ? "is-selected" : ""}">

        <td>
          <span class="pga-no">
            ${start + index + 1}
          </span>
        </td>

        <td>
          <span class="pga-nama">
            ${escapeHTML(d.perihal)}
          </span>
          <span class="pga-sub">
            ${escapeHTML(d.pihak)}
          </span>
        </td>

        <td>${escapeHTML(d.jenis)}</td>

        <td>
          <span class="pga-nomor">
            ${escapeHTML(d.nomor)}
          </span>
        </td>

        <td>${escapeHTML(d.tanggal)}</td>
        <td>${escapeHTML(d.tahun)}</td>

        <td>
          <span class="pga-badge pga-badge--green">
            Diarsipkan
          </span>
        </td>

        <td>${escapeHTML(d.oleh)}</td>

        <td>
          ${escapeHTML(d.tanggalArsip)}
        </td>

        <td>
          <div class="pga-actions">
            <button
              type="button"
              class="pga-radio ${selectedId === d.id ? "is-selected" : ""}"
              data-select="${d.id}"
              title="Pilih dokumen"
            >
              ○
            </button>

            <button
              type="button"
              class="pga-menu-btn"
              data-menu="${d.id}"
              aria-label="Aksi dokumen"
            >
              ⋮
            </button>

            <div class="pga-dropdown"
              id="menu-${d.id}">
              <button type="button"
                data-detail="${d.id}">
                Lihat Detail
              </button>

              <button type="button"
                data-unduh="${d.id}">
                Unduh Arsip
              </button>
            </div>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");
  }

  renderPagination(filtered.length, start, rows.length, pageCount);
}

/* =========================
   PAGINATION
========================= */

function renderPagination(total, start, count, pageCount) {
  if ($("pga-showing")) {
    const first = total ? start + 1 : 0;
    const last = total ? start + count : 0;

    $("pga-showing").textContent =
      `Menampilkan ${first}-${last} ` + `dari ${total} arsip`;
  }

  const prev = $("pga-prev");
  const next = $("pga-next");

  if (prev) prev.disabled = currentPage <= 1;
  if (next) next.disabled = currentPage >= pageCount;

  const existing = document.querySelectorAll(".pga-page-num");

  if (existing.length) {
    const parent = existing[0].parentElement;

    existing.forEach((element) => element.remove());

    for (let number = 1; number <= pageCount; number++) {
      const button = document.createElement("button");

      button.type = "button";
      button.className =
        "pga-page-num" + (number === currentPage ? " is-active" : "");

      button.dataset.page = String(number);
      button.textContent = String(number);

      if (next && next.parentElement === parent) {
        parent.insertBefore(button, next);
      } else {
        parent.appendChild(button);
      }
    }
  }
}

/* =========================
   DOWNLOAD ASLI
========================= */

async function downloadArsip(id) {
  if (!Number.isSafeInteger(id) || id < 1) return;

  const token = localStorage.getItem("eoffice_token");

  if (!token) {
    showToast("Sesi habis. Silakan login ulang.");
    return;
  }

  const base = EOfficeAPI.config?.BASE_URL || "http://127.0.0.1:8080/api";

  try {
    const response = await fetch(`${base}/arsip/${id}/file`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;

      if (
        (response.headers.get("content-type") || "").includes(
          "application/json",
        )
      ) {
        const body = await response.json();
        message = body.message || message;
      }

      throw new Error(message);
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("File arsip kosong.");
    }

    const item = arsipData.find((d) => d.id === id);

    const extension =
      {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          ".docx",
      }[blob.type] || "";

    const safeNomor = String(item?.nomor || id)
      .replace(/[^\w-]+/g, "_")
      .slice(0, 80);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `arsip_${safeNomor}${extension || ".bin"}`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 30000);

    showToast("Permintaan download berhasil.");
  } catch (error) {
    console.error("Download arsip gagal:", error);
    showToast(`Gagal mengunduh: ${error.message}`);
  }
}

/* =========================
   INTERAKSI
========================= */

function closeMenus() {
  document
    .querySelectorAll(".pga-dropdown.is-open")
    .forEach((menu) => menu.classList.remove("is-open"));
}

function setupEvents() {
  $("pga-tabs")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-jenis]");
    if (!button) return;

    tabJenis = button.dataset.jenis;
    currentPage = 1;

    $("pga-tabs")
      .querySelectorAll(".pga-tab")
      .forEach((tab) => {
        tab.classList.toggle("is-active", tab === button);
      });

    renderTable();
  });

  $("pga-search")?.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    currentPage = 1;
    renderTable();
  });

  $("pga-jenis")?.addEventListener("change", (event) => {
    jenisFilter = event.target.value;
    currentPage = 1;
    renderTable();
  });

  $("pga-tahun")?.addEventListener("change", (event) => {
    tahunFilter = event.target.value;
    currentPage = 1;
    renderTable();
  });

  $("pga-status")?.addEventListener("change", (event) => {
    statusFilter = event.target.value;
    currentPage = 1;
    renderTable();
  });

  $("pga-reset")?.addEventListener("click", () => {
    tabJenis = "all";
    jenisFilter = "all";
    tahunFilter = "all";
    statusFilter = "all";
    searchQuery = "";
    selectedId = null;
    currentPage = 1;

    $("pga-search").value = "";
    $("pga-jenis").value = "all";
    $("pga-tahun").value = "all";
    $("pga-status").value = "all";

    $("pga-tabs")
      ?.querySelectorAll(".pga-tab")
      .forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.jenis === "all");
      });

    renderTable();
  });

  $("pga-prev")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  $("pga-next")?.addEventListener("click", () => {
    const pages = Math.max(1, Math.ceil(getFiltered().length / PAGE_SIZE));

    if (currentPage < pages) {
      currentPage++;
      renderTable();
    }
  });

  document
    .querySelector(".pga-pagination")
    ?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");

      if (!button) return;

      currentPage = Number(button.dataset.page);
      renderTable();
    });

  $("pga-tbody")?.addEventListener("click", async (event) => {
    const select = event.target.closest("[data-select]");
    const menu = event.target.closest("[data-menu]");
    const detail = event.target.closest("[data-detail]");
    const download = event.target.closest("[data-unduh]");

    if (select) {
      const id = Number(select.dataset.select);

      selectedId = selectedId === id ? null : id;
      renderTable();
      return;
    }

    if (menu) {
      const target = $(`menu-${menu.dataset.menu}`);
      const wasOpen = target?.classList.contains("is-open");

      closeMenus();

      if (!wasOpen) target?.classList.add("is-open");
      return;
    }

    if (detail) {
      location.href = `detail-arsip.html?id=${encodeURIComponent(detail.dataset.detail)}`;
      return;
    }

    if (download) {
      const id = Number(download.dataset.unduh);
      closeMenus();
      await downloadArsip(id);
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".pga-actions")) {
      closeMenus();
    }
  });
}

/* =========================
   INITIALIZATION
========================= */

async function init() {
  setupFilters();
  setupEvents();

  const tbody = $("pga-tbody");

  if (tbody) {
    tbody.innerHTML = `
      <tr class="pga-empty">
        <td colspan="10">Memuat arsip dari backend...</td>
      </tr>
    `;
  }

  try {
    if (loading) return;
    loading = true;

    arsipData = await loadArsip();

    updateYearOptions();
    renderTable();

    console.info("Arsip Staf berhasil dimuat:", {
      total: arsipData.length,
      masuk: arsipData.filter((d) => d.jenisRaw === "surat_masuk").length,
      keluar: arsipData.filter((d) => d.jenisRaw === "surat_keluar").length,
    });
  } catch (error) {
    console.error("Gagal memuat Arsip Staf:", error);

    if (tbody) {
      tbody.innerHTML = `
        <tr class="pga-empty">
          <td colspan="10">
            Gagal mengambil data dari backend.
          </td>
        </tr>
      `;
    }
  } finally {
    loading = false;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
