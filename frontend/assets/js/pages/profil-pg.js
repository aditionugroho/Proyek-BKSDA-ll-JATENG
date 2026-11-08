/* ============================================
   PROFIL PEGAWAI — E-Office SKSDA
   Data dari mock/sessionStorage, toggle edit
   email & telepon, modal password, logout
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA PROFIL: diisi loadProfil() — API saat LIVE, mock saat belum ===== */
const PROFILE_MOCK = {
  nama: "Ahmad Susanto, S.Hut.",
  nip: "NIP. 19850412 201012 1 003",
  email: "ahmad.susanto@menlhk.go.id",
  telepon: "+62 812 3456 7890"
};

let PROFILE = {
  nama: "Belum tersedia",
  nip: "Belum tersedia",
  email: "",
  telepon: ""
};

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
      statusAkun: Number(p.status) === 1 ? "Aktif" : "Nonaktif",
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
const emailInput = document.getElementById("pgpr-email");
const teleponInput = document.getElementById("pgpr-telepon");

let editMode = false;

/* ===== ISI DATA AWAL ===== */
function applyProfile() {
  document.getElementById("pgpr-nama").textContent = PROFILE.nama;
  document.getElementById("pgpr-nip").textContent = PROFILE.nip;
  emailInput.value = PROFILE.email;
  teleponInput.value = PROFILE.telepon;
  updateAvatar();

  document.getElementById("pgpr-jabatan").textContent =
    PROFILE.jabatan || "Belum tersedia";

  document.getElementById("pgpr-unit").textContent =
    PROFILE.unit || "Belum tersedia";

  document.getElementById("pgpr-golongan").textContent = "Belum tersedia";

  document.getElementById("pgpr-status").textContent =
    PROFILE.statusAkun || "Belum tersedia";
}

/* Inisial avatar mengikuti profil yang sedang login. */
function updateAvatar() {
  const nama = String(PROFILE.nama || "").trim();

  const inisial = nama
    .replace(/,.*$/, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((kata) => kata.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  document.getElementById("pgpr-avatar").textContent =
    inisial && inisial !== "Belum tersedia" ? inisial : "ST";
}

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
editBtn.addEventListener("click", async () => {
  if (!editMode) {
    setEditMode(true);
    emailInput.focus();
    return;
  }

  const email = emailInput.value.trim();
  const telepon = teleponInput.value.trim();

  const errorEl = document.getElementById("pgpr-email-error");

  if (email && !EMAIL_RE.test(email)) {
    errorEl.textContent = "Format email tidak valid.";
    errorEl.hidden = false;
    return;
  }

  errorEl.hidden = true;

  // Mencegah pengguna menekan Simpan berkali-kali.
  editBtn.disabled = true;

  try {
    if (window.EOfficeAPI?.config?.LIVE) {
      const response = await EOfficeAPI.updateProfil({
        email,
        telepon
      });

      if (response?.status !== true || !response.data) {
        throw new Error(
          response?.message || "Server tidak mengonfirmasi perubahan."
        );
      }

      PROFILE.email = String(response.data.email || "");
      PROFILE.telepon = String(response.data.telepon || "");
    } else {
      PROFILE.email = email;
      PROFILE.telepon = telepon;
    }

    applyProfile();
    setEditMode(false);
    showToast("Profil berhasil diperbarui.");
  } catch (error) {
    console.error("Gagal memperbarui profil:", error);
    showToast(
      error?.message || "Gagal menyimpan profil. Coba kembali."
    );
  } finally {
    editBtn.disabled = false;
  }
});

/* Tombol Batal (mode edit) */
document.getElementById("btn-batal-edit").addEventListener("click", () => {
  emailInput.value = PROFILE.email;
  teleponInput.value = PROFILE.telepon;
  setEditMode(false);
});

/* ===== GANTI PASSWORD DENGAN BACKEND ===== */
document.getElementById("btn-password").addEventListener("click", () => {
  openModal({
    title: "Ganti Password",
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

/* ===== LOGOUT (modal konfirmasi) ===== */
document.getElementById("btn-logout").addEventListener("click", () => {
  openModal({
    title: "Konfirmasi Logout",
    desc: "Sesi Anda akan diakhiri dan Anda akan diarahkan ke halaman login.",
    confirmLabel: "Ya, Logout",
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
    console.error("Gagal memuat profil Staf:", error);

    PROFILE = {
      nama: "Belum tersedia",
      nip: "Belum tersedia",
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
