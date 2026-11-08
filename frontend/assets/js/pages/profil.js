/* ============================================
   PROFIL SAYA (KEPALA SEKSI) — E-Office SKSDA
   Toggle edit, field terkunci, ganti password,
   konfirmasi keluar sesi
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA PROFIL: diisi loadProfil() — API saat LIVE, mock saat belum ===== */
const PROFILE_MOCK = {
  nama: "Alex Rivera",
  jabatan: "Kepala Seksi Konservasi Wilayah",
  nip: "198505122010011001",
  unit: "SKSDA Jawa Tengah",
  email: "alex.rivera@SKSDA-jateng.go.id",
  telepon: "0812-3456-7890"
};

let PROFILE = null;

async function loadProfil() {
  if (window.EOfficeAPI?.config?.LIVE) {
    const response = await EOfficeAPI.getProfil();

    if (
      !response ||
      response.status !== true ||
      !response.data ||
      typeof response.data !== "object" ||
      Array.isArray(response.data)
    ) {
      throw new Error(
        response?.message || "Format respons profil tidak sesuai."
      );
    }

    const p = response.data;

    return {
      nama: String(p.nama || "Belum tersedia"),
      jabatan: String(p.jabatan || "Belum tersedia"),
      nip: String(p.nip || "Belum tersedia"),
      unit: String(p.unit || "Belum tersedia"),
      email: String(p.email || ""),
      telepon: String(p.telepon || "")
    };
  }

  return { ...PROFILE_MOCK };
}

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
editBtn.addEventListener("click", async () => {
  if (!editMode) {
    setEditMode(true);
    namaInput.focus();
    return;
  }

  if (editBtn.disabled) return;

  const nama = namaInput.value.trim();
  const email = emailInput.value.trim();
  const telepon = teleponInput.value.trim();

  const namaError = document.getElementById("pf-nama-error");
  const emailError = document.getElementById("pf-email-error");

  let valid = true;

  if (!nama) {
    namaError.hidden = false;
    valid = false;
  } else {
    namaError.hidden = true;
  }

  if (!EMAIL_RE.test(email)) {
    emailError.textContent = "Format email tidak valid";
    emailError.hidden = false;
    valid = false;
  } else {
    emailError.hidden = true;
  }

  if (!valid) return;

  editBtn.disabled = true;
  cancelBtn.disabled = true;

  try {
    if (window.EOfficeAPI?.config?.LIVE) {
      const response = await EOfficeAPI.updateProfil({
        nama,
        email,
        telepon
      });

      if (
        response?.status !== true ||
        !response.data ||
        typeof response.data !== "object"
      ) {
        throw new Error(
          response?.message ||
          "Server tidak mengonfirmasi perubahan profil."
        );
      }

      const p = response.data;

      PROFILE.nama = String(p.nama ?? "");
      PROFILE.email = String(p.email ?? "");
      PROFILE.telepon = String(p.telepon ?? "");
      PROFILE.jabatan = String(p.jabatan || "Belum tersedia");
      PROFILE.nip = String(p.nip || "Belum tersedia");
      PROFILE.unit = String(p.unit || "Belum tersedia");

    } else {
      PROFILE.nama = nama;
      PROFILE.email = email;
      PROFILE.telepon = telepon;
    }

    applyProfile();
    setEditMode(false);

    showToast("Profil berhasil diperbarui.");

  } catch (error) {
    console.error("Gagal menyimpan profil:", error);

    showToast(
      error?.message ||
      "Gagal menyimpan profil. Silakan coba kembali."
    );

    // Tetap dalam mode edit agar data tidak hilang.
  } finally {
    editBtn.disabled = false;
    cancelBtn.disabled = false;
  }
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

/* ===== GANTI PASSWORD DENGAN BACKEND ===== */
document.getElementById("btn-password").addEventListener("click", () => {
  openModal({
    title: "Ubah Kata Sandi",
    desc: "Masukkan password lama dan password baru (8-128 karakter).",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong>Password Lama</strong>
          <input type="password" id="pw-lama" autocomplete="current-password" style="width:100%;padding:10px 12px;border:1px solid #E5E7EB;border-radius:8px" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong>Password Baru</strong>
          <input type="password" id="pw-baru" autocomplete="new-password" style="width:100%;padding:10px 12px;border:1px solid #E5E7EB;border-radius:8px" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong>Konfirmasi Password Baru</strong>
          <input type="password" id="pw-konfirmasi" autocomplete="new-password" style="width:100%;padding:10px 12px;border:1px solid #E5E7EB;border-radius:8px" />
        </div>
        <p id="pw-error" role="alert" style="display:none;margin:0;font-size:12px;color:#DC2626"></p>
      </div>`,
    confirmLabel: "Simpan Password",
    cancelLabel: "Batal",

    onConfirm: async () => {
      const lama = document.getElementById("pw-lama").value;
      const baru = document.getElementById("pw-baru").value;
      const konfirmasi = document.getElementById("pw-konfirmasi").value;
      const errorEl = document.getElementById("pw-error");

      const showError = (message) => {
        errorEl.textContent = message;
        errorEl.style.display = "block";
      };

      errorEl.textContent = "";
      errorEl.style.display = "none";

      if (!lama || !baru || !konfirmasi) {
        showError("Semua field wajib diisi.");
        return false;
      }

      if (baru.length < 8 || baru.length > 128) {
        showError("Password baru harus 8-128 karakter.");
        return false;
      }

      if (baru !== konfirmasi) {
        showError("Konfirmasi password tidak cocok.");
        return false;
      }

      if (lama === baru) {
        showError("Password baru harus berbeda dari password lama.");
        return false;
      }

      if (!window.EOfficeAPI?.config?.LIVE) {
        showError("Ganti password memerlukan koneksi backend aktif.");
        return false;
      }

      try {
        const response = await EOfficeAPI.gantiKataSandi(lama, baru);

        if (response?.status !== true) {
          throw new Error(
            response?.message || "Server tidak mengonfirmasi perubahan."
          );
        }

        // Backend sudah mencabut semua token setelah password berubah.
        // Bersihkan sesi lokal dan arahkan pengguna untuk login ulang.
        await EOfficeAPI.logout();

        window.location.href = "../../login.html";
        return true;
      } catch (error) {
        console.error("Ganti password gagal:", error);
        showError(
          error?.message || "Gagal mengubah password. Coba kembali."
        );
        return false;
      }
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
      if (window.EOfficeAPI) {
        EOfficeAPI.logout().finally(() => {
          window.location.href = "../../login.html";
        });
      } else {
        window.sessionStorage.clear();
        window.localStorage.removeItem("eoffice_session");
        window.location.href = "../../login.html";
      }
    }
  });
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  try {
    PROFILE = await loadProfil();
  } catch (error) {
    console.error("Gagal memuat profil Kepala Seksi:", error);

    PROFILE = {
      nama: "Belum tersedia",
      jabatan: "Belum tersedia",
      nip: "Belum tersedia",
      unit: "Belum tersedia",
      email: "",
      telepon: ""
    };

    editBtn.disabled = true;
    document.getElementById("btn-password").disabled = true;
    showToast("Profil gagal dimuat. Periksa koneksi atau login ulang.");
  }

  applyProfile();
}

init();
