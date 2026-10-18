/* ============================================
   TUGAS SAYA (PEGAWAI) — E-Office SKSDA
   tugasSayaData + render, tab & search filter,
   modal placeholder tugas baru
   ============================================ */

import { tugasSayaData, TOTAL_BADGE_MOCK, TOTAL_FOOTER_MOCK } from "../data/tugas-saya.js";
import { openModal } from "../components/modal.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "tugas-saya-pg";

/* ===== IKON ===== */
const ICONS = {
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
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
  document.querySelectorAll(".pgt-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.filter === currentFilter)
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
            <a href="detail-tugas.html?id=${t.id}" class="pgt-nama">${t.judul}</a>
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
        </tr>`
      )
      .join("");
  }

  /* Footer */
  document.getElementById("pgt-showing").textContent =
    `Menampilkan 1-${rows.length} dari ${TOTAL_FOOTER_MOCK} tugas`;

  /* Badge tab Semua = total semua tugas */
  document.getElementById("pgt-tab-count").textContent = TOTAL_BADGE_MOCK;
  persistState();
}

/* ===== EVENT: tab ===== */
document.getElementById("pgt-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".pgt-tab");
  if (!tab) return;
  document.querySelectorAll(".pgt-tab").forEach((t) => t.classList.remove("is-active"));
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
    }
  });
});

/* ===== Inisialisasi ===== */
restoreState();
renderTable();
