/* ============================================
   MANAJEMEN DISPOSISI (KS) — E-Office SKSDA
   disposisiData + renderTable, validasi form,
   tambah disposisi baru, modal detail
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== MOCK DATA (fallback selama backend belum siap) ===== */
const DISPOSISI_MOCK = [
  {
    id: 1,
    nomor: "DSP-10/23-001",
    surat: "SM-2023/10/001 - Laporan Patroli K",
    pic: "Budi Santoso",
    tanggal: "24 Okt 2023",
    deadline: "26 Okt 2023",
    instruksi: "Segera ditindaklanjuti",
    catatan: "Koordinasikan dengan resort setempat."
  },
  {
    id: 2,
    nomor: "DSP-10/23-002",
    surat: "SM-2023/10/045 - Undangan Rapa",
    pic: "Siti Rahma",
    tanggal: "23 Okt 2023",
    deadline: "28 Okt 2023",
    instruksi: "Untuk dilaporkan",
    catatan: ""
  },
  {
    id: 3,
    nomor: "DSP-10/23-003",
    surat: "SM-2023/09/112 - Permohonan Izin",
    pic: "Andi Wijaya",
    tanggal: "20 Okt 2023",
    deadline: "25 Okt 2023",
    instruksi: "Untuk ditelaah",
    catatan: "Periksa kelengkapan berkas."
  }
];

const TOTAL_MOCK = 24; // total sistem (untuk teks "dari N disposisi")

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let disposisiData = [];

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getDisposisi();
  }
  return DISPOSISI_MOCK;
}

/* ===== IKON ===== */
const CLOCK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

/* ===== UTIL ===== */
function inisial(nama) {
  return nama
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTanggal(date) {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

/* ===== RENDER TABEL ===== */
function renderTable() {
  const tbody = document.getElementById("dsp-tbody");

  tbody.innerHTML = disposisiData
    .map(
      (d) => `
      <tr data-id="${d.id}" title="Klik untuk detail disposisi">
        <td>
          <span class="kdp-nomor">${d.nomor}</span>
          <span class="kdp-surat">${d.surat}</span>
        </td>
        <td>
          <div class="kdp-pic">
            <span class="kdp-avatar">${inisial(d.pic)}</span>
            <span class="kdp-pic-name">${d.pic}</span>
          </div>
        </td>
        <td>
          <span class="kdp-tanggal">${d.tanggal}</span>
          <span class="kdp-deadline">${CLOCK_ICON}${d.deadline || "\u2014"}</span>
        </td>
      </tr>`
    )
    .join("");

  document.getElementById("dsp-showing").textContent =
    `Menampilkan 1-${disposisiData.length} dari ${TOTAL_MOCK + (disposisiData.length > 3 ? disposisiData.length - 3 : 0)} disposisi`;

  document.getElementById("dsp-prev").disabled = true;
  document.getElementById("dsp-next").disabled = disposisiData.length <= 3;
}

/* ===== VALIDASI ===== */
const REQUIRED = ["f-surat", "f-staf", "f-instruksi"];

function setFieldError(id, show) {
  const field = document.getElementById(id).closest(".kdp-field");
  field.classList.toggle("is-error", show);
  document.getElementById(id + "-error").hidden = !show;
}

REQUIRED.forEach((id) => {
  document.getElementById(id).addEventListener("change", () => setFieldError(id, false));
  document.getElementById(id).addEventListener("input", () => setFieldError(id, false));
});

/* ===== SUBMIT: tambah disposisi baru ===== */
document.getElementById("dsp-form").addEventListener("submit", (event) => {
  event.preventDefault();

  let valid = true;
  REQUIRED.forEach((id) => {
    const isEmpty = document.getElementById(id).value === "";
    setFieldError(id, isEmpty);
    if (isEmpty) valid = false;
  });
  if (!valid) return;

  const suratLabel = document.getElementById("f-surat").value;
  const deadlineRaw = document.getElementById("f-deadline").value;

  const afterSuccess = () => {
    renderTable();
    document.getElementById("dsp-form").reset();
    REQUIRED.forEach((id) => setFieldError(id, false));
    showToast("Disposisi berhasil dikirim");
  };

  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    // LIVE: id, nomor, dan tanggal dibuat oleh server
    EOfficeAPI.createDisposisi({
      surat: suratLabel,
      pic: document.getElementById("f-staf").value,
      deadline: deadlineRaw || null,
      instruksi: document.getElementById("f-instruksi").value,
      catatan: document.getElementById("f-catatan").value
    })
      .then((baru) => {
        disposisiData.unshift(baru);
        afterSuccess();
      })
      .catch(() => showToast("Gagal mengirim disposisi. Periksa koneksi lalu coba lagi."));
    return;
  }

  // MOCK: nomor urut & tanggal dibuat lokal
  const urut = disposisiData.length + 1;

  disposisiData.unshift({
    id: Date.now(),
    nomor: `DSP-10/23-${String(urut).padStart(3, "0")}`,
    surat: suratLabel,
    pic: document.getElementById("f-staf").value,
    tanggal: formatTanggal(new Date()),
    deadline: deadlineRaw ? formatTanggal(new Date(deadlineRaw)) : "",
    instruksi: document.getElementById("f-instruksi").value,
    catatan: document.getElementById("f-catatan").value
  });

  afterSuccess();
});

/* ===== KLIK BARIS → MODAL DETAIL ===== */
document.getElementById("dsp-tbody").addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-id]");
  if (!row) return;

  const d = disposisiData.find((x) => String(x.id) === row.dataset.id);
  if (!d) return;

  openModal({
    title: `Detail Disposisi ${d.nomor}`,
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default">
          <span><strong>Surat</strong><span>${d.surat}</span></span>
        </div>
        <div class="app-modal-option" style="cursor:default">
          <span><strong>PIC</strong><span>${d.pic} \u2022 ${d.instruksi}</span></span>
        </div>
        <div class="app-modal-option" style="cursor:default">
          <span><strong>Tanggal &amp; Deadline</strong><span>${d.tanggal} \u2192 ${d.deadline || "\u2014"}</span></span>
        </div>
        <div class="app-modal-option" style="cursor:default">
          <span><strong>Catatan</strong><span>${d.catatan || "Tidak ada catatan."}</span></span>
        </div>
      </div>`,
    cancelLabel: null,
    confirmLabel: "Tutup"
  });
});

/* ===== HEADER: scroll halus ke form ===== */
document.getElementById("btn-buat").addEventListener("click", () => {
  const formCard = document.getElementById("dsp-form");
  formCard.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("f-surat").focus();
});

/* ===== TOMBOL FILTER: toggle state aktif saja ===== */
document.querySelectorAll(".kdp-filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => btn.classList.toggle("is-active"));
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("dsp-tbody");
  tbody.innerHTML = `<tr><td colspan="3">Memuat data disposisi...</td></tr>`;

  try {
    disposisiData = await loadData();
  } catch (e) {
    disposisiData = [];
    tbody.innerHTML = `<tr><td colspan="3">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  renderTable();
}

init();
