/* ============================================
   DOKUMEN SAYA (PEGAWAI) — E-Office SKSDA
   dokumenPgData + tab pill filter, modal
   detail, pagination dummy, aksi dokumen
   ============================================ */

import { dokumenPgData as DOKUMEN_PG_MOCK } from "../data/dokumen-pegawai.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { saveListState, loadListState } from "../utils/state.js";

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let dokumenPgData = [];

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const response = await EOfficeAPI.getDokumenSaya();

    if (response?.status !== true || !Array.isArray(response.data)) {
      throw new Error("Format respons API dokumen tidak valid.");
    }

    return response.data;
  }
  return DOKUMEN_PG_MOCK;
}

const STATE_KEY = "dokumen-saya-pg";

/* ===== IKON ===== */
const ICONS = {
  doc: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  folder: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
};

/* ===== STATE ===== */
let currentStatus = "all";
let page = 1;

/* ===== PERSIST STATE LIST ===== */
function persistState() {
  saveListState(STATE_KEY, { currentStatus, page });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentStatus = s.currentStatus ?? "all";
  page = s.page ?? 1;
  document.querySelectorAll(".pgdk-pill").forEach((p) =>
    p.classList.toggle("is-active", p.dataset.status === currentStatus)
  );
}

/* ===== FILTER ===== */
function getFiltered() {
  return dokumenPgData.filter((d) => currentStatus === "all" || d.status.text === currentStatus);
}

/* ===== RENDER TABEL ===== */
function renderTable() {
  const tbody = document.getElementById("pgdk-tbody");
  const rows = getFiltered();

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="pgdk-empty"><td colspan="6">Tidak ada dokumen yang cocok dengan filter.</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map(
        (d) => `
        <tr>
          <td>
            <div class="pgdk-nama-cell">
              <span class="pgdk-icon">${ICONS[d.icon]}</span>
              <button type="button" class="pgdk-nama" data-detail="${d.id}">${d.nama}</button>
            </div>
          </td>
          <td><span class="pgdk-text">${d.nomor}</span></td>
          <td><span class="pgdk-text">${d.tanggal}</span></td>
          <td><span class="pgdk-kategori">${d.kategori}</span></td>
          <td><span class="pgdk-badge pgdk-badge--${d.status.tone}">${d.status.text}</span></td>
          <td class="th-actions">
            <div class="pgdk-actions">
              ${d.adaFile ? `<button type="button" class="pgdk-action-btn" data-unduh="${d.id}">Unduh</button>` : ""}
              ${d.status.text === "Draft" ? `<button type="button" class="pgdk-action-btn" data-kirim="${d.id}">Kirim</button>` : ""}
              ${d.status.text === "Draft" ? `<button type="button" class="pgdk-action-btn" data-edit="${d.id}">Edit</button>` : ""}
              <button type="button" class="pgdk-action-btn pgdk-action-btn--danger" data-hapus="${d.id}">Hapus</button>
            </div>
          </td>
        </tr>`
      )
      .join("");
  }

  /* Footer */
  document.getElementById("pgdk-showing").textContent =
    `Menampilkan 1-${rows.length} dari ${dokumenPgData.length} dokumen`;
  persistState();
}

/* ===== EVENT: tab pill ===== */
document.getElementById("pgdk-pills").addEventListener("click", (event) => {
  const pill = event.target.closest(".pgdk-pill");
  if (!pill) return;
  document.querySelectorAll(".pgdk-pill").forEach((p) => p.classList.remove("is-active"));
  pill.classList.add("is-active");
  currentStatus = pill.dataset.status;
  page = 1;
  renderPagination();
  renderTable();
});

/* ===== AKSI: unduh / kirim / edit / hapus / detail ===== */
function isLive() {
  return window.EOfficeAPI && EOfficeAPI.config.LIVE;
}

async function unduhFile(id) {
  const dok = dokumenPgData.find((d) => d.id === id);

  if (!isLive()) {
    showToast("Mode demo: file tidak tersedia.");
    return;
  }

  try {
    showToast("Menyiapkan unduhan...");
    const blob = await EOfficeAPI.downloadDokumenSaya(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = dok?.fileNama || "dokumen";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    showToast(err.message || "Gagal mengunduh file.");
  }
}

function konfirmasiKirim(id) {
  const dok = dokumenPgData.find((d) => d.id === id);

  openModal({
    title: "Kirim Dokumen",
    desc: `Kirim "${dok ? dok.nama : "dokumen ini"}" untuk diperiksa Kepala Seksi?`,
    confirmLabel: "Ya, Kirim",
    onConfirm: async () => {
      if (!isLive()) {
        showToast("Mode demo: aksi tidak tersedia.");
        return;
      }

      try {
        await EOfficeAPI.kirimDokumenSaya(id);
        showToast("Dokumen dikirim");
        await muatUlang();
      } catch (err) {
        showToast(err.message || "Gagal mengirim dokumen.");
      }
    }
  });
}

function konfirmasiHapus(id) {
  const dok = dokumenPgData.find((d) => d.id === id);

  openModal({
    title: "Hapus Dokumen",
    desc: `Hapus "${dok ? dok.nama : "dokumen ini"}"? Tindakan ini tidak bisa dibatalkan.`,
    confirmLabel: "Ya, Hapus",
    danger: true,
    onConfirm: async () => {
      if (!isLive()) {
        showToast("Mode demo: aksi tidak tersedia.");
        return;
      }

      try {
        await EOfficeAPI.deleteDokumenSaya(id);
        showToast("Dokumen dihapus");
        await muatUlang();
      } catch (err) {
        showToast(err.message || "Gagal menghapus dokumen.");
      }
    }
  });
}

document.getElementById("pgdk-tbody").addEventListener("click", (event) => {
  const unduh = event.target.closest("[data-unduh]");
  if (unduh) {
    unduhFile(Number(unduh.dataset.unduh));
    return;
  }

  const kirim = event.target.closest("[data-kirim]");
  if (kirim) {
    konfirmasiKirim(Number(kirim.dataset.kirim));
    return;
  }

  const edit = event.target.closest("[data-edit]");
  if (edit) {
    window.location.href = `/pegawai/buat-dokumen?id=${edit.dataset.id}`;
    return;
  }

  const hapus = event.target.closest("[data-hapus]");
  if (hapus) {
    konfirmasiHapus(Number(hapus.dataset.hapus));
    return;
  }

  const btn = event.target.closest("[data-detail]");
  if (!btn) return;
  window.location.href = `/pegawai/detail-dokumen?id=${btn.dataset.detail}`;
});

/* ===== MUAT ULANG DATA ===== */
async function muatUlang() {
  try {
    dokumenPgData = await loadData();
  } catch (e) {
    dokumenPgData = [];
  }

  renderTable();
}

/* ===== EVENT: pagination dummy ===== */
function renderPagination() {
  document.querySelectorAll(".pgdk-page-num").forEach((b) =>
    b.classList.toggle("is-active", Number(b.dataset.page) === page)
  );
  document.getElementById("pgdk-prev").disabled = page === 1;
  document.getElementById("pgdk-next").disabled = page === 3;
}

document.querySelectorAll(".pgdk-page-num").forEach((btn) => {
  btn.addEventListener("click", () => {
    page = Number(btn.dataset.page);
    renderPagination();
  });
});

document.getElementById("pgdk-prev").addEventListener("click", () => {
  if (page > 1) {
    page--;
    renderPagination();
  }
});

document.getElementById("pgdk-next").addEventListener("click", () => {
  if (page < 3) {
    page++;
    renderPagination();
  }
});

/* ===== EVENT: + Buat Dokumen ===== */
document.getElementById("btn-buat").addEventListener("click", () => {
  window.location.href = "/pegawai/buat-dokumen";
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("pgdk-tbody");
  tbody.innerHTML = `<tr class="pgdk-empty"><td colspan="6">Memuat data dokumen...</td></tr>`;

  try {
    dokumenPgData = await loadData();
  } catch (e) {
    dokumenPgData = [];
    tbody.innerHTML = `<tr class="pgdk-empty"><td colspan="6">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  restoreState();
  renderPagination();
  renderTable();
}

init();
