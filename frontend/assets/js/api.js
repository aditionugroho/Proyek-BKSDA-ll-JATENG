/* ============================================
   API LAYER — E-Office SKSDA
   Satu-satunya gerbang komunikasi frontend <-> backend Laravel.
   Halaman TIDAK boleh memanggil fetch() langsung;
   selalu lewat EOfficeAPI.<fungsi>().

   DUA MODE:
   - API_CONFIG.LIVE = false -> MODE MOCK: data lokal
     (localStorage / modul data), dipakai selama backend belum siap.
   - API_CONFIG.LIVE = true  -> MODE LIVE: fetch ke Laravel.
     Cukup ganti satu flag, semua halaman ikut.

   Kontrak JSON tiap endpoint didokumentasikan di atas fungsinya —
   jadikan acuan bersama dengan developer backend.
   ============================================ */

const API_CONFIG = {
  LIVE: false, // <- ganti ke true saat backend Laravel siap
  BASE_URL: "http://localhost:8000/api", // Laragon / php artisan serve
  TIMEOUT_MS: 10000
};

const EOfficeAPI = (() => {
  const TOKEN_KEY = "eoffice_token";

  /* ---------- PENYIMPANAN TOKEN ---------- */

  function getToken() {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  }

  /* ---------- CORE: satu fungsi fetch untuk semua endpoint ---------- */

  async function request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);
    try {
      const res = await fetch(API_CONFIG.BASE_URL + path, {
        method: method,
        headers: Object.assign(
          {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          getToken() ? { Authorization: "Bearer " + getToken() } : {}
        ),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error((data && data.message) || "Terjadi kesalahan pada server.");
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (e) {
      if (e.name === "AbortError") {
        throw new Error("Waktu koneksi ke server habis.");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ============================================
     LOGIN
     KONTRAK (LIVE):
       POST /api/login
       Body   : { "id_pengguna": "...", "kata_sandi": "..." }
       Balasan: { "token": "...", "user": { "id": 1, "nama": "...", "role": "admin|kepala-seksi|pegawai" } }
       Galat  : 401 + { "code": "invalid"  } -> kredensial salah
                403 + { "code": "pending"  } -> menunggu verifikasi admin
                403 + { "code": "rejected" } -> pendaftaran ditolak
     Hasil (selalu, mock & live):
       { status: "ok",       token, user }
       { status: "invalid" }
       { status: "pending" }
       { status: "rejected" }
     ============================================ */

  async function login(idPengguna, kataSandi) {
    if (!API_CONFIG.LIVE) return mockLogin(idPengguna, kataSandi);
    try {
      const res = await request("POST", "/login", {
        id_pengguna: idPengguna,
        kata_sandi: kataSandi
      });
      setToken(res.token);
      return { status: "ok", token: res.token, user: res.user };
    } catch (err) {
      const code = err.data && err.data.code;
      if (code === "pending") return { status: "pending" };
      if (code === "rejected") return { status: "rejected" };
      if (err.status === 401) return { status: "invalid" };
      throw err; // error server/jaringan lain -> ditangkap .catch() halaman
    }
  }

  /* ---------- MOCK LOGIN: replika logika localStorage lama ---------- */

  function mockLogin(idPengguna, kataSandi) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let match = null;
        try {
          const regs = JSON.parse(window.localStorage.getItem("eoffice_registrations") || "[]");
          const v = String(idPengguna).toLowerCase();
          match = regs.find(function (r) {
            return String(r.idAtauEmail).toLowerCase() === v || String(r.nama).toLowerCase() === v;
          }) || null;
        } catch (e) {
          match = null;
        }

        if (match && match.status === "ditolak") return resolve({ status: "rejected" });
        if (match && match.status === "menunggu-verifikasi") return resolve({ status: "pending" });
        if (match && match.status === "aktif" && match.kataSandi && kataSandi !== match.kataSandi) {
          return resolve({ status: "invalid" });
        }

        // Tanpa registrasi cocok (mode demo) role tetap dari dropdown halaman.
        resolve({
          status: "ok",
          token: "mock-token",
          user: match
            ? { id: match.idAtauEmail, nama: match.nama, role: null }
            : { id: idPengguna, nama: idPengguna, role: null }
        });
      }, 400); // simulasi latensi jaringan
    });
  }

  /* ============================================
     LOGOUT
     LIVE: POST /api/logout (menghapus token di server, butuh Authorization)
     ============================================ */

  async function logout() {
    setToken(null);
    window.localStorage.removeItem("eoffice_session");
    window.sessionStorage.removeItem("eoffice_session");
    if (!API_CONFIG.LIVE) return;
    try {
      await request("POST", "/logout");
    } catch (e) {
      // token lokal sudah dibersihkan; kegagalan jaringan diabaikan
    }
  }

  /* ============================================
     DAFTAR SURAT MASUK
     KONTRAK (LIVE):
       GET /api/surat-masuk  (butuh Authorization: Bearer token)
       Balasan: [ { "id": 1, "nomor": "S.452/...", "tanggal": "24 Okt 2023",
                    "pengirim": "...", "pengirimSub": "...", "perihal": "...",
                    "prioritas": { "text": "Segera", "tone": "red", "icon": "zap" },
                    "status":    { "text": "Baru",   "tone": "gray", "icon": null },
                    "unread": true, "perluTindak": false, "selesai": false } ]
     ============================================ */

  async function getSuratMasuk() {
    return request("GET", "/surat-masuk");
  }

  /* ============================================
     DAFTAR SURAT KELUAR
     KONTRAK (LIVE): sama seperti /surat-masuk,
       GET /api/surat-keluar  (butuh token)
     Bentuk item array identik dengan surat masuk.
     ============================================ */

  async function getSuratKeluar() {
    return request("GET", "/surat-keluar");
  }

  /* ============================================
     DAFTAR & BUAT DISPOSISI
     KONTRAK (LIVE):
       GET /api/disposisi  (butuh token)
       Balasan: [ { "id": 1, "nomor": "DSP-10/23-001",
                    "surat": "SM-2023/10/001 - ...", "pic": "Budi Santoso",
                    "tanggal": "24 Okt 2023", "deadline": "26 Okt 2023",
                    "instruksi": "Segera ditindaklanjuti", "catatan": "..." } ]

       POST /api/disposisi  (butuh token)
       Body   : { "surat": "...", "pic": "...", "deadline": "2023-10-26"|null,
                  "instruksi": "...", "catatan": "..." }
       Balasan: objek disposisi yang baru dibuat (bentuk sama seperti item GET)
       Validasi: server WAJIB memeriksa "surat" terhadap daftar surat
       terdaftar — bila nomor tidak ditemukan: 422 { "message": "Nomor surat
       tidak ditemukan. Periksa kembali nomor surat masuk." }
     ============================================ */

  async function getDisposisi() {
    return request("GET", "/disposisi");
  }

  async function createDisposisi(payload) {
    return request("POST", "/disposisi", payload);
  }

  /* ============================================
     NOTIFIKASI
     KONTRAK (LIVE):
       GET  /api/notifikasi  (butuh token)
       Balasan: [ { "id": 1, "tipe": "suratMasukBaru", "kategori": "surat",
                    "judul": "...", "teks": "...", "meta": "...", "waktu": "5 mnt lalu",
                    "unread": true, "penting": false,
                    "badges": [ { "text": "Baru", "tone": "blue" } ],
                    "aksi": { "label": "Lihat Surat", "href": "...", "icon": "arrowUpRight", "style": "blue" } } ]

       POST /api/notifikasi/{id}/read     — tandai satu dibaca
       POST /api/notifikasi/read-all      — tandai semua dibaca
     ============================================ */

  async function getNotifikasi() {
    return request("GET", "/notifikasi");
  }

  async function markNotifikasiRead(id) {
    return request("POST", "/notifikasi/" + id + "/read");
  }

  async function markAllNotifikasiRead() {
    return request("POST", "/notifikasi/read-all");
  }

  /* ============================================
     DAFTAR TUGAS SEKSI
     KONTRAK (LIVE):
       GET /api/tugas  (butuh token)
       Balasan: [ { "id": 1, "judul": "...", "kode": "TGS-001", "pic": "...",
                    "avatar": "BS", "avatarTone": null, "prioritas": "TINGGI|NORMAL",
                    "deadline": "26 Okt 2023", "lewatDeadline": false,
                    "progress": 40, "status": "Berjalan|Menunggu Review|Terlambat|Belum Mulai|Selesai" } ]
     ============================================ */

  async function getTugas() {
    return request("GET", "/tugas");
  }

  /* ============================================
     ARSIP DOKUMEN
     KONTRAK (LIVE):
       GET /api/arsip  (butuh token)
       Balasan: [ { "id": 1, "nomor": "...", "tanggal": "12 Okt 2023",
                    "tahun": "2023", "jenis": "Surat Masuk|Surat Keluar",
                    "perihal": "...", "asal": "...", "status": "Diarsipkan|Selesai" } ]
     ============================================ */

  async function getArsip() {
    return request("GET", "/arsip");
  }

  /* ============================================
     JADWAL AGENDA
     KONTRAK (LIVE):
       GET /api/jadwal  (butuh token)
       Balasan: { "hariIni": "2026-10-27",
                  "agenda": [ { "tanggal": "2026-10-27", "jamMulai": "09.00",
                                "jamSelesai": "10.30", "judul": "...", "lokasi": "...",
                                "deskripsi": "...", "status": "Terjadwal|Berlangsung|Selesai|..." } ] }
     (hariIni dipakai sebagai acuan highlight kalender — tanggal server lebih tepercaya)
     ============================================ */

  async function getJadwal() {
    return request("GET", "/jadwal");
  }

  /* ============================================
     DIREKTORI STAF
     KONTRAK (LIVE):
       GET /api/staf  (butuh token)
       Balasan: [ { "id": 1, "nama": "...", "golongan": "...", "nip": "...",
                    "jabatan": "...", "email": "...", "telp": "...",
                    "tugas": 4, "status": "AKTIF|CUTI|..." } ]
     ============================================ */

  async function getStaf() {
    return request("GET", "/staf");
  }

  /* ============================================
     DETAIL (per-ID)
     KONTRAK (LIVE): pola sama untuk semua resource —
       GET /api/surat-masuk/{id}
         Balasan (rata/di-flatten untuk halaman detail):
         { "nomor": "...", "status": "Menunggu Disposisi", "prioritas": "Segera",
           "sifat": "Biasa", "tanggalDiterima": "24 Okt 2023, 09:15 WIB",
           "pengirimFull": "...", "nomorAsli": "...", "tanggalSurat": "...",
           "perihal": "...", "klasifikasi": ["000 - Umum"],
           "fileName": "Dokumen_Surat.pdf", "fileSize": "1.2 MB" }
       GET /api/surat-keluar/{id} — bentuk item sama seperti list surat keluar
       GET /api/arsip/{id}      — bentuk item sama seperti list arsip
       GET /api/tugas/{id}      — { ...item list..., "deskripsi": ["..."],
           "checklist": [ { "text": "...", "done": false } ],
           "lampiran": [ { "type": "pdf", "name": "...", "meta": "..." } ],
           "aktivitas": [ { "icon": "check", "tone": "green", "text": "...", "time": "..." } ],
           "picRole": "Staf Polhut" }
     ============================================ */

  async function getSuratMasukDetail(id) {
    return request("GET", "/surat-masuk/" + id);
  }

  async function getSuratKeluarDetail(id) {
    return request("GET", "/surat-keluar/" + id);
  }

  async function getArsipDetail(id) {
    return request("GET", "/arsip/" + id);
  }

  async function getTugasDetail(id) {
    return request("GET", "/tugas/" + id);
  }

  /* ============================================
     BUAT TUGAS
     KONTRAK (LIVE):
       POST /api/tugas  (butuh token)
       Body   : { "judul": "...", "deskripsi": "...", "pic": "nama staf",
                  "prioritas": "TINGGI|NORMAL", "deadline": "2026-11-01"|null,
                  "lampiran": ["berkas.pdf"] }
       Balasan: item tugas baru (bentuk sama seperti GET /api/tugas)
       (kode, avatar, progress, status dibuat server)
     ============================================ */

  async function createTugas(payload) {
    return request("POST", "/tugas", payload);
  }

  /* ============================================
     DASHBOARD KEPALA SEKSI (agregat)
     KONTRAK (LIVE):
       GET /api/dashboard/kepala-seksi  (butuh token)
       Balasan: { "stats":   [ { "label": "...", "value": 24, "note": "...",
                                 "noteIcon": "trendUp", "tone": "blue", "icon": "inbox",
                                 "valueRed"?: true, "progress"?: 65 } ],
                  "actions": [ { "icon": "mail", "title": "...", "desc": "...",
                                 "tags": [ { "text": "...", "tone": "red" } ],
                                 "btn": { "text": "Review", "href": "...", "style": "blue" } } ],
                  "letters":  [ { "title": "...", "meta": "...", "accent": "blue"|"" } ],
                  "schedule": [ { "time": "13:00 - 15:00", "accent": "blue"|"",
                                  "name": "...", "place": "...", "placeIcon": "pin" } ],
                  "progress": [ { "label": "...", "percent": 85, "color": "#2563EB" } ] }
     ============================================ */

  async function getDashboardKS() {
    return request("GET", "/dashboard/kepala-seksi");
  }

  /* ============================================
     LAPORAN PER PERIODE
     KONTRAK (LIVE):
       GET /api/laporan?periode=YYYY-MM  (butuh token)
       Balasan: { "label": "September 2026", "updatedAt": "30 Sep 2026, 16:45",
                  "stats": [ { "value": "128", "label": "Surat Masuk", "sub": "...",
                               "icon": "inbox", "tone": "blue", "badge"?: {...} } ],
                  "progress": [ { "label": "...", "percent": 76, "color": "#...",
                                  "dot": "blue", "detail": "...", "detailTone"?: "..." } ],
                  "aktivitas": [ { "tanggal": "05 Sep 2026", "icon": "mail",
                                   "html": "..." } ] }
       Periode kosong -> 404
     ============================================ */

  async function getLaporan(periode) {
    return request("GET", "/laporan?periode=" + encodeURIComponent(periode));
  }

  /* ============================================
     REGISTRASI (publik, tanpa token)
     KONTRAK (LIVE):
       POST /api/register
       Body   : { "nama": "...", "id_pengguna": "...", "kata_sandi": "...",
                  "role": "admin|kepala-seksi|pegawai",
                  "resort": "Cilacap|Wonosobo|Pemalang" }
       Balasan: 201 { "status": "pending" }  -> menunggu verifikasi admin
                409 { "code": "duplicate" } -> ID/email sudah terdaftar
     ============================================ */

  async function register(payload) {
    if (!API_CONFIG.LIVE) return mockRegister(payload);
    try {
      return await request("POST", "/register", payload);
    } catch (err) {
      if (err.data && err.data.code === "duplicate") return { status: "duplicate" };
      throw err;
    }
  }

  /* ---------- MOCK REGISTRASI: replika localStorage lama ---------- */

  function mockRegister(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const daftar = JSON.parse(window.localStorage.getItem("eoffice_registrations") || "[]");
        daftar.push({
          nama: payload.nama,
          idAtauEmail: payload.id_pengguna,
          kataSandi: payload.kata_sandi,
          role: payload.role,
          resort: payload.resort || "",
          sumber: "registrasi-mandiri",
          status: "menunggu-verifikasi",
          daftarPada: new Date().toISOString()
        });
        window.localStorage.setItem("eoffice_registrations", JSON.stringify(daftar));
        resolve({ status: "pending" });
      }, 400);
    });
  }

  /* ============================================
     PROFIL PENGGUNA LOGIN
     KONTRAK (LIVE):
       GET /api/profil  (butuh token)
       Balasan: { "nama": "...", "jabatan": "...", "nip": "...",
                  "unit": "...", "email": "...", "telepon": "..." }
       PUT /api/profil  (butuh token)
       Body   : { "nama": "...", "email": "...", "telepon": "..." }
       POST /api/profil/password  (butuh token)
       Body   : { "kata_sandi_lama": "...", "kata_sandi_baru": "..." }
       Galat  : 422 kata sandi lama salah
     ============================================ */

  async function getProfil() {
    return request("GET", "/profil");
  }

  async function updateProfil(payload) {
    return request("PUT", "/profil", payload);
  }

  async function gantiKataSandi(kataSandiLama, kataSandiBaru) {
    return request("POST", "/profil/password", {
      kata_sandi_lama: kataSandiLama,
      kata_sandi_baru: kataSandiBaru
    });
  }

  /* ============================================
     ENDPOINT PEGAWAI (scope: user pemilik token —
     server memfilter data sesuai pegawai login)
     KONTRAK (LIVE), semua butuh token:
       GET /api/surat-saya        — item: bentuk surat pegawai (jenis, sifat, status, iso, label{dot}, ...)
       GET /api/tugas-saya        — item: bentuk tugas pegawai (judul, status{text}, selesai, ...)
       GET /api/tugas-saya/{id}   — detail + checklist, lampiran, aktivitas (seperti /tugas/{id})
       GET /api/disposisi-saya    — item: disposisi untuk pegawai
       GET /api/dokumen-saya      — item: dokumen pegawai
       GET /api/arsip-saya        — item: arsip pegawai (bentuk sama seperti /arsip)
       GET /api/jadwal-saya       — { "hariIni": "...", "agenda": [...] } (seperti /jadwal)
       GET /api/notifikasi-saya   — item: bentuk sama seperti /notifikasi
     ============================================ */

  async function getSuratSaya() {
    return request("GET", "/surat-saya");
  }

  async function getTugasSaya() {
    return request("GET", "/tugas-saya");
  }

  async function getTugasSayaDetail(id) {
    return request("GET", "/tugas-saya/" + id);
  }

  async function getDisposisiSaya() {
    return request("GET", "/disposisi-saya");
  }

  async function getDokumenSaya() {
    return request("GET", "/dokumen-saya");
  }

  async function getArsipSaya() {
    return request("GET", "/arsip-saya");
  }

  async function getJadwalSaya() {
    return request("GET", "/jadwal-saya");
  }

  async function getNotifikasiSaya() {
    return request("GET", "/notifikasi-saya");
  }

  /* ============================================
     DETAIL PEGAWAI (per-ID)
     KONTRAK (LIVE): GET /api/{surat|disposisi|dokumen|arsip}-saya/{id}
     Bentuk item sama seperti endpoint list masing-masing;
     disposisi-saya/{id} menambah: instruksi, catatan, checklist, timeline.
     ============================================ */

  async function getSuratSayaDetail(id) {
    return request("GET", "/surat-saya/" + id);
  }

  async function getDisposisiSayaDetail(id) {
    return request("GET", "/disposisi-saya/" + id);
  }

  async function getDokumenSayaDetail(id) {
    return request("GET", "/dokumen-saya/" + id);
  }

  async function getArsipSayaDetail(id) {
    return request("GET", "/arsip-saya/" + id);
  }

  /* ============================================
     DASHBOARD PEGAWAI (agregat)
     KONTRAK (LIVE):
       GET /api/dashboard/pegawai  (butuh token)
       Balasan: { "stats": [...], "prioritas": [...], "disposisi": [...] }
       (struktur mengikuti kartu dashboard pegawai: stats, prioritas, disposisi)
     ============================================ */

  async function getDashboardPegawai() {
    return request("GET", "/dashboard/pegawai");
  }

  /* ============================================
     BUAT / AJUKAN SURAT KELUAR (pegawai & admin)
     KONTRAK (LIVE):
       POST /api/surat-keluar  (butuh token)
       Body   : { "nomor": "...", "tanggal": "2026-10-27"|null, "penerima": "...",
                  "perihal": "...", "isi": "...", "sifat": "Biasa",
                  "lampiran": [ { "name": "...", "size": "2.4 MB" } ],
                  "status": "Draft|Diajukan" }
       Balasan: item surat keluar baru (bentuk sama seperti GET /api/surat-saya)
       (nomor kosong -> dibuat otomatis server)
     ============================================ */

  async function createSuratKeluar(payload) {
    return request("POST", "/surat-keluar", payload);
  }

  /* ============================================
     ENDPOINT ADMIN (butuh token role admin)
     KONTRAK (LIVE):

       GET /api/users
       Balasan: [ { "id": 1, "nama": "...", "nip": "...", "avatar": "AR",
                    "avatarTone": "blue", "username": "...", "email": "...",
                    "roleLabel": "KEPALA SEKSI", "roleType": "blue", "roleGroup": "Kepala Seksi",
                    "unit": "...", "unitSub": "...", "unitGroup": "...",
                    "status": "AKTIF|NONAKTIF|MENUNGGU", "lastLogin": "...", "online": false } ]

       POST /api/users — tambah pengguna (bisa juga live-mode buatan admin)
       Body   : { "nama": "...", "nip": "...", "username": "...", "email": "...",
                  "role": "admin|kepala-seksi|pegawai", "unit": "...", "kata_sandi": "..." }
       Balasan: objek pengguna baru

       DELETE /api/users/{id}

       GET /api/registrations — antrean pendaftar (hasil POST /register)
       Balasan: [ { "id": "...", "nama": "...", "idAtauEmail": "...", "role": "...",
                    "status": "menunggu-verifikasi|aktif|ditolak", "daftarPada": "ISO-8601" } ]

       PUT /api/registrations/{id}/status
       Body   : { "status": "aktif"|"ditolak" }

       POST /api/surat-masuk — input surat masuk oleh admin
       Body   : { "nomor": "...", "asal": "...", "tanggal": "2026-10-27",
                  "perihal": "...", "instruksi": "...", "lampiran": [...] }
       Balasan: objek surat masuk baru (bentuk sama seperti GET /api/surat-masuk)

       GET /api/dashboard/admin — agregat dashboard admin
       Balasan: { "stats": [...], "chartTabs": [...], "chartData": [...],
                  "auditTrail": [...], "health": [...] }
     ============================================ */

  async function getUsers() {
    return request("GET", "/users");
  }

  async function createUser(payload) {
    return request("POST", "/users", payload);
  }

  async function deleteUser(id) {
    return request("DELETE", "/users/" + id);
  }

  async function getRegistrations() {
    return request("GET", "/registrations");
  }

  async function verifyRegistration(id, status) {
    return request("PUT", "/registrations/" + id + "/status", { status: status });
  }

  async function createSuratMasuk(payload) {
    return request("POST", "/surat-masuk", payload);
  }

  async function getDashboardAdmin() {
    return request("GET", "/dashboard/admin");
  }

  /* ============================================
     SURAT TERBARU DIINPUT (gabungan masuk+keluar, admin)
     KONTRAK (LIVE):
       GET /api/surat-terbaru  (butuh token admin)
       Balasan: [ { "id": 1, "nomor": "...", "jenis": "MASUK|KELUAR",
                    "pihak": "...", "perihal": "...", "tanggal": "04 Sep 2026",
                    "status": "Terdaftar" } ]
       (halaman detail mengambil dari list ini berdasarkan ?id=)
     ============================================ */

  async function getSuratTerbaru() {
    return request("GET", "/surat-terbaru");
  }

  /* ============================================
     BACKUP (admin)
     KONTRAK (LIVE):
       GET  /api/backup     — { "stats": [...], "modules": [...], "history": [...] }
       POST /api/backup/run — jalankan backup manual,
                              balasan: objek riwayat backup baru
     ============================================ */

  async function getBackup() {
    return request("GET", "/backup");
  }

  async function runBackup() {
    return request("POST", "/backup/run");
  }

  /* ============================================
     EXPORT DATA (admin)
     KONTRAK (LIVE):
       GET  /api/export  — { "stats": [...], "exports": [...], "reports": [...] }
       POST /api/export  — Body: { "jenis": "...", "format": "PDF|XLSX|CSV" }
                           Balasan: objek laporan baru berstatus "Diproses"
     ============================================ */

  async function getExport() {
    return request("GET", "/export");
  }

  async function createExport(payload) {
    return request("POST", "/export", payload);
  }

  /* ============================================
     PROFIL ADMIN
     KONTRAK (LIVE):
       GET /api/admin/profil
       Balasan: { "nama": "...", "jabatan": "...", "email": "...", "telepon": "...",
                  "akses": [...], "aktivitas": [...], "loginInfo": {...} }
       PUT /api/admin/profil — Body: { "nama", "email", "telepon" }
     ============================================ */

  async function getAdminProfil() {
    return request("GET", "/admin/profil");
  }

  async function updateAdminProfil(payload) {
    return request("PUT", "/admin/profil", payload);
  }

  /* ============================================
     NOTIFIKASI ADMIN
     KONTRAK (LIVE):
       GET /api/notifikasi-admin
       Balasan: [ { "id": "...", "kategori": "Sistem|Surat|Registrasi",
                    "icon": "database|mail|alert|megaphone|userPlus",
                    "judul": "...", "teks": "...", "waktu": "ISO-8601",
                    "link": "data-pengguna.html"|null } ]
     ============================================ */

  async function getNotifikasiAdmin() {
    return request("GET", "/notifikasi-admin");
  }

  /* ============================================
     LUPA KATA SANDI (publik)
     KONTRAK (LIVE):
       POST /api/lupa-password
       Body   : { "id_pengguna": "...", "kata_sandi_baru": "..." }
       (pengiriman OTP via email ditangani alur server; endpoint ini
        dipanggil setelah OTP diverifikasi)
     ============================================ */

  async function lupaPassword(idPengguna, kataSandiBaru) {
    if (!API_CONFIG.LIVE) {
      // Mock: perbarui kata sandi di localStorage (perilaku lama)
      return new Promise((resolve) => {
        setTimeout(() => {
          try {
            const regs = JSON.parse(window.localStorage.getItem("eoffice_registrations") || "[]");
            const idx = regs.findIndex((r) => String(r.idAtauEmail).toLowerCase() === String(idPengguna).toLowerCase());
            if (idx >= 0) {
              regs[idx].kataSandi = kataSandiBaru;
              window.localStorage.setItem("eoffice_registrations", JSON.stringify(regs));
            }
          } catch (e) { /* abaikan */ }
          resolve({ status: "ok" });
        }, 400);
      });
    }
    return request("POST", "/lupa-password", {
      id_pengguna: idPengguna,
      kata_sandi_baru: kataSandiBaru
    });
  }

  /* ---------- API publik ---------- */
  return {
    config: API_CONFIG,
    getToken: getToken,
    login: login,
    logout: logout,
    getSuratMasuk: getSuratMasuk,
    getSuratKeluar: getSuratKeluar,
    getDisposisi: getDisposisi,
    createDisposisi: createDisposisi,
    getNotifikasi: getNotifikasi,
    markNotifikasiRead: markNotifikasiRead,
    markAllNotifikasiRead: markAllNotifikasiRead,
    getTugas: getTugas,
    getArsip: getArsip,
    getJadwal: getJadwal,
    getStaf: getStaf,
    getSuratMasukDetail: getSuratMasukDetail,
    getSuratKeluarDetail: getSuratKeluarDetail,
    getArsipDetail: getArsipDetail,
    getTugasDetail: getTugasDetail,
    createTugas: createTugas,
    getDashboardKS: getDashboardKS,
    getLaporan: getLaporan,
    register: register,
    getProfil: getProfil,
    updateProfil: updateProfil,
    gantiKataSandi: gantiKataSandi,
    getSuratSaya: getSuratSaya,
    getTugasSaya: getTugasSaya,
    getTugasSayaDetail: getTugasSayaDetail,
    getDisposisiSaya: getDisposisiSaya,
    getDokumenSaya: getDokumenSaya,
    getArsipSaya: getArsipSaya,
    getJadwalSaya: getJadwalSaya,
    getNotifikasiSaya: getNotifikasiSaya,
    getSuratSayaDetail: getSuratSayaDetail,
    getDisposisiSayaDetail: getDisposisiSayaDetail,
    getDokumenSayaDetail: getDokumenSayaDetail,
    getArsipSayaDetail: getArsipSayaDetail,
    getDashboardPegawai: getDashboardPegawai,
    createSuratKeluar: createSuratKeluar,
    getUsers: getUsers,
    createUser: createUser,
    deleteUser: deleteUser,
    getRegistrations: getRegistrations,
    verifyRegistration: verifyRegistration,
    createSuratMasuk: createSuratMasuk,
    getDashboardAdmin: getDashboardAdmin,
    getSuratTerbaru: getSuratTerbaru,
    getBackup: getBackup,
    runBackup: runBackup,
    getExport: getExport,
    createExport: createExport,
    getAdminProfil: getAdminProfil,
    updateAdminProfil: updateAdminProfil,
    getNotifikasiAdmin: getNotifikasiAdmin,
    lupaPassword: lupaPassword,
    request: request // untuk endpoint baru: selalu lewat sini
  };
})();
