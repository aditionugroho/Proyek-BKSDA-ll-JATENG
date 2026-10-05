# Backend API - E-Office BKSDA SKSDA Wilayah II Pemalang

Backend aplikasi **E-Office BKSDA SKSDA Wilayah II Pemalang** dibangun menggunakan **CodeIgniter 4** dan **MySQL**.

Dokumentasi ini digunakan sebagai panduan integrasi antara frontend dan backend.

---

## Base URL

Untuk development:

```text
http://localhost:8080/api
```

Contoh:

```text
http://localhost:8080/api/auth/login
http://localhost:8080/api/surat-masuk
```

---

## Authentication

Backend menggunakan **Bearer Token Authentication**.

Setelah login berhasil, frontend akan menerima token. Token tersebut harus dikirim pada endpoint yang membutuhkan autentikasi.

Header:

```http
Authorization: Bearer {token}
Accept: application/json
```

Untuk request JSON:

```http
Content-Type: application/json
```

Token memiliki:

- Maximum lifetime: 8 jam
- Idle timeout: 30 menit

Jika user tidak melakukan aktivitas selama lebih dari 30 menit, token akan dinonaktifkan dan user harus login kembali.

---

# Authentication Endpoint

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/login` | Public |
| POST | `/auth/logout` | Login |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/verify-otp` | Public |
| POST | `/auth/reset-password` | Public |

---

## Login

Endpoint:

```http
POST /api/auth/login
```

Contoh request:

```json
{
    "username": "username",
    "password": "password"
}
```

Contoh response berhasil:

```json
{
    "status": true,
    "message": "Login berhasil.",
    "data": {
        "token": "TOKEN",
        "token_type": "Bearer",
        "expires_at": "2026-10-05 20:00:00",
        "user": {
            "id": 1,
            "name": "Nama User",
            "username": "username",
            "email": "email@example.com",
            "role": "admin",
            "jabatan": "Admin"
        }
    }
}
```

Token dari response login disimpan oleh frontend dan digunakan pada request berikutnya.

Contoh:

```http
Authorization: Bearer TOKEN
```

---

## Logout

```http
POST /api/auth/logout
```

Membutuhkan Bearer Token.

---

## Forgot Password

```http
POST /api/auth/forgot-password
```

Digunakan untuk mengirim OTP ke email user.

---

## Verify OTP

```http
POST /api/auth/verify-otp
```

Digunakan untuk memverifikasi OTP.

Jika OTP berhasil diverifikasi, backend akan memberikan reset token.

---

## Reset Password

```http
POST /api/auth/reset-password
```

Digunakan untuk mengganti password setelah OTP berhasil diverifikasi.

---

# User Management

Endpoint User Management hanya dapat digunakan oleh role:

```text
admin
```

| Method | Endpoint | Role |
|---|---|---|
| GET | `/users` | admin |
| GET | `/users/{id}` | admin |
| POST | `/users` | admin |
| PUT | `/users/{id}` | admin |
| PATCH | `/users/{id}` | admin |
| DELETE | `/users/{id}` | admin |

---

# Surat Masuk

| Method | Endpoint | Role |
|---|---|---|
| GET | `/surat-masuk` | admin, kepala_seksi, staf |
| GET | `/surat-masuk/{id}` | admin, kepala_seksi, staf |
| POST | `/surat-masuk` | admin, staf |
| PUT | `/surat-masuk/{id}` | admin, staf |
| PATCH | `/surat-masuk/{id}` | admin, staf |
| DELETE | `/surat-masuk/{id}` | admin |
| POST | `/surat-masuk/{id}/file` | admin, staf |
| GET | `/surat-masuk/{id}/file` | admin, kepala_seksi, staf |

---

## Upload File Surat Masuk

Endpoint:

```http
POST /api/surat-masuk/{id}/file
```

Request menggunakan:

```text
multipart/form-data
```

Nama field:

```text
file
```

Format file yang diperbolehkan:

- PDF
- DOCX
- JPG
- JPEG
- PNG

Ukuran maksimal:

```text
10 MB
```

Backend melakukan validasi:

- Ukuran file
- Ekstensi file
- MIME type
- Struktur internal file DOCX

File `.doc` tidak didukung.

---

## Download File Surat Masuk

```http
GET /api/surat-masuk/{id}/file
```

Dapat diakses oleh:

```text
admin
kepala_seksi
staf
```

---

# Surat Keluar

| Method | Endpoint | Role |
|---|---|---|
| GET | `/surat-keluar` | admin, kepala_seksi, staf |
| GET | `/surat-keluar/{id}` | admin, kepala_seksi, staf |
| POST | `/surat-keluar` | admin, staf |
| PUT | `/surat-keluar/{id}` | admin, staf |
| PATCH | `/surat-keluar/{id}` | admin, staf |
| DELETE | `/surat-keluar/{id}` | admin |
| POST | `/surat-keluar/{id}/file` | admin, staf |
| GET | `/surat-keluar/{id}/file` | admin, kepala_seksi, staf |

Aturan upload Surat Keluar sama seperti Surat Masuk.

Format yang diperbolehkan:

```text
PDF
DOCX
JPG/JPEG
PNG
```

Maksimal:

```text
10 MB
```

---

# Disposisi

| Method | Endpoint | Role |
|---|---|---|
| GET | `/disposisi` | admin, kepala_seksi, staf |
| GET | `/disposisi/{id}` | admin, kepala_seksi, staf |
| POST | `/disposisi` | kepala_seksi |
| PATCH | `/disposisi/{id}/tindak-lanjut` | staf |
| PATCH | `/disposisi/{id}/kembalikan` | kepala_seksi |
| PATCH | `/disposisi/{id}/selesai` | kepala_seksi, staf |

Alur umum disposisi:

```text
Surat Masuk
    ↓
Kepala Seksi membuat disposisi
    ↓
Staf menerima disposisi
    ↓
Staf melakukan tindak lanjut
    ↓
Disposisi selesai
    ↓
Surat masuk diarsipkan otomatis
```

Status disposisi yang digunakan:

```text
menunggu
dalam_proses
selesai
dikembalikan
```

---

# Arsip

| Method | Endpoint | Role |
|---|---|---|
| GET | `/arsip` | admin, kepala_seksi, staf |
| GET | `/arsip/{id}` | admin, kepala_seksi, staf |
| POST | `/arsip` | admin, staf |
| PUT | `/arsip/{id}` | admin, staf |
| PATCH | `/arsip/{id}` | admin, staf |
| DELETE | `/arsip/{id}` | admin |
| GET | `/arsip/{id}/file` | admin, kepala_seksi, staf |

Surat masuk yang proses disposisinya selesai dapat masuk ke arsip secara otomatis.

Aktivitas download arsip dicatat oleh backend pada activity log.

---

# Notifikasi

| Method | Endpoint | Role |
|---|---|---|
| GET | `/notifikasi` | admin, kepala_seksi, staf |
| GET | `/notifikasi/unread-count` | admin, kepala_seksi, staf |
| PATCH | `/notifikasi/{id}/read` | admin, kepala_seksi, staf |
| PATCH | `/notifikasi/read-all` | admin, kepala_seksi, staf |
| DELETE | `/notifikasi/{id}` | admin, kepala_seksi, staf |

Endpoint:

```http
GET /api/notifikasi/unread-count
```

dapat digunakan frontend untuk menampilkan jumlah notifikasi yang belum dibaca.

---

# Dashboard

| Method | Endpoint | Role |
|---|---|---|
| GET | `/dashboard/summary` | admin, kepala_seksi, staf |
| GET | `/dashboard/trend` | admin, kepala_seksi, staf |
| GET | `/dashboard/kinerja` | admin, kepala_seksi |
| GET | `/dashboard/kinerja/{id}` | admin, kepala_seksi |

---

## Dashboard Summary

```http
GET /api/dashboard/summary
```

Digunakan untuk menampilkan ringkasan data pada dashboard.

---

## Dashboard Trend

```http
GET /api/dashboard/trend
```

Digunakan untuk data statistik/tren surat.

---

## Kinerja Pegawai

```http
GET /api/dashboard/kinerja
```

Detail pegawai:

```http
GET /api/dashboard/kinerja/{id}
```

Hanya dapat digunakan oleh:

```text
admin
kepala_seksi
```

---

# Laporan PDF

| Method | Endpoint | Role |
|---|---|---|
| GET | `/laporan/surat-masuk` | admin, kepala_seksi |
| GET | `/laporan/surat-keluar` | admin, kepala_seksi |
| GET | `/laporan/disposisi` | admin, kepala_seksi |
| GET | `/laporan/kinerja` | admin, kepala_seksi |

Endpoint laporan menghasilkan file:

```text
application/pdf
```

Pada frontend, response sebaiknya diproses sebagai:

```text
blob
```

Contoh JavaScript:

```javascript
const response = await fetch(
    "http://localhost:8080/api/laporan/surat-masuk",
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

const blob = await response.blob();

const url = window.URL.createObjectURL(blob);

window.open(url);
```

Aktivitas download laporan PDF dicatat oleh backend.

---

# Login History

| Method | Endpoint | Role |
|---|---|---|
| GET | `/login-history` | admin |
| GET | `/login-history/{id}` | admin |

Digunakan admin untuk melihat riwayat login user.

---

# Backup & Restore Database

| Method | Endpoint | Role |
|---|---|---|
| GET | `/backup` | admin |
| POST | `/backup` | admin |
| GET | `/backup/download/{filename}` | admin |
| POST | `/backup/restore` | admin |

Fitur backup dan restore hanya dapat digunakan oleh:

```text
admin
```

Backup database otomatis dijalankan pada mesin backend setiap pukul:

```text
03:00
```

---

# Role User

Backend menggunakan tiga role:

```text
admin
kepala_seksi
staf
```

### Admin

Memiliki akses utama untuk:

```text
User Management
Surat Masuk
Surat Keluar
Arsip
Dashboard
Laporan
Login History
Backup & Restore
```

### Kepala Seksi

Memiliki akses utama untuk:

```text
Monitoring surat
Membuat disposisi
Mengembalikan disposisi
Menyelesaikan disposisi
Monitoring kinerja
Laporan
Arsip
```

### Staf

Memiliki akses utama untuk:

```text
Surat Masuk
Surat Keluar
Tindak lanjut disposisi
Menyelesaikan disposisi
Arsip
Notifikasi
Dashboard
```

---

# HTTP Status Code

Frontend perlu menangani status berikut:

| Status | Keterangan |
|---|---|
| 200 | Request berhasil |
| 201 | Data berhasil dibuat |
| 400 | Request tidak valid |
| 401 | Authentication gagal |
| 403 | Role tidak memiliki akses |
| 404 | Data tidak ditemukan |
| 422 | Validasi data/file gagal |
| 429 | Rate limit |
| 500 | Internal server error |

---

# Handling 401

Jika API mengembalikan:

```text
401 Unauthorized
```

Kemungkinan:

```text
Token tidak tersedia
Token tidak valid
Token sudah expired
Token sudah logout/revoked
User idle lebih dari 30 menit
```

Frontend sebaiknya:

```text
1. Hapus token yang tersimpan
2. Hapus data user lokal
3. Redirect ke halaman login
```

---

# Handling 403

Jika API mengembalikan:

```text
403 Forbidden
```

artinya user sudah berhasil login tetapi role user tidak mempunyai akses terhadap endpoint tersebut.

Contoh response:

```json
{
    "status": false,
    "message": "Anda tidak memiliki akses ke fitur ini."
}
```

Frontend dapat menampilkan halaman atau pesan:

```text
Anda tidak memiliki akses ke fitur ini.
```

---

# Contoh Request dengan Bearer Token

JavaScript:

```javascript
const token = localStorage.getItem("token");

const response = await fetch(
    "http://localhost:8080/api/surat-masuk",
    {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
        }
    }
);

const result = await response.json();

console.log(result);
```

---

# Contoh Upload File

```javascript
const formData = new FormData();

formData.append("file", selectedFile);

const response = await fetch(
    `http://localhost:8080/api/surat-masuk/${id}/file`,
    {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    }
);

const result = await response.json();

console.log(result);
```

Saat menggunakan `FormData`, frontend tidak perlu mengatur `Content-Type: multipart/form-data` secara manual karena browser akan mengatur boundary secara otomatis.

---

# Catatan Development

Backend dijalankan dengan:

```bash
php spark serve
```

Default development URL:

```text
http://localhost:8080
```

API:

```text
http://localhost:8080/api
```

---

# Konfigurasi Upload Server

PHP server harus mempunyai konfigurasi upload lebih besar dari batas aplikasi.

Development saat ini menggunakan:

```ini
upload_max_filesize = 16M
post_max_size = 16M
```

Walaupun konfigurasi PHP 16 MB, backend tetap membatasi file maksimal:

```text
10 MB
```

---

# Security

Backend menggunakan:

```text
Bearer Token Authentication
Role Based Access Control
Token SHA-256 Hash
Token Expiration
Idle Timeout 30 Menit
Password Hashing
Login Rate Limiting
OTP Verification
Activity Logging
```

CSRF tidak digunakan secara global karena API menggunakan Bearer Token melalui header `Authorization`, bukan autentikasi session-cookie.

---

# Backend Status

Backend utama telah selesai dan siap digunakan untuk integrasi frontend.

Modul yang tersedia:

```text
Authentication
Forgot Password & OTP
User Management
Surat Masuk
Surat Keluar
Upload & Download File
Disposisi
Arsip
Notifikasi
Login History
Dashboard
Kinerja Pegawai
Laporan PDF
Backup & Restore Database
Activity Logging
```

---

## Untuk Tim Frontend

Jika terdapat:

```text
Perbedaan payload
Response API kurang sesuai kebutuhan UI
Endpoint tidak dapat diakses
Masalah role
Masalah upload/download file
Masalah authentication
```

silakan koordinasikan dengan bagian backend.

Backend dapat disesuaikan apabila ditemukan kebutuhan integrasi tambahan selama proses pengembangan frontend.