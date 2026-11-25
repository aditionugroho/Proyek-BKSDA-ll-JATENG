/* ============================================
   DATA SURAT MASUK (BERSAMA) — E-Office SKSDA
   Dipakai oleh surat-masuk.js dan detail-surat.js.
   Nanti tinggal diganti fetch API.
   ============================================ */

export const SURAT_MASUK = [
  {
    id: 1,
    nomor: "S.452/SKSDA-JT/2023",
    tanggal: "24 Okt 2023",
    pengirim: "Kementerian LHK",
    pengirimSub: "Pusat",
    perihal: "Undangan Rapat Koordinasi Nasional Konservasi Keanekaragaman Hayati",
    prioritas: { text: "Segera", tone: "red", icon: "zap" },
    status: { text: "Baru", tone: "gray" },
    unread: true,
    perluTindak: false,
    selesai: false
  },
  {
    id: 2,
    nomor: "B.128/PEM-JTG/2023",
    tanggal: "22 Okt 2023",
    pengirim: "Pemerintah Provinsi",
    pengirimSub: "Dinas Kehutanan",
    perihal: "Laporan Hasil Patroli Gabungan Pengamanan Hutan Lindung",
    prioritas: { text: "Biasa", tone: "blue" },
    status: { text: "Menunggu Disposisi", tone: "amber" },
    unread: false,
    perluTindak: true,
    selesai: false
  },
  {
    id: 3,
    nomor: "085/LSM-LH/X/2023",
    tanggal: "18 Okt 2023",
    pengirim: "LSM Lingkungan",
    pengirimSub: "Mitra Alam",
    perihal: "Permohonan Data Populasi Elang Jawa di Kawasan...",
    prioritas: { text: "Biasa", tone: "blue" },
    status: { text: "Selesai", tone: "outline-green", icon: "check" },
    unread: false,
    perluTindak: false,
    selesai: true
  },
  {
    id: 4,
    nomor: "S.410/SKSDA-JT/2023",
    tanggal: "15 Okt 2023",
    pengirim: "Dirjen KSDAE",
    pengirimSub: "Kementerian LHK",
    perihal: "Instruksi Peningkatan Pengawasan Perdagangan...",
    prioritas: { text: "Penting", tone: "amber", icon: "alert" },
    status: { text: "Dalam Proses", tone: "solid" },
    unread: false,
    perluTindak: false,
    selesai: false
  },
  {
    /* Surat contoh untuk halaman detail */
    id: 5,
    nomor: "S.892/K.21/TU/KSA/10/2023",
    tanggal: "24 Okt 2023",
    pengirim: "Kementerian LHK",
    pengirimSub: "Ditjen KSDAE",
    perihal: "Undangan Rapat Koordinasi Penanganan Konflik Satwa Liar Regional Jawa",
    prioritas: { text: "Segera", tone: "red", icon: "zap" },
    status: { text: "Menunggu Disposisi", tone: "amber" },
    unread: true,
    perluTindak: true,
    selesai: false,

    /* Atribut detail */
    pengirimFull: "Kementerian Lingkungan Hidup dan Kehutanan, Direktorat Jenderal KSDAE",
    nomorAsli: "S.450/KSDAE/SET.2/KSA.0/10/2023",
    tanggalSurat: "20 Oktober 2023",
    tanggalDiterima: "24 Okt 2023, 09:15 WIB",
    sifat: "Biasa",
    klasifikasi: ["000 - Umum", "KSA - Konservasi"],
    fileName: "Undangan_Rakor_Konflik_Satwa.pdf",
    fileSize: "2.4 MB"
  }
];
