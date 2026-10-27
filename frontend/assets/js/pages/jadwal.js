/* ============================================
   HALAMAN JADWAL (KS) — E-Office SKSDA
   Kalender digenerate JS + navigasi bulan +
   agenda hari terpilih dari jadwalData
   ============================================ */

import { jadwalData as JADWAL_MOCK, HARI_INI_MOCK } from "../data/jadwal.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let jadwalData = [];
let todayIso = HARI_INI_MOCK; // LIVE: diganti tanggal dari server
let agendaDates = new Set();

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const res = await EOfficeAPI.getJadwal();
    todayIso = res.hariIni || todayIso;
    return res.agenda;
  }
  return JADWAL_MOCK;
}

/* ===== IKON ===== */
const ICONS = {
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  grid: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  calendarPlus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="20"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>',
  pin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  dots: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>'
};

/* ===== UTIL ===== */
const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function iso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/* ===== STATE ===== */
let today = new Date(HARI_INI_MOCK);
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedIso = HARI_INI_MOCK;

/* ===== RENDER: stat card (dihitung dari data) ===== */
function renderStats() {
  const akhirMinggu = new Date(todayIso);
  akhirMinggu.setDate(akhirMinggu.getDate() + 6);
  const mingguIso = iso(akhirMinggu.getFullYear(), akhirMinggu.getMonth(), akhirMinggu.getDate());

  const hariIni = jadwalData.filter((a) => a.tanggal === todayIso).length;
  const mingguIni = jadwalData.filter((a) => a.tanggal >= todayIso && a.tanggal <= mingguIso).length;
  const mendatang = jadwalData.filter((a) => a.tanggal > todayIso).length;

  const stats = [
    { label: "Hari Ini", value: String(hariIni), sub: "Kegiatan hari ini", icon: "calendar", tone: "blue" },
    { label: "Minggu Ini", value: String(mingguIni), sub: "Kegiatan 7 hari ke depan", icon: "grid", tone: "green" },
    { label: "Mendatang", value: String(mendatang), sub: "Kegiatan mendatang", icon: "calendarPlus", tone: "orange" }
  ];

  document.getElementById("kj-stats").innerHTML = stats.map(
    (s) => `
      <article class="kj-stat">
        <span class="kj-stat-icon kj-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
        <div>
          <p class="kj-stat-label">${s.label}</p>
          <p class="kj-stat-value">${s.value}</p>
          <p class="kj-stat-sub">${s.sub}</p>
        </div>
      </article>`
  ).join("");
}

/* ===== RENDER: kalender (generate via JS) ===== */
function renderCalendar() {
  document.getElementById("kj-month-label").textContent = `${NAMA_BULAN[viewMonth]} ${viewYear}`;

  const grid = document.getElementById("kj-days");

  // Senin sebagai hari pertama
  const firstDay = new Date(viewYear, viewMonth, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(viewYear, viewMonth, 1 - offset);

  let html = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = iso(d.getFullYear(), d.getMonth(), d.getDate());

    const classes = ["kj-day"];
    if (d.getMonth() !== viewMonth) classes.push("is-muted");
    if (key === todayIso) classes.push("is-today");
    if (key === selectedIso) classes.push("is-selected");
    if (agendaDates.has(key)) classes.push("has-agenda");

    html += `<button type="button" class="${classes.join(" ")}" data-date="${key}" aria-label="${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}">${d.getDate()}</button>`;
  }

  grid.innerHTML = html;
}

/* ===== RENDER: agenda hari terpilih ===== */
const STATUS_TONE = {
  Berlangsung: "blue",
  Terjadwal: "green",
  Mendatang: "orange",
  Selesai: "green",
  Dibatalkan: "gray"
};

function renderAgenda() {
  const dateLabel = document.getElementById("kj-agenda-date");
  const list = document.getElementById("kj-agenda-list");

  const d = new Date(selectedIso);
  dateLabel.textContent = `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;

  const items = jadwalData.filter((a) => a.tanggal === selectedIso);

  if (items.length === 0) {
    list.innerHTML = `<p class="kj-agenda-empty">Tidak ada agenda untuk tanggal ini.</p>`;
    return;
  }

  list.innerHTML = items
    .map(
      (a) => `
      <div class="kj-agenda-item">
        <div class="kj-agenda-time">
          <span>${a.jamMulai}</span>
          <span>${a.jamSelesai}</span>
        </div>
        <div class="kj-agenda-line"></div>
        <div class="kj-agenda-body">
          <div class="kj-agenda-top">
            <p class="kj-agenda-title">${a.judul}</p>
            <span class="kj-badge kj-badge--${STATUS_TONE[a.status] || "gray"}">${a.status}</span>
          </div>
          <span class="kj-agenda-place">${ICONS.pin}${a.lokasi}</span>
          <p class="kj-agenda-desc">${a.deskripsi}</p>
        </div>
        <button type="button" class="kj-menu-btn" title="Menu agenda" aria-label="Menu ${a.judul}">${ICONS.dots}</button>
      </div>`
    )
    .join("");
}

/* ===== EVENT: klik tanggal → pilih + update agenda ===== */
document.getElementById("kj-days").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-date]");
  if (!btn) return;
  selectedIso = btn.dataset.date;
  renderCalendar();
  renderAgenda();
});

/* ===== EVENT: navigasi bulan ===== */
document.getElementById("kj-prev-month").addEventListener("click", () => {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  renderCalendar();
});

document.getElementById("kj-next-month").addEventListener("click", () => {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderCalendar();
});

/* ===== EVENT: tab tampilan (Bulan/Minggu/Hari) ===== */
document.querySelectorAll(".kj-view-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".kj-view-pill").forEach((p) => p.classList.remove("is-active"));
    pill.classList.add("is-active");
    if (pill.dataset.view !== "bulan") showToast("Tampilan menyusul");
  });
});

/* ===== EVENT: tombol header ===== */
/* ===== EVENT: tombol header ===== */
document.getElementById("btn-tambah").addEventListener("click", () => {
  openModal({
    title: "Tambah Agenda",
    desc: "Buka halaman Jadwal Pegawai untuk menambah agenda pribadi yang lengkap.",
    cancelLabel: "Tutup",
    confirmLabel: "Buka Jadwal Pegawai",
    onConfirm: () => {
      window.location.href = "../pegawai/jadwal.html";
    }
  });
});

document.getElementById("btn-filter").addEventListener("click", (event) => {
  event.currentTarget.classList.toggle("is-active");
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const list = document.getElementById("kj-agenda-list");
  list.innerHTML = `<p class="kj-agenda-empty">Memuat agenda...</p>`;

  try {
    jadwalData = await loadData();
  } catch (e) {
    jadwalData = [];
    list.innerHTML = `<p class="kj-agenda-empty">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</p>`;
    return;
  }

  today = new Date(todayIso);
  viewYear = today.getFullYear();
  viewMonth = today.getMonth();
  selectedIso = todayIso;
  agendaDates = new Set(jadwalData.map((a) => a.tanggal));

  renderStats();
  renderCalendar();
  renderAgenda();
}

init();
