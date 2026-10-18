/* ============================================
   LAPORAN (KEPALA SEKSI) — E-Office SKSDA
   laporanData per periode + render, filter
   periode, simulasi kosong, unduh & cetak
   ============================================ */

import { laporanData } from "../data/laporan.js";
import { showToast } from "../components/toast.js";

/* ===== IKON ===== */
const ICONS = {
  inbox: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 0 1 3 3L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
};

/* ===== STATE ===== */
let currentKey = "2026-09";
let emptySim = false;

/* ===== PERIODE AKTIF ===== */
function getPeriod() {
  return laporanData[currentKey] || null;
}

/* ===== RENDER: info filter ===== */
function renderInfo() {
  const period = getPeriod();
  const el = document.getElementById("lp-info-text");

  if (emptySim) {
    el.innerHTML = "Menampilkan data: <strong>Simulasi kosong</strong> &#8226; Tidak ada data untuk periode ini";
    return;
  }

  if (!period) {
    el.innerHTML = "Menampilkan data: <strong>Periode tidak tersedia</strong> &#8226; Tidak ada data untuk periode ini";
    return;
  }

  el.innerHTML = `Menampilkan data: <strong>${period.label}</strong> &#8226; Terakhir diperbarui ${period.updatedAt}`;
  document.getElementById("lp-download-text").innerHTML =
    `Unduh ringkasan kegiatan seksi untuk periode yang dipilih (<span class="lp-periode">${period.label}</span>) dalam format resmi kedinasan.`;
}

/* ===== RENDER: stat card ===== */
function renderStats() {
  const period = getPeriod();
  const stats = emptySim || !period
    ? [
        { value: "0", label: "Surat Masuk", sub: "-", icon: "inbox", tone: "blue" },
        { value: "0", label: "Surat Keluar", sub: "-", icon: "send", tone: "blue" },
        { value: "0", label: "Disposisi Selesai", sub: "-", icon: "check", tone: "green" },
        { value: "0", label: "Tugas Selesai", sub: "-", icon: "clipboard", tone: "purple" }
      ]
    : period.stats;

  document.getElementById("lp-stats").innerHTML = stats
    .map((s) => {
      const badge = s.badge ? `<span class="lp-stat-badge lp-stat-badge--${s.badge.tone}">${s.badge.text}</span>` : "";
      return `
      <article class="lp-stat">
        ${badge}
        <span class="lp-stat-icon lp-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
        <p class="lp-stat-value">${s.value}</p>
        <p class="lp-stat-label">${s.label}</p>
        <p class="lp-stat-sub">${s.sub}</p>
      </article>`;
    })
    .join("");
}

/* ===== RENDER: progress (persen dari data) ===== */
function renderProgress() {
  const wrap = document.getElementById("lp-progress");
  const period = getPeriod();

  if (emptySim || !period) {
    wrap.innerHTML = `<p class="lp-progress-empty">Tidak ada data untuk periode ini.</p>`;
    return;
  }

  wrap.innerHTML = period.progress
    .map(
      (p) => `
      <div class="lp-progress-item">
        <div class="lp-progress-label-row">
          <span class="lp-progress-label"><span class="lp-progress-dot lp-progress-dot--${p.dot}"></span>${p.label}</span>
          <span class="lp-progress-detail${p.detailTone ? ` lp-progress-detail--${p.detailTone}` : ""}">${p.detail}</span>
        </div>
        <div class="lp-progress-bar">
          <span style="width:${p.percent}%; background:${p.color}"></span>
        </div>
      </div>`
    )
    .join("");
}

/* ===== RENDER: aktivitas ===== */
function renderAktivitas() {
  const tbody = document.getElementById("lp-aktivitas");
  const period = getPeriod();

  if (emptySim || !period) {
    tbody.innerHTML = `<tr class="lp-empty-row"><td colspan="2">Tidak ada data untuk periode ini.</td></tr>`;
    return;
  }

  tbody.innerHTML = period.aktivitas
    .map(
      (a) => `
      <tr>
        <td><span class="lp-aktivitas-tanggal">${a.tanggal}</span></td>
        <td>
          <div class="lp-aktivitas-kegiatan">
            <span class="lp-aktivitas-icon">${ICONS[a.icon]}</span>
            <span>${a.html}</span>
          </div>
        </td>
      </tr>`
    )
    .join("");
}

/* ===== RENDER UTAMA ===== */
function renderLaporan() {
  renderInfo();
  renderStats();
  renderProgress();
  renderAktivitas();
}

/* ===== EVENT: tombol Tampilkan ===== */
document.getElementById("btn-tampilkan").addEventListener("click", () => {
  const tahun = document.getElementById("lp-tahun").value;
  const bulan = document.getElementById("lp-bulan").value;
  currentKey = `${tahun}-${bulan}`;
  emptySim = false;
  document.getElementById("btn-simulasi").classList.remove("is-active");
  renderLaporan();

  const period = getPeriod();
  showToast(period ? `Menampilkan data ${period.label}` : "Tidak ada data untuk periode ini");
});

/* ===== EVENT: Simulasi Kosong (toggle) ===== */
document.getElementById("btn-simulasi").addEventListener("click", (event) => {
  emptySim = !emptySim;
  event.currentTarget.classList.toggle("is-active", emptySim);
  renderLaporan();
  showToast(emptySim ? "Simulasi data kosong aktif" : "Kembali ke data normal");
});

/* ===== EVENT: unduh & cetak ===== */
document.getElementById("btn-pdf").addEventListener("click", () => showToast("PDF sedang disiapkan..."));
document.getElementById("btn-excel").addEventListener("click", () => showToast("Berkas Excel sedang disiapkan..."));
document.getElementById("btn-print-link").addEventListener("click", () => window.print());
document.getElementById("btn-cetak").addEventListener("click", () => window.print());

/* ===== Inisialisasi ===== */
renderLaporan();
