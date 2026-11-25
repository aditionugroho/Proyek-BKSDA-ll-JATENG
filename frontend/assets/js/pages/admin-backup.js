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

/* ===== RENDER: tabel riwayat (per mode) ===== */
const tbody = document.getElementById("history-tbody");

const JENIS_CLASS = { Scheduled: "badge--blue", Manual: "badge--yellow" };
const STATUS_CLASS = { Berhasil: "badge--green", Gagal: "badge--red" };

function rowHtml(row) {
  return `
    <tr>
      <td><span class="cell-id">${ICONS.list}${escapeHtml(row.id)}</span></td>
      <td>
        <span class="cell-date">${escapeHtml(row.tanggal)}</span>
        <span class="cell-time">${escapeHtml(row.waktu)}</span>
      </td>
      <td><span class="badge ${JENIS_CLASS[row.jenis]}">${escapeHtml(row.jenis)}</span></td>
      <td><span class="cell-size">${escapeHtml(row.size)}</span></td>
      <td><span class="badge ${STATUS_CLASS[row.status]}">${escapeHtml(row.status)}</span></td>
      <td><span class="cell-by">${escapeHtml(row.oleh)}</span></td>
      <td class="th-actions"><button type="button" class="detail-btn" data-id="${escapeHtml(row.id)}">Lihat Detail</button></td>
    </tr>`;
}

function renderHistory(mode) {
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

  if (mode === "error") {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Gagal memuat riwayat backup.</td></tr>';
    return;
  }
  const rows = HISTORY;
  tbody.innerHTML = rows.map(rowHtml).join("");
}

/* ===== LIHAT DETAIL â†’ isi panel kanan ===== */
function fillDetail(row) {
  document.getElementById("d-id").textContent = row.id;
  document.getElementById("d-tipe").textContent = row.jenis;
  document.getElementById("d-waktu").textContent = `${escapeHtml(row.tanggal)}, ${escapeHtml(row.waktu)}`;
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
  const row = HISTORY.find((r) => r.id === btn.dataset.id);
  if (row) fillDetail(row);
});

const backupBtn = document.getElementById("btn-backup");
const idleLabel = backupBtn.innerHTML;
let STATS = [];
let HISTORY = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function loadData() {
  const response = await window.EOfficeAPI.getBackup();
  if (response?.status !== true || !Array.isArray(response.data)) {
    throw new Error(response?.message || "Format riwayat backup tidak valid.");
  }
  HISTORY = response.data.map((backup) => ({
    id: String(backup.filename),
    tanggal: backup.created_at || "?",
    waktu: "",
    jenis: "Database",
    size: Number.isFinite(Number(backup.size)) ? `${Number(backup.size).toLocaleString("id-ID")} byte` : "?",
    status: "Berhasil",
    oleh: "?",
    durasi: "?",
    eksekutor: "?",
  }));
  STATS = [{ label: "Total Cadangan", value: HISTORY.length, sub: "Backup database", icon: "database", tone: "blue" }];
  renderStats();
  renderHistory(HISTORY.length ? "normal" : "empty");
  const detail = document.getElementById("detail-card");
  detail.hidden = HISTORY.length === 0;
  if (HISTORY.length) fillDetail(HISTORY[0]);
}

backupBtn.addEventListener("click", async () => {
  backupBtn.disabled = true;
  backupBtn.textContent = "Memproses...";
  try {
    const response = await window.EOfficeAPI.runBackup();
    if (response?.status !== true || !response.data?.filename) {
      throw new Error(response?.message || "Server belum mengonfirmasi pembuatan backup.");
    }
    try {
      await loadData();
      showToast("Backup manual selesai.");
    } catch {
      showToast("Backup dibuat, tetapi riwayat gagal dimuat ulang.");
    }
  } catch (error) {
    showToast(error.message);
  } finally {
    backupBtn.disabled = false;
    backupBtn.innerHTML = idleLabel;
  }
});

renderHistory("loading");
loadData().catch((error) => {
  renderHistory("error");
  showToast(error.message);
});
