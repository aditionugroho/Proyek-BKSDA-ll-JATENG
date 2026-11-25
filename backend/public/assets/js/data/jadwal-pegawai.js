/* ============================================
   DATA JADWAL PEGAWAI — E-Office SKSDA
   Tanggal relatif terhadap hari nyata agar
   stat & agenda "hari ini" berfungsi live.
   Nanti tinggal diganti fetch API.
   ============================================ */

/* Helper: iso tanggal relatif (0 = hari ini) */
function rel(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const jadwalPegawaiData = [
  /* Hari ini — dari jadwal seksi */
  {
    id: 1,
    tanggal: rel(0),
    jamMulai: "08.00",
    jamSelesai: "09.30",
    judul: "Rapat Koordinasi Seksi",
    lokasi: "Ruang Kepala Seksi",
    deskripsi: "Rapat internal evaluasi kegiatan mingguan.",
    status: "Berlangsung",
    sumber: "seksi"
  },
  {
    id: 2,
    tanggal: rel(0),
    jamMulai: "10.00",
    jamSelesai: "11.30",
    judul: "Pemeriksaan Dokumen Surat",
    lokasi: "Ruang Administrasi",
    deskripsi: "Verifikasi dokumen surat masuk dan keluar.",
    status: "Terjadwal",
    sumber: "seksi"
  },
  {
    id: 3,
    tanggal: rel(0),
    jamMulai: "13.00",
    jamSelesai: "15.00",
    judul: "Monitoring Kegiatan Lapangan",
    lokasi: "Kawasan Konservasi",
    deskripsi: "Monitoring kegiatan konservasi di lapangan.",
    status: "Mendatang",
    sumber: "seksi"
  },

  /* Hari ini — agenda pribadi */
  {
    id: 4,
    tanggal: rel(0),
    jamMulai: "16.00",
    jamSelesai: "17.00",
    judul: "Rapat Internal Staf",
    lokasi: "Meja Kerja",
    deskripsi: "Persiapan laporan mingguan pribadi.",
    status: "Terjadwal",
    sumber: "pribadi"
  },

  /* Minggu ini */
  {
    id: 5,
    tanggal: rel(2),
    jamMulai: "09.00",
    jamSelesai: "10.00",
    judul: "Briefing Patroli Rutin",
    lokasi: "Ruang Rapat Lt. 1",
    deskripsi: "Briefing persiapan patroli rutin minggu depan.",
    status: "Terjadwal",
    sumber: "seksi"
  },
  {
    id: 6,
    tanggal: rel(4),
    jamMulai: "13.00",
    jamSelesai: "16.00",
    judul: "Kunjungan Monitoring Resort",
    lokasi: "Resort Konservasi Selatan",
    deskripsi: "Monitoring lapangan bersama staf resort.",
    status: "Mendatang",
    sumber: "seksi"
  },

  /* Mendatang */
  {
    id: 7,
    tanggal: rel(9),
    jamMulai: "08.30",
    jamSelesai: "11.30",
    judul: "Rapat Evaluasi Bulanan",
    lokasi: "Ruang Rapat Utama",
    deskripsi: "Evaluasi capaian kegiatan bulan berjalan.",
    status: "Mendatang",
    sumber: "seksi"
  },
  {
    id: 8,
    tanggal: rel(12),
    jamMulai: "14.00",
    jamSelesai: "15.30",
    judul: "Pelatihan Penggunaan Sistem",
    lokasi: "Lab Komputer Balai",
    deskripsi: "Pelatihan modul pelaporan digital e-Office.",
    status: "Mendatang",
    sumber: "seksi"
  }
];
