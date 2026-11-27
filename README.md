# E-Office SKSDA Jawa Tengah

Sistem e-office untuk administrasi surat dan kinerja pegawai BKSDA Jawa Tengah: manajemen surat masuk/keluar, disposisi, arsip, laporan patroli, tugas, jadwal, hingga laporan anggaran. Dibangun dengan CodeIgniter 4 dan sepenuhnya dapat dijalankan lewat Docker.

## Fitur

- **Surat Masuk & Keluar**: pencatatan, unggah lampiran, preview/unduh file, kunci otomatis setelah didisposisi
- **Disposisi**: alur Kepala Seksi → Staf (terima, klarifikasi, tindak lanjut, selesai), riwayat perubahan status, auto-arsip ketika seluruh disposisi selesai
- **Arsip**: pengarsipan surat otomatis dan manual dengan kategori
- **Laporan Patroli**: laporan harian staf dengan unggah foto (mendukung sinkronisasi offline via `client_uuid` untuk aplikasi mobile)
- **Tugas**: penugasan dengan checklist, kolaborasi (komentar, aktivitas, lampiran), review Kepala Seksi
- **Jadwal**: agenda pribadi pegawai dan agenda seksi
- **Dokumen**: penyimpanan dokumen dengan status draft/publish
- **Laporan & Export**: target triwulan, realisasi anggaran, wilayah konservasi, export CSV/PDF/XLSX dengan riwayat
- **Administrasi**: manajemen pengguna, resort, notifikasi, riwayat login, backup database, activity log

## Teknologi

| Komponen | Teknologi |
|---|---|
| Backend | PHP ^8.2, CodeIgniter 4.7 |
| Database | MariaDB 11.4 |
| Frontend | Views CodeIgniter 4 (server-rendered) |
| Export | Dompdf (PDF), PhpSpreadsheet (XLSX/CSV) |
| Autentikasi | Bearer token, idle 30 menit, absolute 8 jam |
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

3. Buat akun awal untuk semua role (admin, kepala seksi, staf):

   ```bash
   docker exec sksda-app php spark db:seed UsersSeeder
   ```

   Aplikasi tersedia di http://localhost:8080, login default `admin` / `admin123`. Password dapat diatur saat seeding melalui `SEED_USER_PASSWORD`. **Segera ubah password setelah login.**

### Variabel Konfigurasi (`.env` root)

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `DB_ROOT_PASSWORD` | Ya | Tidak | Password root MariaDB |
| `DB_PASSWORD` | Ya | Tidak | Password user aplikasi |
| `DB_NAME` | Ya | Tidak | Nama database yang dibuat compose |
| `DB_USER` | Ya | Tidak | User aplikasi database |
| `APP_PORT` | Tidak | `8080` | Port host untuk aplikasi |
| `ADMINER_PORT` | Tidak | `8081` | Port host untuk Adminer |
| `MIGRATE_ON_START` | Tidak | `true` | Jalankan migrasi saat container start |
| `CI_ENVIRONMENT` | Tidak | `production` | Mode CodeIgniter |

Nama database/user/password ini juga otomatis disuntikkan ke aplikasi melalui mekanisme override env CodeIgniter (`database_default_*`), sehingga `backend/.env` tidak diperlukan di dalam container.

### Inspeksi Database (Adminer)

Adminer tersedia di http://localhost:8081 (hanya diakses dari mesin lokal). Server, user, dan database sudah terisi otomatis, cukup masukkan `DB_PASSWORD`.

## Menjalankan Tanpa Docker

```bash
cd backend
composer install
cp env .env            # sesuaikan database.default.* dengan database Anda
php spark migrate
php spark db:seed UsersSeeder
php spark serve        # http://localhost:8080
```

Seed tambahan: `DevAccountsSeeder` (akun khusus development) dan `ResortSeeder`.

## Pengujian

Test suite PHPUnit berjalan terhadap database khusus pengujian (`eoffice_bksda_test`) yang sepenuhnya terpisah dari database aplikasi; skema dimigrasikan otomatis saat suite dijalankan.

```bash
cd backend
composer install

# Buat database uji (sekali saja) dan jalankan suite
docker exec sksda-mariadb mariadb -u root -p"${DB_ROOT_PASSWORD}" \
  -e "CREATE DATABASE IF NOT EXISTS eoffice_bksda_test; GRANT ALL PRIVILEGES ON eoffice_bksda_test.* TO '${DB_USER}'@'%';"

export database_tests_hostname=127.0.0.1
export database_tests_database=eoffice_bksda_test
export database_tests_username=root
export database_tests_password="${DB_ROOT_PASSWORD}"
vendor/bin/phpunit
```

## CI (GitHub Actions)

`.github/workflows/ci.yml` berjalan pada setiap push ke `main` dan pull request:

1. **PHPUnit** terhadap service MariaDB dengan database `eoffice_bksda_test`.
2. **Docker smoke test**: build image, jalankan stack penuh, verifikasi endpoint aplikasi/API/Adminer, dan seed pengguna.

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
