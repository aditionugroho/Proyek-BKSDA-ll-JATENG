/* ============================================
   PENGATURAN (KEPALA SEKSI) — E-Office SKSDA
   Tab profil/keamanan, foto profil, ganti
   kata sandi (validasi), preferensi notifikasi
   (localStorage)
   ============================================ */

const SETTINGS_KEY = "eoffice_settings_ks";
const PREF_KEYS = [
  "surat-aplikasi", "surat-email",
  "persetujuan-aplikasi", "persetujuan-email",
  "tugas-aplikasi", "tugas-email",
  "jadwal-aplikasi", "jadwal-email"
];

function getPrefs() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"); }
  catch { return null; }
}

function showToast(msg) {
  const toast = document.getElementById("st-toast");
  document.getElementById("st-toast-text").textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ===== Tab profil / keamanan ===== */
const tabProfil = document.getElementById("tab-profil");
const tabKeamanan = document.getElementById("tab-keamanan");
const panelProfil = document.getElementById("panel-profil");
const panelKeamanan = document.getElementById("panel-keamanan");

function switchTab(tab) {
  const isProfil = tab === "profil";
  tabProfil.classList.toggle("active", isProfil);
  tabProfil.setAttribute("aria-selected", String(isProfil));
  tabKeamanan.classList.toggle("active", !isProfil);
  tabKeamanan.setAttribute("aria-selected", String(!isProfil));
  panelProfil.classList.toggle("active", isProfil);
  panelProfil.hidden = !isProfil;
  panelKeamanan.classList.toggle("active", !isProfil);
  panelKeamanan.hidden = isProfil;
}

tabProfil.addEventListener("click", () => switchTab("profil"));
tabKeamanan.addEventListener("click", () => switchTab("keamanan"));

/* ===== Muat preferensi tersimpan ===== */
const saved = getPrefs();
if (saved) {
  PREF_KEYS.forEach((k) => {
    const el = document.querySelector('[data-pref="' + k + '"]');
    if (el && typeof saved[k] === "boolean") el.checked = saved[k];
  });
  if (saved.nama) document.getElementById("st-nama").value = saved.nama;
  if (saved.username) document.getElementById("st-username").value = saved.username;
  if (saved.email) document.getElementById("st-email").value = saved.email;
  if (saved.telepon) document.getElementById("st-telepon").value = saved.telepon;
}

/* ===== Foto profil ===== */
document.getElementById("st-photo-input").addEventListener("change", function() {
  const file = this.files && this.files[0];
  if (!file) return;
  const err = () => showToast("File harus JPG/PNG maksimal 2 MB.");
  if (!/image\/(jpeg|png)/.test(file.type)) return err();
  if (file.size > 2 * 1024 * 1024) return err();

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("st-avatar").innerHTML = '<img src="' + e.target.result + '" alt="Foto profil" />';
    showToast("Foto profil diperbarui.");
  };
  reader.readAsDataURL(file);
});

/* ===== Ganti kata sandi ===== */
document.getElementById("st-btn-pw").addEventListener("click", function() {
  const lama = document.getElementById("st-pw-lama");
  const baru = document.getElementById("st-pw-baru");
  const konf = document.getElementById("st-pw-konfirmasi");
  const err = document.getElementById("st-pw-error");

  const showErr = (msg) => { err.textContent = msg; err.hidden = false; };
  err.hidden = true;

  if (!lama.value) return showErr("Kata sandi saat ini wajib diisi.");
  if (baru.value.length < 8) return showErr("Kata sandi baru minimal 8 karakter.");
  if (!/[A-Z]/.test(baru.value) || !/[a-z]/.test(baru.value) || !/\d/.test(baru.value)) {
    return showErr("Kata sandi baru harus mengandung huruf besar, huruf kecil, dan angka.");
  }
  if (konf.value !== baru.value) return showErr("Konfirmasi kata sandi tidak sama.");

  lama.value = ""; baru.value = ""; konf.value = "";
  showToast("Kata sandi berhasil diubah.");
});

/* ===== Simpan / batal preferensi ===== */
document.getElementById("st-btn-simpan").addEventListener("click", function() {
  const prefs = {
    nama: document.getElementById("st-nama").value.trim(),
    username: document.getElementById("st-username").value.trim(),
    email: document.getElementById("st-email").value.trim(),
    telepon: document.getElementById("st-telepon").value.trim()
  };
  PREF_KEYS.forEach((k) => {
    const el = document.querySelector('[data-pref="' + k + '"]');
    if (el) prefs[k] = el.checked;
  });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
  showToast("Preferensi berhasil disimpan.");
});

document.getElementById("st-btn-batal").addEventListener("click", function() {
  const saved2 = getPrefs();
  PREF_KEYS.forEach((k) => {
    const el = document.querySelector('[data-pref="' + k + '"]');
    if (el) el.checked = saved2 && typeof saved2[k] === "boolean" ? saved2[k] : el.defaultChecked;
  });
  showToast("Perubahan dibatalkan.");
});
