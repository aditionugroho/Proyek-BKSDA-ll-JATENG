/* ============================================
   SURAT (PEGAWAI) — E-Office SKSDA
   Tab jenis + filter sifat/status/tanggal +
   modal preview ringkas
   ============================================ */

import { suratPgData as SURAT_PG_MOCK } from "../data/surat-pegawai.js";
import { showToast } from "../components/toast.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "surat-pg";

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let suratPgData = [];

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getSuratSaya();
  }
  return SURAT_PG_MOCK;
}

/* ===== IKON ===== */
const EYE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

/* ===== STATE ===== */
let currentJenis = "masuk";
let sifatFilter = "all";
let statusFilter = "all";
let tanggalFilter = "";

/* ===== PERSIST STATE LIST ===== */
function persistState() {
  saveListState(STATE_KEY, { currentJenis, sifatFilter, statusFilter, tanggalFilter });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentJenis = s.currentJenis ?? "masuk";
  sifatFilter = s.sifatFilter ?? "all";
  statusFilter = s.statusFilter ?? "all";
  tanggalFilter = s.tanggalFilter ?? "";

  document.getElementById("pgs-sifat").value = sifatFilter;
  document.getElementById("pgs-status").value = statusFilter;
  document.getElementById("pgs-tanggal").value = tanggalFilter;
  document.querySelectorAll(".pgs-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.jenis === currentJenis)
  );
}

/* ===== FILTER ===== */
function getFiltered() {
  return suratPgData.filter((s) => {
    const byJenis = s.jenis === currentJenis;
    const bySifat = sifatFilter === "all" || s.sifat === sifatFilter;
    const byStatus = statusFilter === "all" || s.status === statusFilter;
    const byTanggal = tanggalFilter === "" || s.iso === tanggalFilter;
    return byJenis && bySifat && byStatus && byTanggal;
  });
}

/* ===== RENDER TABEL ===== */
function renderTable() {
  const tbody = document.getElementById("pgs-tbody");
  const rows = getFiltered();

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="pgs-empty"><td colspan="5">Tidak ada surat yang cocok dengan filter.</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map(
        (s) => `
        <tr>
          <td>
            <div class="pgs-status-wrap">
              ${s.label.dot ? '<span class="pgs-status-dot" title="Butuh perhatian"></span>' : ""}
              <span class="pgs-status-badge pgs-status-badge--${s.label.tone}">${s.label.text}</span>
            </div>
          </td>
          <td>
            <span class="pgs-nomor">${s.nomor}</span>
            <span class="pgs-pengirim">${s.pengirim}</span>
          </td>
          <td>
            <span class="pgs-perihal">${s.perihal}</span>
            <span class="pgs-perihal-detail">${s.perihalDetail}</span>
          </td>
          <td>
            <span class="pgs-tanggal">${s.tanggal}</span>
            <span class="pgs-waktu">${s.waktu}</span>
          </td>
          <td class="th-actions">
            <button type="button" class="pgs-eye" data-preview="${s.id}" title="Lihat surat" aria-label="Lihat ${s.perihal}">${EYE_ICON}</button>
          </td>
        </tr>`
      )
      .join("");
  }

  /* Footer */
  document.getElementById("pgs-showing").textContent =
    `Menampilkan 1-${rows.length} dari ${suratPgData.length} surat`;
  document.getElementById("pgs-prev").disabled = true;
  document.getElementById("pgs-next").disabled = true;
  persistState();
}

/* ===== EVENT: tab jenis ===== */
document.getElementById("pgs-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".pgs-tab");
  if (!tab) return;
  document.querySelectorAll(".pgs-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  currentJenis = tab.dataset.jenis;
  renderTable();
});

/* ===== EVENT: filter sifat / status / tanggal ===== */
document.getElementById("pgs-sifat").addEventListener("change", (event) => {
  sifatFilter = event.target.value;
  renderTable();
});

document.getElementById("pgs-status").addEventListener("change", (event) => {
  statusFilter = event.target.value;
  renderTable();
});

document.getElementById("pgs-tanggal").addEventListener("change", (event) => {
  tanggalFilter = event.target.value;
  renderTable();
});

/* ===== EVENT: filter lanjutan (toast) ===== */
document.getElementById("btn-filter-lanjutan").addEventListener("click", () => {
  showToast("Fitur filter lanjutan menyusul");
});

/* ===== EVENT: eye → navigasi halaman detail ===== */
document.getElementById("pgs-tbody").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-preview]");
  if (!btn) return;
  window.location.href = `detail-surat.html?id=${btn.dataset.preview}`;
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("pgs-tbody");
  tbody.innerHTML = `<tr class="pgs-empty"><td colspan="5">Memuat data surat...</td></tr>`;

  try {
    suratPgData = await loadData();
  } catch (e) {
    suratPgData = [];
    tbody.innerHTML = `<tr class="pgs-empty"><td colspan="5">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  restoreState();
  renderTable();
}

init();
