/* ============================================
   ARSIP DOKUMEN (KS) — E-Office SKSDA
   arsipData + filter (search/jenis/tahun/
   status), toggle tabel/grid, modal detail
   ============================================ */

import { arsipData as ARSIP_MOCK } from "../data/arsip.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let arsipData = [];

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getArsip();
  }
  return ARSIP_MOCK;
}

const ICONS = {
  folder: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
  inbox: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
};

/* ===== STATE ===== */
let mode = "tabel";
let query = "";
let jenisFilter = "all";
let tahunFilter = "all";
let statusFilter = "all";

/* ===== RENDER STAT (dihitung dari data, bukan hard-coded) ===== */
function renderStats() {
  const fmt = (n) => n.toLocaleString("id-ID");
  const namaBulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const now = new Date();
  const bulanIni = arsipData.filter((d) =>
    d.tanggal.includes(`${namaBulan[now.getMonth()]} ${now.getFullYear()}`)
  ).length;

  const stats = [
    { label: "Total Arsip", value: fmt(arsipData.length), sub: "berkas tersimpan aman", dot: "blue", icon: "folder", tone: "blue" },
    { label: "Surat Masuk", value: fmt(arsipData.filter((d) => d.jenis === "Surat Masuk").length), sub: "arsip surat masuk", dot: "green", icon: "inbox", tone: "green" },
    { label: "Surat Keluar", value: fmt(arsipData.filter((d) => d.jenis === "Surat Keluar").length), sub: "arsip surat keluar", dot: "blue", icon: "send", tone: "blue" },
    { label: "Arsip Bulan Ini", value: fmt(bulanIni), sub: "penambahan berkas baru", dot: "orange", icon: "calendar", tone: "amber" }
  ];

  document.getElementById("ar-stats").innerHTML = stats.map(
    (s) => `
      <article class="ar-stat">
        <div>
          <p class="ar-stat-label">${s.label}</p>
          <p class="ar-stat-value">${s.value}</p>
          <p class="ar-stat-sub"><span class="ar-stat-dot ar-stat-dot--${s.dot}"></span>${s.sub}</p>
        </div>
        <span class="ar-stat-icon ar-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
      </article>`
  ).join("");
}

/* ===== FILTER ===== */
function getFiltered() {
  const q = query.trim().toLowerCase();
  return arsipData.filter((d) => {
    const byQ =
      !q || [d.nomor, d.perihal, d.asal].some((f) => f.toLowerCase().includes(q));
    const byJenis = jenisFilter === "all" || d.jenis === jenisFilter;
    const byTahun = tahunFilter === "all" || d.tahun === tahunFilter;
    const byStatus = statusFilter === "all" || d.status === statusFilter;
    return byQ && byJenis && byTahun && byStatus;
  });
}

/* ===== RENDER TABEL ===== */
function renderTable(rows) {
  const tbody = document.getElementById("ar-tbody");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="ar-empty"><td colspan="8">Tidak ada dokumen yang cocok dengan filter.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (d, i) => `
      <tr>
        <td><span class="ar-no">${i + 1}</span></td>
        <td><span class="ar-nomor">${d.nomor}</span></td>
        <td><span class="ar-tanggal">${d.tanggal}</span></td>
        <td><span class="ar-jenis-badge">${d.jenis}</span></td>
        <td><span class="ar-perihal">${d.perihal}</span></td>
        <td><span class="ar-asal">${d.asal}</span></td>
        <td><span class="ar-status-badge ar-status-badge--${d.status === "Selesai" ? "selesai" : "arsip"}">${d.status}</span></td>
        <td class="th-actions"><button type="button" class="ar-lihat" data-detail="${d.id}">Lihat</button></td>
      </tr>`
    )
    .join("");
}

/* ===== RENDER GRID ===== */
function renderGrid(rows) {
  const grid = document.getElementById("ar-grid");
  if (rows.length === 0) {
    grid.innerHTML = `<p class="ar-empty-text">Tidak ada dokumen yang cocok dengan filter.</p>`;
    return;
  }
  grid.innerHTML = rows
    .map(
      (d) => `
      <article class="ar-card-item">
        <span class="ar-jenis-badge" style="align-self:flex-start">${d.jenis}</span>
        <span class="ar-nomor">${d.nomor}</span>
        <span class="ar-card-tanggal">${d.tanggal} \u2022 ${d.status}</span>
        <p class="ar-card-perihal">${d.perihal}</p>
        <button type="button" class="ar-btn ar-btn--outline" data-detail="${d.id}">Lihat</button>
      </article>`
    )
    .join("");
}

/* ===== RENDER INFO & FOOTER ===== */
function renderFooter(rows) {
  document.getElementById("ar-count-num").textContent = rows.length;
  document.getElementById("ar-showing").textContent =
    `Menampilkan 1-${rows.length} dari ${arsipData.length.toLocaleString("id-ID")} dokumen`;
}

/* ===== REFRESH ===== */
function refresh() {
  const rows = getFiltered();
  if (mode === "tabel") {
    document.getElementById("ar-table-wrap").hidden = false;
    document.getElementById("ar-grid").hidden = true;
    renderTable(rows);
  } else {
    document.getElementById("ar-table-wrap").hidden = true;
    document.getElementById("ar-grid").hidden = false;
    renderGrid(rows);
  }
  renderFooter(rows);
}

/* ===== EVENT: filter ===== */
document.getElementById("ar-search").addEventListener("input", (e) => {
  query = e.target.value;
  refresh();
});
document.getElementById("ar-jenis").addEventListener("change", (e) => {
  jenisFilter = e.target.value;
  refresh();
});
document.getElementById("ar-tahun").addEventListener("change", (e) => {
  tahunFilter = e.target.value;
  refresh();
});
document.getElementById("ar-status").addEventListener("change", (e) => {
  statusFilter = e.target.value;
  refresh();
});
document.getElementById("ar-reset").addEventListener("click", () => {
  query = "";
  jenisFilter = "all";
  tahunFilter = "all";
  statusFilter = "all";
  document.getElementById("ar-search").value = "";
  document.getElementById("ar-jenis").value = "all";
  document.getElementById("ar-tahun").value = "all";
  document.getElementById("ar-status").value = "all";
  refresh();
});

/* ===== EVENT: toggle tabel/grid ===== */
document.querySelectorAll(".ar-toggle-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".ar-toggle-pill").forEach((p) => p.classList.remove("is-active"));
    pill.classList.add("is-active");
    mode = pill.dataset.mode;
    refresh();
  });
});

/* ===== EVENT: pagination dummy ===== */
document.getElementById("ar-next").addEventListener("click", () => showToast("Navigasi halaman menyusul"));
document.querySelectorAll("[data-dummy]").forEach((btn) => {
  btn.addEventListener("click", () => showToast("Navigasi halaman menyusul"));
});

/* ===== EVENT: detail dokumen → navigasi halaman detail ===== */
document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-detail]");
  if (!btn) return;
  window.location.href = `detail-arsip.html?id=${btn.dataset.detail}`;
});

/* ===== EVENT: tombol header ===== */
document.getElementById("btn-sinkron").addEventListener("click", () => {
  showToast("Arsip tersinkronisasi");
});

document.getElementById("btn-cari-cepat").addEventListener("click", () => {
  const input = document.getElementById("ar-search");
  input.scrollIntoView({ behavior: "smooth", block: "center" });
  input.focus();
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("ar-tbody");
  tbody.innerHTML = `<tr class="ar-empty"><td colspan="8">Memuat data arsip...</td></tr>`;

  try {
    arsipData = await loadData();
  } catch (e) {
    arsipData = [];
    tbody.innerHTML = `<tr class="ar-empty"><td colspan="8">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  renderStats();
  refresh();
}

init();
