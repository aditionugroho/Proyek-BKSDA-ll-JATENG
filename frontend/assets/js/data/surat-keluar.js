/* ============================================
   DATA SURAT KELUAR (BERSAMA) — E-Office SKSDA
   Dipakai oleh surat-keluar.js.
   Nanti tinggal diganti fetch API.
   ============================================ */

export const SURAT_KELUAR = [
  {
    id: 1,
    nomor: "S.452/BKSDA-JT/2023",
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
    nomor: "S.410/BKSDA-JT/2023",
    tanggal: "15 Okt 2023",
    pengirim: "Dirjen KSDAE",
    pengirimSub: "Kementerian LHK",
    perihal: "Instruksi Peningkatan Pengawasan Perdagangan...",
    prioritas: { text: "Penting", tone: "amber", icon: "alert" },
    status: { text: "Dalam Proses", tone: "solid" },
    unread: false,
    perluTindak: false,
    selesai: false
  }
];
