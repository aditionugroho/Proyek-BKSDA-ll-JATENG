/* ============================================
   EDIT PROFIL ADMIN — E-Office SKSDA
   Validasi, simpan (spinner + toast),
   draf otomatis localStorage, upload foto,
   modal buang perubahan
   ============================================ */

import { ADMIN_PROFILE } from "../data/admin-profile.js";

/* ===== Konstanta penyimpanan ===== */
const DRAFT_KEY = "eoffice_edit_profile_draft";
const SESSION_KEY = "eoffice_admin_profile";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

/* ===== Elemen utama ===== */
const form = document.getElementById("edit-form");
const namaInput = document.getElementById("nama");
const emailInput = document.getElementById("email");
const teleponInput = document.getElementById("telepon");
const saveBtn = document.getElementById("btn-save");
const saveBtnText = document.getElementById("btn-save-text");
const draftBanner = document.getElementById("draft-banner");
const photoAvatar = document.getElementById("photo-avatar");
const photoError = document.getElementById("photo-error");
const fileInput = document.getElementById("file-photo");

/* Ikon centang untuk badge avatar */
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

/* ===== TOAST ===== */
const toast = document.getElementById("toast");
const toastText = document.getElementById("toast-text");
let toastTimer = null;

function showToast(text) {
  toastText.textContent = text;
  toast.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-show"), 3200);
}

/* ===== Nilai awal form (dari mock bersama) ===== */
function fillForm(values) {
  namaInput.value = values.nama;
  emailInput.value = values.email;
  teleponInput.value = values.telepon;
}

function fillLockedFields() {
  document.getElementById("username").value = ADMIN_PROFILE.username;
  document.getElementById("jabatan").value = ADMIN_PROFILE.roleKedinasan;
  document.getElementById("unit").value = ADMIN_PROFILE.unitKerja;
  document.getElementById("page-id-badge").textContent = ADMIN_PROFILE.idAkun;
  document.getElementById("photo-name").textContent = ADMIN_PROFILE.nama;
}

/* ===== AVATAR ===== */
let avatarUrl = null;

function renderAvatar() {
  photoAvatar.innerHTML = avatarUrl
    ? `<img src="${avatarUrl}" alt="Foto profil" /><span class="photo-check">${CHECK_ICON}</span>`
    : `${ADMIN_PROFILE.avatarInisial}<span class="photo-check">${CHECK_ICON}</span>`;
}

/* Upload foto: validasi tipe & ukuran → preview base64 */
document.getElementById("btn-photo").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  photoError.hidden = true;
  const file = fileInput.files[0];
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    photoError.textContent = "Format tidak didukung. Gunakan JPG, PNG, atau WebP.";
    photoError.hidden = false;
    fileInput.value = "";
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    photoError.textContent = "Ukuran file melebihi 2.0 MB.";
    photoError.hidden = false;
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    avatarUrl = reader.result;
    renderAvatar();
    saveDraft();
  };
  reader.readAsDataURL(file);
});

/* Reset ke inisial default */
document.getElementById("link-initials").addEventListener("click", () => {
  avatarUrl = null;
  photoError.hidden = true;
  renderAvatar();
  saveDraft();
});

/* ===== VALIDASI ===== */
function setFieldError(input, message) {
  input.closest(".input-wrap").classList.toggle("is-error", Boolean(message));
  const errorEl = document.getElementById(input.id + "-error");
  if (errorEl) {
    errorEl.textContent = message || "Wajib diisi";
    errorEl.hidden = !message;
  }
}

[namaInput, emailInput].forEach((input) => {
  input.addEventListener("input", () => setFieldError(input, ""));
});

function validateForm() {
  let valid = true;

  if (namaInput.value.trim() === "") {
    setFieldError(namaInput, "Wajib diisi");
    valid = false;
  }

  const email = emailInput.value.trim();
  if (email === "") {
    setFieldError(emailInput, "Wajib diisi");
    valid = false;
  } else if (!EMAIL_RE.test(email)) {
    setFieldError(emailInput, "Format email tidak valid");
    valid = false;
  }

  return valid;
}

/* ===== DRAF OTOMATIS (debounce 500ms) ===== */
let draftTimer = null;

function collectValues() {
  return {
    nama: namaInput.value,
    email: emailInput.value,
    telepon: teleponInput.value,
    avatarUrl
  };
}

function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(collectValues()));
  }, 500);
}

[namaInput, emailInput, teleponInput].forEach((input) => {
  input.addEventListener("input", saveDraft);
});

function readDraft() {
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_KEY));
  } catch {
    return null;
  }
}

function clearDraft() {
  window.localStorage.removeItem(DRAFT_KEY);
  draftBanner.hidden = true;
}

/* Cek draf saat halaman dibuka */
function checkDraft() {
  const draft = readDraft();
  if (draft && draft.nama !== undefined) {
    draftBanner.hidden = false;
  }
}

document.getElementById("btn-restore").addEventListener("click", () => {
  const draft = readDraft();
  if (draft) {
    fillForm(draft);
    avatarUrl = draft.avatarUrl || null;
    renderAvatar();
  }
  draftBanner.hidden = true;
  showToast("Draf dipulihkan");
});

document.getElementById("btn-discard").addEventListener("click", () => {
  clearDraft();
  fillForm(ADMIN_PROFILE);
  avatarUrl = null;
  renderAvatar();
});

/* ===== SIMPAN PERUBAHAN ===== */
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateForm()) return;

  saveBtn.disabled = true;
  saveBtnText.textContent = "Menyimpan...";
  saveBtn.querySelector(".spinner")?.remove();
  const spinner = document.createElement("span");
  spinner.className = "spinner";
  saveBtn.insertBefore(spinner, saveBtnText);

  setTimeout(() => {
    // Simpan hasil ke sessionStorage (ganti dengan POST API bila sudah tersedia)
    window.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...collectValues(), savedAt: new Date().toISOString() })
    );

    clearDraft();

    spinner.remove();
    saveBtn.disabled = false;
    saveBtnText.textContent = "Simpan Perubahan";
    showToast("Perubahan Sukses - Profil Administrator berhasil diperbarui ke server SKSDA.");
  }, 1500);
});

/* ===== BATAL (modal konfirmasi) ===== */
const backdrop = document.getElementById("modal-backdrop");

function resetForm() {
  fillForm(ADMIN_PROFILE);
  avatarUrl = null;
  renderAvatar();
  setFieldError(namaInput, "");
  setFieldError(emailInput, "");
  photoError.hidden = true;
  clearDraft();
}

document.getElementById("btn-cancel").addEventListener("click", () => {
  backdrop.classList.add("is-open");
});

document.getElementById("modal-keep").addEventListener("click", () => {
  backdrop.classList.remove("is-open");
});

document.getElementById("modal-discard").addEventListener("click", () => {
  backdrop.classList.remove("is-open");
  resetForm();
  showToast("Perubahan dibuang");
});

backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) backdrop.classList.remove("is-open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && backdrop.classList.contains("is-open")) {
    backdrop.classList.remove("is-open");
  }
});

/* ===== RESET FORM (tanpa modal) ===== */
document.getElementById("btn-reset").addEventListener("click", () => {
  resetForm();
  showToast("Form direset ke nilai awal");
});

/* ===== SIMULASI INPUT INVALID ===== */
document.getElementById("btn-invalid").addEventListener("click", () => {
  namaInput.value = "";
  emailInput.value = "format-email-salah";
  setFieldError(namaInput, "Wajib diisi");
  setFieldError(emailInput, "Format email tidak valid");
  namaInput.focus();
});

/* ===== METRIK AKUN SISTEM (render dari mock) ===== */
function renderMetrik() {
  const rows = [
    { label: "Status Akun", badge: { text: "\u2022 Aktif & Terverifikasi", tone: "green" } },
    { label: "ID Akun Kepegawaian", value: ADMIN_PROFILE.idAkun, mono: true },
    { label: "Tanggal Terdaftar", value: ADMIN_PROFILE.tanggalTerdaftar },
    { label: "Terakhir Diperbarui", value: ADMIN_PROFILE.terakhirDiperbaruiDetail },
    { label: "Basis Otoritas", value: "Super Administrator SKSDA", bold: true }
  ];

  document.getElementById("metrik-list").innerHTML = rows
    .map((row) => {
      let value;
      if (row.badge) {
        value = `<span class="badge badge--${row.badge.tone}">${row.badge.text}</span>`;
      } else {
        const cls = row.bold ? "kv-value kv-value--bold" : "kv-value";
        const mono = row.mono ? " mono" : "";
        value = `<span class="${cls}${mono}">${row.value}</span>`;
      }
      return `
        <div class="kv-row">
          <span class="kv-label">${row.label}</span>
          ${value}
        </div>`;
    })
    .join("");
}

/* ===== Inisialisasi ===== */
fillLockedFields();
fillForm(ADMIN_PROFILE);
renderAvatar();
renderMetrik();
checkDraft();
