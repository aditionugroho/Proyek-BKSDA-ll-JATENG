/* ============================================
   BUAT SURAT KELUAR (PEGAWAI) — E-Office SKSDA
   Validasi, editor toolbar, lampiran,
   ajukan/preview/simpan draft
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { createDraftSession, downloadDraftAttachment, validateSuratAttachment } from "./surat-keluar-draft.js";

const session = createDraftSession();
let selectedFile = null;
let uploadKey = null;
let ready = false;
let busy = false;

/* ===== Elemen ===== */
const nomorInput = document.getElementById("f-nomor");
const tanggalInput = document.getElementById("f-tanggal");
const penerimaInput = document.getElementById("f-penerima");
const perihalInput = document.getElementById("f-perihal");
const editor = document.getElementById("f-isi");

const REQUIRED = ["f-nomor", "f-tanggal", "f-penerima", "f-perihal"];

/* ===== VALIDASI INLINE ===== */
function setFieldError(id, show) {
  document.getElementById(id).closest(".pgb-field").classList.toggle("is-error", show);
  document.getElementById(id + "-error").hidden = !show;
}

REQUIRED.forEach((id) => {
  document.getElementById(id).addEventListener("input", () => setFieldError(id, false));
});

function editorIsEmpty() {
  return editor.innerText.trim() === "";
}

function setEditorError(show) {
  editor.closest(".pgb-editor-wrap").classList.toggle("is-error", show);
  document.getElementById("f-isi-error").hidden = !show;
}

editor.addEventListener("input", () => setEditorError(false));

document.querySelectorAll(".pgb-tool").forEach((button) => { button.disabled = true; });

const fileList = document.getElementById("pgb-file-list");
function renderFiles() {
  fileList.replaceChildren();
  if (session.draft?.file_path) {
    const download = document.createElement("button");
    download.type = "button";
    download.textContent = "Unduh lampiran tersimpan";
    download.addEventListener("click", async () => {
      try {
        await downloadDraftAttachment(session.draft.id);
      } catch (error) {
        showToast(error.message);
      }
    });
    fileList.append(download);
  }
  if (selectedFile) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = `Batalkan unggah ${selectedFile.name}`;
    remove.disabled = busy;
    remove.addEventListener("click", () => {
      selectedFile = null;
      uploadKey = null;
      renderFiles();
    });
    fileList.append(remove);
  }
}

function addFile(file) {
  if (busy || !ready) return;
  const errorEl = document.getElementById("pgb-file-error");
  errorEl.hidden = true;
  try {
    validateSuratAttachment(file);
    uploadKey = crypto.randomUUID();
    selectedFile = file;
    renderFiles();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
  }
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

const agenda = document.getElementById("f-agenda");
const submitButton = document.getElementById("btn-ajukan");
const saveButton = document.getElementById("btn-draft");
const previewButton = document.getElementById("btn-preview");

function setBusy(value) {
  busy = value;
  for (const button of [submitButton, saveButton, previewButton, fileInput]) {
    button.disabled = busy || !ready;
  }
  renderFiles();
}

async function save(action) {
  if (!ready || busy) return;
  setBusy(true);
  try {
    const record = await session.save({
      no_surat: nomorInput.value.trim(),
      tanggal: tanggalInput.value,
      tujuan: penerimaInput.value.trim(),
      perihal: perihalInput.value.trim(),
      isi: editor.innerText.trim(),
    }, selectedFile, uploadKey, action === "submit");
    selectedFile = null;
    if (action === "submit" || action === "preview") {
      ready = false;
      location.href = action === "submit" ? "surat.html" : `preview-surat.html?draft_id=${record.id}`;
      return;
    }
    showToast("Draft disimpan.");
  } catch (error) {
    showToast(error.message);
  } finally {
    agenda.value = session.draft?.no_agenda ?? "";
    setBusy(false);
  }
}

submitButton.addEventListener("click", () => {
  let valid = true;
  for (const id of REQUIRED) {
    const empty = !document.getElementById(id).value.trim();
    setFieldError(id, empty);
    if (empty) valid = false;
  }
  setEditorError(editorIsEmpty());
  if (!valid || editorIsEmpty()) return;
  openModal({
    title: "Ajukan Surat Keluar",
    desc: "Surat akan diajukan dengan data yang telah diisi.",
    confirmLabel: "Ya, Ajukan",
    onConfirm: () => save("submit"),
  });
});
saveButton.addEventListener("click", () => save("draft"));
previewButton.addEventListener("click", () => save("preview"));

async function init() {
  setBusy(true);
  try {
    const draft = await session.load();
    if (draft) {
      agenda.value = draft.no_agenda ?? "";
      nomorInput.value = draft.no_surat ?? "";
      tanggalInput.value = draft.tanggal ?? "";
      penerimaInput.value = draft.tujuan ?? "";
      perihalInput.value = draft.perihal ?? "";
      editor.textContent = draft.isi ?? "";
    }
    ready = true;
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(false);
  }
}

init();
