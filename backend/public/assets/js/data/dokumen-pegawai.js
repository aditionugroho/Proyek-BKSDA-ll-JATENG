/* ============================================
   DATA DOKUMEN PEGAWAI — E-Office SKSDA
   Dipakai oleh dokumen-saya.js. Siap diganti API.
   ============================================ */

export const TOTAL_DOKUMEN_MOCK = 42;

export const dokumenPgData = [
  {
    id: 1,
    nama: "Laporan Survei Flora Fauna SKSDA 2023",
    icon: "doc",
    nomor: "SKSDA-JT/09/23",
    tanggal: "12 Sep 2023",
    kategori: "Laporan",
    status: { text: "Disetujui", tone: "green" }
  },
  {
    id: 2,
    nama: "Draf SK Penetapan Kawasan Konservasi",
    icon: "clipboard",
    nomor: "-",
    tanggal: "15 Sep 2023",
    kategori: "Surat Keputusan",
    status: { text: "Draft", tone: "gray" }
  },
  {
    id: 3,
    nama: "Pengajuan Dana Patroli Kehutanan Bulan Oktober",
    icon: "mail",
    nomor: "PD-10/SKSDA/23",
    tanggal: "18 Sep 2023",
    kategori: "Pengajuan Dana",
    status: { text: "Terkirim", tone: "blue" }
  },
  {
    id: 4,
    nama: "Revisi Proposal Fasilitas Penangkaran",
    icon: "folder",
    nomor: "PROP-05/REV/23",
    tanggal: "20 Sep 2023",
    kategori: "Proposal",
    status: { text: "Ditolak", tone: "red" }
  }
];
