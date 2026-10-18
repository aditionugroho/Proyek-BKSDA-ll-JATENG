/* ============================================
   TUGAS SEKSI (KEPALA SEKSI) — E-Office SKSDA
   tugasData + render, tab filter status,
   dropdown menu ⋮, progress bar warna
   ============================================ */

import { TUGAS_SEKSI, TOTAL_TUGAS_MOCK } from "../data/tugas-seksi.js";
import { showToast } from "../components/toast.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "tugas-seksi-ks";

/* ===== STAT CARD ===== */
const STATS = [
  { label: "Total Tugas Aktif", value: "24", note: "+3 dari minggu lalu", noteTone: "green", noteIcon: "trendUp", icon: "clipboard", tone: "blue" },
  { label: "Menunggu Review", value: "5", note: "Perlu tindakan segera", icon: "clock", tone: "amber" },
  { label: "Selesai (Bulan Ini)", value: "18", note: "Tingkat penyelesaian: 85%", icon: "check", tone: "green" },
  { label: "Terlambat", value: "2", valueRed: true, note: "Perlu eskalasi", noteTone: "red", icon: "alert", tone: "red" }
];

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  trendUp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>',
  dots: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

/* ===== STATE ===== */
let currentFilter = "all";

/* ===== PERSIST STATE LIST ===== */
function persistState() {
  saveListState(STATE_KEY, { currentFilter });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentFilter = s.currentFilter ?? "all";
  document.querySelectorAll(".ktg-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.filter === currentFilter)
  );
}

/* ===== RENDER: stat card ===== */
function renderStats() {
  document.getElementById("ktg-stats").innerHTML = STATS.map((s) => {
    const noteTone = s.noteTone ? ` ktg-stat-note--${s.noteTone}` : "";
    const noteIcon = s.noteIcon ? ICONS[s.noteIcon] : "";
    return `
      <article class="ktg-stat">
        <div>
          <p class="ktg-stat-label">${s.label}</p>
          <p class="ktg-stat-value${s.valueRed ? " ktg-stat-value--red" : ""}">${s.value}</p>
          <p class="ktg-stat-note${noteTone}">${noteIcon}${s.note}</p>
        </div>
        <span class="ktg-stat-icon ktg-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
      </article>`;
  }).join("");
}

/* ===== WARNA PROGRESS =====
   100% = hijau, 40-99% = biru, <40% atau terlambat = merah */
function progressTone(t) {
  if (t.status === "Terlambat" || t.progress < 40) return "red";
  if (t.progress === 100) return "green";
  return "blue";
}

/* ===== BADGE STATUS ===== */
const STATUS_TONE = {
  "Berjalan": "gray",
  "Menunggu Review": "amber",
  "Terlambat": "red",
  "Belum Mulai": "gray",
  "Selesai": "green"
};

/* ===== RENDER: baris tabel ===== */
function renderTable() {
  const tbody = document.getElementById("ktg-tbody");

  const rows = TUGAS_SEKSI.filter((t) => currentFilter === "all" || t.status === currentFilter);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="ktg-empty"><td colspan="7">Tidak ada tugas dengan status ini.</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map((t) => {
        const tone = progressTone(t);
        const statusTone = STATUS_TONE[t.status] || "gray";
        return `
        <tr>
          <td>
            <a href="detail-tugas.html?id=${t.id}" class="ktg-judul">${t.judul}</a>
            <span class="ktg-kode">${t.kode}</span>
          </td>
          <td>
            <div class="ktg-pic">
              <span class="ktg-avatar${t.avatarTone === "red" ? " ktg-avatar--red" : ""}">${t.avatar}</span>
              <span class="ktg-pic-name">${t.pic}</span>
            </div>
          </td>
          <td><span class="ktg-badge ktg-badge--${t.prioritas === "TINGGI" ? "red" : "gray"}">${t.prioritas}</span></td>
          <td><span class="ktg-deadline${t.lewatDeadline ? " ktg-deadline--lewat" : ""}">${t.deadline}</span></td>
          <td>
            <div class="ktg-progress">
              <div class="ktg-progress-bar ktg-progress-bar--${tone}"><span style="width:${t.progress}%"></span></div>
              <span class="ktg-progress-label">${t.progress}%</span>
            </div>
          </td>
          <td><span class="ktg-badge ktg-badge--${statusTone}"><span class="dot"></span>${t.status}</span></td>
          <td>
            <div class="ktg-action">
              <button type="button" class="ktg-menu-btn" data-menu="${t.id}" aria-label="Menu tugas" title="Menu tugas">${ICONS.dots}</button>
              <div class="ktg-dropdown" id="menu-${t.id}">
                <a href="detail-tugas.html?id=${t.id}">${ICONS.eye}Lihat Detail</a>
                <button type="button" data-soon="Edit">${ICONS.edit}Edit</button>
                <button type="button" class="ktg-dd--danger" data-soon="Hapus">${ICONS.trash}Hapus</button>
              </div>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  /* Footer tabel */
  document.getElementById("ktg-showing").textContent =
    `Menampilkan 1 - ${rows.length} dari ${TOTAL_TUGAS_MOCK} tugas`;
  document.getElementById("ktg-prev").disabled = true;
  document.getElementById("ktg-next").disabled = true;
  persistState();
}

/* ===== EVENT: tab filter status ===== */
document.getElementById("ktg-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".ktg-tab");
  if (!tab) return;
  document.querySelectorAll(".ktg-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  currentFilter = tab.dataset.filter;
  renderTable();
});

/* ===== EVENT: dropdown ⋮ ===== */
document.getElementById("ktg-tbody").addEventListener("click", (event) => {
  const menuBtn = event.target.closest("[data-menu]");

  if (menuBtn) {
    const dropdown = document.getElementById(`menu-${menuBtn.dataset.menu}`);
    const wasOpen = dropdown.classList.contains("is-open");
    document.querySelectorAll(".ktg-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
    dropdown.classList.toggle("is-open", !wasOpen);
    return;
  }

  const soonBtn = event.target.closest("[data-soon]");
  if (soonBtn) {
    showToast(`Fitur ${soonBtn.dataset.soon.toLowerCase()} tugas menyusul`);
    document.querySelectorAll(".ktg-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
  }
});

/* Tutup dropdown saat klik di luar */
document.addEventListener("click", (event) => {
  if (!event.target.closest(".ktg-action")) {
    document.querySelectorAll(".ktg-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
  }
});

/* ===== EVENT: tombol Filter (state saja) ===== */
document.getElementById("btn-filter").addEventListener("click", (event) => {
  event.currentTarget.classList.toggle("is-active");
});

/* ===== Inisialisasi ===== */
renderStats();
restoreState();
renderTable();
