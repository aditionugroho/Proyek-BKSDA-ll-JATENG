/* ============================================
   EXPORT DATA & LAPORAN (ADMIN) â€” E-Office SKSDA
   Stat, kartu pilih data, filter tabel,
   modal format export, toast
   ============================================ */

/* ===== MOCK DATA ===== */

/* Stat card */
const STATS_MOCK = [
  { label: "Surat Masuk", value: "1,248", badge: { text: "+8%", tone: "green" }, sub: "arsip", foot: "Total surat masuk", footRight: "Aktif" },
  { label: "Surat Keluar", value: "856", badge: { text: "+12%", tone: "green" }, sub: "arsip", foot: "Total surat keluar", footRight: "Tervalidasi" },
  { label: "Data Pengguna", value: "148", badge: { text: "132 aktif", tone: "blue" }, sub: "personel", foot: "Pengguna terdaftar SKSDA Jateng" },
  { label: "Laporan Bulan Ini", value: "24", badge: { text: "Sep 2026", tone: "blue" }, sub: "file dibuat", foot: "Laporan terbit", footDot: "100% OK" }
];

/* Kartu pilih data untuk export */
const EXPORTS_MOCK = [
  {
    id: "masuk",
    icon: "mail",
    badgeTop: "1,248 DATA TERSEDIA",
    title: "Surat Masuk",
    desc: "Export data surat masuk yang telah diregistrasikan dan didistribusikan dalam sistem e-Office SKSDA Jawa Tengah.",
    footIcon: "shield",
    footText: "Metadata & Disposisi",
    link: "Export Surat Masuk"
  },
  {
    id: "keluar",
    icon: "send",
    badgeTop: "856 DATA TERSEDIA",
    title: "Surat Keluar",
    desc: "Export data surat keluar, nomor agenda dinas, tujuan penerima, serta status penandatanganan elektronik (TTE).",
    footIcon: "shield",
    footText: "TTE & Lampiran",
    link: "Export Surat Keluar"
  },
  {
    id: "pengguna",
    icon: "idCard",
    badgeTop: "148 PENGGUNA TERSEDIA",
    title: "Data Pengguna",
    desc: "Export informasi seluruh akun pegawai terdaftar, unit kerja, jabatan kearsipan, serta level otorisasi akses.",
    footIcon: "shield",
    footText: "Profil & Otoritas",
    link: "Export Data Pengguna"
  },
  {
    id: "aktivitas",
    icon: "history",
    badgeTop: "2,840 AKTIVITAS TERSEDIA",
    title: "Aktivitas Sistem",
    desc: "Export log audit trail, riwayat login, perubahan konfigurasi, dan rekam jejak aktivitas operasional pengguna.",
    footIcon: "shield",
    footText: "Audit Trail Terenkripsi",
    link: "Export Aktivitas"
  }
];

/* Daftar laporan terbaru */
const REPORTS_MOCK = [
  { id: 1, nama: "Rekap Surat Masuk September 2026", jenis: "Surat Masuk", periode: "01\u201313 Sep 2026", format: "PDF", oleh: "Admin Sistem", tanggal: "13 Sep 2026", status: "Selesai" },
  { id: 2, nama: "Rekap Surat Keluar September 2026", jenis: "Surat Keluar", periode: "01\u201313 Sep 2026", format: "XLSX", oleh: "Admin Sistem", tanggal: "13 Sep 2026", status: "Selesai" },
  { id: 3, nama: "Daftar Pengguna Aktif", jenis: "Data Pengguna", periode: "September 2026", format: "XLSX", oleh: "Admin Sistem", tanggal: "12 Sep 2026", status: "Selesai" },
  { id: 4, nama: "Audit Aktivitas Sistem", jenis: "Aktivitas Sistem", periode: "01\u201313 Sep 2026", format: "PDF", oleh: "Admin Sistem", tanggal: "13 Sep 2026", status: "Selesai" },
  { id: 5, nama: "Laporan Bulanan Surat Masuk Agustus 2026", jenis: "Surat Masuk", periode: "01\u201331 Agu 2026", format: "PDF", oleh: "Admin Sistem", tanggal: "01 Sep 2026", status: "Selesai" }
];

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  idCard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="8.5" cy="10.5" r="2.5"></circle><line x1="14" y1="9" x2="19" y2="9"></line><line x1="14" y1="13" x2="19" y2="13"></line></svg>',
  history: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><polyline points="12 7 12 12 15 15"></polyline></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
};

/* ===== TOAST ===== */
const toast = document.getElementById("toast");
const toastText = document.getElementById("toast-text");
let toastTimer = null;

function showToast(text) {
  toastText.textContent = text;
  toast.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-show"), 3000);
}

/* ===== RENDER: stat card ===== */
function renderStats() {
  document.getElementById("stats-grid").innerHTML = STATS.map((s) => {
    const badge = s.badge ? `<span class="stat-badge stat-badge--${s.badge.tone}">${s.badge.text}</span>` : "";
    const footRight = s.footDot
      ? `<span class="stat-foot-right" style="color:var(--color-success)"><span class="stat-dot"></span>${s.footDot}</span>`
      : `<span class="stat-foot-right">${s.footRight || ""}</span>`;
    return `
      <article class="stat-card">
        <p class="stat-label">${s.label}</p>
        <div class="stat-value-row">
          <span class="stat-value">${s.value}</span>
          ${badge}
        </div>
        <p class="stat-sub">${s.sub}</p>
        <div class="stat-foot">
          <span class="stat-foot-text">${s.foot}</span>
          ${footRight}
        </div>
      </article>`;
  }).join("");
}

/* ===== RENDER: kartu pilih data ===== */
function renderPickCards() {
  document.getElementById("pick-grid").innerHTML = EXPORTS.map((e) => `
    <article class="pick-card">
      <span class="pick-badge-top">${e.badgeTop}</span>
      <span class="pick-icon">${ICONS[e.icon]}</span>
      <h3 class="pick-title">${e.title}</h3>
      <p class="pick-desc">${e.desc}</p>
      <div class="pick-foot">
        <span class="pick-foot-left">${ICONS[e.footIcon]}${e.footText}</span>
        <button type="button" class="pick-link" data-export="${e.id}">${e.link} &rarr;</button>
      </div>
    </article>`).join("");
}

/* ===== RENDER: tabel laporan + filter ===== */
const tbody = document.getElementById("report-tbody");
let currentMode = "aktif";
let currentKategori = "all";

const FORMAT_CLASS = { PDF: "badge--pdf", XLSX: "badge--xlsx", CSV: "badge--csv" };
const STATUS_CLASS = { Selesai: "badge--done", Diproses: "badge--process" };

function getFilteredReports() {
  // Mode Kosong & Gagal: tidak ada baris (simulasi state)
  if (currentMode !== "aktif") return [];
  if (currentKategori !== "all") {
    return REPORTS.filter((r) => r.jenis === currentKategori);
  }
  return REPORTS;
}

function renderTable() {
  const rows = getFilteredReports();

  document.getElementById("count-badge").textContent = `${rows.length} Berkas`;

  if (rows.length === 0) {
    const message =
      currentMode === "kosong" ? "Tidak ada laporan." :
      currentMode === "gagal" ? "Tidak ada laporan yang gagal." :
      "Tidak ada laporan pada kategori ini.";
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">${message}</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (r) => `
      <tr>
        <td>
          <span class="cell-name">
            <span class="cell-name-icon cell-name-icon--${r.format.toLowerCase()}">${ICONS.file}</span>
            ${r.nama}
          </span>
        </td>
        <td><span class="cell-text">${r.jenis}</span></td>
        <td><span class="cell-text">${r.periode}</span></td>
        <td><span class="badge ${FORMAT_CLASS[r.format]}">${r.format}</span></td>
        <td><span class="cell-text">${r.oleh}</span></td>
        <td><span class="cell-text">${r.tanggal}</span></td>
        <td><span class="badge ${STATUS_CLASS[r.status]}">${r.status}</span></td>
        <td class="th-actions"><button type="button" class="download-link" data-download="${r.id}">Unduh</button></td>
      </tr>`
    )
    .join("");
}

/* Tab pill */
document.getElementById("tab-pills").addEventListener("click", (event) => {
  const btn = event.target.closest(".tab-pill");
  if (!btn) return;
  document.querySelectorAll(".tab-pill").forEach((t) => t.classList.remove("is-active"));
  btn.classList.add("is-active");
  currentMode = btn.dataset.mode;
  renderTable();
});

/* Dropdown kategori */
document.getElementById("filter-kategori").addEventListener("change", (event) => {
  currentKategori = event.target.value;
  renderTable();
});

/* Tombol Segarkan: sinkron ulang waktu */
document.getElementById("btn-refresh").addEventListener("click", () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  document.getElementById("sync-text").textContent =
    `Data sinkron terakhir: ${pad(now.getDate())} ${bulan[now.getMonth()]} ${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())} WIB`;
  renderTable();
  showToast("Data laporan disegarkan");
});

/* Unduh (demo) */
tbody.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-download]");
  if (!btn) return;
  const row = REPORTS.find((r) => String(r.id) === btn.dataset.download);
  showToast(row && row.status === "Diproses" ? "Laporan masih diproses" : `Mengunduh: ${row.nama}.${row.format.toLowerCase()}`);
});

/* ===== MODAL EXPORT ===== */
const backdrop = document.getElementById("modal-backdrop");
const modalTitle = document.getElementById("modal-title");
let pendingExport = null;

document.getElementById("pick-grid").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-export]");
  if (!btn) return;
  pendingExport = EXPORTS.find((e) => e.id === btn.dataset.export);
  modalTitle.textContent = `Export ${pendingExport.title}`;
  document.querySelector('input[name="format"][value="PDF"]').checked = true;
  backdrop.classList.add("is-open");
});

function closeModal() {
  backdrop.classList.remove("is-open");
  pendingExport = null;
}

document.getElementById("modal-cancel").addEventListener("click", closeModal);
backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && backdrop.classList.contains("is-open")) closeModal();
});

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let STATS = STATS_MOCK;
let EXPORTS = EXPORTS_MOCK;
let REPORTS = REPORTS_MOCK;

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const res = await EOfficeAPI.getExport();
    return {
      stats: res.stats || STATS_MOCK,
      exports: res.exports || EXPORTS_MOCK,
      reports: res.reports || REPORTS_MOCK
    };
  }
  return { stats: STATS_MOCK, exports: EXPORTS_MOCK, reports: REPORTS_MOCK };
}

async function muatUlang() {
  try {
    const res = await loadData();
    STATS = res.stats;
    EXPORTS = res.exports;
    REPORTS = res.reports;
  } catch (e) {
    console.error("Gagal memuat data export:", e);
  }
  renderStats();
  renderPickCards();
  renderTable();
}

/* Generate: LIVE via API, mock tambah baris lokal */
document.getElementById("modal-generate").addEventListener("click", () => {
  if (!pendingExport) return;

  const format = document.querySelector('input[name="format"]:checked').value;

  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    EOfficeAPI.createExport({ jenis: pendingExport.title, format: format })
      .then(() => {
        closeModal();
        showToast("Export sedang diproses...");
        return muatUlang();
      })
      .catch(() => showToast("Gagal membuat export. Periksa koneksi lalu coba lagi."));
    return;
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const tanggalLabel = `${pad(now.getDate())} ${bulan[now.getMonth()]} ${now.getFullYear()}`;

  REPORTS.unshift({
    id: Date.now(),
    nama: `Export ${pendingExport.title} ${tanggalLabel}`,
    jenis: pendingExport.title,
    periode: tanggalLabel,
    format,
    oleh: "Admin Sistem",
    tanggal: tanggalLabel,
    status: "Diproses"
  });
  REPORTS.pop(); // jaga daftar tetap ringkas

  // Reset filter agar baris baru terlihat
  currentMode = "aktif";
  currentKategori = "all";
  document.querySelectorAll(".tab-pill").forEach((t) => t.classList.toggle("is-active", t.dataset.mode === "aktif"));
  document.getElementById("filter-kategori").value = "all";
  renderTable();

  closeModal();
  showToast("Export sedang diproses...");
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
muatUlang();
