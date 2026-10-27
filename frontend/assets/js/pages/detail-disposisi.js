/* ============================================
   DETAIL DISPOSISI (PEGAWAI) — E-Office SKSDA
   Baca ?id= dari disposisiPgData (shared),
   fallback DISPOSISI_DETAIL_PG. Terima
   disposisi ubah status + badge.
   ============================================ */

import { disposisiPgData as DISPOSISI_PG_MOCK, DISPOSISI_DETAIL_PG } from "../data/disposisi-pegawai.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA: diisi loadDetail() — API saat LIVE, mock saat belum ===== */
let disposisi = null;
let STATUS_KEY = "";

async function loadDetail(id) {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getDisposisiSayaDetail(id);
  }
  /* Mock: prioritaskan data per-item (baris yang diklik);
     fallback ke DISPOSISI_DETAIL_PG bila field belum ada */
  const found = DISPOSISI_PG_MOCK.find((d) => d.id === id);
  return {
    ...DISPOSISI_DETAIL_PG,
    ...(found || {}),
    judul: found?.judul || DISPOSISI_DETAIL_PG.judul,
    pemberi: found?.pemberi || DISPOSISI_DETAIL_PG.pemberi,
    tenggat: found?.tenggat || DISPOSISI_DETAIL_PG.tenggat,
    instruksi: found?.instruksiFull || DISPOSISI_DETAIL_PG.instruksi,
    surat: found?.surat || DISPOSISI_DETAIL_PG.surat,
    files: found?.files || DISPOSISI_DETAIL_PG.files
  };
}

/* ===== IKON ===== */
const ICONS = {
  pdf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
};

/* ===== RENDER ===== */
function renderHeader() {
  document.getElementById("pgdd-judul").textContent = disposisi.judul;
  document.getElementById("pgdd-pemberi").textContent = `Disposisi dari: ${disposisi.pemberi}`;
  document.getElementById("pgdd-tenggat-text").textContent = disposisi.tenggat;
  document.getElementById("pgdd-instruksi").textContent = disposisi.instruksi;
  renderLaporan();
}

/* ===== LAPORAN TINDAK LANJUT (jika ada, dari disposisi-saya) ===== */
function renderLaporan() {
  const lama = document.getElementById("pgdd-laporan");
  if (lama) lama.remove();

  if (!found?.laporan) return;

  const card = document.querySelector(".pgdd-left .pgdd-card--instruksi");
  if (!card) return;

  const box = document.createElement("div");
  box.className = "pgdd-card";
  box.id = "pgdd-laporan";
  box.style.borderLeft = "4px solid #10B981";
  box.innerHTML = `
    <div class="pgdd-card-head">
      <div class="pgdd-card-head-left">
        <span class="pgdd-icon" style="background:#D1FAE5;color:#059669">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </span>
        <h2 class="pgdd-card-title">Laporan Tindak Lanjut</h2>
      </div>
    </div>
    <div class="pgdd-instruksi-box" style="background:#F0FDF4">${found.laporan.text}</div>
    <p style="margin:8px 0 0;font-size:11.5px;color:#9CA3AF">Dilaporkan: ${found.laporan.waktu}</p>
  `;
  card.after(box);
}

function renderSurat() {
  document.getElementById("pgdd-surat-nomor").textContent = disposisi.surat.nomor;
  document.getElementById("pgdd-surat-tanggal").textContent = disposisi.surat.tanggal;
  document.getElementById("pgdd-surat-pengirim").textContent = disposisi.surat.pengirim;
  document.getElementById("pgdd-surat-perihal").textContent = disposisi.surat.perihal;

  document.getElementById("pgdd-files").innerHTML = disposisi.files
    .map(
      (f, i) => `
      <div class="pgdd-file-card">
        <span class="pgdd-file-icon pgdd-file-icon--${f.type}">${ICONS[f.type]}</span>
        <div class="pgdd-file-info">
          <span class="pgdd-file-name">${f.name}</span>
          <span class="pgdd-file-size">${f.size}</span>
        </div>
        <button type="button" class="pgdd-download" data-download="${i}" title="Unduh berkas" aria-label="Unduh ${f.name}">${ICONS.download}</button>
      </div>`
    )
    .join("");
}

/* ===== STATUS DITERIMA ===== */
function isDiterima() {
  if (window.sessionStorage.getItem(STATUS_KEY) === "diterima") return true;
  return found ? found.status === "diterima" : false;
}

function renderStatus() {
  const badge = document.getElementById("pgdd-status");
  const btn = document.getElementById("btn-terima");
  const btnLabel = document.getElementById("btn-terima-label");

  if (isDiterima()) {
    badge.textContent = "Diterima";
    badge.className = "pgdd-badge pgdd-badge--green";
    btn.disabled = true;
    btnLabel.textContent = "Diterima";
  } else {
    badge.textContent = "Belum Diterima";
    badge.className = "pgdd-badge pgdd-badge--gray";
    btn.disabled = false;
    btnLabel.textContent = "Terima Disposisi";
  }
}

/* ===== TERIMA DISPOSISI ===== */
document.getElementById("btn-terima").addEventListener("click", () => {
  openModal({
    title: "Terima Disposisi",
    desc: `Konfirmasi penerimaan disposisi "${disposisi.judul}"? Status akan berubah menjadi 'Sedang Dikerjakan'.`,
    confirmLabel: "Ya, Terima",
    onConfirm: () => {
      // Simpan di sessionStorage + ubah status di shared data
      window.sessionStorage.setItem(STATUS_KEY, "diterima");
      if (found) found.status = "diterima";
      renderStatus();
      showToast("Disposisi diterima — status: Sedang Dikerjakan");
    }
  });
});

/* ===== MINTA KLARIFIKASI ===== */
document.getElementById("btn-klarifikasi").addEventListener("click", () => {
  openModal({
    title: "Minta Klarifikasi",
    desc: "Tuliskan hal yang perlu diklarifikasi kepada Kepala Seksi:",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Alasan Klarifikasi</strong>
          <textarea id="klarifikasi-text" rows="4" placeholder="Tuliskan alasan..." style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none;resize:vertical"></textarea>
        </div>
      </div>`,
    confirmLabel: "Kirim Klarifikasi",
    cancelLabel: "Batal",
    onConfirm: () => {
      showToast("Klarifikasi dikirim ke Kepala Seksi");
    }
  });
});

/* ===== DOWNLOAD LAMPIRAN ===== */
document.getElementById("pgdd-files").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-download]");
  if (!btn) return;
  const file = disposisi.files[Number(btn.dataset.download)];
  showToast(`Mengunduh ${file.name}...`);
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const params = new URLSearchParams(window.location.search);
  try {
    disposisi = await loadDetail(Number(params.get("id")));
  } catch (e) {
    showToast("Gagal memuat detail disposisi. Periksa koneksi lalu muat ulang halaman.");
    return;
  }
  STATUS_KEY = `disposisi_status_${disposisi.id}`;
  renderHeader();
  renderSurat();
  renderStatus();
}

init();
