/* ============================================
   BUAT TUGAS BARU (KS) — E-Office SKSDA
   Validasi, unggah lampiran, push ke data
   bersama lalu redirect ke daftar tugas
   ============================================ */

import { TUGAS_SEKSI as TUGAS_MOCK } from "../data/tugas-seksi.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== Elemen ===== */
const form = document.getElementById("bt-form");
const judulInput = document.getElementById("bt-judul");
const deskripsiInput = document.getElementById("bt-deskripsi");
const stafSelect = document.getElementById("bt-staf");

const REQUIRED = ["bt-judul", "bt-deskripsi", "bt-staf"];

/* ===== VALIDASI ===== */
function setFieldError(id, show) {
  document.getElementById(id).closest(".bt-field").classList.toggle("is-error", show);
  document.getElementById(id + "-error").hidden = !show;
}

REQUIRED.forEach((id) => {
  document.getElementById(id).addEventListener("input", () => setFieldError(id, false));
  document.getElementById(id).addEventListener("change", () => setFieldError(id, false));
});

/* ===== LAMPIRAN (drag & drop + list) ===== */
const files = [];
const dropzone = document.getElementById("bt-dropzone");
const fileInput = document.getElementById("bt-file");

const FILE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
const TRASH_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

function renderFiles() {
  const list = document.getElementById("bt-file-list");
  list.innerHTML = files
    .map(
      (name, i) => `
      <div class="bt-file-item">
        ${FILE_ICON}
        <span class="bt-file-name">${name}</span>
        <button type="button" class="bt-file-remove" data-remove="${i}" title="Hapus lampiran" aria-label="Hapus ${name}">${TRASH_ICON}</button>
      </div>`
    )
    .join("");
}

function addFiles(fileList) {
  Array.from(fileList).forEach((f) => {
    if (f.size > 10 * 1024 * 1024) {
      showToast(`Berkas ${f.name} melebihi 10MB`);
      return;
    }
    files.push(f.name);
  });
  renderFiles();
}

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") fileInput.click();
});
fileInput.addEventListener("change", () => {
  addFiles(fileInput.files);
  fileInput.value = "";
});

["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("is-over");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-over");
  })
);
dropzone.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

document.getElementById("bt-file-list").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-remove]");
  if (!btn) return;
  files.splice(Number(btn.dataset.remove), 1);
  renderFiles();
});

/* ===== DETEKSI FORM DIRUBAH (untuk konfirmasi Batal) ===== */
function isFormDirty() {
  return (
    judulInput.value !== "" ||
    deskripsiInput.value !== "" ||
    stafSelect.value !== "" ||
    files.length > 0
  );
}

/* ===== SUBMIT ===== */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  let valid = true;
  REQUIRED.forEach((id) => {
    const isEmpty = document.getElementById(id).value.trim() === "";
    setFieldError(id, isEmpty);
    if (isEmpty) valid = false;
  });
  if (!valid) return;

  const pic = stafSelect.value;
  const prioritas = document.querySelector('input[name="prioritas"]:checked').value;
  const deadlineRaw = document.getElementById("bt-deadline").value;

  const sukses = () => {
    showToast("Tugas berhasil dibuat");
    // Redirect ke daftar tugas setelah 1 detik
    setTimeout(() => {
      window.location.href = "tugas-seksi.html";
    }, 1000);
  };

  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    // LIVE: kode & atribut lain dibuat server
    EOfficeAPI.createTugas({
      judul: judulInput.value.trim(),
      deskripsi: deskripsiInput.value.trim(),
      pic: pic,
      prioritas: prioritas === "Tinggi" ? "TINGGI" : "NORMAL",
      deadline: deadlineRaw || null,
      lampiran: files.slice()
    })
      .then(sukses)
      .catch(() => showToast("Gagal membuat tugas. Periksa koneksi lalu coba lagi."));
    return;
  }

  // MOCK: nomor otomatis TGS-2023-08-0XX urut
  const urut = TUGAS_MOCK.length + 1;
  const kode = `TGS-2023-08-${String(urut).padStart(3, "0")}`;

  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const fmt = (d) => `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;

  TUGAS_MOCK.unshift({
    id: Date.now(),
    judul: judulInput.value.trim(),
    kode,
    pic,
    avatar: pic
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    avatarTone: prioritas === "Tinggi" ? "red" : "gray",
    prioritas: prioritas === "Tinggi" ? "TINGGI" : "NORMAL",
    deadline: deadlineRaw ? fmt(new Date(deadlineRaw)) : "-",
    lewatDeadline: false,
    progress: 0,
    status: "Belum Mulai"
  });

  sukses();
});

/* ===== BATAL (modal konfirmasi bila form terisi) ===== */
function resetForm() {
  form.reset();
  files.length = 0;
  renderFiles();
  REQUIRED.forEach((id) => setFieldError(id, false));
}

document.getElementById("btn-batal").addEventListener("click", () => {
  if (!isFormDirty()) {
    resetForm();
    return;
  }
  openModal({
    title: "Buang perubahan?",
    desc: "Seluruh isian form akan dihapus dan tidak tersimpan.",
    confirmLabel: "Ya, Buang",
    danger: true,
    onConfirm: resetForm
  });
});
