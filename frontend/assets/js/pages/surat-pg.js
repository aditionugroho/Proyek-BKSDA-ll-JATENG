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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function getResponseData(response) {
  if (response?.status !== true || !Array.isArray(response.data)) {
    throw new Error(response?.message || "Format respons API surat tidak valid.");
  }
  return response.data;
}

function mapSurat(s, jenis) {
  const rawDate = String(s.tanggal || s.created_at || "");
  const iso = rawDate.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const date = iso ? new Date(iso + "T00:00:00") : null;

  const tanggal = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "Belum tersedia";

  const status = String(s.status || "Belum tersedia");
  const sifat = String(s.sifat || "Biasa");
  const prioritas = /penting|segera|rahasia/i.test(sifat);

  return {
    id: s.id,
    jenis,
    nomor: String(s.no_surat || s.no_agenda || "Belum ada nomor"),
    pengirim: String(
      jenis === "masuk"
        ? (s.asal || s.created_by_name || "Tidak diketahui")
        : (s.tujuan || s.created_by_name || "Tidak diketahui")
    ),
    perihal: String(s.perihal || "Tanpa perihal"),
    perihalDetail: String(s.klasifikasi || ""),
    tanggal,
    waktu: String(s.created_at || "").match(/\d{2}:\d{2}/)?.[0] || "",
    iso,
    sifat,
    status,
    label: {
      text: status,
      tone: prioritas ? "red" : "gray",
      dot: prioritas
    }
  };
}

async function loadData() {
  if (window.EOfficeAPI?.config?.LIVE) {
    const [masukResponse, keluarResponse] = await Promise.all([
      EOfficeAPI.getSuratMasuk(),
      EOfficeAPI.getSuratKeluar()
    ]);

    const masuk = getResponseData(masukResponse);
    const keluar = getResponseData(keluarResponse);

    return [
      ...masuk.map(s => mapSurat(s, "masuk")),
      ...keluar.map(s => mapSurat(s, "keluar"))
    ];
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
              <span class="pgs-status-badge pgs-status-badge--${s.label.tone}">${escapeHtml(s.label.text)}</span>
            </div>
          </td>
          <td>
            <span class="pgs-nomor">${escapeHtml(s.nomor)}</span>
            <span class="pgs-pengirim">${escapeHtml(s.pengirim)}</span>
          </td>
          <td>
            <span class="pgs-perihal">${escapeHtml(s.perihal)}</span>
            <span class="pgs-perihal-detail">${escapeHtml(s.perihalDetail)}</span>
          </td>
          <td>
            <span class="pgs-tanggal">${escapeHtml(s.tanggal)}</span>
            <span class="pgs-waktu">${escapeHtml(s.waktu)}</span>
          </td>
          <td class="th-actions">
            <button type="button" class="pgs-eye" data-preview="${escapeHtml(s.id)}" data-jenis="${escapeHtml(s.jenis)}" title="Lihat surat" aria-label="Lihat ${escapeHtml(s.perihal)}">${EYE_ICON}</button>
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
  if (btn.dataset.jenis === "keluar") {
    showToast("Detail surat keluar pegawai belum terhubung.");
    return;
  }
  const id = btn.dataset.preview;
const jenis = btn.dataset.jenis;

window.location.href =
  `detail-surat.html?id=${encodeURIComponent(id)}&jenis=${encodeURIComponent(jenis)}`;
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
