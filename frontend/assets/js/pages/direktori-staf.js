/* ============================================
   DIREKTORI STAF (KS) — E-Office SKSDA
   Stat, filter, tabel/grid, modal detail
   ============================================ */

import { stafData as STAF_MOCK } from "../data/staf.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let stafData = [];

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getStaf();
  }
  return STAF_MOCK;
}

const ICONS = {
  users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
};

/* ===== STATE ===== */
let mode = "tabel";
let page = 1;
let query = "";
let statusFilter = "all";
let jabatanFilter = "all";

/* ===== RENDER STAT (dihitung dari data, bukan hard-coded) ===== */
function renderStats() {
  const total = stafData.length;
  const aktif = stafData.filter((s) => s.status === "AKTIF").length;
  const bertugas = stafData.filter((s) => s.tugas > 0).length;
  const beban = stafData.reduce((sum, s) => sum + (s.tugas || 0), 0);
  const pct = total ? Math.round((aktif / total) * 100) : 0;

  const stats = [
    { label: "Total Staf", labelTone: "", value: String(total), valueTone: "", suffix: "personel", sub: "Personel terdaftar pada seksi", icon: "users", tone: "blue" },
    { label: "Staf Aktif", labelTone: "green", value: String(aktif), valueTone: "green", suffix: `orang (${pct}%)`, sub: "Siap menerima disposisi harian", icon: "check", tone: "green" },
    { label: "Sedang Bertugas", labelTone: "blue", value: String(bertugas), valueTone: "blue", suffix: "personel", sub: "Memiliki tugas berjalan", icon: "clipboard", tone: "blue" },
    { label: "Total Beban Tugas", labelTone: "orange", value: String(beban), valueTone: "orange", suffix: "tugas", sub: "Akumulasi tugas seluruh seksi", icon: "clock", tone: "amber" }
  ];

  document.getElementById("st-stats").innerHTML = stats.map((s) => `
    <article class="st-stat">
      <div>
        <p class="st-stat-label${s.labelTone ? ` st-stat-label--${s.labelTone}` : ""}">${s.label}</p>
        <p class="st-stat-value${s.valueTone ? ` st-stat-value--${s.valueTone}` : ""}">${s.value} <span>${s.suffix}</span></p>
        <p class="st-stat-sub">${s.sub}</p>
      </div>
      <span class="st-stat-icon st-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
    </article>`).join("");
}

/* ===== FILTER ===== */
function getFiltered() {
  const q = query.trim().toLowerCase();
  return stafData.filter((s) => {
    const byQ = !q || [s.nama, s.nip, s.jabatan].some((f) => f.toLowerCase().includes(q));
    const byStatus = statusFilter === "all" || s.status === statusFilter;
    const byJabatan = jabatanFilter === "all" || s.jabatan === jabatanFilter;
    return byQ && byStatus && byJabatan;
  });
}

/* ===== RENDER TABEL ===== */
function renderTable(rows) {
  const tbody = document.getElementById("st-tbody");
  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="st-empty"><td colspan="8">Tidak ada staf yang cocok dengan filter.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map(
      (s, i) => `
      <tr>
        <td><span class="st-no">${i + 1}</span></td>
        <td>
          <div class="st-identity">
            <span class="st-avatar">${inisial(s.nama)}</span>
            <div>
              <span class="st-nama">${s.nama}</span>
              <span class="st-golongan">${s.golongan}</span>
            </div>
          </div>
        </td>
        <td><span class="st-nip">${s.nip}</span></td>
        <td><span class="st-jabatan">${s.jabatan}</span></td>
        <td>
          <span class="st-email">${s.email}</span>
          <span class="st-telp">${s.telp}</span>
        </td>
        <td><span class="st-tugas-box">${s.tugas} Tugas</span></td>
        <td><span class="st-badge st-badge--${s.status === "AKTIF" ? "green" : "amber"}">${s.status}</span></td>
        <td class="th-actions"><button type="button" class="st-detail-link" data-detail="${s.id}">Lihat Detail</button></td>
      </tr>`
    )
    .join("");
}

/* ===== RENDER GRID ===== */
function renderGrid(rows) {
  const grid = document.getElementById("st-grid");
  if (rows.length === 0) {
    grid.innerHTML = `<p class="st-empty-text">Tidak ada staf yang cocok dengan filter.</p>`;
    return;
  }
  grid.innerHTML = rows
    .map(
      (s) => `
      <article class="st-card-item">
        <span class="st-avatar st-avatar--lg">${inisial(s.nama)}</span>
        <p class="st-card-nama">${s.nama}</p>
        <p class="st-card-jabatan">${s.jabatan}</p>
        <span class="st-tugas-box">${s.tugas} Tugas</span>
        <button type="button" class="st-btn st-btn--outline st-btn--sm" data-detail="${s.id}">Lihat Detail</button>
      </article>`
    )
    .join("");
}

/* ===== RENDER FOOTER ===== */
function renderFooter(rows) {
  const showing = page === 1 ? `Menampilkan 1-${rows.length} dari ${stafData.length} staf seksi` : `Menampilkan 1-4 dari ${stafData.length} staf seksi`;
  document.getElementById("st-showing").textContent = showing;
  document.getElementById("st-count").textContent = `${rows.length} dari ${stafData.length} staf`;
  document.getElementById("st-prev").disabled = page === 1;
  document.getElementById("st-next").disabled = page === 2;
  document.querySelectorAll(".st-page-num").forEach((b) => b.classList.toggle("is-active", Number(b.dataset.page) === page));
}

/* ===== REFRESH ===== */
function refresh() {
  let rows = getFiltered();
  // Halaman 2 (dummy): tampilkan 4 baris terakhir
  if (page === 2) rows = rows.slice(4, 8);

  if (mode === "tabel") {
    document.getElementById("st-table-wrap").hidden = false;
    document.getElementById("st-grid").hidden = true;
    renderTable(rows);
  } else {
    document.getElementById("st-table-wrap").hidden = true;
    document.getElementById("st-grid").hidden = false;
    renderGrid(rows);
  }
  renderFooter(rows);
}

/* ===== UTIL ===== */
function inisial(nama) {
  return nama
    .replace(/,.*$/, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* ===== EVENT: filter ===== */
document.getElementById("st-search").addEventListener("input", (e) => {
  query = e.target.value;
  page = 1;
  refresh();
});
document.getElementById("st-status").addEventListener("change", (e) => {
  statusFilter = e.target.value;
  page = 1;
  refresh();
});
document.getElementById("st-jabatan").addEventListener("change", (e) => {
  jabatanFilter = e.target.value;
  page = 1;
  refresh();
});
document.getElementById("st-reset").addEventListener("click", () => {
  query = "";
  statusFilter = "all";
  jabatanFilter = "all";
  page = 1;
  document.getElementById("st-search").value = "";
  document.getElementById("st-status").value = "all";
  document.getElementById("st-jabatan").value = "all";
  refresh();
});

/* ===== EVENT: toggle tabel/grid ===== */
document.querySelectorAll(".st-toggle-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".st-toggle-pill").forEach((p) => p.classList.remove("is-active"));
    pill.classList.add("is-active");
    mode = pill.dataset.mode;
    refresh();
  });
});

/* ===== EVENT: pagination dummy ===== */
document.getElementById("st-prev").addEventListener("click", () => {
  if (page > 1) {
    page--;
    refresh();
  }
});
document.getElementById("st-next").addEventListener("click", () => {
  if (page < 2) {
    page++;
    refresh();
  }
});
document.querySelectorAll(".st-page-num").forEach((btn) => {
  btn.addEventListener("click", () => {
    page = Number(btn.dataset.page);
    refresh();
  });
});

/* ===== EVENT: detail staf (modal) ===== */
function openDetail(id) {
  const s = stafData.find((x) => String(x.id) === String(id));
  if (!s) return;
  openModal({
    title: s.nama,
    desc: s.golongan,
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default"><span><strong>NIP</strong><span>${s.nip}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Jabatan</strong><span>${s.jabatan}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Kontak</strong><span>${s.email} \u2022 ${s.telp}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Tugas Aktif</strong><span>${s.tugas} tugas berjalan \u2022 Status: ${s.status}</span></span></div>
      </div>`,
    cancelLabel: null,
    confirmLabel: "Tutup"
  });
}

document.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-detail]");
  if (btn) openDetail(btn.dataset.detail);
});

/* ===== EVENT: sinkron ===== */
document.getElementById("btn-sinkron").addEventListener("click", () => {
  showToast("Data tersinkronisasi");
});

/* ===== OPSI JABATAN (dinamis dari data) ===== */
function isiOpsiJabatan() {
  const jabatanSelect = document.getElementById("st-jabatan");
  [...new Set(stafData.map((s) => s.jabatan))].forEach((j) => {
    const opt = document.createElement("option");
    opt.value = j;
    opt.textContent = j;
    jabatanSelect.appendChild(opt);
  });
}

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("st-tbody");
  tbody.innerHTML = `<tr class="st-empty"><td colspan="8">Memuat data staf...</td></tr>`;

  try {
    stafData = await loadData();
  } catch (e) {
    stafData = [];
    tbody.innerHTML = `<tr class="st-empty"><td colspan="8">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  isiOpsiJabatan();
  renderStats();
  refresh();
}

init();
