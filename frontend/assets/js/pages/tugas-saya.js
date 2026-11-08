/* ============================================
   TUGAS SAYA (PEGAWAI) — E-Office SKSDA
   tugasSayaData + render, tab & search filter,
   modal placeholder tugas baru
   ============================================ */

import { tugasSayaData as TUGAS_SAYA_MOCK } from "../data/tugas-saya.js";
import { openModal } from "../components/modal.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "tugas-saya-pg";

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let tugasSayaData = [];

function extractData(response) {
  if (response?.status !== true || !Array.isArray(response.data)) {
    throw new Error(
      response?.message || "Format respons disposisi tidak valid.",
    );
  }

  return response.data;
}

function formatTanggal(value) {
  if (!value) return "-";

  const iso = String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!iso) return String(value);

  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapDisposisi(d) {
  const statusAsli = String(d.status || "").toLowerCase();

  let status = { text: "Belum Mulai", tone: "gray" };

  if (/selesai|completed/.test(statusAsli)) {
    status = { text: "Selesai", tone: "green" };
  } else if (/review|verifikasi/.test(statusAsli)) {
    status = { text: "Menunggu Review", tone: "blue" };
  } else if (/proses|berjalan|tindak_lanjut/.test(statusAsli)) {
    status = { text: "Berjalan", tone: "blue" };
  }

  const rawPrioritas = String(d.prioritas || d.sifat || "Normal");

  const tinggi = /tinggi|penting|segera/i.test(rawPrioritas);

  const pemberiNama = String(
    d.pemberi_nama || d.created_by_name || "Kepala Seksi",
  );

  return {
    id: d.id,
    judul: String(d.perihal || d.judul || d.instruksi || `Disposisi #${d.id}`),
    deskripsi: String(d.instruksi || d.catatan || ""),
    pemberi: {
      nama: pemberiNama,
      inisial: pemberiNama
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0] || "")
        .join("")
        .toUpperCase(),
    },
    prioritas: {
      text: tinggi ? "Tinggi" : "Normal",
      tone: tinggi ? "red" : "gray",
    },
    deadline: formatTanggal(d.batas_waktu || d.deadline || d.tanggal),
    progress: status.text === "Selesai" ? 100 : 0,
    progressColor: "#2563EB",
    status,
    selesai: status.text === "Selesai",
  };
}

async function loadData() {
  if (window.EOfficeAPI?.config?.LIVE) {
    const response = await EOfficeAPI.getTugasSaya();
    return extractData(response).map(mapDisposisi);
  }

  return TUGAS_SAYA_MOCK;
}

/* ===== IKON ===== */
const ICONS = {
  calendar:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
};

/* ===== STATE ===== */
let currentFilter = "all";
let query = "";

/* ===== PERSIST STATE LIST ===== */
function persistState() {
  saveListState(STATE_KEY, { currentFilter, query });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentFilter = s.currentFilter ?? "all";
  query = s.query ?? "";
  document.getElementById("pgt-search").value = query;
  document
    .querySelectorAll(".pgt-tab")
    .forEach((t) =>
      t.classList.toggle("is-active", t.dataset.filter === currentFilter),
    );
}

/* ===== FILTER ===== */
function getFiltered() {
  const q = query.trim().toLowerCase();
  return tugasSayaData.filter((t) => {
    const byTab = currentFilter === "all" || t.status.text === currentFilter;
    const bySearch = !q || t.judul.toLowerCase().includes(q);
    return byTab && bySearch;
  });
}

/* ===== RENDER: baris tabel ===== */
function renderTable() {
  const tbody = document.getElementById("pgt-tbody");
  const rows = getFiltered();

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="pgt-empty"><td colspan="6">Tidak ada tugas yang cocok dengan filter.</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map(
        (t) => `
        <tr${t.selesai ? ' class="pgt-row-done"' : ""}>
          <td>
            <a href="disposisi-saya.html" class="pgt-nama">${t.judul}</a>
            <span class="pgt-deskripsi">${t.deskripsi}</span>
          </td>
          <td>
            <div class="pgt-pemberi">
              <span class="pgt-avatar">${t.pemberi.inisial}</span>
              <span class="pgt-pemberi-nama">${t.pemberi.nama}</span>
            </div>
          </td>
          <td><span class="pgt-prio pgt-prio--${t.prioritas.tone}">${t.prioritas.text}</span></td>
          <td><span class="pgt-deadline">${ICONS.calendar}${t.deadline}</span></td>
          <td>
            <div class="pgt-progress">
              <div class="pgt-progress-bar"><span style="width:${t.progress}%; background:${t.progressColor}"></span></div>
              <span class="pgt-progress-label">${t.progress}%</span>
            </div>
          </td>
          <td><span class="pgt-status pgt-status--${t.status.tone}">${t.status.text}</span></td>
        </tr>`,
      )
      .join("");
  }

  /* Footer */
  document.getElementById("pgt-showing").textContent =
    `Menampilkan 1-${rows.length} dari ${tugasSayaData.length} tugas`;

  /* Badge tab Semua = total semua tugas */
  document.getElementById("pgt-tab-count").textContent = tugasSayaData.length;
  persistState();
}

/* ===== EVENT: tab ===== */
document.getElementById("pgt-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".pgt-tab");
  if (!tab) return;
  document
    .querySelectorAll(".pgt-tab")
    .forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  currentFilter = tab.dataset.filter;
  renderTable();
});

/* ===== EVENT: search ===== */
document.getElementById("pgt-search").addEventListener("input", (event) => {
  query = event.target.value;
  renderTable();
});

/* ===== EVENT: + Tugas Baru → info + link ===== */
document.getElementById("btn-tugas-baru").addEventListener("click", () => {
  openModal({
    title: "Buat Tugas Baru",
    desc: "Tugas mandiri oleh pegawai menyusul. Untuk saat ini, tugas diberikan melalui disposisi Kepala Seksi/Kepala Balai. Silakan cek disposisi Anda untuk tugas terbaru.",
    cancelLabel: "Tutup",
    confirmLabel: "Lihat Disposisi Saya",
    onConfirm: () => {
      window.location.href = "disposisi-saya.html";
    },
  });
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("pgt-tbody");
  tbody.innerHTML = `<tr class="pgt-empty"><td colspan="6">Memuat data tugas...</td></tr>`;

  try {
    tugasSayaData = await loadData();
  } catch (e) {
    tugasSayaData = [];
    tbody.innerHTML = `<tr class="pgt-empty"><td colspan="6">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  restoreState();
  renderTable();
}

init();
