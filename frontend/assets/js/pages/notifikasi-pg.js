/* ============================================
   NOTIFIKASI (PEGAWAI) — E-Office SKSDA
   notifPgData + tab filter, tandai dibaca
   (satu & semua), ringkasan dari data
   ============================================ */

import { notifPgData } from "../data/notifikasi-pegawai.js";
import { showToast } from "../components/toast.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "notifikasi-pg";

/* ===== IKON ===== */
const ICONS = {
  plus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  minus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
};

/* ===== STATE ===== */
let currentFilter = "all";

/* ===== PERSIST STATE ===== */
function persistState() {
  saveListState(STATE_KEY, { currentFilter });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentFilter = s.currentFilter ?? "all";
  document.querySelectorAll(".pgn-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.filter === currentFilter)
  );
}

/* ===== FILTER ===== */
function getFiltered() {
  return notifPgData.filter((n) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "unread") return n.unread;
    return n.kategori === currentFilter;
  });
}

/* ===== RENDER: list ===== */
function renderList() {
  const listEl = document.getElementById("pgn-list");
  const rows = getFiltered();

  if (rows.length === 0) {
    listEl.innerHTML = `<p class="pgn-empty">Tidak ada notifikasi yang cocok dengan filter.</p>`;
  } else {
    listEl.innerHTML = rows
      .map(
        (n) => `
        <div class="pgn-item" data-item="${n.id}">
          <span class="pgn-icon pgn-icon--${n.tone}">${ICONS[n.icon]}</span>
          <div class="pgn-body">
            <p class="pgn-judul">${n.judul}</p>
            <p class="pgn-teks">${n.teks}</p>
            <span class="pgn-waktu">${n.waktu}</span>
          </div>
          ${n.unread ? '<span class="pgn-dot" title="Belum dibaca"></span>' : ""}
        </div>`
      )
      .join("");
  }
}

/* ===== RENDER: ringkasan (dihitung dari data) ===== */
function renderSummary() {
  const unread = notifPgData.filter((n) => n.unread).length;
  const surat = notifPgData.filter((n) => n.kategori === "surat").length;
  const tugas = notifPgData.filter((n) => n.kategori === "tugas").length;

  document.getElementById("pgn-unread-count").textContent = unread;
  document.getElementById("pgn-surat-count").textContent = surat;
  document.getElementById("pgn-tugas-count").textContent = tugas;
  document.getElementById("pgn-unread-sub").textContent = `${unread} notifikasi belum dibaca`;

  /* Link abu bila semua sudah dibaca */
  document.getElementById("btn-mark-all").classList.toggle("is-done", unread === 0);
}

/* ===== REFRESH ===== */
function refresh() {
  renderList();
  renderSummary();
  persistState();
}

/* ===== EVENT: tab ===== */
document.getElementById("pgn-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".pgn-tab");
  if (!tab) return;
  document.querySelectorAll(".pgn-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  currentFilter = tab.dataset.filter;
  renderList();
});

/* ===== EVENT: klik item → tandai dibaca satu ===== */
document.getElementById("pgn-list").addEventListener("click", (event) => {
  const item = event.target.closest("[data-item]");
  if (!item) return;
  const notif = notifPgData.find((n) => String(n.id) === item.dataset.item);
  if (notif && notif.unread) {
    notif.unread = false;
    refresh();
  }
});

/* ===== EVENT: tandai semua dibaca ===== */
document.getElementById("btn-mark-all").addEventListener("click", () => {
  notifPgData.forEach((n) => (n.unread = false));
  refresh();
  showToast("Semua notifikasi ditandai dibaca");
});

/* ===== EVENT: pengaturan (toast) ===== */
document.getElementById("btn-pengaturan").addEventListener("click", () => {
  showToast("Fitur pengaturan notifikasi menyusul");
});

/* ===== Inisialisasi ===== */
restoreState();
refresh();
