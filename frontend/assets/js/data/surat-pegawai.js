/* ============================================
   DATA SURAT (PEGAWAI) — E-Office SKSDA
   suratPgData + filter jenis/sifat/status.
   Nanti tinggal diganti fetch API.
   ============================================ */

export const TOTAL_SURAT_MOCK = 45;

export const suratPgData = [
  /* Surat Masuk (default tab aktif) */
  {
    id: 1,
    jenis: "masuk",
    nomor: "S.123/MenLHK/Setjen/2023",
    pengirim: "Kementerian LHK",
    perihal: "Undangan Rapat Koordinasi Konservasi Nasional",
    perihalDetail: "Mohon kehadiran Kepala Balai pada rapat koordinasi yang akan...",
    tanggal: "12 Okt 2023",
    waktu: "09:00 WIB",
    iso: "2023-10-12",
    sifat: "Penting",
    status: "Baru",
    label: { text: "Penting", tone: "red", dot: true }
  },
  {
    id: 2,
    jenis: "masuk",
    nomor: "B.456/BKSDA-JT/TU/10/2023",
    pengirim: "Balai TN Karimunjawa",
    perihal: "Laporan Bulanan Patroli Kawasan",
    perihalDetail: "Terlampir laporan kegiatan patroli kawasan periode September...",
    tanggal: "10 Okt 2023",
    waktu: "14:30 WIB",
    iso: "2023-10-10",
    sifat: "Biasa",
    status: "Dibaca",
    label: { text: "Biasa", tone: "gray", dot: false }
  },
  {
    id: 3,
    jenis: "masuk",
    nomor: "S.789/DinasHut/Prov/2023",
    pengirim: "Dinas Kehutanan Prov Jateng",
    perihal: "Permohonan Bantuan Tenaga Ahli",
    perihalDetail: "Permohonan penugasan personil untuk identifikasi jenis satwa liar.",
    tanggal: "08 Okt 2023",
    waktu: "11:15 WIB",
    iso: "2023-10-08",
    sifat: "Biasa",
    status: "Didisposisikan",
    label: { text: "Didisposisikan", tone: "blue", dot: false }
  },

  /* Surat Keluar */
  {
    id: 4,
    jenis: "keluar",
    nomor: "B.890/BKSDA-JT/TU/10/2023",
    pengirim: "Balai BKSDA Jateng",
    perihal: "Penyampaian Laporan Triwulan III",
    perihalDetail: "Penyampaian laporan kegiatan konservasi triwulan III 2023.",
    tanggal: "06 Okt 2023",
    waktu: "10:00 WIB",
    iso: "2023-10-06",
    sifat: "Biasa",
    status: "Terkirim",
    label: { text: "Terkirim", tone: "blue", dot: false }
  },

  /* Draft */
  {
    id: 5,
    jenis: "draft",
    nomor: "DRAFT-ND/2023/014",
    pengirim: "Anda (Bagian TU)",
    perihal: "Nota Dinas Persiapan Rakor",
    perihalDetail: "Draf nota dinas persiapan rapat koordinasi internal balai.",
    tanggal: "05 Okt 2023",
    waktu: "16:45 WIB",
    iso: "2023-10-05",
    sifat: "Biasa",
    status: "Draft",
    label: { text: "Draft", tone: "gray", dot: false }
  },

  /* Arsip */
  {
    id: 6,
    jenis: "arsip",
    nomor: "S.654/Ditjen/KSDAE/2023",
    pengirim: "Ditjen KSDAE",
    perihal: "Edaran Teknis Penyusunan RKT",
    perihalDetail: "Edaran teknis penyusunan rencana kerja tahunan bidang konservasi.",
    tanggal: "28 Sep 2023",
    waktu: "08:20 WIB",
    iso: "2023-09-28",
    sifat: "Biasa",
    status: "Diarsipkan",
    label: { text: "Diarsipkan", tone: "gray", dot: false }
  }
];
