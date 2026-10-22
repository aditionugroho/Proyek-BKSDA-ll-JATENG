/* ============================================
   PROFIL SAYA (KEPALA SEKSI) — E-Office SKSDA
   Toggle edit, field terkunci, ganti password,
   konfirmasi keluar sesi
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA PROFIL (mock — bisa diganti sessionStorage/API) ===== */
const PROFILE = {
  nama: "Alex Rivera",
  jabatan: "Kepala Seksi Konservasi Wilayah",
  nip: "198505122010011001",
  unit: "SKSDA Jawa Tengah",
  email: "alex.rivera@SKSDA-jateng.go.id",
  telepon: "0812-3456-7890"
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ===== Elemen ===== */
const editBtn = document.getElementById("btn-edit");
const editBtnLabel = document.getElementById("btn-edit-label");
const cancelBtn = document.getElementById("btn-cancel");
const namaInput = document.getElementById("pf-nama");
const emailInput = document.getElementById("pf-email");
const teleponInput = document.getElementById("pf-telepon");

let editMode = false;

/* ===== ISI DATA AWAL ===== */
function applyProfile() {
  namaInput.value = PROFILE.nama;
  document.getElementById("pf-jabatan").value = PROFILE.jabatan;
  document.getElementById("pf-nip").value = PROFILE.nip;
  document.getElementById("pf-unit").value = PROFILE.unit;
  emailInput.value = PROFILE.email;
  teleponInput.value = PROFILE.telepon;
  document.getElementById("pf-name").textContent = PROFILE.nama;
}

/* ===== MODE EDIT ===== */
function setEditMode(on) {
  editMode = on;
  [namaInput, emailInput, teleponInput].forEach((input) => {
    input.readOnly = !on;
    input.classList.toggle("editable", on);
  });
  editBtnLabel.textContent = on ? "Simpan Perubahan" : "Edit Profil";
  cancelBtn.hidden = !on;
  if (!on) {
    document.getElementById("pf-email-error").hidden = true;
    document.getElementById("pf-nama-error").hidden = true;
  }
}

/* Tombol Edit / Simpan */
editBtn.addEventListener("click", () => {
  if (!editMode) {
    setEditMode(true);
    namaInput.focus();
    return;
  }

  // Simpan: validasi
  let valid = true;

  const namaError = document.getElementById("pf-nama-error");
  if (namaInput.value.trim() === "") {
    namaError.hidden = false;
    valid = false;
  } else {
    namaError.hidden = true;
  }

  const emailError = document.getElementById("pf-email-error");
  if (!EMAIL_RE.test(emailInput.value.trim())) {
    emailError.textContent = "Format email tidak valid";
    emailError.hidden = false;
    valid = false;
  } else {
    emailError.hidden = true;
  }

  if (!valid) return;

  PROFILE.nama = namaInput.value.trim();
  PROFILE.email = emailInput.value.trim();
  PROFILE.telepon = teleponInput.value.trim();

  setEditMode(false);
  applyProfile();
  showToast("Profil diperbarui");
});

/* Batal: kembali read-only tanpa mengubah data */
cancelBtn.addEventListener("click", () => {
  applyProfile();
  setEditMode(false);
});

/* Field terkunci diklik → toast */
document.querySelectorAll("[data-locked]").forEach((input) => {
  input.addEventListener("click", () => {
    showToast("Field ini terkunci oleh sistem (Hubungi Admin)");
  });
});

/* ===== MODAL GANTI PASSWORD ===== */
document.getElementById("btn-password").addEventListener("click", () => {
  openModal({
    title: "Ubah Kata Sandi",
    desc: "Masukkan kata sandi lama dan kata sandi baru (minimal 8 karakter).",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Kata Sandi Lama</strong>
          <input type="password" id="pw-lama" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Kata Sandi Baru</strong>
          <input type="password" id="pw-baru" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Konfirmasi Kata Sandi Baru</strong>
          <input type="password" id="pw-konfirmasi" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <p id="pw-error" style="display:none;margin:0;font-size:12px;color:#DC2626"></p>
      </div>`,
    confirmLabel: "Simpan Kata Sandi",
    cancelLabel: "Batal",
    onConfirm: () => {
      const lama = document.getElementById("pw-lama").value;
      const baru = document.getElementById("pw-baru").value;
      const konfirmasi = document.getElementById("pw-konfirmasi").value;
      const errorEl = document.getElementById("pw-error");

      const showError = (msg) => {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      };

      if (lama === "" || baru === "" || konfirmasi === "") {
        showError("Semua field wajib diisi.");
        return false; // modal tetap terbuka
      }
      if (baru.length < 8) {
        showError("Kata sandi baru minimal 8 karakter.");
        return false;
      }
      if (baru !== konfirmasi) {
        showError("Konfirmasi kata sandi tidak cocok.");
        return false;
      }

      showToast("Kata sandi berhasil diubah");
    }
  });
});

/* ===== MODAL KONFIRMASI KELUAR ===== */
document.getElementById("btn-logout").addEventListener("click", () => {
  openModal({
    title: "Yakin keluar dari sesi?",
    desc: "Sesi login Anda pada perangkat ini akan diakhiri dan Anda akan diarahkan ke halaman login.",
    confirmLabel: "Keluar",
    cancelLabel: "Batal",
    danger: true,
    onConfirm: () => {
      window.sessionStorage.clear();
      window.localStorage.removeItem("eoffice_session"); // hapus juga sesi "tetap masuk"
      window.location.href = "../../login.html";
    }
  });
});

/* ===== Inisialisasi ===== */
applyProfile();
