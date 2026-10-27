/* ============================================
   FORM SURAT KELUAR — E-Office SKSDA
   Editor contenteditable, jabatan otomatis,
   upload lampiran, validasi + toast
   ============================================ */

/* ===== Data pejabat penandatangan ===== */
const SIGNERS = {
  darmanto: { label: "Ir. Darmanto, M.Si. - Kepala Balai", jabatan: "Kepala Seksi Konservasi Sumber Daya Alam Jawa Tengah" },
  sari: { label: "Dra. Sari Wulandari - Sekretaris Balai", jabatan: "Sekretaris Seksi Konservasi Sumber Daya Alam Jawa Tengah" }
};

/* Jabatan mengikuti pejabat yang dipilih */
const signerSelect = document.getElementById("penandatangan");
const jabatanText = document.getElementById("jabatan-text");

signerSelect.addEventListener("change", () => {
  const signer = SIGNERS[signerSelect.value];
  jabatanText.textContent = signer ? signer.jabatan : "Otomatis mengikuti pejabat terpilih";
  setFieldError("penandatangan", false);
});

/* ===== TOAST ===== */
const toast = document.getElementById("toast");
const toastText = document.getElementById("toast-text");
let toastTimer = null;

function showToast(text) {
  toastText.textContent = text;
  toast.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-show"), 3000);
}

/* ===== EDITOR CONTENTEDITABLE (toolbar dasar) ===== */
const editorBody = document.getElementById("editor-body");
const toolbarButtons = document.querySelectorAll(".editor-btn");

toolbarButtons.forEach((btn) => {
  // preventDefault agar seleksi teks tidak hilang saat klik tombol
  btn.addEventListener("mousedown", (event) => event.preventDefault());
  btn.addEventListener("click", () => {
    editorBody.focus();
    document.execCommand(btn.dataset.cmd, false, null);
    updateToolbarState();
  });
});

// Status aktif tombol mengikuti posisi kursor
function updateToolbarState() {
  toolbarButtons.forEach((btn) => {
    let isActive = false;
    try {
      isActive = document.queryCommandState(btn.dataset.cmd);
    } catch {
      isActive = false;
    }
    btn.classList.toggle("is-active", isActive);
  });
}

editorBody.addEventListener("keyup", updateToolbarState);
editorBody.addEventListener("mouseup", updateToolbarState);
editorBody.addEventListener("input", () => {
  editor.closest(".editor").classList.remove("is-error");
  document.getElementById("editor-body-error").hidden = true;
});

/* ===== DAFTAR BERKAS TERLAMPIR ===== */
const attachments = [
  { name: "Draft_Nota_Dinas_Klarifikasi.docx", size: "2.4 MB", meta: "Berkas Utama", type: "docx", done: true, file: null },
  { name: "Lampiran_Peta_Kawasan_Konservasi.pdf", size: "5.1 MB", meta: "Lampiran Pendukung", type: "pdf", done: true, file: null }
];

const ICONS = {
  file: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>'
};

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderAttachments() {
  const list = document.getElementById("attachment-list");
  document.getElementById("attachment-count").textContent = attachments.length;

  if (attachments.length === 0) {
    list.innerHTML = `<p class="form-hint">Belum ada berkas terlampir.</p>`;
    return;
  }

  list.innerHTML = attachments
    .map((a, i) => {
      const status = a.done
        ? `${a.size} \u2022 <span class="done">${a.meta}</span>`
        : `${a.size} \u2022 Mengunggah... ${a.progress}%`;
      const progress = a.done ? "" : `<div class="attachment-progress"><span style="width:${a.progress}%"></span></div>`;
      return `
        <div class="attachment-item attachment-item--muted">
          <span class="attachment-icon attachment-icon--${a.type === "docx" ? "pink" : "green"}">${ICONS.file}</span>
          <div class="attachment-info">
            <span class="attachment-name">${a.name}</span>
            <span class="attachment-meta">${status}</span>
            ${progress}
          </div>
          <div class="attachment-actions">
            <button type="button" class="icon-btn" data-preview="${i}" title="Pratinjau berkas" aria-label="Pratinjau ${a.name}">${ICONS.eye}</button>
            <button type="button" class="icon-btn icon-btn--danger" data-remove="${i}" title="Hapus berkas" aria-label="Hapus ${a.name}">${ICONS.trash}</button>
          </div>
        </div>`;
    })
    .join("");
}

/* ===== UPLOAD: simulasi progress ===== */
function uploadFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const item = {
    name: file.name,
    size: formatSize(file.size),
    meta: "Selesai (100%)",
    type: ext === "pdf" ? "pdf" : "docx",
    progress: 0,
    done: false,
    file
  };
  attachments.push(item);
  renderAttachments();

  const timer = setInterval(() => {
    item.progress = Math.min(100, item.progress + Math.floor(Math.random() * 14) + 7);
    renderAttachments();
    if (item.progress >= 100) {
      item.done = true;
      clearInterval(timer);
      renderAttachments();
    }
  }, 160);
}

const fileInput = document.getElementById("file-input");
document.getElementById("browse-btn").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) uploadFile(fileInput.files[0]);
  fileInput.value = "";
});

/* Drag & drop (klik area juga membuka pemilih file) */
const dropzone = document.getElementById("dropzone");
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
  if (e.dataTransfer.files.length > 0) uploadFile(e.dataTransfer.files[0]);
});
dropzone.addEventListener("click", (event) => {
  if (event.target === dropzone || event.target.classList.contains("dropzone-title") || event.target.classList.contains("dropzone-sub") || event.target.closest(".dropzone-icon")) {
    fileInput.click();
  }
});

/* ===== AKSI BERKAS: preview & hapus (modal) ===== */
const backdrop = document.getElementById("modal-backdrop");
const modalDesc = document.getElementById("modal-desc");
let pendingRemove = null;

document.getElementById("attachment-list").addEventListener("click", (event) => {
  const previewBtn = event.target.closest("[data-preview]");
  const removeBtn = event.target.closest("[data-remove]");

  if (previewBtn) {
    const item = attachments[Number(previewBtn.dataset.preview)];
    if (item.file) {
      window.open(URL.createObjectURL(item.file), "_blank");
    } else {
      console.log("[demo] pratinjau berkas:", item.name);
    }
  }

  if (removeBtn) {
    pendingRemove = Number(removeBtn.dataset.remove);
    modalDesc.textContent = `Berkas "${attachments[pendingRemove].name}" akan dihapus dari daftar lampiran. Lanjutkan?`;
    backdrop.classList.add("is-open");
  }
});

document.getElementById("modal-cancel").addEventListener("click", () => {
  backdrop.classList.remove("is-open");
  pendingRemove = null;
});
backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) {
    backdrop.classList.remove("is-open");
    pendingRemove = null;
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && backdrop.classList.contains("is-open")) {
    backdrop.classList.remove("is-open");
    pendingRemove = null;
  }
});
document.getElementById("modal-confirm").addEventListener("click", () => {
  if (pendingRemove !== null) attachments.splice(pendingRemove, 1);
  backdrop.classList.remove("is-open");
  pendingRemove = null;
  renderAttachments();
});

/* ===== VALIDASI INLINE ===== */
const REQUIRED_FIELDS = [
  "nomor-agenda",
  "tanggal-surat",
  "tujuan-surat",
  "sifat-surat",
  "klasifikasi",
  "perihal",
  "penandatangan"
];

function setFieldError(id, show) {
  const input = document.getElementById(id);
  input.closest(".input-wrap").classList.toggle("is-error", show);
  const errorEl = document.getElementById(id + "-error");
  if (errorEl) errorEl.hidden = !show;
}

REQUIRED_FIELDS.forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener("input", () => setFieldError(id, false));
  el.addEventListener("change", () => setFieldError(id, false));
});

function editorIsEmpty() {
  const text = editorBody.textContent.trim();
  return text === "" && editorBody.innerHTML !== "<br>";
}

function validateForm() {
  let valid = true;

  REQUIRED_FIELDS.forEach((id) => {
    const isEmpty = document.getElementById(id).value.trim() === "";
    setFieldError(id, isEmpty);
    if (isEmpty) valid = false;
  });

  const editorError = editorIsEmpty();
  document.getElementById("editor").classList.toggle("is-error", editorError);
  document.getElementById("editor-body-error").hidden = !editorError;
  if (editorError) valid = false;

  return valid;
}

/* ===== TOMBOL BAWAH ===== */
const form = document.getElementById("form-surat");

function payloadSuratKeluar(status) {
  return {
    agenda: document.getElementById("nomor-agenda").value.trim(),
    tujuan: document.getElementById("tujuan-surat").value.trim(),
    penandatangan: SIGNERS[signerSelect.value].label,
    isi: editorBody.textContent.trim(),
    lampiran: attachments.filter((a) => a.done).map((a) => ({ name: a.name, size: a.size })),
    status: status
  };
}

/* Simpan & Kirim (submit, dengan validasi) */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    EOfficeAPI.createSuratKeluar(payloadSuratKeluar("Terkirim"))
      .then(() => showToast("Surat keluar berhasil dibuat dan dikirim."))
      .catch(() => showToast("Gagal mengirim surat. Periksa koneksi lalu coba lagi."));
    return;
  }

  showToast("Surat keluar berhasil dibuat dan dikirim.");
  console.log("[demo] surat keluar dikirim:", {
    agenda: document.getElementById("nomor-agenda").value,
    tujuan: document.getElementById("tujuan-surat").value,
    penandatangan: SIGNERS[signerSelect.value].label,
    isi: editorBody.textContent.trim().slice(0, 80) + "...",
    lampiran: attachments.filter((a) => a.done).length
  });
});

/* Simpan Draft (tanpa validasi penuh) */
document.getElementById("btn-draft").addEventListener("click", () => {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    EOfficeAPI.createSuratKeluar(payloadSuratKeluar("Draft"))
      .then(() => showToast("Draft surat keluar berhasil disimpan."))
      .catch(() => showToast("Gagal menyimpan draft. Periksa koneksi lalu coba lagi."));
    return;
  }
  showToast("Draft surat keluar berhasil disimpan.");
  console.log("[demo] draft disimpan");
});

/* Batal */
document.getElementById("btn-cancel").addEventListener("click", () => {
  window.location.href = "input-surat.html";
});

/* ===== Inisialisasi ===== */
renderAttachments();
