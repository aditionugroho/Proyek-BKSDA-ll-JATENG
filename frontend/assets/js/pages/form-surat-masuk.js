/* ============================================
   FORM SURAT MASUK — E-Office SKSDA
   Nomor agenda auto, upload simulasi,
   lampiran (preview/hapus via modal),
   validasi inline + toast
   ============================================ */

/* ===== DEFAULT VALUE FORM ===== */
const DEFAULT_PERIHAL =
  "Koordinasi Pengamanan Kawasan Konservasi dan Penertiban Pemanfaatan Tumbuhan dan Satwa Liar di Wilayah Kabupaten Semarang";
const DEFAULT_INSTRUKSI =
  "Segera ditindaklanjuti dan dikoordinasikan dengan instansi terkait paling lambat 3 hari kerja.";
const DEFAULT_ASAL = "Dinas Lingkungan Hidup dan Kehutanan Prov. Jateng";

/* ===== Nomor agenda otomatis: AGD/[tahun]/[bulan]/[urut] ===== */
function generateNomorAgenda() {
  const now = new Date();
  const urut = Math.floor(Math.random() * 900) + 100; // 100–999
  return `AGD/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${urut}`;
}

function applyDefaults() {
  document.getElementById("nomor-agenda").value = generateNomorAgenda();
  document.getElementById("asal-surat").value = DEFAULT_ASAL;
  document.getElementById("perihal").value = DEFAULT_PERIHAL;
  document.getElementById("instruksi").value = DEFAULT_INSTRUKSI;
}

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

/* ===== DAFTAR LAMPIRAN ===== */
const attachments = [
  { name: "Surat_Permohonan_Kawasan_Hutan.pdf", size: "2.4 MB", progress: 100, done: true, file: null }
];

const ICONS = {
  pdf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
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
        ? `${a.size} \u2022 <span class="done">\u2713 Selesai (100%)</span>`
        : `${a.size} \u2022 Mengunggah... ${a.progress}%`;
      const progress = a.done ? "" : `<div class="attachment-progress"><span style="width:${a.progress}%"></span></div>`;
      return `
        <div class="attachment-item">
          <span class="attachment-icon">${ICONS.pdf}</span>
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

/* ===== UPLOAD: simulasi progress hingga 100% ===== */
function uploadFile(file) {
  const item = { name: file.name, size: formatSize(file.size), progress: 0, done: false, file };
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

/* Pilih file via tombol / link */
const fileInput = document.getElementById("file-input");
document.getElementById("browse-btn").addEventListener("click", () => fileInput.click());
document.getElementById("pick-file").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) uploadFile(fileInput.files[0]);
  fileInput.value = ""; // agar file yang sama bisa dipilih ulang
});

/* Drag & drop */
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

/* ===== AKSI LAMPIRAN: preview & hapus (modal) ===== */
const backdrop = document.getElementById("modal-backdrop");
const modalDesc = document.getElementById("modal-desc");
let pendingRemove = null;

document.getElementById("attachment-list").addEventListener("click", (event) => {
  const previewBtn = event.target.closest("[data-preview]");
  const removeBtn = event.target.closest("[data-remove]");

  if (previewBtn) {
    const item = attachments[Number(previewBtn.dataset.preview)];
    if (item.file) {
      window.open(URL.createObjectURL(item.file), "_blank"); // pratinjau file asli
    } else {
      console.log("[demo] pratinjau lampiran:", item.name);
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
  "nomor-surat",
  "tanggal-surat",
  "tanggal-diterima",
  "asal-surat",
  "perihal"
];

function setFieldError(id, show) {
  const input = document.getElementById(id);
  input.closest(".input-wrap").classList.toggle("is-error", show);
  const errorEl = document.getElementById(id + "-error");
  if (errorEl) errorEl.hidden = !show;
}

REQUIRED_FIELDS.forEach((id) => {
  document.getElementById(id).addEventListener("input", () => setFieldError(id, false));
});

function validateForm() {
  let valid = true;
  REQUIRED_FIELDS.forEach((id) => {
    const isEmpty = document.getElementById(id).value.trim() === "";
    setFieldError(id, isEmpty);
    if (isEmpty) valid = false;
  });
  return valid;
}

/* ===== TOMBOL BAWAH ===== */
const form = document.getElementById("form-surat");

function kirimSuratMasuk(lalu) {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    EOfficeAPI.createSuratMasuk({
      agenda: document.getElementById("nomor-agenda").value.trim(),
      nomor: document.getElementById("nomor-surat").value.trim(),
      asal: document.getElementById("asal-surat").value.trim(),
      perihal: document.getElementById("perihal").value.trim(),
      instruksi: document.getElementById("instruksi").value.trim(),
      lampiran: attachments.filter((a) => a.done).map((a) => ({ name: a.name, size: a.size }))
    })
      .then(() => { showToast("Surat berhasil disimpan"); lalu(); })
      .catch(() => showToast("Gagal menyimpan surat. Periksa koneksi lalu coba lagi."));
    return;
  }
  showToast("Surat berhasil disimpan");
  lalu();
}

/* Simpan Surat (submit) */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm()) return;
  kirimSuratMasuk(() => {
    console.log("[demo] surat masuk disimpan:", {
      agenda: document.getElementById("nomor-agenda").value,
      nomor: document.getElementById("nomor-surat").value,
      lampiran: attachments.filter((a) => a.done).length
    });
  });
});

/* Simpan & Tambah Baru: simpan lalu reset form ke nilai default */
document.getElementById("btn-save-new").addEventListener("click", () => {
  if (!validateForm()) return;
  kirimSuratMasuk(() => {
    form.reset();
    applyDefaults();
    // Kembalikan lampiran awal (1 berkas demo)
    attachments.length = 0;
    attachments.push({ name: "Surat_Permohonan_Kawasan_Hutan.pdf", size: "2.4 MB", progress: 100, done: true, file: null });
    renderAttachments();
  });
});

/* Batal: kembali ke halaman pilihan jenis surat */
document.getElementById("btn-cancel").addEventListener("click", () => {
  window.location.href = "input-surat.html";
});

/* ===== Inisialisasi ===== */
applyDefaults();
renderAttachments();
