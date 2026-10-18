/* ============================================
   DATA NOTIFIKASI (BERSAMA) — E-Office SKSDA
   Dipakai oleh notifikasi.js. Siap diganti API.
   ============================================ */

export const TOTAL_NOTIF_MOCK = 12;

export const notifData = [
  {
    id: 1,
    kategori: "Surat",
    tipe: "suratMasukBaru",
    badges: [
      { text: "SURAT MASUK", tone: "blue" },
      { text: "\u2022 PRIORITAS TINGGI", tone: "red" }
    ],
    judul: "Surat masuk baru",
    teks: "Surat S.892/K.21/TU/KSA/10/2023 perihal Permohonan Data Kawasan Konservasi Gunung Merbabu telah diterima dan menunggu disposisi Kepala Seksi.",
    meta: "Pengirim: Ditjen KSDAE",
    waktu: "Hari ini, 09:15 WIB",
    unread: true,
    penting: true,
    aksi: { label: "Lihat Surat", href: "detail-surat-masuk.html?id=5", style: "blue", icon: "arrowRight" }
  },
  {
    id: 2,
    kategori: "Disposisi",
    tipe: "disposisiSelesai",
    badges: [{ text: "DISPOSISI SELESAI", tone: "indigo" }],
    judul: "Disposisi selesai",
    teks: "Andi Pratama, S.Hut telah menyelesaikan disposisi terkait verifikasi batas cagar alam Guci dan mengunggah dokumen telaah teknis.",
    meta: "Pelaksana: Andi Pratama",
    waktu: "Hari ini, 08:42 WIB",
    unread: true,
    penting: false,
    aksi: { label: "Lihat Disposisi", href: "disposisi.html", style: "outline", icon: "arrowUpRight" }
  },
  {
    id: 3,
    kategori: "Tugas",
    tipe: "tugasReview",
    badges: [
      { text: "TUGAS SEKSI", tone: "orange" },
      { text: "BUTUH REVIEW", tone: "amber" }
    ],
    judul: "Tugas menunggu review",
    teks: "Laporan Patroli Kawasan Cagar Alam telah dikirim oleh Budi Santoso dan menunggu review & persetujuan Anda.",
    meta: "Target: Triwulan III",
    waktu: "Kemarin, 16:20 WIB",
    unread: true,
    penting: true,
    aksi: { label: "Review Tugas", href: "tugas-seksi.html", style: "blue", icon: "square" }
  },
  {
    id: 4,
    kategori: "Surat",
    tipe: "suratKeluar",
    badges: [
      { text: "SURAT KELUAR", tone: "blue" },
      { text: "MENUNGGU TTE", tone: "blueSoft" }
    ],
    judul: "Surat keluar menunggu persetujuan",
    teks: "Surat undangan koordinasi teknis (Nomor draft B.124/K.21/TU/10/2023) telah selesai diformulasi dan menunggu paraf/persetujuan TTE Kepala Seksi.",
    meta: "Konseptor: Rina Wulandari",
    waktu: "Kemarin, 14:30 WIB",
    unread: true,
    penting: false,
    aksi: { label: "Review Surat", href: "surat-keluar.html", style: "outline", icon: "edit" }
  },
  {
    id: 5,
    kategori: "Jadwal",
    tipe: "jadwal",
    badges: [{ text: "JADWAL DINAS", tone: "green" }],
    judul: "Pengingat jadwal kegiatan",
    teks: "Rapat koordinasi seksi evaluasi progres triwulan III akan dilaksanakan hari ini pukul 13:00 - 15:00 WIB di Ruang Rapat Lt. 2.",
    meta: "Penyelenggara: Sekretariat Balai",
    waktu: "Hari ini, 07:00 WIB",
    unread: true,
    penting: false,
    aksi: { label: "Lihat Jadwal", href: "jadwal.html", style: "outline", icon: "calendar" }
  },
  {
    id: 6,
    kategori: "Surat",
    tipe: "arsipRead",
    badges: [{ text: "SURAT MASUK", tone: "gray" }],
    judul: "Surat Edaran Pembinaan ASN",
    teks: "Surat edaran penetapan hari libur dan cuti bersama tahun 2026 telah diarsipkan ke dalam sistem korespondensi.",
    meta: "2 hari yang lalu \u2022 Bagian Umum & Kepegawaian",
    waktu: "14 Sep 2026, 11:20 WIB",
    unread: false,
    penting: false,
    aksi: { label: "Lihat Arsip Surat", href: "arsip.html", style: "gray", icon: "archive" }
  },
  {
    id: 7,
    kategori: "Sistem",
    tipe: "sistemRead",
    badges: [{ text: "SISTEM & ARSIP", tone: "greenSoft" }],
    judul: "Sinkronisasi Berkas Berhasil",
    teks: "Pencadangan data otomatis mingguan dan sinkronisasi arsip digital seksi telah sukses dieksekusi oleh server sentral e-Office.",
    meta: "3 hari yang lalu \u2022 Sistem Otomatisasi Balai",
    waktu: "13 Sep 2026, 02:00 WIB",
    unread: false,
    penting: false,
    aksi: { label: "Log Aktivitas", href: null, style: "gray", icon: "refresh" }
  },

  /* Pengisi hingga total 12 (READ) */
  {
    id: 8,
    kategori: "Tugas",
    tipe: "tugasRead",
    badges: [{ text: "TUGAS SEKSI", tone: "gray" }],
    judul: "Catatan revisi tugas ditambahkan",
    teks: "Catatan revisi tugas monitoring kegiatan lapangan telah diperbarui oleh pelaksana.",
    meta: "11 Sep 2026 \u2022 Maya Indrawati",
    waktu: "11 Sep 2026, 10:05 WIB",
    unread: false,
    penting: false,
    aksi: { label: "Lihat Tugas", href: "tugas-seksi.html", style: "gray", icon: "square" }
  },
  {
    id: 9,
    kategori: "Surat",
    tipe: "arsipRead",
    badges: [{ text: "SURAT MASUK", tone: "gray" }],
    judul: "Berkas surat diarsipkan",
    teks: "Berkas fisis telah diterima dan dicocokkan dengan salinan digital pada arsip korespondensi.",
    meta: "10 Sep 2026 \u2022 Ruang Administrasi",
    waktu: "10 Sep 2026, 14:40 WIB",
    unread: false,
    penting: false,
    aksi: { label: "Lihat Arsip Surat", href: "arsip.html", style: "gray", icon: "archive" }
  },
  {
    id: 10,
    kategori: "Jadwal",
    tipe: "jadwalRead",
    badges: [{ text: "JADWAL DINAS", tone: "gray" }],
    judul: "Perubahan ruang rapat",
    teks: "Rapat evaluasi bulanan dipindahkan ke Ruang Rapat Lt. 1 menyusul ketersediaan ruangan.",
    meta: "10 Sep 2026 \u2022 Sekretariat Balai",
    waktu: "10 Sep 2026, 08:15 WIB",
    unread: false,
    penting: false,
    aksi: { label: "Lihat Jadwal", href: "jadwal.html", style: "gray", icon: "calendar" }
  },
  {
    id: 11,
    kategori: "Disposisi",
    tipe: "disposisiRead",
    badges: [{ text: "DISPOSISI", tone: "gray" }],
    judul: "Disposisi diteruskan ke staf",
    teks: "Disposisi surat koordinasi batas kawasan telah diteruskan kepada pelaksana terkait.",
    meta: "09 Sep 2026 \u2022 Sekretariat Seksi",
    waktu: "09 Sep 2026, 13:22 WIB",
    unread: false,
    penting: false,
    aksi: { label: "Lihat Disposisi", href: "disposisi.html", style: "gray", icon: "arrowUpRight" }
  },
  {
    id: 12,
    kategori: "Sistem",
    tipe: "sistemRead",
    badges: [{ text: "SISTEM & ARSIP", tone: "gray" }],
    judul: "Pemeliharaan server terjadwal",
    teks: "Pemeliharaan berkala server e-Office akan dilaksanakan akhir pekan ini pada pukul 23.00 WIB.",
    meta: "09 Sep 2026 \u2022 Sistem Otomatisasi Balai",
    waktu: "09 Sep 2026, 06:30 WIB",
    unread: false,
    penting: false,
    aksi: { label: "Log Aktivitas", href: null, style: "gray", icon: "refresh" }
  }
];
