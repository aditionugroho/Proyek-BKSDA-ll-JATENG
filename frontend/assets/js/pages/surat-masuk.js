/* ============================================
   SURAT MASUK (KEPALA SEKSI) — E-Office SKSDA
   suratData + renderTable, filter tab, search,
   pagination teks, select-all, modal info
   ============================================ */

import { SURAT_MASUK as suratData } from "../data/surat-masuk.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "surat-masuk-ks";

/* Stat card */
const stats = [
  { label: "Total Surat Masuk", meta: "Bulan Ini", value: "1,248", icon: "inbox", tone: "blue" },
  { label: "Belum Dibaca", meta: "\u2191 12%", metaTone: "red", value: "42", icon: "mail", tone: "red" },
  { label: "Perlu Tindak Lanjut", meta: "Menunggu", value: "18", icon: "clock", tone: "amber" },
  { label: "Selesai (Bulan Ini)", meta: "\u2191 8%", metaTone: "green", value: "1,188", icon: "checkCircle", tone: "green" }
];

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  inbox: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  zap: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
};

/* ===== STATE ===== */
let currentFilter = "all";
let searchQuery = "";
let page = 1;
const PER_PAGE = 10;

/* ===== PERSIST STATE LIST ===== */
function persistState() {
  saveListState(STATE_KEY, { currentFilter, searchQuery, page });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentFilter = s.currentFilter ?? "all";
  searchQuery = s.searchQuery ?? "";
  page = s.page ?? 1;
  document.getElementById("kss-search").value = searchQuery;
  document.querySelectorAll(".kss-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.filter === currentFilter)
  );
}

/* ===== RENDER: stat card ===== */
function renderStats() {
  document.getElementById("kss-stats").innerHTML = stats.map((s) => {
    const metaTone = s.metaTone ? ` kss-stat-meta--${s.metaTone}` : "";
    return `
      <article class="kss-stat">
        <span class="kss-stat-icon kss-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
        <div class="kss-stat-body">
          <div class="kss-stat-top">
            <p class="kss-stat-label">${s.label}</p>
            <span class="kss-stat-meta${metaTone}">${s.meta}</span>
          </div>
          <p class="kss-stat-value">${s.value}</p>
        </div>
      </article>`;
  }).join("");
}

/* ===== FILTER DATA (tab + search) ===== */
function getFiltered() {
  return suratData.filter((s) => {
    const byTab =
      currentFilter === "all" ? true :
      currentFilter === "unread" ? s.unread :
      currentFilter === "perlu" ? s.perluTindak :
      s.selesai;

    const q = searchQuery.trim().toLowerCase();
    const bySearch =
      !q || [s.nomor, s.pengirim, s.perihal].some((f) => f.toLowerCase().includes(q));

    return byTab && bySearch;
  });
}

/* ===== RENDER: baris tabel ===== */
function renderTable(data) {
  const tbody = document.getElementById("kss-tbody");

  if (data.length === 0) {
    tbody.innerHTML = `<tr class="kss-empty"><td colspan="6">Tidak ada surat yang cocok dengan filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((s) => {
      const prioIcon = s.prioritas.icon ? ICONS[s.prioritas.icon] : "";
      const statIcon = s.status.icon ? ICONS[s.status.icon] : "";
      return `
      <tr>
        <td><input type="checkbox" class="row-check" aria-label="Pilih ${s.nomor}" /></td>
        <td>
          <div class="cell-nomor-wrap">
            ${s.unread ? '<span class="unread-dot" title="Belum dibaca"></span>' : ""}
            <a href="detail-surat-masuk.html?id=${s.id}" class="cell-nomor">${s.nomor}</a>
          </div>
          <span class="cell-tanggal">${s.tanggal}</span>
        </td>
        <td>
          <span class="cell-pengirim">${s.pengirim}</span>
          <span class="cell-pengirim-sub">${s.pengirimSub}</span>
        </td>
        <td><span class="cell-perihal">${s.perihal}</span></td>
        <td><span class="kss-badge kss-badge--${s.prioritas.tone}">${prioIcon}${s.prioritas.text}</span></td>
        <td><span class="kss-badge kss-badge--${s.status.tone}">${statIcon}${s.status.text}</span></td>
      </tr>`;
    })
    .join("");
}

/* ===== RENDER: teks "Menampilkan..." ===== */
function renderShowing(data) {
  const totalPages = Math.max(1, Math.ceil(data.length / PER_PAGE));
  if (page > totalPages) page = totalPages;

  const start = data.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, data.length);

  document.getElementById("kss-showing").textContent =
    `Menampilkan ${start}-${end} dari ${data.length} surat`;

  document.getElementById("kss-prev").disabled = page <= 1;
  document.getElementById("kss-next").disabled = page >= totalPages;
}

/* ===== RENDER: badge angka pada tab (dihitung dari data) ===== */
function renderTabBadges() {
  const unreadCount = suratData.filter((s) => s.unread).length;
  const perluCount = suratData.filter((s) => s.perluTindak).length;

  const unreadBadge = document.querySelector('[data-count="unread"]');
  const perluBadge = document.querySelector('[data-count="perlu"]');
  if (unreadBadge) unreadBadge.textContent = unreadCount;
  if (perluBadge) perluBadge.textContent = perluCount;
}

/* ===== REFRESH ===== */
function refresh() {
  const filtered = getFiltered();
  renderTable(filtered);
  renderShowing(filtered);
  persistState();
}

/* ===== EVENT: tab ===== */
const TAB_LABEL = { all: "Semua", unread: "Belum Dibaca", perlu: "Perlu Ditindaklanjuti", selesai: "Selesai" };

document.getElementById("kss-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".kss-tab");
  if (!tab) return;
  document.querySelectorAll(".kss-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  currentFilter = tab.dataset.filter;
  page = 1;
  document.getElementById("kss-search").placeholder = `Cari dalam ${TAB_LABEL[currentFilter]}...`;
  refresh();
});

/* ===== EVENT: search ===== */
document.getElementById("kss-search").addEventListener("input", (event) => {
  searchQuery = event.target.value;
  page = 1;
  refresh();
});

/* ===== EVENT: pagination (update teks saja) ===== */
document.getElementById("kss-prev").addEventListener("click", () => {
  if (page > 1) {
    page--;
    refresh();
  }
});

document.getElementById("kss-next").addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(getFiltered().length / PER_PAGE));
  if (page < totalPages) {
    page++;
    refresh();
  }
});

/* ===== EVENT: checkbox select-all ===== */
document.getElementById("kss-check-all").addEventListener("change", (event) => {
  const checked = event.target.checked;
  document.querySelectorAll(".row-check").forEach((cb) => {
    cb.checked = checked;
  });
});

/* ===== EVENT: modal registrasi — tombol kini LINK ke form admin =====
   (tidak perlu handler JS; href sudah di HTML) */
const backdrop = document.getElementById("modal-backdrop");

document.getElementById("modal-close").addEventListener("click", () => {
  backdrop.classList.remove("is-open");
});

backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) backdrop.classList.remove("is-open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && backdrop.classList.contains("is-open")) {
    backdrop.classList.remove("is-open");
  }
});

/* ===== Inisialisasi ===== */
renderStats();
renderTabBadges();
restoreState();
refresh();
