/* ============================================
   DATA TUGAS SEKSI (BERSAMA) — E-Office SKSDA
   Dipakai oleh tugas-seksi.js, detail-tugas,
   dan buat-tugas (nanti). Siap diganti API.
   ============================================ */

export const TUGAS_SEKSI = [
  {
    id: 1,
    judul: "Penyusunan Laporan Tahunan Seksi Wilayah I",
    kode: "TGS-2023-08-001",
    pic: "Budi Santoso",
    avatar: "BS",
    avatarTone: "gray",
    prioritas: "TINGGI",
    deadline: "25 Agt 2023",
    lewatDeadline: false,
    progress: 75,
    status: "Berjalan",
    picRole: "Staf Pelaksana",
    deskripsi: [
      "Penyusunan laporan tahunan seksi wilayah I periode 2023 mencakup rekapitulasi kegiatan konservasi, patroli, dan edukasi masyarakat.",
      "Sesuaikan format dengan template laporan tahunan balai."
    ],
    checklist: [
      { text: "Pengumpulan data kegiatan", done: true },
      { text: "Penyusunan draft laporan", done: false }
    ],
    lampiran: [{ name: "Template_Laporan_Tahunan.docx", meta: "240 KB \u2022 Referensi", type: "doc" }],
    aktivitas: [
      { icon: "check", tone: "green", text: "Budi Santoso menyelesaikan pengumpulan data.", time: "Hari ini, 09:00 WIB" }
    ]
  },
  {
    id: 2,
    judul: "Patroli Pengamanan Hutan Lindung Blok C",
    kode: "TGS-2023-08-002",
    pic: "Siti Aminah",
    avatar: "SA",
    avatarTone: "red",
    prioritas: "NORMAL",
    deadline: "20 Agt 2023",
    lewatDeadline: false,
    progress: 100,
    status: "Menunggu Review",
    picRole: "Staf PEH",
    deskripsi: [
      "Patroli pengamanan hutan lindung Blok C sesuai jadwal rutin; laporan patroli mencakup temuan dan tindakan yang dilakukan.",
      "Lampirkan track log GPS dan dokumentasi foto."
    ],
    checklist: [
      { text: "Pelaksanaan patroli lapangan", done: true },
      { text: "Upload laporan & dokumentasi", done: true }
    ],
    lampiran: [
      { name: "Laporan_Patroli_Blok_C.pdf", meta: "1.9 MB \u2022 Hasil", type: "pdf" },
      { name: "TrackLog_Blok_C.gpx", meta: "310 KB \u2022 Hasil", type: "xlsx" }
    ],
    aktivitas: [
      { icon: "check", tone: "green", text: "Siti Aminah menandai tugas selesai.", time: "Kemarin, 16:20 WIB" }
    ]
  },
  {
    id: 3,
    judul: "Penyusunan Rencana Deforestasi Q3",
    kode: "TGS-2023-08-005",
    pic: "Arif Wibowo",
    avatar: "AW",
    avatarTone: "gray",
    prioritas: "TINGGI",
    deadline: "15 Agt 2023",
    lewatDeadline: true,
    progress: 40,
    status: "Terlambat",
    picRole: "Staf Seksi Wilayah I",
    deskripsi: [
      "Penyusunan rencana kerja deforestasi kuartal III berdasarkan data citra satelit terbaru dan laporan lapangan resort.",
      "Koordinasikan dengan analis data untuk validasi angka."
    ],
    checklist: [
      { text: "Pengumpulan data citra satelit", done: true },
      { text: "Analisis data & penyusunan draft", done: false }
    ],
    lampiran: [{ name: "Data_Citra_Q3.tif", meta: "48 MB \u2022 Referensi", type: "doc" }],
    aktivitas: [
      { icon: "comment", tone: "gray", text: "Arif Wibowo menambahkan komentar progres.", time: "2 hari lalu" }
    ]
  }
];

export const TOTAL_TUGAS_MOCK = 24; // total sistem (untuk teks footer)

/* Tugas contoh untuk halaman Detail Tugas (fallback bila ?id= tidak ketemu) */
export const TUGAS_DETAIL = {
  id: 4,
  judul: "Penyusunan Laporan Patroli Kawasan Cagar Alam",
  kode: "TGS-2023-11-042",
  pic: "Budi Wibowo",
  avatar: "BW",
  avatarTone: "blue",
  picRole: "Staf Polhut",
  prioritas: "Tinggi",
  deadline: "30 Nov 2023, 16:00 WIB",
  lewatDeadline: false,
  progress: 100,
  status: "Menunggu Review",

  deskripsi: [
    "Berdasarkan surat tugas ST.123/SKSDA-JT/2023, agar segera disusun laporan hasil patroli rutin di kawasan Cagar Alam Nusakambangan Timur bulan November 2023. Laporan harus mencakup data temuan flora/fauna, kondisi tutupan lahan, dan potensi ancaman gangguan kawasan.",
    "Pastikan data spasial (track log GPS) dilampirkan.",
    "Dokumentasi foto minimal 10 lembar dengan geotagging.",
    "Format laporan sesuai standar SOP Pelaporan Bidang Konservasi."
  ],

  checklist: [
    { text: "Pengumpulan data lapangan (GPS & Foto)", done: true },
    { text: "Penyusunan draft narasi laporan", done: true },
    { text: "Finalisasi dan upload dokumen", done: true }
  ],

  lampiran: [
    { name: "Laporan_Patroli_CA_Nusakambangan_Nov23.pdf", meta: "2.4 MB \u2022 Diunggah 2 jam lalu", type: "pdf" },
    { name: "Data_Spasial_Tracklog.xlsx", meta: "1.1 MB \u2022 Diunggah 2 jam lalu", type: "xlsx" }
  ],

  aktivitas: [
    { icon: "check", tone: "green", text: "Budi Wibowo menandai tugas selesai.", time: "Hari ini, 10:15 WIB" },
    { icon: "upload", tone: "gray", text: "Budi Wibowo mengunggah 2 lampiran.", time: "Hari ini, 10:14 WIB" },
    { icon: "comment", tone: "gray", text: "Alex Rivera menambahkan komentar.", time: "Kemarin, 14:30 WIB" }
  ]
};
