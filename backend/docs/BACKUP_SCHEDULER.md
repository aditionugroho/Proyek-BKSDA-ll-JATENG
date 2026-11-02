
# Dokumentasi Backup Otomatis E-Office BKSDA

## 1. Deskripsi

Sistem E-Office BKSDA Jawa Tengah menyediakan fitur backup database MySQL secara manual dan otomatis.

Backup otomatis dijalankan melalui Windows Task Scheduler menggunakan command CodeIgniter 4:

```bash
php spark backup:auto
```

Tujuan backup:
- Menyediakan salinan database untuk pemulihan data.
- Mengurangi risiko kehilangan data.
- Menjalankan backup otomatis setiap hari.
- Menerapkan retensi backup selama 30 hari.
- Mencatat aktivitas backup pada tabel `activity_logs`.

## 2. Teknologi

- Backend: CodeIgniter 4
- Database: MySQL
- PHP: PHP CLI
- Database export: mysqldump
- Scheduler development: Windows Task Scheduler

Komponen aplikasi:

- `app/Commands/AutoBackup.php`
- `app/Services/BackupService.php`
- `app/Controllers/Api/BackupController.php`

## 3. Konfigurasi Environment

Konfigurasi backup disimpan pada file `.env`.

Contoh:

```dotenv
backup.mysqldumpPath = "D:/path/to/mysql/bin/mysqldump.exe"
backup.mysqlPath = "D:/path/to/mysql/bin/mysql.exe"
backup.directory = "D:/path/to/eoffice-backups"
backup.retentionDays = 30
```

Sesuaikan path berdasarkan lingkungan deployment.

Jangan menyimpan password database atau isi file `.env` yang mengandung kredensial di repository GitHub.

## 4. Konfigurasi Windows Task Scheduler

Nama task:

`EOffice BKSDA Auto Backup`

Pengaturan:

| Komponen | Konfigurasi |
|---|---|
| Trigger | Daily |
| Waktu | 23.00 WIB |
| Program | Path lengkap ke php.exe |
| Arguments | Path lengkap ke spark, diikuti backup:auto |
| Start in | Direktori backend |
| StartWhenAvailable | True |
| ExecutionTimeLimit | 1 jam |
| MultipleInstances | IgnoreNew |

Contoh konfigurasi:

Program:

```text
D:\programs\Php85\php.exe
```

Arguments:

```text
"D:\Punya_Shofi\Proyek-BKSDA-ll-JATENG\backend\spark" backup:auto
```

Working Directory:

```text
D:\Punya_Shofi\Proyek-BKSDA-ll-JATENG\backend
```

Path di atas merupakan contoh konfigurasi development lokal, bukan konfigurasi universal server.

Task development saat ini memakai LogonType Interactive. Mode ini membutuhkan sesi login pengguna yang sesuai. Untuk server produksi, gunakan konfigurasi penjadwalan yang dapat berjalan tanpa sesi login interaktif sesuai kebijakan keamanan server.

## 5. Menjalankan Backup Manual

Backup melalui API:

```http
POST /api/backup
Authorization: Bearer <ADMIN_TOKEN>
```

Endpoint hanya dapat diakses oleh admin sesuai middleware aplikasi.

Backup otomatis dapat dijalankan melalui terminal:

```bash
php spark backup:auto
```

Perhatian: command otomatis dapat menjalankan proses retensi yang membersihkan file backup lama.

## 6. Endpoint Backup

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | /api/backup | Melihat daftar backup |
| POST | /api/backup | Membuat backup manual |
| GET | /api/backup/download/{filename} | Mengunduh file backup |
| POST | /api/backup/restore | Restore database |

Seluruh endpoint tersebut menggunakan middleware role admin.

Restore harus diuji menggunakan database terisolasi terlebih dahulu karena berpotensi mengganti data.

## 7. Retensi Backup

Konfigurasi default:

```dotenv
backup.retentionDays = 30
```

BackupService memiliki mekanisme retensi berdasarkan konfigurasi tersebut.

Penghapusan file yang benar-benar melewati masa retensi perlu divalidasi secara terpisah.

## 8. Pemeriksaan Status Scheduler

Memeriksa jadwal:

```powershell
Get-ScheduledTask -TaskName "EOffice BKSDA Auto Backup"
```

Memeriksa hasil eksekusi:

```powershell
Get-ScheduledTaskInfo -TaskName "EOffice BKSDA Auto Backup" |
    Format-List LastRunTime,LastTaskResult,NextRunTime
```

Kode `LastTaskResult = 0` menunjukkan proses yang dijalankan Task Scheduler selesai dengan exit code sukses. Keberadaan dan isi backup tetap perlu diverifikasi.

## 9. Verifikasi Activity Log

Jalankan query MySQL:

```sql
SELECT id, aktivitas, modul, deskripsi, created_at
FROM activity_logs
WHERE aktivitas = 'backup_otomatis'
ORDER BY id DESC
LIMIT 5;
```

## 10. Hasil Pengujian Development

Tanggal pengujian: 2 November 2026.

- Task dijalankan melalui Windows Task Scheduler.
- LastTaskResult: 0.
- Event ID 200: action PHP dijalankan.
- Event ID 201: action selesai dengan return code 0.
- Event ID 102: task selesai.
- File berhasil dibuat:
  `eoffice_bksda_auto_20261102_173518.sql`
- Ukuran file: 69.356 bytes.
- Activity log berhasil tersimpan dengan ID 98.

Hasil: PASS untuk pengujian eksekusi backup melalui Task Scheduler.

## 11. Pengujian yang Masih Diperlukan

- Memastikan backup berjalan otomatis pada pukul 23.00.
- Memastikan backup berjalan dalam kondisi operasional server yang diharapkan.
- Memvalidasi file SQL dapat digunakan untuk pemulihan database.
- Memvalidasi penghapusan backup yang melewati retensi 30 hari.
- Memastikan konfigurasi scheduler diterapkan pada server deployment.

## 12. Catatan Keamanan

- Jangan commit file `.env` berisi kredensial.
- Simpan file backup di direktori yang tidak dapat diakses publik.
- Batasi akses backup hanya kepada pengguna berwenang.
- Jangan melakukan restore pada database aktif untuk keperluan pengujian.
- Simpan salinan backup penting pada penyimpanan yang aman dan terpisah.
