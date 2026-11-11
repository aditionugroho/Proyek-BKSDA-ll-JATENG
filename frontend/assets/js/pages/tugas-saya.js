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
      response?.message || "Format respons tugas tidak valid.",
    );
  }

  return response.data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeTaskId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function safeProgress(value) {
  const progress = Number(value);
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
}
function safeTone(value) {
  const allowed = ["gray", "green", "red", "amber", "blue", "orange"];
  return allowed.includes(value) ? value : "gray";
}

function safeProgressColor(value) {
  const allowed = [
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#2563eb",
    "#94a3b8"
  ];

  const color = String(value ?? "").toLowerCase();
  return allowed.includes(color) ? color : "#94a3b8";
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

function mapTugas(d) {
  const statusText = String(d.status || "Belum Mulai");
  const nama = String(d.pemberi_nama || "Kepala Seksi");

  const prioritasTinggi =
    String(d.prioritas || "").toUpperCase() === "TINGGI";

  return {
    id: d.id,
    kode: d.kode || `TGS-${d.id}`,
    judul: String(d.judul || `Tugas #${d.id}`),
    deskripsi: String(d.deskripsi || ""),
    pemberi: {
      nama,
      inisial: nama
        .split(/\s+/)
        .slice(0, 2)
        .map(x => x[0] || "")
        .join("")
        .toUpperCase()
    },
    prioritas: {
      text: prioritasTinggi ? "Tinggi" : "Normal",
      tone: prioritasTinggi ? "red" : "gray"
    },
    deadline: formatTanggal(d.deadline),
    progress: Number(d.progress || 0),
    progressColor: "#2563EB",
    status: {
      text: statusText,
      tone: statusText === "Selesai"
        ? "green"
        : statusText === "Menunggu Review"
          ? "blue"
          : "amber"
    },
    selesai: statusText === "Selesai"
  };
}

async function loadData() {
  if (window.EOfficeAPI?.config?.LIVE) {
    const response = await EOfficeAPI.getTugasSaya();
    return extractData(response).map(mapTugas);
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
        (t) => {
          const taskId = safeTaskId(t.id);
          const progress = safeProgress(t.progress);
          return `
        <tr${t.selesai ? ' class="pgt-row-done"' : ""}>
          <td>
            ${taskId === null ? `<span class="pgt-nama">${escapeHtml(t.judul)}</span>` : `<a href="detail-tugas.html?id=${taskId}" class="pgt-nama">${escapeHtml(t.judul)}</a>`}
            <span class="pgt-deskripsi">${escapeHtml(t.deskripsi)}</span>
          </td>
          <td>
            <div class="pgt-pemberi">
              <span class="pgt-avatar">${escapeHtml(t.pemberi.inisial)}</span>
              <span class="pgt-pemberi-nama">${escapeHtml(t.pemberi.nama)}</span>
            </div>
          </td>
          <td><span class="pgt-prio pgt-prio--${safeTone(t.prioritas.tone)}">${escapeHtml(t.prioritas.text)}</span></td>
          <td><span class="pgt-deadline">${ICONS.calendar}${escapeHtml(t.deadline)}</span></td>
          <td>
            <div class="pgt-progress">
              <div class="pgt-progress-bar"><span style="width:${progress}%; background:${safeProgressColor(t.progressColor)}"></span></div>
              <span class="pgt-progress-label">${progress}%</span>
            </div>
          </td>
          <td><span class="pgt-status pgt-status--${safeTone(t.status.tone)}">${escapeHtml(t.status.text)}</span></td>
        </tr>`;
        },
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
