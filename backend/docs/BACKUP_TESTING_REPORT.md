# Laporan Pengujian E13 — Activity Log & Backup Database

**Proyek:** E-Office BKSDA Jawa Tengah  
**Backend:** CodeIgniter 4  
**Database:** MySQL 8.4.3  
**Lingkungan pengujian:** Development lokal Windows

## 1. Tujuan

Memastikan fitur backup database manual, backup otomatis, download backup, pembatasan akses, retensi 30 hari, dan pemulihan file SQL berfungsi sesuai kebutuhan.

## 2. Hasil Pengujian

| No. | Skenario | Hasil | Status |
|---|---|---|---|
| 1 | Backup otomatis pukul 23.00 | File SQL berhasil dibuat sesuai jadwal | PASS |
| 2 | Backup manual melalui API | File SQL berhasil dibuat | PASS |
| 3 | GET daftar backup | Daftar backup berhasil ditampilkan | PASS |
| 4 | Download backup | SHA-256 file asli dan download identik | PASS |
| 5 | Akses Kepala Seksi | Seluruh 4 endpoint backup menghasilkan HTTP 403 | PASS |
| 6 | Akses Staf | Seluruh 4 endpoint backup menghasilkan HTTP 403 | PASS |
| 7 | Retensi backup lebih dari 30 hari | File backup aplikasi lama dihapus | PASS |
| 8 | Retensi backup terbaru | File tetap tersimpan | PASS |
| 9 | Perlindungan file SQL lain | File SQL non-aplikasi tidak terhapus | PASS |
| 10 | Import backup ke database testing | Import berhasil dengan exit code 0 | PASS |

## 3. Bukti Backup Otomatis

Tanggal: 2 November 2026

- Jadwal: 23.00 WIB
- `LastTaskResult`: 0
- File: `eoffice_bksda_auto_20261102_230007.sql`
- Ukuran: 69.499 bytes

## 4. Bukti Backup Manual

- Endpoint: `POST /api/backup`
- File: `eoffice_bksda_manual_20261102_231546.sql`
- Ukuran: 69.935 bytes
- Download: berhasil
- SHA-256: cocok dengan file asli

## 5. Pengujian Retensi

Pengujian dilakukan menggunakan direktori sementara.

Hasil:
- Backup aplikasi yang lebih tua dari 30 hari berhasil dihapus.
- Backup aplikasi yang masih baru dipertahankan.
- File SQL lain yang lebih tua dari 30 hari tidak ikut terhapus.

## 6. Pengujian Restore

Database tujuan: `eoffice_bksda_restore_test`

- Import menggunakan MySQL CLI.
- Exit code: 0.
- Jumlah tabel hasil restore: 16.
- Jumlah pengguna: 7.
- Jumlah activity log hasil restore: 91.

Database utama saat pemeriksaan memiliki 7 pengguna dan 93 activity log. Perbedaan activity log dapat terjadi karena database utama menerima aktivitas tambahan setelah snapshot backup dibuat.

## 7. Pengujian yang Belum Dilakukan

Endpoint `POST /api/backup/restore` belum diuji langsung.

Pengujian endpoint harus dilakukan pada instance aplikasi khusus testing yang terhubung ke database terisolasi.

Konfigurasi backup otomatis pada server deployment juga perlu diverifikasi secara terpisah.

## 8. Kesimpulan

Fitur backup manual, backup otomatis terjadwal, download backup, pembatasan akses, retensi file, dan pemulihan SQL berhasil melewati pengujian yang dilakukan pada lingkungan development lokal.

Pengujian restore melalui endpoint API dan penerapan scheduler pada server deployment masih menjadi tindak lanjut.

### Pengujian Restore melalui API — PASS

**Tanggal:** 3 November 2026  
**Endpoint:** `POST /api/backup/restore`  
**Port testing:** `8081`  
**Database:** `eoffice_bksda_restore_test`

**Hasil:**
- Restore API mengembalikan `status: true`.
- Safety backup otomatis berhasil dibuat dengan nama `eoffice_bksda_restore_test_pre_restore_20261103_010449.sql`.
- Data penanda `restore_api_test` berhasil dihapus setelah restore.
- Jumlah pengguna setelah restore: 7 record.
- Jumlah activity log setelah restore: 92 record.
- Pengujian menggunakan akun MySQL khusus dengan akses terbatas pada database testing.

**Kesimpulan:** Restore database melalui API berhasil diuji pada lingkungan development terisolasi. Database utama tidak dijadikan target restore.

**Catatan:** Pengujian restore pada server deployment belum dilakukan.