/* ============================================
   DATA PROFIL ADMIN (BERSAMA) — E-Office SKSDA
   Dipakai oleh profil-admin.js dan
   edit-profil-admin.js agar data konsisten.
   Nanti tinggal diganti fetch API.
   ============================================ */

export const ADMIN_PROFILE = {
  /* Identitas utama */
  nama: "Admin Sistem",
  jabatan: "Administrator Utama Sistem e-Office",
  username: "admin.SKSDA",
  roleKedinasan: "Administrator (Super Administrator - Wilayah I)",
  unitKerja: "Seksi Konservasi Sumber Daya Alam Jawa Tengah - Kantor Pusat Semarang",
  email: "admin@SKSDA-jateng.go.id",
  telepon: "0812-3456-7890",
  idAkun: "ADM-SKSDA-001",
  avatarInisial: "AS",
  avatarUrl: null,

  /* Hero profil */
  statusPill: "Akun Aktif",
  roleOtoritas: "Super Administrator",
  terakhirLogin: "Hari Ini, 08:12 WIB",
  meta: [
    { icon: "building", text: "SKSDA Jawa Tengah" },
    { icon: "mail", text: "admin@SKSDA-jateng.go.id" },
    { icon: "phone", text: "08xx-xxxx-xxxx" }
  ],

  /* Grid informasi akun */
  info: [
    { label: "Nama Lengkap", value: "Admin Sistem" },
    { label: "Username", value: "admin.SKSDA", mono: true },
    { label: "Role Akun", value: "Administrator", tone: "blue" },
    { label: "Unit Kerja", value: "SKSDA Jawa Tengah" },
    { label: "Status Akun", value: "Aktif", tone: "green", dot: true },
    { label: "Email Kedinasan", value: "admin@SKSDA-jateng.go.id" },
    { label: "Nomor Telepon", value: "08xx-xxxx-xxxx" },
    { label: "Tanggal Dibuat", value: "01 Januari 2026" }
  ],
  terakhirDiperbarui: "13 September 2026",
  tanggalTerdaftar: "01 Januari 2026",
  terakhirDiperbaruiDetail: "13 Sep 2026, 16:30 WIB",

  /* Hak akses */
  akses: [
    "Manajemen Data Pengguna",
    "Input Surat",
    "Export Data & Laporan",
    "Backup Data",
    "Melihat Audit Trail",
    "Mengelola Data Sistem"
  ],

  /* Aktivitas terbaru */
  aktivitas: [
    {
      icon: "logIn",
      tone: "green",
      title: "Login berhasil",
      time: "16 Sep 2026 \u2014 08:12",
      badge: { text: "Sukses", tone: "green" },
      detail: "Sesi aktif dari Windows Desktop (Chrome Browser) di Kantor Pusat SKSDA Jateng."
    },
    {
      icon: "export",
      tone: "blue",
      title: "Export laporan surat keluar",
      time: "15 Sep 2026 \u2014 15:42",
      badge: { text: "Export", tone: "blue" },
      detail: "Rekapitulasi berkas korespondensi dinas periode September 2026 (format XLSX)."
    },
    {
      icon: "mail",
      tone: "blue",
      title: "Melakukan registrasi surat keluar",
      time: "15 Sep 2026 \u2014 14:20",
      badge: { text: "Surat", tone: "blue" },
      detail: "Nomor agenda dinas SKSDA-SK/2026/09-142 tujuan Dinas LHK Jateng."
    },
    {
      icon: "database",
      tone: "purple",
      title: "Melakukan backup data",
      time: "14 Sep 2026 \u2014 09:05",
      badge: { text: "Backup", tone: "purple" },
      detail: "Snapshot arsip database sistem (BKP-2026-09-14-0905, 2.3 GB)."
    },
    {
      icon: "user",
      tone: "orange",
      title: "Mengubah informasi pengguna",
      time: "13 Sep 2026 \u2014 16:30",
      badge: { text: "Pengguna", tone: "orange" },
      detail: "Pembaruan jabatan dan unit kerja staf Seksi Konservasi Wilayah I."
    }
  ],

  /* Informasi login */
  loginInfo: [
    { label: "Login Terakhir", value: "16 Sep 2026, 08:12 WIB", bold: true },
    { label: "Perangkat", value: "Windows Desktop", icon: "laptop" },
    { label: "Browser", value: "Chrome v128" },
    { label: "Status Autentikasi", badge: { text: "Berhasil", tone: "green" } },
    { label: "Sesi Saat Ini", value: "Aktif", green: true, dot: true }
  ]
};
