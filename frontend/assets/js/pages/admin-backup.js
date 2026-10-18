/* ============================================
   BACKUP DATA (ADMIN) — E-Office SKSDA
   Stat, modul, riwayat (tab state), backup
   manual simulasi, detail interaktif
   ============================================ */

/* ===== MOCK DATA ===== */

/* Stat card */
const STATS = [
  { label: "Backup Terakhir", value: "13 Sep 2026", badge: "Berhasil", sub: "03:00 WIB", icon: "calendar", tone: "blue" },
  { label: "Status Backup", value: "Normal", sub: "Sistem Backup Aktif", dot: true, icon: "checkCircle", tone: "green" },
  { label: "Ukuran Terakhir", value: "2.4 GB", sub: "Full Backup Harian", icon: "box", tone: "blue" },
  { label: "Total Cadangan", value: "28 Snapshot", sub: "Tersimpan di Cloud BKSDA", icon: "database", tone: "blue" },
  { label: "Kapasitas Disk", value: "64%", sub: "1.28 / 2.0 TB", progress: 64, icon: "disk", tone: "blue" }
];

/* Modul backup 2x2 */
const MODULES = [
  { icon: "database", name: "Database", desc: "PostgreSQL 15 (Cluster Jateng)", time: "13 Sep 2026, 03:00 WIB" },
  { icon: "file", name: "Dokumen Surat", desc: "Arsip digital PDF & Lampiran (1.8 TB)", time: "13 Sep 2026, 03:00 WIB" },
  { icon: "users", name: "Data Pengguna", desc: "148 akun pengguna & hak akses", time: "13 Sep 2026, 03:00 WIB" },
  { icon: "activity", name: "Audit Trail", desc: "2,840 log aktivitas administrasi", time: "13 Sep 2026, 03:00 WIB" }
];

/* Riwayat backup */
const HISTORY = [
  {
    id: "BKP-2026-09-13-0300", tanggal: "13 Sep 2026", waktu: "03:00 WIB",
    jenis: "Scheduled", size: "2.4 GB", status: "Berhasil", oleh: "System (Cron)",
    durasi: "08 menit 42 detik", eksekutor: "System (Automated)"
  },
  {
    id: "BKP-2026-09-12-0300", tanggal: "12 Sep 2026", waktu: "03:00 WIB",
    jenis: "Scheduled", size: "2.3 GB", status: "Berhasil", oleh: "System (Cron)",
    durasi: "08 menit 10 detik", eksekutor: "System (Automated)"
  },
  {
    id: "BKP-2026-09-11-0300", tanggal: "11 Sep 2026", waktu: "03:00 WIB",
    jenis: "Scheduled", size: "2.3 GB", status: "Berhasil", oleh: "System (Cron)",
    durasi: "07 menit 58 detik", eksekutor: "System (Automated)"
  },
  {
    id: "BKP-2026-09-10-1430", tanggal: "10 Sep 2026", waktu: "14:30 WIB",
    jenis: "Manual", size: "2.3 GB", status: "Berhasil", oleh: "Admin Sistem",
    durasi: "09 menit 15 detik", eksekutor: "Admin Sistem (Manual)"
  }
];

/* Baris gagal untuk tab Error */
const ERROR_ROW = {
  id: "BKP-2026-09-09-0300", tanggal: "09 Sep 2026", waktu: "03:00 WIB",
  jenis: "Scheduled", size: "2.3 GB", status: "Gagal", oleh: "System (Cron)",
  durasi: "02 menit 05 detik", eksekutor: "System (Automated)"
};

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  box: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
  database: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
  disk: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  activity: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
  list: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  cloud: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>'
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
    const badge = s.badge ? `<span class="stat-badge stat-badge--green">${s.badge}</span>` : "";
    const dot = s.dot ? `<span class="stat-dot"></span>` : "";
    const progress = s.progress
      ? `<div class="stat-progress"><span style="width:${s.progress}%"></span></div>`
      : "";
    return `
      <article class="stat-card">
        <div>
          <p class="stat-label">${s.label}</p>
          <p class="stat-value">${s.value}</p>
          ${badge}
          <p class="stat-sub">${dot}${s.sub}</p>
          ${progress}
        </div>
        <span class="stat-icon stat-icon--${s.tone}">${ICONS[s.icon]}</span>
      </article>`;
  }).join("");
}

/* ===== RENDER: grid modul 2x2 ===== */
function renderModules() {
  document.getElementById("module-grid").innerHTML = MODULES.map((m) => `
    <article class="module-card">
      <div class="module-head">
        <span class="module-icon">${ICONS[m.icon]}</span>
        <p class="module-name">${m.name}</p>
        <span class="module-badge">NORMAL</span>
      </div>
      <p class="module-desc">${m.desc}</p>
      <div class="module-foot">
        <span class="module-foot-check">${ICONS.check}Terbackup</span>
        <span class="module-foot-time">${m.time}</span>
      </div>
    </article>`).join("");
}

/* ===== RENDER: tabel riwayat (per mode) ===== */
const tbody = document.getElementById("history-tbody");
let currentMode = "normal";

const JENIS_CLASS = { Scheduled: "badge--blue", Manual: "badge--yellow" };
const STATUS_CLASS = { Berhasil: "badge--green", Gagal: "badge--red" };

function rowHtml(row) {
  return `
    <tr>
      <td><span class="cell-id">${ICONS.list}${row.id}</span></td>
      <td>
        <span class="cell-date">${row.tanggal}</span>
        <span class="cell-time">${row.waktu}</span>
      </td>
      <td><span class="badge ${JENIS_CLASS[row.jenis]}">${row.jenis}</span></td>
      <td><span class="cell-size">${row.size}</span></td>
      <td><span class="badge ${STATUS_CLASS[row.status]}">${row.status}</span></td>
      <td><span class="cell-by">${row.oleh}</span></td>
      <td class="th-actions"><button type="button" class="detail-btn" data-id="${row.id}">Lihat Detail</button></td>
    </tr>`;
}

function renderHistory(mode) {
  currentMode = mode;

  if (mode === "loading") {
    // Skeleton rows animasi
    tbody.innerHTML = Array.from({ length: 4 })
      .map(
        () => `
        <tr>
          <td><span class="skeleton" style="width:150px"></span></td>
          <td><span class="skeleton" style="width:90px"></span></td>
          <td><span class="skeleton" style="width:70px"></span></td>
          <td><span class="skeleton" style="width:50px"></span></td>
          <td><span class="skeleton" style="width:60px"></span></td>
          <td><span class="skeleton" style="width:100px"></span></td>
          <td><span class="skeleton" style="width:80px"></span></td>
        </tr>`
      )
      .join("");
    return;
  }

  if (mode === "empty") {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Tidak ada riwayat backup yang tersedia.</td></tr>`;
    return;
  }

  const rows = mode === "error" ? [ERROR_ROW] : HISTORY;
  tbody.innerHTML = rows.map(rowHtml).join("");
}

/* Tab pill mengganti isi tabel */
document.getElementById("tab-pills").addEventListener("click", (event) => {
  const btn = event.target.closest(".tab-pill");
  if (!btn) return;
  document.querySelectorAll(".tab-pill").forEach((t) => t.classList.remove("is-active"));
  btn.classList.add("is-active");
  renderHistory(btn.dataset.mode);
});

/* ===== LIHAT DETAIL → isi panel kanan ===== */
function fillDetail(row) {
  document.getElementById("d-id").textContent = row.id;
  document.getElementById("d-tipe").textContent = row.jenis;
  document.getElementById("d-waktu").textContent = `${row.tanggal}, ${row.waktu}`;
  document.getElementById("d-durasi").textContent = row.durasi;
  document.getElementById("d-ukuran").textContent = row.size;
  document.getElementById("d-eksekutor").textContent = row.eksekutor;

  const statusEl = document.getElementById("d-status");
  statusEl.textContent = row.status.toUpperCase();
  statusEl.className = `status-badge status-badge--${row.status === "Berhasil" ? "green" : "red"}`;

  // Sorot kartu sebentar agar perubahan terlihat
  const card = document.getElementById("detail-card");
  card.classList.add("is-highlight");
  setTimeout(() => card.classList.remove("is-highlight"), 900);
}

tbody.addEventListener("click", (event) => {
  const btn = event.target.closest(".detail-btn");
  if (!btn) return;
  const row = [...HISTORY, ERROR_ROW].find((r) => r.id === btn.dataset.id);
  if (row) fillDetail(row);
});

/* ===== TOMBOL BACKUP SEKARANG ===== */
const backupBtn = document.getElementById("btn-backup");
const BACKUP_IDLE = `${ICONS.cloud} + Backup Sekarang`;

backupBtn.addEventListener("click", () => {
  backupBtn.disabled = true;
  backupBtn.innerHTML = `<span class="spinner"></span> Memproses...`;

  setTimeout(() => {
    // Buat baris riwayat baru (Manual, Berhasil)
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const tanggalLabel = `${pad(now.getDate())} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
    const waktuLabel = `${pad(now.getHours())}:${pad(now.getMinutes())} WIB`;

    HISTORY.unshift({
      id: `BKP-${stamp}`,
      tanggal: tanggalLabel,
      waktu: waktuLabel,
      jenis: "Manual",
      size: "2.4 GB",
      status: "Berhasil",
      oleh: "Admin Sistem",
      durasi: "08 menit 51 detik",
      eksekutor: "Admin Sistem (Manual)"
    });
    HISTORY.pop(); // jaga tetap 4 snapshot terakhir

    // Kembali ke tab Normal agar baris baru terlihat
    document.querySelectorAll(".tab-pill").forEach((t) => t.classList.remove("is-active"));
    document.querySelector('.tab-pill[data-mode="normal"]').classList.add("is-active");
    renderHistory("normal");

    backupBtn.disabled = false;
    backupBtn.innerHTML = BACKUP_IDLE;
    showToast("Backup manual selesai");
  }, 3000);
});

/* ===== Inisialisasi ===== */
renderStats();
renderModules();
renderHistory("normal");
