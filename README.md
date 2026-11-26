# E-Office SKSDA Jawa Tengah

Sistem e-office untuk administrasi surat dan kinerja pegawai BKSDA Jawa Tengah: manajemen surat masuk/keluar, disposisi, arsip, laporan patroli, tugas, jadwal, hingga laporan anggaran — dibangun dengan CodeIgniter 4 dan sepenuhnya dapat dijalankan lewat Docker.

## Fitur

- **Surat Masuk & Keluar** — pencatatan, unggah lampiran, preview/unduh file, kunci otomatis setelah didisposisi
- **Disposisi** — alur Kepala Seksi → Staf (terima, klarifikasi, tindak lanjut, selesai), riwayat perubahan status, auto-arsip ketika seluruh disposisi selesai
- **Arsip** — pengarsipan surat otomatis dan manual dengan kategori
- **Laporan Patroli** — laporan harian staf dengan unggah foto (mendukung sinkronisasi offline via `client_uuid` untuk aplikasi mobile)
- **Tugas** — penugasan dengan checklist, kolaborasi (komentar, aktivitas, lampiran), review Kepala Seksi
- **Jadwal** — agenda pribadi pegawai dan agenda seksi
- **Dokumen** — penyimpanan dokumen dengan status draft/publish
- **Laporan & Export** — target triwulan, realisasi anggaran, wilayah konservasi, export CSV/PDF/XLSX dengan riwayat
- **Administrasi** — manajemen pengguna, resort, notifikasi, riwayat login, backup database, activity log

## Teknologi

| Komponen | Teknologi |
|---|---|
| Backend | PHP ^8.2, CodeIgniter 4.7 |
| Database | MariaDB 11.4 |
| Frontend | Views CodeIgniter 4 (server-rendered) |
| Export | Dompdf (PDF), PhpSpreadsheet (XLSX/CSV) |
| Autentikasi | Bearer token — idle 30 menit, absolute 8 jam |
| Deployment | Docker Compose |

## Struktur Repositori

```
.
├── docker-compose.yml     # Orkestrasi app + MariaDB
├── .env.example           # Template konfigurasi Docker
└── backend/               # Aplikasi CodeIgniter 4
    ├── app/               # Controllers, Models, Services, Filters, Config
    ├── app/Commands/      # Perintah spark kustom
    ├── app/Database/      # Migrations & Seeds
    ├── docker/            # Entrypoint container
    ├── Dockerfile
    ├── public/            # Document root
    └── writable/          # Logs, cache, uploads, session
```

## Menjalankan dengan Docker

1. Salin template konfigurasi dan sesuaikan password:

   ```bash
   cp .env.example .env
   ```

2. Jalankan stack:

   ```bash
   docker compose up -d
   ```

   Container `app` akan otomatis menunggu MariaDB siap dan menjalankan `php spark migrate` saat pertama start (`MIGRATE_ON_START=true`).

3. Buat akun admin awal:

   ```bash
   docker exec sksda-app php spark db:seed AdminSeeder
   ```

   Aplikasi tersedia di http://localhost:8080 — login default `admin` / `admin123`. **Segera ubah password setelah login.**

### Variabel Konfigurasi (`.env` root)

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DB_ROOT_PASSWORD` | Ya | — | Password root MariaDB |
| `DB_PASSWORD` | Ya | — | Password user aplikasi |
| `DB_NAME` | Ya | — | Nama database yang dibuat compose |
| `DB_USER` | Ya | — | User aplikasi database |
| `APP_PORT` | Tidak | `8080` | Port host untuk aplikasi |
| `MIGRATE_ON_START` | Tidak | `true` | Jalankan migrasi saat container start |
| `CI_ENVIRONMENT` | Tidak | `production` | Mode CodeIgniter |

Nama database/user/password ini juga otomatis disuntikkan ke aplikasi melalui mekanisme override env CodeIgniter (`database_default_*`), sehingga `backend/.env` tidak diperlukan di dalam container.

## Menjalankan Tanpa Docker

```bash
cd backend
composer install
cp env .env            # sesuaikan database.default.* dengan database Anda
php spark migrate
php spark db:seed AdminSeeder
php spark serve        # http://localhost:8080
```

Seed tambahan untuk pengembangan: `DevAccountsSeeder` (akun per role) dan `ResortSeeder`.

## Perintah Spark Kustom

| Perintah | Keterangan |
|---|---|
| `php spark backup:auto` | Backup database terjadwal (dipanggil Task Scheduler/cron) |
| `php spark dev:reset-admin` | Reset password admin lokal saat pengembangan |

## Backup Database

Backup/restore tersedia dari aplikasi (menu admin) dan CLI via `backup:auto`. Berkas backup disimpan di direktori `backup.directory` (lihat `backend/.env`) dengan retensi otomatis `backup.retentionDays` (default 30 hari). Detail scheduler: [`backend/docs/BACKUP_SCHEDULER.md`](backend/docs/BACKUP_SCHEDULER.md).

## Role Pengguna

| Role | Hak akses |
|---|---|
| `admin` | Manajemen pengguna, backup, export, semua modul baca, unggah foto laporan patroli |
| `kepala_seksi` | Disposisi surat, review tugas, agenda seksi, laporan kinerja |
| `staf` | Surat/disposisi pribadi, tugas, laporan patroli, agenda pribadi |

Autentikasi API menggunakan bearer token yang diterbitkan saat login dan dicabut otomatis saat logout, reset password, penggantian password, atau penonaktifan akun.
