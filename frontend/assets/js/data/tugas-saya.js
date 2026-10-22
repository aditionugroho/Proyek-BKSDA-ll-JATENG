/* ============================================
   DATA TUGAS SAYA (PEGAWAI) — E-Office SKSDA
   Dipakai oleh tugas-saya.js. Siap diganti API.
   ============================================ */

export const TOTAL_BADGE_MOCK = 13; // badge tab "Semua"
export const TOTAL_FOOTER_MOCK = 12; // teks footer "dari 12 tugas"

export const tugasSayaData = [
  {
    id: 1,
    judul: "Penyusunan Laporan Tahunan Konservasi",
    deskripsi: "Drafting dokumen laporan akhir tahun untuk...",
    pemberi: { inisial: "KA", nama: "Kepala Balai" },
    prioritas: { text: "High", tone: "red" },
    deadline: "Besok",
    progress: 75,
    progressColor: "#2563EB",
    status: { text: "Berjalan", tone: "blue" },
    subtasks: [
      { text: "Kompilasi data survei 2023", done: true },
      { text: "Menyusun bab analisis", done: false }
    ],
    files: [{ name: "Data_Survei_2023.xlsx", size: "3.1 MB", type: "xlsx" }],
    diskusi: [
      { role: "me", nama: "Anda", avatar: "ST", waktu: "Hari ini, 09:00", teks: "Draft bab analisis dimulai hari ini." }
    ],
    timeline: [
      { judul: "Tugas ditugaskan", waktu: "20 Okt, 08:00", detail: "Kepala Balai menugaskan tugas ini" }
    ]
  },
  {
    id: 2,
    judul: "Patroli Wilayah Sektor B",
    deskripsi: "Jadwal patroli rutin pengamanan hutan lindung...",
    pemberi: { inisial: "KS", nama: "Kasi Wilayah I" },
    prioritas: { text: "Medium", tone: "amber" },
    deadline: "15 Okt",
    progress: 0,
    progressColor: "#E5E7EB",
    status: { text: "Belum Mulai", tone: "gray" },
    subtasks: [
      { text: "Cek jadwal patroli sektor B", done: false },
      { text: "Siapkan perlengkapan lapangan", done: false }
    ],
    files: [],
    diskusi: [],
    timeline: [
      { judul: "Tugas ditugaskan", waktu: "12 Okt, 10:00", detail: "Kasi Wilayah I menugaskan tugas ini" }
    ]
  },
  {
    id: 3,
    judul: "Evaluasi Perizinan Penangkaran",
    deskripsi: "Review dokumen perpanjangan izin PT. Flora...",
    pemberi: { inisial: "PT", nama: "Seksi P3" },
    prioritas: { text: "Medium", tone: "amber" },
    deadline: "20 Okt",
    progress: 100,
    progressColor: "#F59E0B",
    status: { text: "Menunggu Review", tone: "amber" },
    subtasks: [
      { text: "Review dokumen izin PT. Flora", done: true },
      { text: "Buat catatan evaluasi", done: true }
    ],
    files: [{ name: "Evaluasi_PT_Flora.pdf", size: "1.2 MB", type: "doc" }],
    diskusi: [
      { role: "them", nama: "Seksi P3", avatar: "PT", waktu: "19 Okt, 14:00", teks: "Dokumen sudah lengkap, mohon evaluasinya." }
    ],
    timeline: [
      { judul: "Tugas ditugaskan", waktu: "16 Okt, 09:00", detail: "Seksi P3 menugaskan tugas ini" },
      { judul: "Tugas dikirim", waktu: "20 Okt, 16:00", detail: "Anda mengirim tugas untuk direview" }
    ]
  },
  {
    id: 4,
    judul: "Update Data Kepegawaian",
    deskripsi: "Pembaruan SK Pangkat triwulan III.",
    pemberi: { inisial: "TU", nama: "Bagian TU" },
    prioritas: { text: "Low", tone: "gray" },
    deadline: "01 Okt",
    progress: 100,
    progressColor: "#10B981",
    status: { text: "Selesai", tone: "green" },
    selesai: true,
    subtasks: [
      { text: "Input ulang data kepegawaian", done: true },
      { text: "Verifikasi SK pangkat", done: true }
    ],
    files: [],
    diskusi: [],
    timeline: [
      { judul: "Tugas ditugaskan", waktu: "28 Sep, 08:00", detail: "Bagian TU menugaskan tugas ini" },
      { judul: "Tugas selesai", waktu: "01 Okt, 15:00", detail: "Anda menyelesaikan tugas ini" }
    ]
  }
];

/* Tugas detail untuk halaman Detail Tugas Pegawai (fallback bila ?id= tidak ketemu) */
export const TUGAS_DETAIL_PG = {
  id: 99,
  kode: "TGS-23-089",
  judul: "Laporan Pemantauan Satwa Liar TWA Ruteng",
  prioritas: { text: "Tinggi", tone: "red" },
  deskripsi:
    "Melakukan pemantauan rutin populasi satwa liar endemik di kawasan Taman Wisata Alam Ruteng selama periode Q3 2023. Laporan harus mencakup data populasi, identifikasi ancaman, dan rekomendasi mitigasi sesuai standar operasional SKSDA.",
  pemberi: { inisial: "KS", nama: "Kepala Seksi Wil II" },
  deadline: "24 Nov 2023",
  status: { text: "Sedang Dikerjakan", tone: "amber" },

  subtasks: [
    { text: "Mengumpulkan data lapangan (GPS, Foto, Catatan)", done: true },
    { text: "Validasi data koordinat temuan satwa", done: true },
    { text: "Membuat draft laporan naratif", done: false },
    { text: "Upload hasil akhir & lampiran", done: false }
  ],

  files: [
    { name: "SOP_Pemantauan_TWA.pdf", meta: "2.4 MB \u2022 Referensi", type: "doc" },
    { name: "Data_Mentah_Lapangan_Q3.xlsx", meta: "1.1 MB \u2022 Diupload Anda", type: "xlsx" }
  ],

  diskusi: [
    {
      role: "them",
      nama: "Kepala Seksi Wil II",
      avatar: "KS",
      waktu: "Kemarin, 09:30",
      teks: "Tolong pastikan titik koordinat penemuan Elang Flores divalidasi ulang dengan data sebelumnya."
    },
    {
      role: "me",
      nama: "Anda",
      avatar: "ST",
      waktu: "Hari ini, 10:15",
      teks: "Baik Pak, sedang dilakukan kroscek silang dengan data GIS tahun lalu."
    }
  ],

  timeline: [
    { judul: "Sub-tugas diselesaikan", waktu: "Hari ini, 09:12", detail: "Anda menyelesaikan 'Validasi data koordinat'" },
    { judul: "File diunggah", waktu: "Kemarin, 14:30", detail: "Anda mengunggah Data_Mentah_Lapangan_Q3.xlsx" },
    { judul: "Status diperbarui", waktu: "20 Nov, 08:00", detail: "Anda mengubah status menjadi 'Sedang Dikerjakan'" },
    { judul: "Tugas ditugaskan", waktu: "18 Nov, 10:45", detail: "Kepala Seksi Wil II menugaskan tugas ini kepada Anda" }
  ]
};
