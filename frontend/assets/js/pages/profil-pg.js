/* ============================================
   PROFIL PEGAWAI — E-Office SKSDA
   Data dari mock/sessionStorage, toggle edit
   email & telepon, modal password, logout
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA PROFIL (mock — bisa diganti sessionStorage/API) ===== */
const PROFILE = {
  nama: "Ahmad Susanto, S.Hut.",
  nip: "NIP. 19850412 201012 1 003",
  email: "ahmad.susanto@menlhk.go.id",
  telepon: "+62 812 3456 7890"
};

/* Nama dari sesi login (bila ada) */
try {
  const session = JSON.parse(window.sessionStorage.getItem("eoffice_session") || "null");
  if (session?.userId) {
    PROFILE.nama = session.userId
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
} catch {
  /* abaikan */
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ===== Elemen ===== */
const editBtn = document.getElementById("btn-edit");
const editBtnLabel = document.getElementById("btn-edit-label");
const emailInput = document.getElementById("pgpr-email");
const teleponInput = document.getElementById("pgpr-telepon");

let editMode = false;

/* ===== ISI DATA AWAL ===== */
function applyProfile() {
  document.getElementById("pgpr-nama").textContent = PROFILE.nama;
  document.getElementById("pgpr-nip").textContent = PROFILE.nip;
  emailInput.value = PROFILE.email;
  teleponInput.value = PROFILE.telepon;
}

/* Inisial avatar dari nama */
(function initAvatar() {
  const inisial = PROFILE.nama
    .replace(/,.*$/, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  document.getElementById("pgpr-avatar").textContent = inisial || "ST";
})();

/* ===== MODE EDIT (email & telepon saja) ===== */
function setEditMode(on) {
  editMode = on;
  [emailInput, teleponInput].forEach((input) => {
    input.readOnly = !on;
    input.closest(".pgpr-kontak-row").classList.toggle("is-editing", on);
  });
  editBtnLabel.textContent = on ? "Simpan" : "Edit Profil";
  document.getElementById("btn-batal-edit").hidden = !on;
  document.getElementById("pgpr-email-error").hidden = true;
}

/* Tombol Edit / Simpan */
editBtn.addEventListener("click", () => {
  if (!editMode) {
    setEditMode(true);
    emailInput.focus();
    return;
  }

  // Simpan: validasi email
  if (!EMAIL_RE.test(emailInput.value.trim())) {
    document.getElementById("pgpr-email-error").hidden = false;
    return;
  }

  PROFILE.email = emailInput.value.trim();
  PROFILE.telepon = teleponInput.value.trim();
  setEditMode(false);
  showToast("Profil diperbarui");
});

/* Tombol Batal (mode edit) */
document.getElementById("btn-batal-edit").addEventListener("click", () => {
  emailInput.value = PROFILE.email;
  teleponInput.value = PROFILE.telepon;
  setEditMode(false);
});

/* ===== GANTI PASSWORD (modal + validasi) ===== */
document.getElementById("btn-password").addEventListener("click", () => {
  openModal({
    title: "Ganti Password",
    desc: "Masukkan password lama dan password baru (minimal 8 karakter).",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Password Lama</strong>
          <input type="password" id="pw-lama" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Password Baru</strong>
          <input type="password" id="pw-baru" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Konfirmasi Password Baru</strong>
          <input type="password" id="pw-konfirmasi" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <p id="pw-error" style="display:none;margin:0;font-size:12px;color:#DC2626"></p>
      </div>`,
    confirmLabel: "Simpan Password",
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
        showError("Password baru minimal 8 karakter.");
        return false;
      }
      if (baru !== konfirmasi) {
        showError("Konfirmasi password tidak cocok.");
        return false;
      }

      showToast("Password berhasil diubah");
    }
  });
});

/* ===== LOGOUT (modal konfirmasi) ===== */
document.getElementById("btn-logout").addEventListener("click", () => {
  openModal({
    title: "Konfirmasi Logout",
    desc: "Sesi Anda akan diakhiri dan Anda akan diarahkan ke halaman login.",
    confirmLabel: "Ya, Logout",
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
