/* ============================================
   DATA LAPORAN (BERSAMA) — E-Office SKSDA
   Mock statistik per periode (YYYY-MM).
   Nanti tinggal diganti fetch API.
   ============================================ */

export const laporanData = {
  "2026-09": {
    label: "September 2026",
    updatedAt: "hari ini, 09:30 WIB",
    stats: [
      { value: "124", label: "Surat Masuk", sub: "Surat diterima & terarsip", badge: { text: "\u2197 +12 bln lalu", tone: "green" }, icon: "inbox", tone: "blue" },
      { value: "86", label: "Surat Keluar", sub: "Surat dinas diproses", badge: { text: "Teregistrasi", tone: "blue" }, icon: "send", tone: "blue" },
      { value: "41", label: "Disposisi Selesai", sub: "Dari total 48 arahan pimpinan", badge: { text: "85.4% Selesai", tone: "green" }, icon: "check", tone: "green" },
      { value: "30", label: "Tugas Selesai", sub: "Dari total 36 penugasan seksi", badge: { text: "6 Berjalan", tone: "gray" }, icon: "clipboard", tone: "purple" }
    ],
    progress: [
      { label: "Disposisi Kepala Seksi", percent: 85, detail: "85% (41 dari 48 selesai)", color: "#10B981", dot: "green" },
      { label: "Pelaksanaan Tugas Seksi", percent: 83, detail: "83% (30 dari 36 selesai)", color: "#2563EB", dot: "blue" },
      { label: "Laporan & Evaluasi Berkala", percent: 45, detail: "45% (Dalam Penyusunan)", color: "#F59E0B", dot: "orange", detailTone: "orange" }
    ],
    aktivitas: [
      { tanggal: "23 Sep 2026", icon: "mail", html: 'Penyelesaian disposisi surat masuk <span class="lp-nomor">S.892/K.21/TU/KSA/10/2023</span>' },
      { tanggal: "22 Sep 2026", icon: "clipboard", html: "Review telaah dan hasil tugas patroli staf Andi Pratama" },
      { tanggal: "21 Sep 2026", icon: "edit", html: 'Pemeriksaan draf surat keluar <span class="lp-nomor">B.124/K.21/TU/10/2023</span>' },
      { tanggal: "20 Sep 2026", icon: "file", html: "Pembuatan laporan rekapitulasi seksi triwulan III" },
      { tanggal: "19 Sep 2026", icon: "users", html: "Rapat koordinasi teknis inventarisasi satwa liar" }
    ]
  },

  "2026-08": {
    label: "Agustus 2026",
    updatedAt: "1 Sep 2026, 08:00 WIB",
    stats: [
      { value: "102", label: "Surat Masuk", sub: "Surat diterima & terarsip", badge: { text: "\u2197 +6 bln lalu", tone: "green" }, icon: "inbox", tone: "blue" },
      { value: "71", label: "Surat Keluar", sub: "Surat dinas diproses", badge: { text: "Teregistrasi", tone: "blue" }, icon: "send", tone: "blue" },
      { value: "34", label: "Disposisi Selesai", sub: "Dari total 40 arahan pimpinan", badge: { text: "85.0% Selesai", tone: "green" }, icon: "check", tone: "green" },
      { value: "25", label: "Tugas Selesai", sub: "Dari total 31 penugasan seksi", badge: { text: "5 Berjalan", tone: "gray" }, icon: "clipboard", tone: "purple" }
    ],
    progress: [
      { label: "Disposisi Kepala Seksi", percent: 85, detail: "85% (34 dari 40 selesai)", color: "#10B981", dot: "green" },
      { label: "Pelaksanaan Tugas Seksi", percent: 81, detail: "81% (25 dari 31 selesai)", color: "#2563EB", dot: "blue" },
      { label: "Laporan & Evaluasi Berkala", percent: 60, detail: "60% (Revisi Internal)", color: "#F59E0B", dot: "orange", detailTone: "orange" }
    ],
    aktivitas: [
      { tanggal: "31 Agu 2026", icon: "file", html: "Pengumpulan laporan bulanan staf seksi" },
      { tanggal: "28 Agu 2026", icon: "mail", html: 'Registrasi surat masuk <span class="lp-nomor">S.877/K.21/TU/KSA/08/2026</span>' },
      { tanggal: "26 Agu 2026", icon: "users", html: "Koordinasi patroli gabungan resort wilayah utara" },
      { tanggal: "22 Agu 2026", icon: "clipboard", html: "Review hasil monitoring tugas lapangan" },
      { tanggal: "18 Agu 2026", icon: "edit", html: "Penyusunan draf notadin jawaban permohonan data" }
    ]
  }
};
