/* ============================================
   DATA DISPOSISI PEGAWAI — E-Office SKSDA
   Dipakai oleh disposisi-saya.js & detail.
   Nanti tinggal diganti fetch API.
   ============================================ */

export const disposisiPgData = [
  {
    id: 1,
    nomor: "DISP/2023/10/045",
    suratNomor: "B.124/MenLHK/10/2023",
    suratPerihal: "Undangan Rapat Koordinasi Konserv...",
    instruksi: "Harap hadiri dan siapkan bahan paparan terk...",
    prioritas: { text: "Segera", tone: "red" },
    batas: { line1: "Hari ini,", line2: "15:00", red: true },
    status: "baru",
    judul: "Tindak Lanjut Laporan Patroli Kawasan Konservasi",
    pemberi: "Bpk. Budi Santoso (Kepala Seksi Wilayah I)",
    tenggat: "Hari ini, 15:00 WIB",
    instruksiFull:
      "Segera koordinasikan dengan tim lapangan terkait temuan aktivitas ilegal di sektor utara. Siapkan laporan detail kronologi dan rekomendasi tindakan penertiban paling lambat besok siang sebelum rapat pleno.",
    surat: {
      nomor: "S.842/BKSDA-JT/K.1/2023",
      tanggal: "12 Oktober 2023",
      pengirim: "Kepala Resort Konservasi Wilayah Cilacap",
      perihal: "Laporan Hasil Patroli Rutin Bulan Oktober dan Temuan Indikasi Perambahan Hutan"
    },
    files: [
      { name: "Laporan_Patroli_Okt2023.pdf", size: "2.4 MB", type: "pdf" },
      { name: "Dokumentasi_Lapangan.zip", size: "15.8 MB", type: "img" }
    ]
  },
  {
    id: 2,
    nomor: "DISP/2023/10/042",
    suratNomor: "S-98/BKSDA-JT/Tu/2023",
    suratPerihal: "Laporan Patroli Pengamanan Hutan E",
    instruksi: "Pelajari laporan dan buat resume untuk dibah...",
    prioritas: { text: "Penting", tone: "amber" },
    batas: { line1: "Besok,", line2: "12:00", red: false },
    status: "baru",
    judul: "Resume Laporan Patroli Pengamanan Hutan",
    pemberi: "Bpk. Budi Santoso (Kepala Seksi Wilayah I)",
    tenggat: "Besok, 12:00 WIB",
    instruksiFull:
      "Pelajari laporan patroli pengamanan hutan lindung sektor timur dan buat resume ringkas untuk dibahas dalam rapat evaluasi mingguan seksi.",
    surat: {
      nomor: "S-98/BKSDA-JT/Tu/2023",
      tanggal: "10 Oktober 2023",
      pengirim: "Polisi Kehutanan BKSDA Jateng",
      perihal: "Laporan Patroli Pengamanan Hutan Lindung Sektor Timur"
    },
    files: [{ name: "Patroli_Sektor_Timur.pdf", size: "1.8 MB", type: "pdf" }]
  },
  {
    id: 3,
    nomor: "DISP/2023/10/038",
    suratNomor: "Pengaduan-Masyarakat-092",
    suratPerihal: "Laporan Konflik Satwa di Desa Sukan",
    instruksi: "Koordinasikan dengan tim lapangan untuk pe...",
    prioritas: { text: "Segera", tone: "red" },
    batas: { line1: "24 Okt", line2: "2023", red: false },
    status: "baru",
    judul: "Penanganan Konflik Satwa di Desa Sukamaju",
    pemberi: "Ibu Siti Rahmawati (Analis Konservasi Wilayah)",
    tenggat: "24 Okt 2023",
    instruksiFull:
      "Koordinasikan dengan tim lapangan untuk penanganan konflik satwa liar di Desa Sukamaju; laporkan hasil penanganan beserta dokumentasi.",
    surat: {
      nomor: "Pengaduan-Masyarakat-092",
      tanggal: "18 Oktober 2023",
      pengirim: "Forum Desa Sukamaju",
      perihal: "Laporan Konflik Satwa di Desa Sukamaju Kecamatan Baturaden"
    },
    files: [{ name: "Foto_Konflik_Satwa.zip", size: "6.2 MB", type: "img" }]
  }
];

/* Detail disposisi untuk halaman Detail Disposisi (fallback bila ?id= tidak ketemu) */
export const DISPOSISI_DETAIL_PG = {
  id: 1,
  nomor: "DISP/2023/10/045",
  judul: "Tindak Lanjut Laporan Patroli Kawasan Konservasi",
  pemberi: "Bpk. Budi Santoso (Kepala Seksi Wilayah I)",
  tenggat: "Besok, 12:00 WIB",
  instruksi:
    "Segera koordinasikan dengan tim lapangan terkait temuan aktivitas ilegal di sektor utara. Siapkan laporan detail kronologi dan rekomendasi tindakan penertiban paling lambat besok siang sebelum rapat pleno.",
  surat: {
    nomor: "S.842/BKSDA-JT/K.1/2023",
    tanggal: "12 Oktober 2023",
    pengirim: "Kepala Resort Konservasi Wilayah Cilacap",
    perihal: "Laporan Hasil Patroli Rutin Bulan Oktober dan Temuan Indikasi Perambahan Hutan"
  },
  files: [
    { name: "Laporan_Patroli_Okt2023.pdf", size: "2.4 MB", type: "pdf" },
    { name: "Dokumentasi_Lapangan.zip", size: "15.8 MB", type: "img" }
  ]
};
