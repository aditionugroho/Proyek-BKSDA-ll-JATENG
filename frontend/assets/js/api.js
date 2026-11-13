/* ============================================
   API LAYER â€” E-Office SKSDA
   Satu-satunya gerbang komunikasi frontend <-> backend Laravel.
   Halaman TIDAK boleh memanggil fetch() langsung;
   selalu lewat EOfficeAPI.<fungsi>().

   DUA MODE:
   - API_CONFIG.LIVE = false -> MODE MOCK: data lokal
     (localStorage / modul data), dipakai selama backend belum siap.
   - API_CONFIG.LIVE = true  -> MODE LIVE: fetch ke Laravel.
     Cukup ganti satu flag, semua halaman ikut.

   Kontrak JSON tiap endpoint didokumentasikan di atas fungsinya â€”
   jadikan acuan bersama dengan developer backend.
   ============================================ */

const API_CONFIG = {
  LIVE: true,
  BASE_URL: "http://127.0.0.1:8080/api",
  TIMEOUT_MS: 10000,
};

const EOfficeAPI = (() => {
  const TOKEN_KEY = "eoffice_token";

  /* ---------- PENYIMPANAN TOKEN ---------- */

  function getToken() {
    return window.sessionStorage.getItem(TOKEN_KEY) ||
      window.localStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token, remember = true) {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_KEY);

    if (token) {
      const storage = remember
        ? window.localStorage
        : window.sessionStorage;

      storage.setItem(TOKEN_KEY, token);
    }
  }

  /* ---------- CORE: satu fungsi fetch untuk semua endpoint ---------- */

  /**
   * Mengambil foto patroli privat menggunakan Bearer Token.
   * Hasil berupa Blob, bukan JSON.
   */
  async function getFotoPatroli(fotoId) {
    const id = Number(fotoId);

    if (!Number.isSafeInteger(id) || id < 1) {
      throw new Error("ID foto tidak valid.");
    }

    const token = getToken();

    if (!token) {
      throw new Error("Sesi login tidak ditemukan.");
    }

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      30000
    );

    try {
      const res = await fetch(
        API_CONFIG.BASE_URL + "/laporan-patroli/foto/" + id,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
            Accept: "image/jpeg, image/png"
          },
          signal: controller.signal,
          cache: "no-store"
        }
      );

      if (!res.ok) {
        throw new Error(
          "Gagal mengambil foto patroli (HTTP " +
          res.status + ")."
        );
      }

      const mime = (
        res.headers.get("content-type") || ""
      ).split(";")[0].trim().toLowerCase();

      if (!["image/jpeg", "image/png"].includes(mime)) {
        throw new Error("Respons server bukan gambar yang didukung.");
      }

      return await res.blob();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Waktu pengambilan foto habis.");
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async function request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);
    try {
      const res = await fetch(API_CONFIG.BASE_URL + path, {
        method: method,
        headers: Object.assign(
          {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          getToken() ? { Authorization: "Bearer " + getToken() } : {},
        ),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(
          (data && data.message) || "Terjadi kesalahan pada server.",
        );
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
    if (!API_CONFIG.LIVE) {
      return mockLogin(idPengguna, kataSandi);
    }

    try {
      const res = await request("POST", "/auth/login", {
        username: idPengguna,
        password: kataSandi,
      });

      const result = res && res.data;

      if (!result || !result.token || !result.user) {
        throw new Error("Format respons login backend tidak sesuai.");
      }

      // Role asli dari CodeIgniter
      // disesuaikan dengan nama folder frontend.
      const allowedRoles = {
        admin: "admin",
        kepala_seksi: "kepala-seksi",
        staf: "pegawai",
      };

      const uiRole = allowedRoles[result.user.role];

      if (!uiRole) {
        throw new Error("Role akun tidak dikenali.");
      }

      setToken(result.token, false);

      return {
        status: "ok",
        token: result.token,
        user: Object.assign({}, result.user, {
          role: uiRole,
        }),
      };
    } catch (err) {
      const code = err.data && err.data.code;

      if (code === "pending") {
        return { status: "pending" };
      }

      if (code === "rejected") {
        return { status: "rejected" };
      }

      if (err.status === 401) {
        return { status: "invalid" };
      }

      throw err;
    }
  }

  /* ---------- MOCK LOGIN: replika logika localStorage lama ---------- */

  function mockLogin(idPengguna, kataSandi) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let match = null;
        try {
          const regs = JSON.parse(
            window.localStorage.getItem("eoffice_registrations") || "[]",
          );
          const v = String(idPengguna).toLowerCase();
          match =
            regs.find(function (r) {
              return (
                String(r.idAtauEmail).toLowerCase() === v ||
                String(r.nama).toLowerCase() === v
              );
            }) || null;
        } catch (e) {
          match = null;
        }

        if (match && match.status === "ditolak")
          return resolve({ status: "rejected" });
        if (match && match.status === "menunggu-verifikasi")
          return resolve({ status: "pending" });
        if (
          match &&
          match.status === "aktif" &&
          match.kataSandi &&
          kataSandi !== match.kataSandi
        ) {
          return resolve({ status: "invalid" });
        }

        // Tanpa registrasi cocok (mode demo) role tetap dari dropdown halaman.
        resolve({
          status: "ok",
          token: "mock-token",
          user: match
            ? { id: match.idAtauEmail, nama: match.nama, role: null }
            : { id: idPengguna, nama: idPengguna, role: null },
        });
      }, 400); // simulasi latensi jaringan
    });
  }

  /* ============================================
     LOGOUT
     LIVE: POST /api/logout (menghapus token di server, butuh Authorization)
     ============================================ */

  async function logout() {
    try {
      if (API_CONFIG.LIVE && getToken()) {
        await request("POST", "/auth/logout");
      }
    } catch (error) {
      console.warn("Logout backend gagal. Sesi lokal tetap diakhiri.");
    } finally {
      setToken(null);

      window.localStorage.removeItem("eoffice_session");
      window.sessionStorage.removeItem("eoffice_session");
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
       terdaftar â€” bila nomor tidak ditemukan: 422 { "message": "Nomor surat
       tidak ditemukan. Periksa kembali nomor surat masuk." }
     ============================================ */

  async function getDisposisi() {
    return request("GET", "/disposisi");
  }

  async function createDisposisi(payload) {
    return request("POST", "/disposisi", payload);
  }

  async function tindakLanjutDisposisi(id, hasil) {
    return request(
      "PATCH",
      "/disposisi/" + encodeURIComponent(id) + "/tindak-lanjut",
      { hasil_tindak_lanjut: hasil },
    );
  }

  async function selesaikanDisposisi(id) {
    return request(
      "PATCH",
      "/disposisi/" + encodeURIComponent(id) + "/selesai",
      {},
    );
  }

  // TERIMA DISPOSISI
  async function terimaDisposisi(id) {
    return request(
      "PATCH",
      "/disposisi/" + encodeURIComponent(id) + "/terima",
      {},
    );
  }

  // MINTA KLARIFIKASI
  async function mintaKlarifikasi(id, pertanyaan) {
    return request(
      "POST",
      "/disposisi/" + encodeURIComponent(id) + "/klarifikasi",
      {
        pertanyaan: pertanyaan,
      },
    );
  }

  /* ============================================
     NOTIFIKASI
     KONTRAK (LIVE):
       Tipe yang dipicu SERVER (frontend tidak membuat notif):
       - suratMasukBaru   (admin input surat  -> utk KS)
       - disposisiBaru    (KS kirim disposisi -> utk pegawai tujuan)
       - patroliBaru      (petugas kirim laporan patroli -> utk KS)
       - statusBerubah    (disposisi selesai / laporan direview -> utk pihak terkait)
       GET  /api/notifikasi  (butuh token)
       Balasan: [ { "id": 1, "tipe": "suratMasukBaru", "kategori": "surat",
                    "judul": "...", "teks": "...", "meta": "...", "waktu": "5 mnt lalu",
                    "unread": true, "penting": false,
                    "badges": [ { "text": "Baru", "tone": "blue" } ],
                    "aksi": { "label": "Lihat Surat", "href": "...", "icon": "arrowUpRight", "style": "blue" } } ]

       POST /api/notifikasi/{id}/read     â€” tandai satu dibaca
       POST /api/notifikasi/read-all      â€” tandai semua dibaca
     ============================================ */

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
     (hariIni dipakai sebagai acuan highlight kalender â€” tanggal server lebih tepercaya)
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

  async function getStafTujuan() {
    return request("GET", "/disposisi/staf-tujuan");
  }

  /* ============================================
     DETAIL (per-ID)
     KONTRAK (LIVE): pola sama untuk semua resource â€”
       GET /api/surat-masuk/{id}
         Balasan (rata/di-flatten untuk halaman detail):
         { "nomor": "...", "status": "Menunggu Disposisi", "prioritas": "Segera",
           "sifat": "Biasa", "tanggalDiterima": "24 Okt 2023, 09:15 WIB",
           "pengirimFull": "...", "nomorAsli": "...", "tanggalSurat": "...",
           "perihal": "...", "klasifikasi": ["000 - Umum"],
           "fileName": "Dokumen_Surat.pdf", "fileSize": "1.2 MB" }
       GET /api/surat-keluar/{id} â€” bentuk item sama seperti list surat keluar
       GET /api/arsip/{id}      â€” bentuk item sama seperti list arsip
       GET /api/tugas/{id}      â€” { ...item list..., "deskripsi": ["..."],
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


  async function reviewTugas(id, action, reason = "") {
    return request(
      "PATCH",
      "/tugas/" + encodeURIComponent(id) + "/review",
      { action, reason }
    );
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
     TARGET VS REALISASI TRIWULAN
     KONTRAK (LIVE):
       GET /api/target-realisasi?tahun=2026&resort=Cilacap  (butuh token)
       resort opsional ("semua" / kosong = agregat seluruh resort)
       Balasan: { "anggaran": [ { "tw": "TW I", "target": 100, "realisasi": 91 },
                                { "tw": "TW II", ... }, { "tw": "TW III", ... }, { "tw": "TW IV", ... } ],
                  "kinerja":  [ bentuk sama ] }
       (nilai dalam persen; target umumnya 100; triwulan belum berjalan = 0)
     ============================================ */

  async function getTargetRealisasi(tahun, resort) {
    const q =
      "tahun=" +
      encodeURIComponent(tahun) +
      (resort && resort !== "semua"
        ? "&resort=" + encodeURIComponent(resort)
        : "");
    return request("GET", "/target-realisasi?" + q);
  }

  /* ============================================
     LAPORAN PATROLI (petugas lapangan, dari HP)
     KONTRAK (LIVE):
       POST /api/laporan-patroli  (butuh token, multipart/form-data)
       Field  : tanggal=2026-11-02, resort=Cilacap|Wonosobo|Pemalang,
                catatan="...", foto[]=<file gambar> (0..n buah)
       Petugas TIDAK dikirim dari form â€” diambil server dari token.
       Balasan: 201 objek laporan baru (bentuk sama seperti GET)

       GET /api/laporan-patroli  (butuh token)
       Query opsional: ?resort=&petugas=&dari=YYYY-MM-DD&sampai=YYYY-MM-DD
       HAK AKSES: server HARUS memfilter sesuai role & resort yang
       diizinkan untuk pemilik token (mis. KS Wilayah II hanya resort
       Wilayah II) â€” data resort lain tidak pernah dikirim ke browser.
       Balasan: [ { "id": 1, "petugas": "Budi Santoso", "resort": "Cilacap",
                    "tanggal": "2026-11-02", "catatan": "...",
                    "status": "Terkirim|Direview", "dibuatPada": "ISO-8601",
                    "foto": [ "https://.../foto1.jpg" ] } ]

       GET /api/laporan-patroli/{id} â€” satu laporan + array foto
     ============================================ */

  async function getLaporanPatroli() {
    return request("GET", "/laporan-patroli");
  }

  async function getLaporanPatroliDetail(id) {
    return request("GET", "/laporan-patroli/" + id);
  }

  async function createLaporanPatroli(payload) {
    if (!API_CONFIG.LIVE) {
      return mockCreatePatroli(payload);
    }

    const data = {
      tanggal_patroli: payload.tanggal,
      resort_id: Number(payload.resort),
      lokasi: payload.lokasi || "",
      keterangan: payload.catatan
    };

    return request("POST", "/laporan-patroli", data);
  }


  async function uploadFotoPatroli(laporanId, file) {
    if (!API_CONFIG.LIVE) {
      throw new Error("Upload foto hanya tersedia pada mode LIVE.");
    }

    if (!Number.isInteger(Number(laporanId)) || Number(laporanId) < 1) {
      throw new Error("ID laporan patroli tidak valid.");
    }

    if (!(file instanceof File)) {
      throw new Error("Foto harus berupa File.");
    }

    const form = new FormData();
    form.append("foto", file, file.name);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    try {
      const headers = {
        Accept: "application/json"
      };

      const token = getToken();
      if (token) {
        headers.Authorization = "Bearer " + token;
      }

      const response = await fetch(
        API_CONFIG.BASE_URL + "/laporan-patroli/" +
          encodeURIComponent(laporanId) + "/foto",
        {
          method: "POST",
          headers,
          body: form,
          signal: controller.signal
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          data.message || "Gagal mengunggah foto patroli."
        );
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Upload foto terlalu lama. Coba lagi.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- MOCK: localStorage (foto base64, bertahan antar-refresh) ---------- */

  function mockCreatePatroli(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let session = null;
        try {
          session = JSON.parse(
            window.sessionStorage.getItem("eoffice_session") ||
              window.localStorage.getItem("eoffice_session") ||
              "null",
          );
        } catch (e) {}
        const KEY = "eoffice_laporan_patroli";
        let daftar = [];
        try {
          daftar = JSON.parse(window.localStorage.getItem(KEY) || "[]");
        } catch (e) {}
        const baru = {
          id: "LP-" + Date.now(),
          petugas: (session && session.userId) || "Petugas",
          resort: payload.resort,
          tanggal: payload.tanggal,
          catatan: payload.catatan,
          status: "Terkirim",
          dibuatPada: new Date().toISOString(),
          foto: (payload.foto || []).filter((f) => typeof f === "string"),
        };
        daftar.unshift(baru);
        window.localStorage.setItem(KEY, JSON.stringify(daftar));
        resolve(baru);
      }, 500);
    });
  }

  function mockGetPatroli() {
    try {
      return JSON.parse(
        window.localStorage.getItem("eoffice_laporan_patroli") || "[]",
      );
    } catch (e) {
      return [];
    }
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
    if (!API_CONFIG.LIVE) {
      throw new Error("Registrasi membutuhkan koneksi backend.");
    }

    return request("POST", "/auth/register", {
      name: payload.name,
      email: payload.email,
      username: payload.username,
      password: payload.password,
      resort_id: payload.resort_id
    });
  }

  async function getResortsPublic() {
    return request("GET", "/public/resorts?status=1");
  }

  async function requestPasswordOtp(email) {
    return request("POST", "/auth/forgot-password", {
      email: email
    });
  }

  async function verifyPasswordOtp(email, otp) {
    return request("POST", "/auth/verify-otp", {
      email: email,
      otp: otp
    });
  }

  async function resetPasswordWithToken(token, password, confirmation) {
    return request("POST", "/auth/reset-password", {
      reset_token: token,
      new_password: password,
      confirm_password: confirmation
    });
  }

  /* ---------- MOCK REGISTRASI: replika localStorage lama ---------- */

  function mockRegister(payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const daftar = JSON.parse(
          window.localStorage.getItem("eoffice_registrations") || "[]",
        );
        daftar.push({
          nama: payload.nama,
          idAtauEmail: payload.id_pengguna,
          kataSandi: payload.kata_sandi,
          role: payload.role,
          resort: payload.resort || "",
          sumber: "registrasi-mandiri",
          status: "menunggu-verifikasi",
          daftarPada: new Date().toISOString(),
        });
        window.localStorage.setItem(
          "eoffice_registrations",
          JSON.stringify(daftar),
        );
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
      kata_sandi_baru: kataSandiBaru,
    });
  }

  /* ============================================
     ENDPOINT PEGAWAI (scope: user pemilik token â€”
     server memfilter data sesuai pegawai login)
     KONTRAK (LIVE), semua butuh token:
       GET /api/surat-saya        â€” item: bentuk surat pegawai (jenis, sifat, status, iso, label{dot}, ...)
       GET /api/tugas-saya        â€” item: bentuk tugas pegawai (judul, status{text}, selesai, ...)
       GET /api/tugas-saya/{id}   â€” detail + checklist, lampiran, aktivitas (seperti /tugas/{id})
       GET /api/disposisi-saya    â€” item: disposisi untuk pegawai
       GET /api/dokumen-saya      â€” item: dokumen pegawai
       GET /api/arsip-saya        â€” item: arsip pegawai (bentuk sama seperti /arsip)
       GET /api/jadwal-saya       â€” { "hariIni": "...", "agenda": [...] } (seperti /jadwal)
       GET /api/notifikasi-saya   â€” item: bentuk sama seperti /notifikasi
     ============================================ */

  async function getSuratSaya() {
    const [masukResponse, keluarResponse] = await Promise.all([
      getSuratMasuk(),
      getSuratKeluar(),
    ]);

    if (masukResponse?.status !== true || keluarResponse?.status !== true) {
      throw new Error("Gagal mengambil data surat pegawai.");
    }

    const masuk = Array.isArray(masukResponse.data) ? masukResponse.data : [];

    const keluar = Array.isArray(keluarResponse.data)
      ? keluarResponse.data
      : [];

    return [
      ...masuk.map((s) => ({ ...s, jenis: "masuk" })),
      ...keluar.map((s) => ({ ...s, jenis: "keluar" })),
    ];
  }

  async function getTugasSaya() {
    return request("GET", "/tugas");
  }


  async function updateTugasProgress(id, progress) {
    return request(
      "PATCH",
      "/tugas/" + encodeURIComponent(id) + "/progress",
      { progress }
    );
  }


  async function getKomentarTugas(id) {
    return request(
      "GET",
      "/tugas/" + encodeURIComponent(id) + "/komentar"
    );
  }

  async function kirimKomentarTugas(id, isi) {
    return request(
      "POST",
      "/tugas/" + encodeURIComponent(id) + "/komentar",
      { isi }
    );
  }

  async function getAktivitasTugas(id) {
    return request(
      "GET",
      "/tugas/" + encodeURIComponent(id) + "/aktivitas"
    );
  }

  async function getTugasSayaDetail(id) {
    return request("GET", "/tugas/" + encodeURIComponent(id));
  }

  async function getDisposisiSaya() {
    return request("GET", "/disposisi");
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
  async function createJadwalSaya(data) {
    return request("POST", "/jadwal-saya", data);
  }

  async function updateJadwalSaya(id, data) {
    return request("PUT", `/jadwal-saya/${id}`, data);
  }

  async function deleteJadwalSaya(id) {
    return request("DELETE", `/jadwal-saya/${id}`);
  }

  /* ============================================
     DETAIL PEGAWAI (per-ID)
     KONTRAK (LIVE): GET /api/{surat|disposisi|dokumen|arsip}-saya/{id}
     Bentuk item sama seperti endpoint list masing-masing;
     disposisi-saya/{id} menambah: instruksi, catatan, checklist, timeline.
     ============================================ */

  async function getSuratSayaDetail(id, jenis = "masuk") {
    if (!["masuk", "keluar"].includes(jenis)) {
      throw new Error("Jenis surat tidak valid.");
    }

    const endpoint = jenis === "keluar" ? "/surat-keluar/" : "/surat-masuk/";

    return request("GET", endpoint + encodeURIComponent(id));
  }

  async function getDisposisiSayaDetail(id) {
    return request("GET", "/disposisi/" + id);
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

       POST /api/users â€” tambah pengguna (bisa juga live-mode buatan admin)
       Body   : { "nama": "...", "nip": "...", "username": "...", "email": "...",
                  "role": "admin|kepala-seksi|pegawai", "unit": "...", "kata_sandi": "..." }
       Balasan: objek pengguna baru

       DELETE /api/users/{id}

       GET /api/registrations â€” antrean pendaftar (hasil POST /register)
       Balasan: [ { "id": "...", "nama": "...", "idAtauEmail": "...", "role": "...",
                    "status": "menunggu-verifikasi|aktif|ditolak", "daftarPada": "ISO-8601" } ]

       PUT /api/registrations/{id}/status
       Body   : { "status": "aktif"|"ditolak" }

       POST /api/surat-masuk â€” input surat masuk oleh admin
       Body   : { "nomor": "...", "asal": "...", "tanggal": "2026-10-27",
                  "perihal": "...", "instruksi": "...", "lampiran": [...] }
       Balasan: objek surat masuk baru (bentuk sama seperti GET /api/surat-masuk)

       GET /api/dashboard/admin â€” agregat dashboard admin
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
    return request("PUT", "/registrations/" + id + "/status", {
      status: status,
    });
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
    const [masukResponse, keluarResponse] = await Promise.all([
      request("GET", "/surat-masuk"),
      request("GET", "/surat-keluar")
    ]);

    function extractRows(response) {
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.data)) return response.data;
      if (Array.isArray(response?.data?.data)) return response.data.data;
      return [];
    }

    const masuk = extractRows(masukResponse).map((item) => ({
      id: item.id,
      nomor: item.no_surat || item.nomor || "-",
      jenis: "MASUK",
      file_path: item.file_path || null,
      pihak: item.asal || "-",
      perihal: item.perihal || "-",
      tanggal: item.tanggal || item.created_at || "",
      status: item.status || "Terdaftar",
      created_at: item.created_at || item.tanggal || "",
      raw: item
    }));

    const keluar = extractRows(keluarResponse).map((item) => ({
      id: item.id,
      nomor: item.no_surat || item.nomor || "-",
      jenis: "KELUAR",
      file_path: item.file_path || null,
      pihak: item.tujuan || item.penerima || "-",
      perihal: item.perihal || "-",
      tanggal: item.tanggal || item.created_at || "",
      status: item.status || "Terdaftar",
      created_at: item.created_at || item.tanggal || "",
      raw: item
    }));

    return [...masuk, ...keluar].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  /* ============================================
     BACKUP (admin)
     KONTRAK (LIVE):
       GET  /api/backup     â€” { "stats": [...], "modules": [...], "history": [...] }
       POST /api/backup/run â€” jalankan backup manual,
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
       GET  /api/export  â€” { "stats": [...], "exports": [...], "reports": [...] }
       POST /api/export  â€” Body: { "jenis": "...", "format": "PDF|XLSX|CSV" }
                           Balasan: objek laporan baru berstatus "Diproses"
     ============================================ */

  async function getExport() {
    return request("GET", "/export");
  }

  async function downloadExportResponse(response, fallbackName) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Export gagal (HTTP " + response.status + ")");
    }

    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1].replace(/[\\/]/g, "_") : fallbackName;

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    return { success: true, filename };
  }

  async function createExport(payload) {
    const token = getToken();

    if (!token) throw new Error("Silakan login kembali.");

    const response = await fetch(API_CONFIG.BASE_URL + "/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    });

    return downloadExportResponse(
      response,
      "export_" + payload.jenis + "." + payload.format.toLowerCase()
    );
  }

  async function downloadExport(id) {
    const token = getToken();

    if (!token) throw new Error("Silakan login kembali.");

    const response = await fetch(
      API_CONFIG.BASE_URL + "/export/" + encodeURIComponent(id) + "/download",
      {
        headers: {
          "Accept": "*/*",
          "Authorization": "Bearer " + token
        }
      }
    );

    return downloadExportResponse(response, "export_" + id);
  }
/* ============================================
     PROFIL ADMIN
     KONTRAK (LIVE):
       GET /api/admin/profil
       Balasan: { "nama": "...", "jabatan": "...", "email": "...", "telepon": "...",
                  "akses": [...], "aktivitas": [...], "loginInfo": {...} }
       PUT /api/admin/profil â€” Body: { "nama", "email", "telepon" }
     ============================================ */

  async function getAdminProfil() {
    return getProfil();
  }

  async function updateAdminProfil(payload) {
    return updateProfil(payload);
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
            const regs = JSON.parse(
              window.localStorage.getItem("eoffice_registrations") || "[]",
            );
            const idx = regs.findIndex(
              (r) =>
                String(r.idAtauEmail).toLowerCase() ===
                String(idPengguna).toLowerCase(),
            );
            if (idx >= 0) {
              regs[idx].kataSandi = kataSandiBaru;
              window.localStorage.setItem(
                "eoffice_registrations",
                JSON.stringify(regs),
              );
            }
          } catch (e) {
            /* abaikan */
          }
          resolve({ status: "ok" });
        }, 400);
      });
    }
    return request("POST", "/lupa-password", {
      id_pengguna: idPengguna,
      kata_sandi_baru: kataSandiBaru,
    });
  }

  /* ---------- API publik ---------- */

  async function getNotifikasi() {
    return request("GET", "/notifikasi");
  }

  async function getNotifikasiSaya() {
    return getNotifikasi();
  }

  async function markNotifikasiRead(id) {
    return request("PATCH", "/notifikasi/" + encodeURIComponent(id) + "/read");
  }

  async function markAllNotifikasiRead() {
    return request("PATCH", "/notifikasi/read-all");
  }

  // Unduh file surat masuk menggunakan token login.
  async function downloadLampiranSuratMasuk(id) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(
        API_CONFIG.BASE_URL +
          "/surat-masuk/" +
          encodeURIComponent(id) +
          "/file",
        {
          method: "GET",
          headers: {
            Accept: "application/octet-stream, application/pdf, */*",
            Authorization: "Bearer " + getToken(),
          },
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Gagal mengunduh lampiran surat.");
      }

      const blob = await response.blob();

      let filename = "lampiran-surat-" + id;

      const disposition = response.headers.get("Content-Disposition") || "";

      const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plain = disposition.match(/filename="?([^";]+)"?/i);

      if (encoded) {
        try {
          filename = decodeURIComponent(encoded[1].trim());
        } catch (_) {}
      } else if (plain) {
        filename = plain[1].trim();
      }

      // Pastikan nama file tidak mengandung path.
      filename = filename.replace(/[\\/]/g, "_");

      return { blob, filename };
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Waktu unduh lampiran habis.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    config: API_CONFIG,
    getToken: getToken,
    setToken: setToken,
    login: login,
    logout: logout,
    getSuratMasuk: getSuratMasuk,
    getSuratKeluar: getSuratKeluar,
    getDisposisi: getDisposisi,
    createDisposisi: createDisposisi,
    tindakLanjutDisposisi: tindakLanjutDisposisi,
    selesaikanDisposisi: selesaikanDisposisi,
    terimaDisposisi: terimaDisposisi,
    mintaKlarifikasi: mintaKlarifikasi,
    getNotifikasi: getNotifikasi,
    markNotifikasiRead: markNotifikasiRead,
    markAllNotifikasiRead: markAllNotifikasiRead,
    getTugas: getTugas,
    getArsip: getArsip,
    getJadwal: getJadwal,
    getStaf: getStaf,
    getStafTujuan: getStafTujuan,
    getSuratMasukDetail: getSuratMasukDetail,
    downloadLampiranSuratMasuk: downloadLampiranSuratMasuk,
    getSuratKeluarDetail: getSuratKeluarDetail,
    getArsipDetail: getArsipDetail,
    getTugasDetail: getTugasDetail,
    reviewTugas: reviewTugas,
    createTugas: createTugas,
    getDashboardKS: getDashboardKS,
    getLaporan: getLaporan,
    getTargetRealisasi: getTargetRealisasi,
    getLaporanPatroli: function () {
      if (!API_CONFIG.LIVE) return Promise.resolve(mockGetPatroli());
      return getLaporanPatroli();
    },
    getLaporanPatroliDetail: getLaporanPatroliDetail,
    createLaporanPatroli: createLaporanPatroli,
    uploadFotoPatroli: uploadFotoPatroli,
    getFotoPatroli: getFotoPatroli,
    register: register,
    getResortsPublic: getResortsPublic,
    requestPasswordOtp: requestPasswordOtp,
    verifyPasswordOtp: verifyPasswordOtp,
    resetPasswordWithToken: resetPasswordWithToken,
    getProfil: getProfil,
    updateProfil: updateProfil,
    gantiKataSandi: gantiKataSandi,
    getSuratSaya: getSuratSaya,
    getTugasSaya: getTugasSaya,
    getTugasSayaDetail: getTugasSayaDetail,

    getKomentarTugas: getKomentarTugas,
    kirimKomentarTugas: kirimKomentarTugas,
    getAktivitasTugas: getAktivitasTugas,

    updateTugasProgress: updateTugasProgress,
    getDisposisiSaya: getDisposisiSaya,
    getDokumenSaya: getDokumenSaya,
    getArsipSaya: getArsipSaya,
    getJadwalSaya: getJadwalSaya,
    createJadwalSaya: createJadwalSaya,
    updateJadwalSaya: updateJadwalSaya,
    deleteJadwalSaya: deleteJadwalSaya,
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
    downloadExport: downloadExport,
    getAdminProfil: getAdminProfil,
    updateAdminProfil: updateAdminProfil,
    getNotifikasiAdmin: getNotifikasiAdmin,
    lupaPassword: lupaPassword,
    request: request, // untuk endpoint baru: selalu lewat sini
  };
})();

window.EOfficeAPI = EOfficeAPI;
