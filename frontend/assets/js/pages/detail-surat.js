/* ============================================
   DETAIL SURAT MASUK (KEPALA SEKSI) — E-Office
   Baca ?id= dari data bersama, render info +
   dokumen mock, zoom, fullscreen, aksi modal
   ============================================ */

import { SURAT_MASUK } from "../data/surat-masuk.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== Ambil surat dari URL (?id=), fallback S.892 ===== */
const FALLBACK = SURAT_MASUK.find((s) => s.nomor.startsWith("S.892"));

const params = new URLSearchParams(window.location.search);
const idParam = Number(params.get("id"));
const surat = SURAT_MASUK.find((s) => s.id === idParam) || FALLBACK;

/* Nilai default bila surat tidak punya atribut detail lengkap */
const data = {
  nomor: surat.nomor,
  status: surat.status?.text || "Menunggu Disposisi",
  prioritas: surat.prioritas?.text || "Segera",
  sifat: surat.sifat || "Biasa",
  tanggalDiterima: surat.tanggalDiterima || `${surat.tanggal}, 09:15 WIB`,
  pengirimFull: surat.pengirimFull || `${surat.pengirim}, ${surat.pengirimSub}`,
  nomorAsli: surat.nomorAsli || surat.nomor,
  tanggalSurat: surat.tanggalSurat || surat.tanggal,
  perihal: surat.perihal,
  klasifikasi: surat.klasifikasi || ["000 - Umum"],
  fileName: surat.fileName || "Dokumen_Surat.pdf",
  fileSize: surat.fileSize || "1.2 MB"
};

/* ===== RENDER: header & kartu kiri ===== */
function renderInfo() {
  document.getElementById("dsm-nomor").textContent = data.nomor;
  document.querySelector("#dsm-status").lastChild.textContent = ` ${data.status}`;
  document.querySelector("#dsm-prioritas").lastChild.textContent = ` ${data.prioritas}`;
  document.getElementById("dsm-sifat").textContent = data.sifat;
  document.getElementById("dsm-terima").textContent = data.tanggalDiterima;

  document.getElementById("dsm-pengirim").textContent = data.pengirimFull;
  document.getElementById("dsm-nomor-asli").textContent = data.nomorAsli;
  document.getElementById("dsm-tanggal-surat").textContent = data.tanggalSurat;
  document.getElementById("dsm-perihal").textContent = data.perihal;

  document.getElementById("dsm-klasifikasi").innerHTML = data.klasifikasi
    .map((k) => `<span class="kss-badge kss-badge--gray">${k}</span>`)
    .join("");

  document.getElementById("dsm-file-name").textContent = data.fileName;
  document.getElementById("dsm-file-size").textContent = `(${data.fileSize})`;
}

/* ===== RENDER: dokumen mock di kertas ===== */
function renderMockDocument(d) {
  document.getElementById("dsm-paper").innerHTML = `
    <!-- Watermark -->
    <span class="dsm-watermark">SALINAN</span>

    <!-- KOP surat -->
    <header class="doc-kop">
      <p class="doc-kop-1">KEMENTERIAN LINGKUNGAN HIDUP DAN KEHUTANAN</p>
      <p class="doc-kop-2">Direktorat Jenderal Konservasi Sumber Daya Alam dan Ekosistem</p>
      <p class="doc-kop-3">Gedung Manggala Wanabakti Blok I Lt. 8, Jl. Gatot Subroto, Jakarta 10270</p>
    </header>

    <!-- BODY -->
    <div class="doc-body">
      <div class="doc-meta-row">
        <span>Nomor : ${d.nomorAsli}</span>
        <span>${d.tanggalSurat}</span>
      </div>
      <div>Sifat : ${d.prioritas}</div>
      <div>Lampiran : 1 (satu) berkas</div>
      <div>Hal : <span class="doc-bold">${d.perihal}</span></div>

      <p class="doc-justify" style="margin-top:22px">Yth.</p>
      <div class="doc-indent">
        Kepala Balai Besar KSDA Jawa Barat<br />
        Kepala Balai KSDA Jawa Tengah<br />
        Kepala Balai Besar KSDA Jawa Timur
      </div>
      <p style="margin:6px 0 0">di tempat</p>

      <p class="doc-justify">Sehubungan dengan meningkatnya intensitas interaksi negatif antara manusia dan satwa liar, khususnya di wilayah regional Jawa pada triwulan ketiga tahun 2023, Direktorat Jenderal KSDAE memandang perlu untuk segera merumuskan langkah-langkah strategis dan taktis tingkat tapak.</p>

      <p class="doc-justify">Berkenaan dengan hal tersebut, kami mengundang Saudara beserta 1 (satu) orang staf teknis terkait untuk hadir pada Rapat Koordinasi yang akan diselenggarakan pada:</p>
    </div>`;
}

/* ===== ZOOM (ubah --doc-scale 0.8–1.4, step 0.1) ===== */
let scale = 1;
const paper = document.getElementById("dsm-paper");
const zoomLabel = document.getElementById("zoom-level");

function applyZoom() {
  paper.style.setProperty("--doc-scale", scale);
  zoomLabel.textContent = `${Math.round(scale * 100)}%`;
}

document.getElementById("zoom-in").addEventListener("click", () => {
  scale = Math.min(1.4, Math.round((scale + 0.1) * 10) / 10);
  applyZoom();
});

document.getElementById("zoom-out").addEventListener("click", () => {
  scale = Math.max(0.8, Math.round((scale - 0.1) * 10) / 10);
  applyZoom();
});

/* ===== FULLSCREEN ===== */
const viewer = document.getElementById("dsm-viewer");

document.getElementById("btn-fullscreen").addEventListener("click", () => {
  viewer.classList.toggle("fullscreen");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") viewer.classList.remove("fullscreen");
});

/* ===== TOOLBAR & AKSI ===== */

/* Cetak resi */
document.getElementById("btn-print").addEventListener("click", () => window.print());

/* Unduh berkas (demo) */
document.getElementById("btn-download").addEventListener("click", () => {
  showToast(`Mengunduh ${data.fileName}`);
});

/* Teruskan: modal daftar staf (mock) → kirim → toast */
const STAF_LIST = `
  <div class="app-modal-list">
    <label class="app-modal-option">
      <input type="radio" name="forward-to" value="Budi Santoso" checked />
      <span><strong>Budi Santoso</strong><span>Staf Polhut - Resort Baturaden</span></span>
    </label>
    <label class="app-modal-option">
      <input type="radio" name="forward-to" value="Siti Aminah" />
      <span><strong>Siti Aminah</strong><span>Staf PEH - Seksi Wilayah II</span></span>
    </label>
    <label class="app-modal-option">
      <input type="radio" name="forward-to" value="Joko Susilo" />
      <span><strong>Joko Susilo</strong><span>Staf - Resort Nusakambangan</span></span>
    </label>
  </div>`;

document.getElementById("btn-forward").addEventListener("click", () => {
  openModal({
    title: "Teruskan Surat",
    desc: "Pilih staf penerima penerusan surat:",
    html: STAF_LIST,
    confirmLabel: "Kirim",
    onConfirm: () => {
      const checked = document.querySelector('input[name="forward-to"]:checked');
      const nama = checked ? checked.value : "staf terpilih";
      showToast(`Surat diteruskan kepada ${nama}`);
    }
  });
});

/* Arsipkan sementara: modal konfirmasi → toast */
document.getElementById("btn-archive").addEventListener("click", () => {
  openModal({
    title: "Arsipkan Sementara",
    desc: `Surat "${data.nomor}" akan dipindahkan ke arsip sementara dan dapat dibuka kembali kapan saja.`,
    confirmLabel: "Ya, Arsipkan",
    danger: true,
    onConfirm: () => showToast("Surat diarsipkan sementara")
  });
});

/* ===== Inisialisasi ===== */
renderInfo();
renderMockDocument(data);
applyZoom();
