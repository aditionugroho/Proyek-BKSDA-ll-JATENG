/* ============================================
   BUAT / EDIT DOKUMEN (PEGAWAI) — E-Office SKSDA
   Validasi inline, lampiran file,
   simpan draft / kirim ke Kepala Seksi
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== Elemen ===== */
const crumbEl = document.getElementById("pgbd-crumb");
const titleEl = document.getElementById("pgbd-title");
const descEl = document.getElementById("pgbd-desc");

const namaInput = document.getElementById("f-nama");
const kategoriSelect = document.getElementById("f-kategori");
const nomorInput = document.getElementById("f-nomor");
const keteranganInput = document.getElementById("f-keterangan");

const dropzone = document.getElementById("pgbd-dropzone");
const fileInput = document.getElementById("pgbd-file");
const fileError = document.getElementById("pgbd-file-error");
const fileList = document.getElementById("pgbd-file-list");

const EKSTENSI = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];
const MAKSIMAL = 5 * 1024 * 1024;

/* ===== STATE ===== */
let selectedFile = null;
let fileLama = null;

const editId = Number(new URLSearchParams(location.search).get("id"));
const isEdit = Number.isSafeInteger(editId) && editId > 0;

/* ===== VALIDASI INLINE ===== */
function setFieldError(id, show) {
  document.getElementById(id).closest(".pgb-field").classList.toggle("is-error", show);
  document.getElementById(id + "-error").hidden = !show;
}

[namaInput, kategoriSelect, nomorInput, keteranganInput].forEach((el) => {
  el.addEventListener("input", () => setFieldError(el.id, false));
  el.addEventListener("change", () => setFieldError(el.id, false));
});

function validateForm() {
  let valid = true;

  if (namaInput.value.trim().length < 3) {
    setFieldError("f-nama", true);
    valid = false;
  }

  if (kategoriSelect.value === "") {
    setFieldError("f-kategori", true);
    valid = false;
  }

  if (keteranganInput.value.length > 5000) {
    setFieldError("f-keterangan", true);
    document.getElementById("f-keterangan-error").textContent = "Keterangan maksimal 5000 karakter.";
    valid = false;
  }

  return valid;
}

function validateFile(file) {
  const ekstensi = file.name.split(".").pop().toLowerCase();

  if (!EKSTENSI.includes(ekstensi)) {
    return "Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.";
  }

  if (file.size > MAKSIMAL) {
    return "Ukuran file maksimal 5MB.";
  }

  return null;
}

/* ===== LAMPIRAN ===== */
function formatUkuran(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
  return Math.ceil(bytes / 1024) + " KB";
}

function renderFile() {
  fileList.innerHTML = "";

  if (selectedFile) {
    fileList.innerHTML = `
      <div class="pgb-file-item">
        <span class="pgb-file-name">${selectedFile.name}</span>
        <span class="pgb-file-size">${formatUkuran(selectedFile.size)}</span>
        <button type="button" class="pgb-file-remove" id="pgbd-file-remove" aria-label="Hapus lampiran">&times;</button>
      </div>`;

    document.getElementById("pgbd-file-remove").addEventListener("click", () => {
      selectedFile = null;
      fileInput.value = "";
      renderFile();
    });

    return;
  }

  if (fileLama) {
    fileList.innerHTML = `
      <div class="pgb-file-item">
        <span class="pgb-file-name">${fileLama}</span>
        <span class="pgb-file-size">lampiran saat ini</span>
      </div>
        <p class="pgb-helper">Pilih file baru untuk mengganti lampiran.</p>`;

    return;
  }
}

function pilihFile(file) {
  const error = validateFile(file);

  if (error) {
    fileError.textContent = error;
    fileError.hidden = false;
    return;
  }

  fileError.hidden = true;
  selectedFile = file;
  renderFile();
}

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    pilihFile(fileInput.files[0]);
  }
});

["dragover", "dragenter"].forEach((nama) => {
  dropzone.addEventListener(nama, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-drag");
  });
});

["dragleave", "dragend", "drop"].forEach((nama) => {
  dropzone.addEventListener(nama, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-drag");
  });
});

dropzone.addEventListener("drop", (event) => {
  if (event.dataTransfer.files.length > 0) {
    pilihFile(event.dataTransfer.files[0]);
  }
});

/* ===== MODE EDIT ===== */
async function muatEdit() {
  try {
    const response = await EOfficeAPI.getDokumenSayaDetail(editId);

    if (response?.status !== true || !response.data) {
      throw new Error("Dokumen tidak ditemukan.");
    }

    const d = response.data;

    namaInput.value = d.nama || "";
    kategoriSelect.value = d.kategori || "";
    nomorInput.value = d.nomor && d.nomor !== "-" ? d.nomor : "";
    keteranganInput.value = d.keterangan || "";
    fileLama = d.adaFile ? d.fileNama : null;

    crumbEl.textContent = "Edit Dokumen";
    titleEl.textContent = "Edit Dokumen";
    descEl.textContent = "Perubahan hanya bisa disimpan selama dokumen masih berstatus draft.";
    document.title = "Edit Dokumen - E-Office SKSDA";

    renderFile();
  } catch (err) {
    showToast(err.message || "Gagal memuat dokumen.", "error");
    setTimeout(() => {
      window.location.href = "/pegawai/dokumen-saya";
    }, 1500);
  }
}

/* ===== SIMPAN / KIRIM ===== */
async function simpan(status) {
  if (!validateForm()) return;

  const payload = {
    nama: namaInput.value.trim(),
    kategori: kategoriSelect.value,
    nomor: nomorInput.value.trim(),
    keterangan: keteranganInput.value.trim(),
    status: status,
  };

  if (selectedFile) {
    payload.file = selectedFile;
  }

  const label = status === "terkirim" ? "Kirim Dokumen" : "Simpan Draft";

  openModal({
    title: label,
    desc: "Periksa ringkasan dokumen sebelum disimpan:",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default"><span><strong>Nama</strong><span>${payload.nama}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Kategori</strong><span>${payload.kategori}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Nomor</strong><span>${payload.nomor || "-"}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Lampiran</strong><span>${selectedFile ? selectedFile.name : (fileLama || "Tidak ada")}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Status</strong><span>${status === "terkirim" ? "Terkirim ke Kepala Seksi" : "Draft"}</span></span></div>
      </div>`,
    confirmLabel: status === "terkirim" ? "Ya, Kirim" : "Ya, Simpan",
    onConfirm: () => kirimKeServer(payload),
  });
}

async function kirimKeServer(payload) {
  if (!window.EOfficeAPI || !EOfficeAPI.config.LIVE) {
    showToast(payload.status === "terkirim" ? "Dokumen dikirim" : "Draft dokumen disimpan", "success");
    setTimeout(() => {
      window.location.href = "/pegawai/dokumen-saya";
    }, 1200);
    return;
  }

  try {
    if (isEdit) {
      await EOfficeAPI.updateDokumenSaya(editId, payload);

      if (payload.status === "terkirim") {
        await EOfficeAPI.kirimDokumenSaya(editId);
      }
    } else {
      await EOfficeAPI.createDokumenSaya(payload);
    }

    showToast(payload.status === "terkirim"
      ? "Dokumen dikirim untuk diperiksa Kepala Seksi"
      : "Draft dokumen disimpan", "success");

    setTimeout(() => {
      window.location.href = "/pegawai/dokumen-saya";
    }, 1200);
  } catch (err) {
    showToast(err.message || "Gagal menyimpan dokumen. Periksa koneksi lalu coba lagi.", "error");
  }
}

/* ===== TOMBOL AKSI ===== */
document.getElementById("btn-simpan").addEventListener("click", () => simpan("draft"));
document.getElementById("btn-kirim").addEventListener("click", () => simpan("terkirim"));

document.getElementById("btn-batal").addEventListener("click", () => {
  window.location.href = "/pegawai/dokumen-saya";
});

/* ===== INISIALISASI ===== */
renderFile();

if (isEdit && window.EOfficeAPI && EOfficeAPI.config.LIVE) {
  muatEdit();
}
