/* ============================================
   PREVIEW SURAT KELUAR (PEGAWAI) — E-Office
   Baca draftSurat dari sessionStorage (atau
   mock default), render kertas, zoom & print
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA DEFAULT (mock sesuai spesifikasi) ===== */
const DEFAULT_SURAT = {
  nomor: "S.123/SKSDA-JT/2023",
  tanggalTtd: "Semarang, 24 Oktober 2023",
  sifat: "Biasa",
  lampiran: "1 (satu) berkas",
  hal: "Undangan Rapat Koordinasi Pengelolaan Kawasan Konservasi",
  tujuan: [
    "Kepala Dinas Lingkungan Hidup Provinsi Jawa Tengah",
    "Kepala Balai Taman Nasional Gunung Merbabu",
    "Bupati Kabupaten Semarang"
  ],
  pembuka:
    "Dalam rangka sinkronisasi program kerja pengelolaan kawasan konservasi dan keanekaragaman hayati di wilayah Provinsi Jawa Tengah untuk tahun anggaran 2024, bersama ini kami mengundang Bapak/Ibu untuk hadir pada Rapat Koordinasi yang akan diselenggarakan pada:",
  rencana: [
    { label: "Hari/Tanggal", nilai: "Kamis, 2 November 2023" },
    { label: "Waktu", nilai: "09.00 WIB s.d. selesai" },
    { label: "Tempat", nilai: "Ruang Rapat Utama SKSDA Jawa Tengah" },
    { label: "Acara", nilai: "Pembahasan Rencana Kerja Tahunan Pengelolaan Kawasan Konservasi" }
  ],
  penutup:
    "Mengingat pentingnya acara tersebut, kami memohon kehadiran Bapak/Ibu tepat pada waktunya. Demikian undangan ini kami sampaikan, atas perhatian dan kehadirannya diucapkan terima kasih.",
  penandatangan: {
    jabatan: "Kepala Balai,",
    nama: "Ir. Darmanto, M.Si.",
    nip: "NIP. 19700101 199503 1 001"
  }
};

/* ===== Baca draft dari buat-surat (jika ada) ===== */
function readDraft() {
  try {
    const raw = window.sessionStorage.getItem("draftSurat");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatTanggalTtd(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DEFAULT_SURAT.tanggalTtd;
  return `Semarang, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/* Gabungkan draft (bila ada) dengan default */
function buildData() {
  const draft = readDraft();
  if (!draft) return DEFAULT_SURAT;

  return {
    ...DEFAULT_SURAT,
    nomor: draft.nomor || DEFAULT_SURAT.nomor,
    tanggalTtd: draft.tanggal ? formatTanggalTtd(draft.tanggal) : DEFAULT_SURAT.tanggalTtd,
    hal: draft.perihal || DEFAULT_SURAT.hal,
    tujuan: draft.penerima ? [draft.penerima] : DEFAULT_SURAT.tujuan,
    paragrafTambahan: draft.isi || null,
    lampiran: draft.lampiran > 0 ? `${draft.lampiran} berkas` : "-"
  };
}

/* ===== IKON QR kecil (placeholder TTE) ===== */
const QR_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><line x1="14" y1="14" x2="21" y2="14"></line><line x1="14" y1="18" x2="21" y2="18"></line><line x1="14" y1="21" x2="17" y2="21"></line></svg>';

/* ===== RENDER SURAT ===== */
function renderSurat(data) {
  document.getElementById("pgv-paper").innerHTML = `
    <!-- KOP -->
    <header class="pgv-kop">
      <p class="pgv-kop-1">Kementerian Lingkungan Hidup dan Kehutanan</p>
      <p class="pgv-kop-2">Direktorat Jenderal Konservasi Sumber Daya Alam dan Ekosistem</p>
      <p class="pgv-kop-3">Seksi Konservasi Sumber Daya Alam Jawa Tengah</p>
      <p class="pgv-kop-addr">
        Gedung Manggala Wanabakti Blok I Lt. 3, Jl. Gatot Subroto, Senayan, Jakarta 10270<br />
        Telepon: (021) 5731326, Faksimile: (021) 5731326<br />
        Website: ksdae.menlhk.go.id, Email: SKSDAjateng@menlhk.go.id
      </p>
      <hr class="pgv-kop-line" />
    </header>

    <!-- Blok meta -->
    <div class="pgv-meta">
      <div class="pgv-meta-row">
        <span>Nomor&nbsp;: ${data.nomor}</span>
        <span>${data.tanggalTtd}</span>
      </div>
      <div class="pgv-meta-item"><span class="pgv-meta-label">Sifat</span><span>: ${data.sifat}</span></div>
      <div class="pgv-meta-item"><span class="pgv-meta-label">Lampiran</span><span>: ${data.lampiran}</span></div>
      <div class="pgv-meta-item"><span class="pgv-meta-label">Hal</span><span>: <strong>${data.hal}</strong></span></div>
    </div>

    <!-- Tujuan -->
    <div class="pgv-tujuan">
      Yth.
      <div class="pgv-indent">
        ${data.tujuan.join("<br />")}
      </div>
      di Tempat
    </div>

    <!-- Paragraf pembuka -->
    <p class="pgv-para">${data.pembuka}</p>

    <!-- Tabel rencana -->
    <div class="pgv-rencana">
      ${data.rencana
        .map(
          (r) => `
          <div class="pgv-rencana-row">
            <span class="pgv-rencana-label">${r.label}</span>
            <span>: ${r.nilai}</span>
          </div>`
        )
        .join("")}
    </div>

    <!-- Paragraf penutup -->
    <p class="pgv-para">${data.penutup}</p>

    <!-- Penandatangan + TTE -->
    <div class="pgv-tte-block">
      ${data.penandatangan.jabatan}
      <div class="pgv-tte-space"></div>
      <div class="pgv-tte-box">${QR_ICON}<span>TTE</span></div>
      <span class="pgv-tte-nama">${data.penandatangan.nama}</span><br />
      <span class="pgv-tte-nip">${data.penandatangan.nip}</span>
    </div>`;
}

/* ===== ZOOM (0.7 – 1.4) ===== */
let scale = 1;
const paper = document.getElementById("pgv-paper");

function applyZoom() {
  paper.style.setProperty("--doc-scale", scale);
}

document.getElementById("pgv-zoom-in").addEventListener("click", () => {
  scale = Math.min(1.4, Math.round((scale + 0.1) * 10) / 10);
  applyZoom();
});

document.getElementById("pgv-zoom-out").addEventListener("click", () => {
  scale = Math.max(0.7, Math.round((scale - 0.1) * 10) / 10);
  applyZoom();
});

/* ===== PRINT ===== */
document.getElementById("pgv-print").addEventListener("click", () => window.print());

/* ===== AJUKAN SURAT ===== */
document.getElementById("pgv-ajukan").addEventListener("click", () => {
  openModal({
    title: "Ajukan Surat Keluar",
    desc: "Surat akan diajukan untuk persetujuan dan penandatanganan elektronik. Lanjutkan?",
    confirmLabel: "Ya, Ajukan",
    onConfirm: () => {
      const draft = JSON.parse(window.sessionStorage.getItem("draftSurat") || "null");

      if (window.EOfficeAPI && EOfficeAPI.config.LIVE && draft) {
        EOfficeAPI.createSuratKeluar({ ...draft, status: "Diajukan" })
          .then(() => {
            showToast("Surat diajukan");
            setTimeout(() => {
              window.location.href = "surat.html";
            }, 800);
          })
          .catch(() => showToast("Gagal mengajukan surat. Periksa koneksi lalu coba lagi."));
        return;
      }

      showToast("Surat diajukan");
      setTimeout(() => {
        window.location.href = "surat.html";
      }, 800);
    }
  });
});

/* ===== LAMPIRAN (toast) ===== */
document.getElementById("pgv-att-eye").addEventListener("click", () => {
  showToast("Pratinjau lampiran menyusul");
});

/* ===== Inisialisasi ===== */
renderSurat(buildData());
applyZoom();
