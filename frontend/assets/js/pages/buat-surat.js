/* ============================================
   BUAT SURAT KELUAR (PEGAWAI) — E-Office SKSDA
   Validasi, editor toolbar, lampiran,
   ajukan/preview/simpan draft
   ============================================ */

import { suratPgData as SURAT_PG_MOCK } from "../data/surat-pegawai.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== Elemen ===== */
const nomorInput = document.getElementById("f-nomor");
const tanggalInput = document.getElementById("f-tanggal");
const penerimaInput = document.getElementById("f-penerima");
const perihalInput = document.getElementById("f-perihal");
const editor = document.getElementById("f-isi");

const AUTO_NOMOR = "B-045/K.21/TU/10/2023";
const REQUIRED = ["f-tanggal", "f-penerima", "f-perihal"];

/* ===== VALIDASI INLINE ===== */
function setFieldError(id, show) {
  document.getElementById(id).closest(".pgb-field").classList.toggle("is-error", show);
  document.getElementById(id + "-error").hidden = !show;
}

REQUIRED.forEach((id) => {
  document.getElementById(id).addEventListener("input", () => setFieldError(id, false));
});

function editorIsEmpty() {
  return editor.textContent.trim() === "" && editor.innerHTML !== "<br>";
}

function setEditorError(show) {
  editor.closest(".pgb-editor-wrap").classList.toggle("is-error", show);
  document.getElementById("f-isi-error").hidden = !show;
}

editor.addEventListener("input", () => setEditorError(false));

/* ===== TOOLBAR B / I / LIST ===== */
document.querySelectorAll(".pgb-tool").forEach((btn) => {
  btn.addEventListener("mousedown", (event) => event.preventDefault()); // jaga seleksi
  btn.addEventListener("click", () => {
    editor.focus();
    document.execCommand(btn.dataset.cmd, false, null);
  });
});

/* ===== LAMPIRAN ===== */
const files = [{ name: "SK_Tim_Evaluasi.pdf", size: "2.4 MB" }];

const PDF_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
const X_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

function renderFiles() {
  document.getElementById("pgb-file-list").innerHTML = files
    .map(
      (f, i) => `
      <div class="pgb-file-item">
        <span class="pgb-file-icon">${PDF_ICON}</span>
        <span class="pgb-file-name">${f.name} <span class="pgb-file-size">${f.size}</span></span>
        <button type="button" class="pgb-file-remove" data-remove="${i}" title="Hapus lampiran" aria-label="Hapus ${f.name}">${X_ICON}</button>
      </div>`
    )
    .join("");
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function addFile(file) {
  const errorEl = document.getElementById("pgb-file-error");
  errorEl.hidden = true;

  const ext = "." + file.name.split(".").pop().toLowerCase();
  const validTypes = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];

  if (!validTypes.includes(ext)) {
    errorEl.textContent = "Format tidak didukung. Gunakan PDF, DOCX, atau JPG.";
    errorEl.hidden = false;
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    errorEl.textContent = "Ukuran file melebihi 10MB.";
    errorEl.hidden = false;
    return;
  }

  files.push({ name: file.name, size: formatSize(file.size) });
  renderFiles();
}

const dropzone = document.getElementById("pgb-dropzone");
const fileInput = document.getElementById("pgb-file");

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") fileInput.click();
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) addFile(fileInput.files[0]);
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
dropzone.addEventListener("drop", (e) => {
  if (e.dataTransfer.files.length > 0) addFile(e.dataTransfer.files[0]);
});

/* Hapus lampiran (tanpa konfirmasi — draft) */
document.getElementById("pgb-file-list").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-remove]");
  if (!btn) return;
  files.splice(Number(btn.dataset.remove), 1);
  renderFiles();
});

/* ===== KUMPULKAN DATA ===== */
function collectDraft() {
  return {
    nomor: nomorInput.value.trim() || AUTO_NOMOR,
    tanggal: tanggalInput.value,
    penerima: penerimaInput.value.trim(),
    perihal: perihalInput.value.trim(),
    isi: editor.innerHTML,
    lampiran: files.length,
    disimpanPada: new Date().toISOString()
  };
}

/* ===== AJUKAN SURAT ===== */
document.getElementById("btn-ajukan").addEventListener("click", () => {
  let valid = true;

  REQUIRED.forEach((id) => {
    const isEmpty = document.getElementById(id).value.trim() === "";
    setFieldError(id, isEmpty);
    if (isEmpty) valid = false;
  });

  const editorError = editorIsEmpty();
  setEditorError(editorError);
  if (editorError) valid = false;

  if (!valid) return;

  const draft = collectDraft();

  openModal({
    title: "Ajukan Surat Keluar",
    desc: "Periksa ringkasan surat sebelum diajukan:",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default"><span><strong>Nomor Surat</strong><span>${draft.nomor}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Penerima</strong><span>${draft.penerima}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Perihal</strong><span>${draft.perihal}</span></span></div>
        <div class="app-modal-option" style="cursor:default"><span><strong>Lampiran</strong><span>${draft.lampiran} berkas</span></span></div>
      </div>`,
    confirmLabel: "Ya, Ajukan",
    onConfirm: () => {
      showToast("Surat diajukan untuk persetujuan");
      setTimeout(() => {
        window.location.href = "surat.html";
      }, 1500);
    }
  });
});

/* ===== PREVIEW (kirim via sessionStorage) ===== */
document.getElementById("btn-preview").addEventListener("click", () => {
  window.sessionStorage.setItem("draftSurat", JSON.stringify(collectDraft()));
  window.location.href = "preview-surat.html";
});

/* ===== SIMPAN DRAFT ===== */
document.getElementById("btn-draft").addEventListener("click", () => {
  const draft = collectDraft();

  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    // LIVE: draft tersimpan di server
    EOfficeAPI.createSuratKeluar({ ...draft, status: "Draft" })
      .then(() => showToast("Draft disimpan"))
      .catch(() => showToast("Gagal menyimpan draft. Periksa koneksi lalu coba lagi."));
    return;
  }

  // Mock: tambah ke data Draft (tab Draft di halaman Surat)
  SURAT_PG_MOCK.unshift({
    id: Date.now(),
    jenis: "draft",
    nomor: draft.nomor,
    pengirim: "Anda (Bagian TU)",
    perihal: draft.perihal || "(Tanpa perihal)",
    perihalDetail: "Draf surat keluar yang sedang dikerjakan.",
    tanggal: "Hari ini",
    waktu: "Baru saja",
    iso: new Date().toISOString().slice(0, 10),
    sifat: "Biasa",
    status: "Draft",
    label: { text: "Draft", tone: "gray", dot: false }
  });

  showToast("Draft disimpan");
});

/* ===== Inisialisasi ===== */
renderFiles();
