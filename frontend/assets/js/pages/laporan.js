/* ============================================
   LAPORAN (KEPALA SEKSI) â€” E-Office SKSDA
   laporanData per periode + render, filter
   periode, simulasi kosong, unduh & cetak
   ============================================ */

import { showToast } from "../components/toast.js";

let laporanData = null;
let trData = null;
const fields = [
  ["surat_masuk", "Surat Masuk", "inbox", "blue"],
  ["surat_keluar", "Surat Keluar", "send", "blue"],
  ["disposisi_selesai", "Disposisi Selesai", "check", "green"],
  ["tugas_selesai", "Tugas Selesai", "clipboard", "purple"],
];

async function loadLaporan(periode) {
  const response = await window.EOfficeAPI.getLaporan(periode);
  const data = response?.data;
  if (response?.status !== true || data?.periode !== periode || !data?.ringkasan) {
    throw new Error(response?.message || "Format laporan tidak valid.");
  }
  return {
    label: periode,
    updatedAt: new Date().toLocaleString("id-ID"),
    stats: fields.map(([key, label, icon, tone]) => ({
      label, icon, tone, value: Number(data.ringkasan[key]) || 0, sub: periode,
    })),
    progress: [],
    aktivitas: [],
  };
}

async function loadTargetRealisasi(tahun, resort) {
  const response = await window.EOfficeAPI.getTargetRealisasi(tahun, resort === "semua" ? "" : resort);
  if (response?.status !== true || !Array.isArray(response.data)) {
    throw new Error(response?.message || "Format realisasi anggaran tidak valid.");
  }
  const quarters = new Map();
  for (const row of response.data) {
    const quarter = Number(row.triwulan);
    if (quarter < 1 || quarter > 4) continue;
    const sum = quarters.get(quarter) || { budget: 0, actual: 0 };
    sum.budget += Number(row.pagu_anggaran) || 0;
    sum.actual += Number(row.nilai_realisasi) || 0;
    quarters.set(quarter, sum);
  }
  return { anggaran: [...quarters].sort(([a], [b]) => a - b).map(([quarter, sum]) => ({
    tw: "TW " + ["I", "II", "III", "IV"][quarter - 1],
    target: 100,
    realisasi: sum.budget > 0 ? Math.round(sum.actual / sum.budget * 100) : 0,
  })), kinerja: [] };
}

async function loadResorts() {
  const response = await window.EOfficeAPI.request("GET", "/public/resorts");
  if (response?.status !== true || !Array.isArray(response.data)) {
    throw new Error(response?.message || "Daftar resort tidak tersedia.");
  }
  const select = document.getElementById("tr-resort");
  select.replaceChildren(new Option("Semua Resort", "semua"),
    ...response.data.map((row) => new Option(row.nama, row.id)));
}

/* Warna bar realisasi: hijau tidak dipakai â€” biru >=80, amber 60-79, merah <60 */
function toneRealisasi(nilai) {
  if (nilai >= 80) return "";
  if (nilai >= 60) return " is-warning";
  return " is-danger";
}

function renderTargetRealisasi() {
  const chart = document.getElementById("tr-chart");
  const foot = document.getElementById("tr-foot");
  const metrik = document.getElementById("tr-metrik").value;
  const resort = document.getElementById("tr-resort").value;
  const triwulan = document.getElementById("tr-triwulan").value;

  const semua = trData ? trData[metrik] : [];
  const rows = triwulan === "all" ? semua : semua.filter((r) => r.tw === triwulan);

  if (!rows.length) {
    chart.textContent = trData ? "Belum ada realisasi anggaran untuk filter ini." : "Data realisasi anggaran tidak tersedia.";
    foot.textContent = "";
    return;
  }

  chart.innerHTML = rows.map((r) => {
    const tercapai = r.realisasi >= r.target;
    const selisih = r.realisasi - r.target;
    const chip = tercapai
      ? `<span class="lp-tr-chip lp-tr-chip--ok">&#10003; Tercapai</span>`
      : `<span class="lp-tr-chip lp-tr-chip--no">&#10007; Belum (${selisih}%)</span>`;
    return `
      <div class="lp-tr-group">
        <div class="lp-tr-bars">
          <div class="lp-tr-bar-wrap" title="Target ${r.target}%">
            <div class="lp-tr-bar lp-tr-bar--target" style="height:${Math.max(2, r.target)}%"><span class="lp-tr-bar-val">${r.target}%</span></div>
          </div>
          <div class="lp-tr-bar-wrap" title="Realisasi ${r.realisasi}%">
            <div class="lp-tr-bar lp-tr-bar--real${toneRealisasi(r.realisasi)}" style="height:${Math.max(2, r.realisasi)}%"><span class="lp-tr-bar-val">${r.realisasi}%</span></div>
          </div>
        </div>
        <span class="lp-tr-tw">${r.tw}</span>
        ${chip}
      </div>`;
  }).join("");

  const metrikLabel = metrik === "anggaran" ? "realisasi anggaran" : "capaian kinerja";
  const resortLabel = document.getElementById("tr-resort").selectedOptions[0]?.textContent || "Seluruh Resort";
  const twLabel = triwulan === "all" ? "rata-rata setahun" : triwulan;
  const rata = rows.length ? Math.round(rows.reduce((s, r) => s + r.realisasi, 0) / rows.length) : 0;
  foot.textContent = triwulan === "all"
    ? `Rata-rata ${metrikLabel} ${resortLabel} tahun ini: ${rata}%. Dihitung dari triwulan yang memiliki data tercatat.`
    : `${twLabel}: ${metrikLabel} ${resortLabel} sebesar ${rows.length ? rows[0].realisasi : 0}% dari target. Bar biru = realisasi, bar abu = target.`;
}

async function refreshTargetRealisasi() {
  const tahun = document.getElementById("lp-tahun").value;
  const resort = document.getElementById("tr-resort").value;
  try {
    trData = await loadTargetRealisasi(tahun, resort);
  } catch (e) {
    trData = null;
    showToast("Gagal memuat data target vs realisasi");
  }
  renderTargetRealisasi();
}

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
const now = new Date();
const yearFilter = document.getElementById("lp-tahun");
const monthFilter = document.getElementById("lp-bulan");
const year = now.getFullYear();
yearFilter.replaceChildren(...Array.from({ length: Math.max(1, year - 2026 + 1) }, (_, index) => {
  const value = String(year - index);
  return new Option(value, value);
}));
const monthFormat = new Intl.DateTimeFormat("id-ID", { month: "long" });
monthFilter.replaceChildren(...Array.from({ length: 12 }, (_, index) => new Option(
  monthFormat.format(new Date(2026, index, 1)), String(index + 1).padStart(2, "0"),
)));
monthFilter.value = String(now.getMonth() + 1).padStart(2, "0");
let currentKey = `${yearFilter.value}-${monthFilter.value}`;

/* ===== PERIODE AKTIF (laporanData = objek periode yang sedang dimuat) ===== */
function getPeriod() {
  return laporanData || null;
}

/* ===== RENDER: info filter ===== */
function renderInfo() {
  const period = getPeriod();
  const el = document.getElementById("lp-info-text");

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
  const stats = !period
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

  if (!period) {
    wrap.innerHTML = `<p class="lp-progress-empty">Tidak ada data untuk periode ini.</p>`;
    return;
  }

  if (!period.progress.length) { wrap.textContent = "Rincian progres belum tersedia untuk periode ini."; return; }
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

  if (!period) {
    tbody.innerHTML = `<tr class="lp-empty-row"><td colspan="2">Tidak ada data untuk periode ini.</td></tr>`;
    return;
  }

  if (!period.aktivitas.length) { tbody.innerHTML = '<tr><td colspan="2">Rincian aktivitas belum tersedia untuk periode ini.</td></tr>'; return; }
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
document.getElementById("btn-tampilkan").addEventListener("click", async () => {
  const tahun = document.getElementById("lp-tahun").value;
  const bulan = document.getElementById("lp-bulan").value;
  currentKey = `${tahun}-${bulan}`;

  try {
    laporanData = await loadLaporan(currentKey);
  } catch (e) {
    laporanData = null;
    renderLaporan();
    showToast("Gagal memuat laporan. Periksa koneksi lalu coba lagi.");
    return;
  }

  renderLaporan();
  showToast(laporanData ? `Menampilkan data ${laporanData.label}` : "Tidak ada data untuk periode ini");
  refreshTargetRealisasi(); // tahun bisa berubah -> muat ulang diagram triwulan
});

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

/* ===== UNDUH PDF TRIWULAN (lembar cetak resmi per resort & triwulan) ===== */
document.getElementById("btn-pdf-tr").addEventListener("click", () => {
  if (!trData) return showToast("Data belum termuat");

  const resortLabel = escapeHtml(document.getElementById("tr-resort").selectedOptions[0]?.textContent || "Seluruh Resort");
  const twVal = document.getElementById("tr-triwulan").value;
  const tahun = document.getElementById("lp-tahun").value;

  const buatBagian = (judul, rows) => {
    const tampil = twVal === "all" ? rows : rows.filter((r) => r.tw === twVal);
    return `
      <h2>${judul}</h2>
      <table class="prt-table">
        <thead><tr><th>Triwulan</th><th>Target</th><th>Realisasi</th><th>Selisih</th><th>Status</th></tr></thead>
        <tbody>
          ${tampil.map((r) => {
            const s = r.realisasi - r.target;
            return `<tr><td>${r.tw}</td><td>${r.target}%</td><td><strong>${r.realisasi}%</strong></td><td>${s > 0 ? "+" : ""}${s}%</td><td>${r.realisasi >= r.target ? "Tercapai" : "Belum"}</td></tr>`;
          }).join("")}
        </tbody>
      </table>
      <div class="prt-chart">
        ${tampil.map((r) => `
          <div class="prt-group">
            <div class="prt-bars">
              <div class="prt-bar prt-bar--target" style="height:${Math.max(3, r.target * 1.2)}px"><span>${r.target}%</span></div>
              <div class="prt-bar prt-bar--real" style="height:${Math.max(3, r.realisasi * 1.2)}px"><span>${r.realisasi}%</span></div>
            </div>
            <span class="prt-tw">${r.tw}</span>
          </div>`).join("")}
      </div>`;
  };

  const sheet = document.getElementById("tr-print-sheet");
  sheet.innerHTML = `
    <div class="prt-head">
      <h1>LAPORAN TRIWULAN</h1>
      <p>E-Office SKSDA Jawa Tengah &bull; Seksi Konservasi Sumber Daya Alam</p>
      <p><strong>${resortLabel}</strong> &bull; ${twVal === "all" ? "Semua Triwulan" : twVal} &bull; Tahun ${tahun}</p>
      <p>Dicetak: ${new Date().toLocaleString("id-ID")}</p>
    </div>
    ${buatBagian("A. Realisasi Anggaran", trData.anggaran)}
    <div class="prt-ttd">
      <p>Semarang, ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p>Mengetahui,</p>
      <p class="prt-ttd-nama">Kepala Seksi Konservasi</p>
      <p class="prt-ttd-ruang">( ............................................ )</p>
    </div>`;

  document.body.classList.add("tr-printing");
  window.print();
  window.addEventListener("afterprint", () => document.body.classList.remove("tr-printing"), { once: true });
});

/* ===== EVENT: filter diagram triwulan ===== */
document.getElementById("tr-metrik").addEventListener("change", renderTargetRealisasi);
document.getElementById("tr-triwulan").addEventListener("change", renderTargetRealisasi);
document.getElementById("tr-resort").addEventListener("change", refreshTargetRealisasi);

/* ===== EVENT: unduh & cetak ===== */
document.getElementById("btn-pdf").addEventListener("click", () => {
  if (!laporanData) return showToast("Data laporan belum tersedia.");
  window.print();
});
document.getElementById("btn-excel").addEventListener("click", () => {
  if (!laporanData) return showToast("Data laporan belum tersedia.");
  const csv = ["Metrik,Jumlah", ...laporanData.stats.map(({label, value}) => `${label},${value}`)].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-${laporanData.label}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
});
document.getElementById("btn-print-link").addEventListener("click", () => window.print());
document.getElementById("btn-cetak").addEventListener("click", () => window.print());

/* ===== Inisialisasi: muat periode awal dulu, baru render ===== */
async function init() {
  try {
    laporanData = await loadLaporan(currentKey);
  } catch (e) {
    laporanData = null;
  }
  renderLaporan();
  await loadResorts().catch((error) => showToast(error.message));
  refreshTargetRealisasi();
}

init();
