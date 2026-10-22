/* ============================================
   DATA NOTIFIKASI PEGAWAI — E-Office SKSDA
   Dipakai oleh notifikasi-pg.js. Siap diganti API.
   ============================================ */

export const notifPgData = [
  {
    id: 1,
    judul: "Surat masuk baru",
    teks: "Surat dari Dinas Lingkungan Hidup telah diterima.",
    waktu: "10 menit yang lalu",
    kategori: "surat",
    icon: "plus",
    tone: "blue",
    unread: true
  },
  {
    id: 2,
    judul: "Tugas perlu diperiksa",
    teks: "Tugas Patroli Kawasan TN. Gunung Palung menunggu tindakan.",
    waktu: "1 jam yang lalu",
    kategori: "tugas",
    icon: "plus",
    tone: "amber",
    unread: true
  },
  {
    id: 3,
    judul: "Dokumen berhasil diarsipkan",
    teks: "Laporan Kegiatan Patroli Bulan Mei 2026 telah diarsipkan.",
    waktu: "Kemarin, 14:20",
    kategori: "sistem",
    icon: "check",
    tone: "green",
    unread: true
  },
  {
    id: 4,
    judul: "Surat keluar telah disetujui",
    teks: "Surat tugas dengan nomor ST/023/SKSDA/VI/2026 telah disetujui.",
    waktu: "2 hari yang lalu",
    kategori: "surat",
    icon: "minus",
    tone: "gray",
    unread: false
  }
];
