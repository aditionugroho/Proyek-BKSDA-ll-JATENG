/* ============================================
   I18N — dua bahasa (id / en)
   Cara pakai:
   - Tandai elemen dengan data-i18n="kunci"
   - Placeholder: data-i18n-placeholder="kunci"
   - Judul dokumen: <title data-i18n-title="kunci">
   - Bahasa tersimpan di localStorage (eoffice_lang)
   ============================================ */

const I18N = {
  id: {
    "title.index": "E-Office SKSDA Wilayah II Pemalang",
    "title.login": "Masuk — E-Office SKSDA Wilayah II Pemalang",

    /* Navbar */
    "nav.subtitle": "SEKSI KONSERVASI SUMBER DAYA ALAM",
    "nav.beranda": "BERANDA",
    "nav.visi": "VISI & MISI",
    "nav.profil": "PROFIL",
    "nav.kontak": "CONTACT",

    /* Dropdown login */
    "login.as": "MASUK SEBAGAI",
    "role.dd.admin": "ADMIN",
    "role.dd.kepala-seksi": "KEPALA SEKSI",
    "role.dd.pegawai": "STAFF/PEGAWAI",
    "role.opt.kepala-seksi": "Kepala Seksi",
    "role.opt.pegawai": "Staff",

    /* Hero */
    "hero.desc": "Sistem informasi manajemen surat menyurat dan administrasi perkantoran untuk mendukung tata kelola yang efektif, efisien, dan transparan.",

    /* Kartu fitur */
    "fitur.surat.title": "Pengelolaan Surat",
    "fitur.surat.desc": "Kelola surat masuk, surat keluar, dan disposisi dengan mudah dan terstruktur.",
    "fitur.jadwal.title": "Jadwal Kegiatan",
    "fitur.jadwal.desc": "Pantau jadwal kegiatan dan agenda penting secara terorganisir dan terupdate.",
    "fitur.laporan.title": "Laporan & Arsip",
    "fitur.laporan.desc": "Hasilkan laporan dan kelola arsip dokumen untuk kebutuhan administrasi.",

    /* Tentang kami */
    "tentang.title": "Tentang Kami",
    "tentang.text": "Balai Konservasi Sumber Daya Alam (BKSDA) SKW II Pemalang memiliki tugas melaksanakan konservasi sumber daya alam hayati dan ekosistemnya di wilayah kerja Seksi Konservasi Wilayah II Pemalang secara profesional dan berintegritas.",

    /* Footer */
    "footer.ketentuan": "KETENTUAN LAYANAN",
    "footer.privasi": "KEBIJAKAN PRIVASI",
    "footer.aksesibilitas": "AKSESIBILITAS",
    "footer.copy": "© 2024 Lembaga Pemerintah Digital. Seluruh hak cipta dilindungi undang-undang.",

    /* Halaman login */
    "login.title": "Selamat Datang Kembali",
    "login.subtitle": "Akses aman ke ruang kerja resmi Anda",
    "login.userId": "ID Pengguna",
    "login.userId.ph": "Masukkan ID resmi Anda",
    "login.password": "Kata Sandi",
    "login.password.ph": "Masukkan kata sandi Anda",
    "login.forgot": "Lupa kata sandi?",
    "login.role": "Role",
    "login.remember": "Tetap masuk di perangkat ini",
    "login.submit": "Masuk ke Portal",
    "login.processing": "Memproses…",
    "login.error": "Wajib diisi",
    "badge.ssl": "Koneksi SSL Aman",
    "badge.personel": "Hanya untuk Personel Resmi",
    "login.help": "Butuh bantuan teknis?",
    "login.helpLink": "Hubungi Dukungan IT"
  },
  en: {
    "title.index": "E-Office SKSDA Wilayah II Pemalang",
    "title.login": "Sign in — E-Office SKSDA Wilayah II Pemalang",

    /* Navbar */
    "nav.subtitle": "NATURAL RESOURCES CONSERVATION SECTION",
    "nav.beranda": "HOME",
    "nav.visi": "VISION & MISSION",
    "nav.profil": "PROFILE",
    "nav.kontak": "CONTACT",

    /* Login dropdown */
    "login.as": "SIGN IN AS",
    "role.dd.admin": "ADMIN",
    "role.dd.kepala-seksi": "SECTION HEAD",
    "role.dd.pegawai": "STAFF",
    "role.opt.kepala-seksi": "Section Head",
    "role.opt.pegawai": "Staff",

    /* Hero */
    "hero.desc": "A correspondence management and office administration information system to support effective, efficient, and transparent governance.",

    /* Feature cards */
    "fitur.surat.title": "Mail Management",
    "fitur.surat.desc": "Manage incoming mail, outgoing mail, and dispositions easily and in a structured way.",
    "fitur.jadwal.title": "Activity Schedule",
    "fitur.jadwal.desc": "Monitor activity schedules and important agendas in an organized and up-to-date manner.",
    "fitur.laporan.title": "Reports & Archives",
    "fitur.laporan.desc": "Generate reports and manage document archives for administrative needs.",

    /* About us */
    "tentang.title": "About Us",
    "tentang.text": "The Natural Resources Conservation Agency (BKSDA) SKW II Pemalang is responsible for conserving biological natural resources and their ecosystems in the working area of Conservation Section II Pemalang in a professional and integrous manner.",

    /* Footer */
    "footer.ketentuan": "TERMS OF SERVICE",
    "footer.privasi": "PRIVACY POLICY",
    "footer.aksesibilitas": "ACCESSIBILITY",
    "footer.copy": "© 2024 Digital Government Agency. All rights reserved.",

    /* Login page */
    "login.title": "Welcome Back",
    "login.subtitle": "Secure access to your official workspace",
    "login.userId": "User ID",
    "login.userId.ph": "Enter your official ID",
    "login.password": "Password",
    "login.password.ph": "Enter your password",
    "login.forgot": "Forgot password?",
    "login.role": "Role",
    "login.remember": "Stay signed in on this device",
    "login.submit": "Sign in to Portal",
    "login.processing": "Processing…",
    "login.error": "Required",
    "badge.ssl": "Secure SSL Connection",
    "badge.personel": "Official Personnel Only",
    "login.help": "Need technical help?",
    "login.helpLink": "Contact IT Support"
  }
};

const LANG_KEY = "eoffice_lang";
const LANG_NAMES = { id: "Bahasa Indonesia", en: "English (US)" };

/* Bahasa aktif (default: Indonesia) */
function getLang() {
  const saved = window.localStorage.getItem(LANG_KEY);
  return saved === "en" || saved === "id" ? saved : "id";
}

/* Terapkan bahasa ke seluruh elemen ber-i18n */
function applyLang() {
  const lang = getLang();
  const dict = I18N[lang];

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
  });

  const titleEl = document.querySelector("title[data-i18n-title]");
  if (titleEl && dict[titleEl.getAttribute("data-i18n-title")]) {
    document.title = dict[titleEl.getAttribute("data-i18n-title")];
  }

  /* Label tombol switcher + tanda aktif pada pilihan */
  document.querySelectorAll("[data-lang-label]").forEach((el) => {
    el.textContent = LANG_NAMES[lang];
  });
  document.querySelectorAll("[data-setlang]").forEach((btn) => {
    const active = btn.getAttribute("data-setlang") === lang;
    const check = btn.querySelector("[data-lang-check]");
    if (check) check.style.display = active ? "block" : "none";
    btn.classList.toggle("text-blue-600", active);
    btn.classList.toggle("text-slate-700", !active);
  });
}

/* Ganti bahasa + simpan preferensi */
function setLang(lang) {
  if (lang !== "id" && lang !== "en") return;
  window.localStorage.setItem(LANG_KEY, lang);
  applyLang();
}

document.addEventListener("DOMContentLoaded", applyLang);

/* ===== Dropdown pemilih bahasa (di navbar) ===== */
const langWrapper = document.getElementById("lang-wrapper");
const langToggle = document.getElementById("lang-toggle");
const langDropdown = document.getElementById("lang-dropdown");
const langChevron = document.getElementById("lang-chevron");

let langOpen = false;

function setLangDropdown(open) {
  langOpen = open;
  langDropdown.classList.toggle("opacity-0", !open);
  langDropdown.classList.toggle("scale-95", !open);
  langDropdown.classList.toggle("pointer-events-none", !open);
  langToggle.setAttribute("aria-expanded", String(open));
  langChevron.style.transform = open ? "rotate(180deg)" : "";
}

if (langWrapper && langToggle && langDropdown) {
  langToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setLangDropdown(!langOpen);
  });

  document.querySelectorAll("[data-setlang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLang(btn.getAttribute("data-setlang"));
      setLangDropdown(false);
    });
  });

  document.addEventListener("click", (event) => {
    if (langOpen && !langWrapper.contains(event.target)) setLangDropdown(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && langOpen) setLangDropdown(false);
  });
}
