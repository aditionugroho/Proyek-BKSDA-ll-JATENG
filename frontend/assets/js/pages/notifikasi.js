/* ============================================
   NOTIFIKASI (KEPALA SEKSI) — E-Office SKSDA
   notifData + render, tab & search filter,
   tandai dibaca, pagination 2 halaman
   ============================================ */

import { notifData } from "../data/notifikasi.js";
import { showToast } from "../components/toast.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "notifikasi-ks";

/* ===== IKON ===== */
const ICONS = {
  bell: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  checkDouble: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L7 17l-4-4"></path><path d="M22 10l-7.5 7.5L12 15"></path></svg>',
  /* icon kotak item per tipe */
  mailSolid: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  archive: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>',
  refresh: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
  /* icon tombol aksi */
  arrowRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
  arrowUpRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>',
  square: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 0 1 3 3L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>'
};

/* Icon kotak per tipe item */
const TIPE_ICON = {
  suratMasukBaru: { icon: "mailSolid", tone: "blueSolid" },
  disposisiSelesai: { icon: "checkCircle", tone: "indigo" },
  tugasReview: { icon: "clipboard", tone: "orange" },
  suratKeluar: { icon: "send", tone: "blue" },
  jadwal: { icon: "calendar", tone: "green" },
  arsipRead: { icon: "archive", tone: "gray" },
  sistemRead: { icon: "refresh", tone: "greenSoft" },
  tugasRead: { icon: "clipboard", tone: "gray" },
  jadwalRead: { icon: "calendar", tone: "gray" },
  disposisiRead: { icon: "checkCircle", tone: "gray" }
};

/* ===== STATE ===== */
let currentFilter = "all";
let query = "";

/* ===== PERSIST STATE ===== */
function persistState() {
  saveListState(STATE_KEY, { currentFilter, query });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentFilter = s.currentFilter ?? "all";
  query = s.query ?? "";
  document.getElementById("nt-search").value = query;
  document.querySelectorAll(".nt-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.filter === currentFilter)
  );
}
let page = 1;
const PER_PAGE = 7;

/* ===== RENDER: stat card (dihitung dari data) ===== */
function renderStats() {
  const semua = notifData.length;
  const belum = notifData.filter((n) => n.unread).length;
  const penting = notifData.filter((n) => n.penting).length;

  const stats = [
    { label: "Semua Notifikasi", value: semua, sub: "total pembaruan masuk", icon: "bell", tone: "blue", valueTone: "" },
    { label: "Belum Dibaca", value: belum, sub: "perlu diperiksa", icon: "mail", tone: "blue", valueTone: "blue" },
    { label: "Penting & Mendesak", labelTone: "red", value: penting, sub: "butuh tindakan segera", icon: "alert", tone: "red", valueTone: "red" }
  ];

  document.getElementById("nt-stats").innerHTML = stats
    .map(
      (s) => `
      <article class="nt-stat">
        <div>
          <p class="nt-stat-label${s.labelTone ? ` nt-stat-label--${s.labelTone}` : ""}">${s.label}</p>
          <p class="nt-stat-value${s.valueTone ? ` nt-stat-value--${s.valueTone}` : ""}">${s.value}</p>
          <p class="nt-stat-sub">${s.sub}</p>
        </div>
        <span class="nt-stat-icon nt-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
      </article>`
    )
    .join("");

  /* Badge angka tab "Semua" */
  const badge = document.querySelector("[data-count='all']");
  if (badge) badge.textContent = semua;
}

/* ===== FILTER ===== */
function getFiltered() {
  return notifData.filter((n) => {
    const byTab =
      currentFilter === "all" ? true :
      currentFilter === "unread" ? n.unread :
      n.kategori === currentFilter;

    const q = query.trim().toLowerCase();
    const bySearch = !q || [n.judul, n.teks].some((f) => f.toLowerCase().includes(q));

    return byTab && bySearch;
  });
}

/* ===== RENDER: list ===== */
function renderList() {
  const listEl = document.getElementById("nt-list");
  const rows = getFiltered();

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  if (page > totalPages) page = totalPages;
  const items = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (items.length === 0) {
    listEl.innerHTML = `<p class="nt-empty">Tidak ada notifikasi yang cocok dengan filter.</p>`;
  } else {
    listEl.innerHTML = items
      .map((n) => {
        const tipe = TIPE_ICON[n.tipe] || TIPE_ICON.sistemRead;

        const badges = n.badges
          .map((b) => `<span class="nt-badge nt-badge--${b.tone}">${b.text}</span>`)
          .join("");

        const readLink = n.unread
          ? `<button type="button" class="nt-read-link" data-read="${n.id}">${ICONS.check}Tandai Dibaca</button>`
          : "";

        const aksiBtn = `<a href="${n.aksi.href || "#"}" class="nt-action-btn nt-action-btn--${n.aksi.style}" data-action="${n.id}">${ICONS[n.aksi.icon] || ""}${n.aksi.label}</a>`;

        return `
        <article class="nt-item">
          <div class="nt-left">
            ${n.unread ? '<span class="nt-unread-dot" title="Belum dibaca"></span>' : ""}
            <span class="nt-icon nt-icon--${tipe.tone}">${ICONS[tipe.icon]}</span>
          </div>
          <div class="nt-body">
            <p class="nt-judul">${n.judul}</p>
            <p class="nt-teks">${n.teks}</p>
            <div class="nt-foot">
              <span class="nt-meta">${n.meta}</span>
              <div class="nt-actions">${readLink}${aksiBtn}</div>
            </div>
          </div>
          <div class="nt-right">
            <div class="nt-badges">${badges}</div>
            <span class="nt-time">${ICONS.clock}${n.waktu}</span>
          </div>
        </article>`;
      })
      .join("");
  }

  /* Footer */
  const start = rows.length === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, rows.length);
  document.getElementById("nt-showing").textContent =
    `Menampilkan ${start}-${end} dari ${notifData.length} notifikasi`;
  document.getElementById("nt-prev").disabled = page <= 1;
  document.getElementById("nt-next").disabled = page >= totalPages;
  document.querySelectorAll(".nt-page-num").forEach((b) =>
    b.classList.toggle("is-active", Number(b.dataset.page) === page)
  );
}

/* ===== REFRESH ===== */
function refresh() {
  renderStats();
  renderList();
  persistState();
}

/* ===== EVENT: tab ===== */
document.getElementById("nt-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".nt-tab");
  if (!tab) return;
  document.querySelectorAll(".nt-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  currentFilter = tab.dataset.filter;
  page = 1;
  refresh();
});

/* ===== EVENT: search ===== */
document.getElementById("nt-search").addEventListener("input", (event) => {
  query = event.target.value;
  page = 1;
  refresh();
});

/* ===== EVENT: urutkan (state saja) ===== */
document.getElementById("nt-sort").addEventListener("change", () => {
  /* Toggle state — tidak mengubah urutan (mock) */
});

/* ===== EVENT: tandai dibaca ===== */
document.getElementById("nt-list").addEventListener("click", (event) => {
  const readBtn = event.target.closest("[data-read]");
  if (readBtn) {
    const item = notifData.find((n) => String(n.id) === readBtn.dataset.read);
    if (item) item.unread = false;
    refresh();
    return;
  }

  const actionBtn = event.target.closest("[data-action]");
  if (actionBtn) {
    const item = notifData.find((n) => String(n.id) === actionBtn.dataset.action);
    if (item && !item.aksi.href) {
      event.preventDefault();
      showToast("Fitur menyusul");
    }
  }
});

/* ===== EVENT: tandai semua dibaca ===== */
document.getElementById("btn-read-all").addEventListener("click", () => {
  notifData.forEach((n) => (n.unread = false));
  refresh();
  showToast("Semua notifikasi ditandai dibaca");
});

/* ===== EVENT: pagination ===== */
document.getElementById("nt-prev").addEventListener("click", () => {
  if (page > 1) {
    page--;
    refresh();
  }
});
document.getElementById("nt-next").addEventListener("click", () => {
  const totalPages = Math.max(1, Math.ceil(getFiltered().length / PER_PAGE));
  if (page < totalPages) {
    page++;
    refresh();
  }
});
document.querySelectorAll(".nt-page-num").forEach((btn) => {
  btn.addEventListener("click", () => {
    page = Number(btn.dataset.page);
    refresh();
  });
});

/* ===== Inisialisasi ===== */
restoreState();
refresh();
