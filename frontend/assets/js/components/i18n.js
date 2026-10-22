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
    "tentang.text": "Seksi Konservasi Sumber Daya Alam (SKSDA) SKW II Pemalang memiliki tugas melaksanakan konservasi sumber daya alam hayati dan ekosistemnya di wilayah kerja Seksi Konservasi Wilayah II Pemalang secara profesional dan berintegritas.",

    /* Footer */
    "footer.ketentuan": "KETENTUAN LAYANAN",
    "footer.privasi": "KEBIJAKAN PRIVASI",
    "footer.aksesibilitas": "AKSESIBILITAS",
    "footer.copy": "© 2026 Lembaga Pemerintah Digital. Seluruh hak cipta dilindungi undang-undang.",

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
    "login.helpLink": "Hubungi Dukungan IT",
    "login.pending": "Akun Anda sedang menunggu verifikasi Admin.",
    "login.rejected": "Pendaftaran akun Anda ditolak Admin.",
    "login.wrongPw": "ID pengguna atau kata sandi salah.",
    "login.already": "Anda sudah masuk sebagai",
    "login.continue": "Lanjut ke Dashboard",
    "login.showPw": "Tampilkan kata sandi",

    /* Halaman registrasi */
    "title.reg": "Buat Akun — E-Office SKSDA Wilayah II Pemalang",
    "reg.title": "Buat Akun Baru",
    "reg.subtitle": "Daftarkan akun untuk akses portal resmi Anda",
    "reg.step1": "Data Diri",
    "reg.step2": "Keamanan",
    "reg.step3": "Konfirmasi",
    "reg.nama": "Nama Lengkap",
    "reg.nama.ph": "Masukkan nama lengkap Anda",
    "reg.idemail": "ID Resmi / Email",
    "reg.idemail.ph": "Masukkan ID resmi atau email",
    "reg.role": "Role",
    "reg.sum.role": "Role",
    "reg.password": "Kata Sandi",
    "reg.password.ph": "Buat kata sandi",
    "reg.konfirmasi": "Konfirmasi Kata Sandi",
    "reg.konfirmasi.ph": "Ulangi kata sandi",
    "reg.next": "Lanjut",
    "reg.back": "Kembali",
    "reg.submit": "Buat Akun",
    "reg.processing": "Memproses…",
    "reg.err.required": "Wajib diisi",
    "reg.err.min6": "Minimal 6 karakter",
    "reg.err.match": "Kata sandi tidak sama",
    "reg.err.terms": "Centang persetujuan untuk melanjutkan",
    "reg.strength": "Kekuatan sandi",
    "reg.strength.0": "Lemah",
    "reg.strength.1": "Cukup",
    "reg.strength.2": "Kuat",
    "reg.strength.3": "Sangat Kuat",
    "reg.terms.pre": "Saya menyetujui",
    "reg.terms.link": "syarat dan ketentuan",
    "reg.terms.post": "dan memastikan data di atas benar",
    "reg.sum.nama": "Nama Lengkap",
    "reg.sum.id": "ID Resmi / Email",
    "reg.sum.pass": "Kata Sandi",
    "reg.success.title": "Akun Berhasil Didaftarkan!",
    "reg.success.desc": "Registrasi Anda akan diverifikasi oleh Admin terlebih dahulu. Setelah disetujui, Anda bisa langsung masuk kapan saja tanpa verifikasi ulang.",
    "reg.success.count.pre": "Mengalihkan ke halaman masuk dalam",
    "reg.success.count.post": "detik…",
    "reg.success.link": "Masuk sekarang",
    "reg.badge.data": "Data Dilindungi",
    "reg.has.account": "Sudah punya akun?",
    "reg.login": "Masuk",
    "reg.footer.copy": "© 2026 SKSDA Wilayah II Pemalang. Semua hak cipta dilindungi.",
    "reg.footer.sub": "Seksi Konservasi Sumber Daya Alam | SKSDA Wilayah II Pemalang",

    /* Halaman lupa password */
    "forgot.title": "LUPA PASSWORD?",
    "forgot.sub": "Tenang, kami siap membantu.",
    "forgot.step1": "Pilih Metode",
    "forgot.step2": "Verifikasi OTP",
    "forgot.step3": "Buat Password Baru",
    "forgot.gmail.title": "Pilih Akun Gmail",
    "forgot.gmail.desc": "Pilih Gmail yang terdaftar pada akun Anda. Kami akan mengirimkan kode verifikasi untuk mereset kata sandi.",
    "forgot.other": "Gunakan akun lain",
    "forgot.other.ph": "Masukkan email kedinasan Anda",
    "forgot.send": "Kirim Kode OTP ke Email",
    "forgot.otp.title": "Verifikasi Kode OTP",
    "forgot.otp.desc": "Kami telah mengirimkan 6 digit kode keamanan ke akun Gmail kedinasan Anda untuk memvalidasi akses e-Office.",
    "forgot.otp.hint": "Kode OTP terdiri dari 6 digit dan berlaku 5 menit.",
    "forgot.otp.expire": "Kode akan kedaluwarsa dalam",
    "forgot.resend": "Kirim ulang kode ke Gmail",
    "forgot.verify": "Verifikasi OTP",
    "forgot.new.title": "Buat Password Baru",
    "forgot.new.pass": "Kata Sandi Baru",
    "forgot.new.confirm": "Konfirmasi Kata Sandi",
    "forgot.new.hint": "Gunakan minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka.",
    "forgot.save": "Simpan Password Baru",
    "forgot.back.login": "Kembali ke Login",
    "forgot.back.verify": "Kembali ke Mode Verifikasi",
    "forgot.secure": "Layanan Reset Mandiri Terenkripsi End-to-End",
    "forgot.ssl": "Keamanan akun terlindungi dengan enkripsi SSL 256-bit",
    "forgot.demo": "Mode demo — kode OTP Anda",
    "forgot.success": "Password berhasil diubah! Mengalihkan ke halaman masuk…",
    "forgot.err.otp": "Kode OTP salah.",
    "forgot.err.email": "Masukkan email yang valid.",
    "forgot.err.pass": "Minimal 8 karakter.",
    "forgot.err.match": "Konfirmasi kata sandi tidak sama."
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
    "tentang.text": "The Natural Resources Conservation Agency (SKSDA) SKW II Pemalang is responsible for conserving biological natural resources and their ecosystems in the working area of Conservation Section II Pemalang in a professional and integrous manner.",

    /* Footer */
    "footer.ketentuan": "TERMS OF SERVICE",
    "footer.privasi": "PRIVACY POLICY",
    "footer.aksesibilitas": "ACCESSIBILITY",
    "footer.copy": "© 2026 Digital Government Agency. All rights reserved.",

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
    "login.helpLink": "Contact IT Support",
    "login.pending": "Your account is awaiting admin verification.",
    "login.rejected": "Your account registration was rejected by the Admin.",
    "login.wrongPw": "Incorrect user ID or password.",
    "login.already": "You are already signed in as",
    "login.continue": "Go to Dashboard",
    "login.showPw": "Show password",

    /* Registration page */
    "title.reg": "Create Account — E-Office SKSDA Wilayah II Pemalang",
    "reg.title": "Create a New Account",
    "reg.subtitle": "Register an account for your official portal access",
    "reg.step1": "Identity",
    "reg.step2": "Security",
    "reg.step3": "Confirm",
    "reg.nama": "Full Name",
    "reg.nama.ph": "Enter your full name",
    "reg.idemail": "Official ID / Email",
    "reg.idemail.ph": "Enter your official ID or email",
    "reg.role": "Role",
    "reg.sum.role": "Role",
    "reg.password": "Password",
    "reg.password.ph": "Create a password",
    "reg.konfirmasi": "Confirm Password",
    "reg.konfirmasi.ph": "Repeat your password",
    "reg.next": "Next",
    "reg.back": "Back",
    "reg.submit": "Create Account",
    "reg.processing": "Processing…",
    "reg.err.required": "Required",
    "reg.err.min6": "Minimum 6 characters",
    "reg.err.match": "Passwords do not match",
    "reg.err.terms": "Please accept the terms to continue",
    "reg.strength": "Password strength",
    "reg.strength.0": "Weak",
    "reg.strength.1": "Fair",
    "reg.strength.2": "Strong",
    "reg.strength.3": "Very Strong",
    "reg.terms.pre": "I agree to the",
    "reg.terms.link": "terms and conditions",
    "reg.terms.post": "and confirm the data above is correct",
    "reg.sum.nama": "Full Name",
    "reg.sum.id": "Official ID / Email",
    "reg.sum.pass": "Password",
    "reg.success.title": "Registration Successful!",
    "reg.success.desc": "Your registration will be verified by the Admin first. Once approved, you can sign in anytime without further verification.",
    "reg.success.count.pre": "Redirecting to the sign-in page in",
    "reg.success.count.post": "seconds…",
    "reg.success.link": "Sign in now",
    "reg.badge.data": "Data Protected",
    "reg.has.account": "Already have an account?",
    "reg.login": "Sign in",
    "reg.footer.copy": "© 2026 SKSDA Wilayah II Pemalang. All rights reserved.",
    "reg.footer.sub": "Natural Resources Conservation Section | SKSDA Wilayah II Pemalang",

    /* Forgot password page */
    "forgot.title": "FORGOT PASSWORD?",
    "forgot.sub": "Don't worry, we're here to help.",
    "forgot.step1": "Choose Method",
    "forgot.step2": "OTP Verification",
    "forgot.step3": "Create New Password",
    "forgot.gmail.title": "Select Gmail Account",
    "forgot.gmail.desc": "Choose the Gmail registered to your account. We will send a verification code to reset your password.",
    "forgot.other": "Use another account",
    "forgot.other.ph": "Enter your official email",
    "forgot.send": "Send OTP Code to Email",
    "forgot.otp.title": "Verify OTP Code",
    "forgot.otp.desc": "We have sent a 6-digit security code to your official Gmail account to validate e-Office access.",
    "forgot.otp.hint": "The OTP code consists of 6 digits and is valid for 5 minutes.",
    "forgot.otp.expire": "Code expires in",
    "forgot.resend": "Resend code to Gmail",
    "forgot.verify": "Verify OTP",
    "forgot.new.title": "Create New Password",
    "forgot.new.pass": "New Password",
    "forgot.new.confirm": "Confirm Password",
    "forgot.new.hint": "Use at least 8 characters with a combination of uppercase, lowercase, and numbers.",
    "forgot.save": "Save New Password",
    "forgot.back.login": "Back to Login",
    "forgot.back.verify": "Back to Verification",
    "forgot.secure": "End-to-End Encrypted Self-Service Reset",
    "forgot.ssl": "Account security protected with 256-bit SSL encryption",
    "forgot.demo": "Demo mode — your OTP code",
    "forgot.success": "Password changed successfully! Redirecting to sign-in…",
    "forgot.err.otp": "Incorrect OTP code.",
    "forgot.err.email": "Enter a valid email.",
    "forgot.err.pass": "Minimum 8 characters.",
    "forgot.err.match": "Password confirmation doesn't match."
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
