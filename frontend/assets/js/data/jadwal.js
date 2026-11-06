/* ============================================
   DATA JADWAL (BERSAMA) — E-Office SKSDA
   jadwalData: agenda per tanggal.
   Nanti tinggal diganti fetch API.
   ============================================ */

/* "Hari ini" simulasi untuk highlight kalender */
export const HARI_INI_MOCK = "2024-05-29";

export const jadwalData = [
  /* Tanggal ber-agenda (penanda titik pada kalender) */
  {
    tanggal: "2024-05-01",
    jamMulai: "09.00",
    jamSelesai: "10.30",
    judul: "Rapat Sinkronisasi Awal Bulan",
    lokasi: "Ruang Kepala Seksi",
    deskripsi: "Sinkronisasi rencana kerja bulan Mei.",
    status: "Selesai"
  },
  {
    tanggal: "2024-05-08",
    jamMulai: "08.00",
    jamSelesai: "09.00",
    judul: "Evaluasi Mingguan Seksi",
    lokasi: "Ruang Rapat Lt. 2",
    deskripsi: "Evaluasi capaian kegiatan pekan kedua.",
    status: "Selesai"
  },
  {
    tanggal: "2024-05-15",
    jamMulai: "13.00",
    jamSelesai: "15.00",
    judul: "Monitoring Lapangan Blok Utara",
    lokasi: "Kawasan Konservasi",
    deskripsi: "Monitoring patroli dan kondisi kawasan.",
    status: "Selesai"
  },
  {
    tanggal: "2024-05-22",
    jamMulai: "10.00",
    jamSelesai: "11.30",
    judul: "Rapat Koordinasi Penyusunan Laporan",
    lokasi: "Ruang Administrasi",
    deskripsi: "Penyusunan laporan bulanan seksi.",
    status: "Selesai"
  },

  /* Agenda 29 Mei 2024 (default terpilih) */
  {
    tanggal: "2024-05-29",
    jamMulai: "08.00",
    jamSelesai: "09.30",
    judul: "Rapat Koordinasi Seksi",
    lokasi: "Ruang Kepala Seksi",
    deskripsi: "Rapat internal membahas evaluasi kegiatan mingguan.",
    status: "Berlangsung"
  },
  {
    tanggal: "2024-05-29",
    jamMulai: "10.00",
    jamSelesai: "11.30",
    judul: "Pemeriksaan Dokumen Surat",
    lokasi: "Ruang Administrasi",
    deskripsi: "Verifikasi dan pemeriksaan dokumen surat masuk dan keluar.",
    status: "Terjadwal"
  },
  {
    tanggal: "2024-05-29",
    jamMulai: "13.00",
    jamSelesai: "15.00",
    judul: "Monitoring Kegiatan Lapangan",
    lokasi: "Kawasan Konservasi",
    deskripsi: "Monitoring pelaksanaan kegiatan konservasi di lapangan.",
    status: "Mendatang"
  },
  {
    tanggal: "2024-05-29",
    jamMulai: "16.00",
    jamSelesai: "17.00",
    judul: "Penyusunan Laporan",
    lokasi: "Ruang Kepala Seksi",
    deskripsi: "Penyusunan laporan kegiatan harian.",
    status: "Terjadwal"
  }
];
