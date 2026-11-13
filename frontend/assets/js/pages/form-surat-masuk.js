/* ============================================
   FORM SURAT MASUK - E-Office SKSDA
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
  const urut = Math.floor(Math.random() * 900) + 100; // 100-999
  return `AGD/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${urut}`;
}

function applyDefaults() {
  // Nomor Agenda diisi manual oleh pengguna.
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

async function loadResortsSurat() {
  const select = document.getElementById("resort-surat");
  if (!select) return;

  try {
    const response = await EOfficeAPI.request("GET", "/resorts");
    const data = response?.data;

    const resorts = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];

    select.innerHTML = '<option value="">Pilih Resort</option>';

    for (const resort of resorts) {
      if (String(resort.status) !== "1") continue;

      const option = document.createElement("option");
      option.value = String(resort.id);
      option.textContent = resort.nama_resort || resort.nama || `Resort ${resort.id}`;
      select.appendChild(option);
    }

    if (select.options.length === 1) {
      select.innerHTML = '<option value="">Tidak ada resort aktif</option>';
    }
  } catch (error) {
    console.error("Gagal memuat resort:", error);
    select.innerHTML = '<option value="">Gagal memuat resort</option>';
  }
}

/* ===== DAFTAR LAMPIRAN ===== */
const attachments = [];

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
  if (e14CreatedSuratId !== null) {
    showToast("Surat sudah dibuat. Gunakan file yang sama untuk retry.");
    return;
  }
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
  if (e14CreatedSuratId !== null) {
    showToast("Lampiran tidak dapat dihapus selama retry upload.");
    return;
  }
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

/* ===== E14: STATE UPLOAD & RETRY ===== */
let e14CreatedSuratId = null;
let e14UploadKey = null;
let e14PendingFile = null;
let e14Submitting = false;
let e14Saved = false;
let e14CreateUncertain = false;

function e14LockFields(locked) {
  form.querySelectorAll("input, select, textarea").forEach((element) => {
    if (element.type !== "hidden") {
      element.disabled = locked;
    }
  });
}
function e14ResetState() {
  e14CreatedSuratId = null;
  e14UploadKey = null;
  e14PendingFile = null;
  e14Submitting = false;
  e14Saved = false;
  e14CreateUncertain = false;
}

function e14UploadLampiran(suratId, file, key) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const baseUrl = EOfficeAPI.config.BASE_URL.replace(/\/$/, "");

    const token =
      sessionStorage.getItem("eoffice_token") ||
      localStorage.getItem("eoffice_token") ||
      "";

    const body = new FormData();
    body.append("file", file);

    xhr.open(
      "POST",
      `${baseUrl}/surat-masuk/${encodeURIComponent(suratId)}/file`
    );

    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Idempotency-Key", key);
    xhr.setRequestHeader("Accept", "application/json");

    xhr.timeout = 60000;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const percentage = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100)
      );

      console.log(`[E14] File terkirim: ${percentage}%`);

      // 100% berarti transfer selesai,
      // bukan konfirmasi file tersimpan di backend.
    };

    xhr.onload = () => {
      let result;

      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Respons upload dari server tidak valid."));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && result.status === true) {
        resolve(result);
      } else {
        reject(
          new Error(
            result.message ||
            `Upload gagal (HTTP ${xhr.status}).`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Koneksi upload terputus."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload melebihi batas waktu."));
    };

    xhr.send(body);
  });
}

async function kirimSuratMasuk(lalu) {
  if (e14Submitting) return;

  if (e14Saved) {
    showToast("Surat sudah berhasil disimpan.");
    return;
  }

  if (e14CreateUncertain) {
    showToast(
      "Status pembuatan surat belum pasti. Periksa daftar Surat Masuk sebelum mencoba lagi."
    );
    return;
  }

  if (!(window.EOfficeAPI && EOfficeAPI.config.LIVE)) {
    showToast("Surat berhasil disimpan (demo)");
    lalu();
    return;
  }

  if (e14CreatedSuratId === null) {
    const files = attachments
      .filter((item) => item.done && item.file instanceof File)
      .map((item) => item.file);

    if (files.length > 1) {
      showToast("Surat Masuk hanya mendukung satu lampiran file.");
      return;
    }

    const resortSelect = document.getElementById("resort-surat");

    if (!resortSelect || !resortSelect.value) {
      showToast("Silakan pilih Resort terlebih dahulu.");
      resortSelect?.focus();
      return;
    }

    e14PendingFile = files[0] || null;
  }

  e14Submitting = true;

  const buttons = [
    form.querySelector('[type="submit"]'),
    document.getElementById("btn-save-new")
  ].filter(Boolean);

  buttons.forEach((button) => {
    button.disabled = true;
  });

  try {
    // Surat hanya dibuat satu kali.
    if (e14CreatedSuratId === null) {
      const payload = {
        no_agenda: document.getElementById("nomor-agenda").value.trim(),
        no_surat: document.getElementById("nomor-surat").value.trim(),
        tanggal: document.getElementById("tanggal-surat").value,
        asal: document.getElementById("asal-surat").value.trim(),
        perihal: document.getElementById("perihal").value.trim(),
        klasifikasi: document.getElementById("sifat-surat").value,
        resort_id: document.getElementById("resort-surat").value
      };

      // Bila respons hilang, hasil pembuatan bisa tidak pasti.
      e14CreateUncertain = true;

      const response = await EOfficeAPI.createSuratMasuk(payload);

      if (!response?.status) {
        e14CreateUncertain = false;
        throw new Error(response?.message || "Gagal membuat surat masuk.");
      }

      const newId = Number(
        response.data?.id ??
        response.data?.surat?.id ??
        response.id
      );

      if (!Number.isSafeInteger(newId) || newId <= 0) {
        throw new Error(
          "Surat mungkin sudah dibuat, tetapi ID tidak tersedia. Periksa daftar surat."
        );
      }

      e14CreatedSuratId = newId;
      e14CreateUncertain = false;
      e14LockFields(true);

      // Satu key untuk satu file dan seluruh retry-nya.
      if (e14PendingFile) {
        e14UploadKey = crypto.randomUUID();
      }

      console.log("[E14] Surat berhasil dibuat:", e14CreatedSuratId);
    }

    // Retry hanya mengulangi upload, bukan membuat surat.
    if (e14PendingFile) {
      if (!e14UploadKey) {
        e14UploadKey = crypto.randomUUID();
      }

      showToast("Mengunggah lampiran surat...");

      await e14UploadLampiran(
        e14CreatedSuratId,
        e14PendingFile,
        e14UploadKey
      );

      console.log("[E14] Upload dikonfirmasi backend.");
    }

    e14Saved = true;

    showToast("Surat masuk berhasil disimpan.");

    if (typeof lalu === "function") {
      lalu();
    }

  } catch (error) {
    console.error("[E14] Simpan Surat Masuk gagal:", error);

    if (e14CreateUncertain) {
      showToast(
        "Hasil pembuatan surat belum pasti. Periksa daftar Surat Masuk sebelum mengirim ulang."
      );
    } else if (e14CreatedSuratId !== null) {
      showToast(
        `${error.message} Surat sudah dibuat. Klik Simpan lagi untuk retry lampiran.`
      );
    } else {
      showToast(error.message || "Gagal menyimpan surat.");
    }

  } finally {
    e14Submitting = false;

    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
}

/* Simpan Surat (submit) */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (e14CreatedSuratId === null && !validateForm()) return;
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
  if (e14CreatedSuratId === null && !validateForm()) return;
  kirimSuratMasuk(() => {
    e14ResetState();
    e14LockFields(false);
    form.reset();
    applyDefaults();
    attachments.length = 0;
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
loadResortsSurat();
