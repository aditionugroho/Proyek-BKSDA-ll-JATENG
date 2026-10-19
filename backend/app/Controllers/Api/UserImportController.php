<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ResortModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class UserImportController extends BaseController
{
    use ResponseTrait;

    public function import()
    {
        // ==========================================
        // 1. VALIDASI FILE CSV
        // ==========================================

        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->respond([
                'status' => false,
                'message' => 'File CSV wajib diunggah melalui field file.',
            ], 422);
        }

        if (
            $file->getSize() > 2 * 1024 * 1024 ||
            strtolower($file->getClientExtension()) !== 'csv'
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'File harus berformat .csv dan maksimal 2 MB.',
            ], 422);
        }

        $handle = fopen($file->getTempName(), 'rb');

        if ($handle === false) {
            return $this->respond([
                'status' => false,
                'message' => 'File tidak dapat dibaca.',
            ], 422);
        }

        // ==========================================
        // 2. VALIDASI HEADER CSV
        // ==========================================

        $columns = [
            'name',
            'username',
            'email',
            'no_whatsapp',
            'role',
            'jabatan',
            'resort_kode'
        ];

        $header = fgetcsv($handle, 0, ',', '"', '');

        if (!is_array($header)) {
            fclose($handle);

            return $this->respond([
                'status' => false,
                'message' => 'File CSV tidak memiliki header.',
            ], 422);
        }

        // Hapus BOM UTF-8 jika ada
        $header[0] = preg_replace(
            '/^\xEF\xBB\xBF/',
            '',
            (string) $header[0]
        );

        $header = array_map('trim', $header);

        if ($header !== $columns) {
            fclose($handle);

            return $this->respond([
                'status' => false,
                'message' => 'Header CSV harus sesuai urutan: ' .
                    implode(',', $columns),
            ], 422);
        }

        // ==========================================
        // 3. BACA SELURUH BARIS CSV
        // ==========================================

        $rows = [];
        $rowNumber = 1;

        while (
            ($values = fgetcsv($handle, 0, ',', '"', '')) !== false
        ) {
            $rowNumber++;

            // Lewati baris kosong
            if (
                count($values) === 1 &&
                trim((string) ($values[0] ?? '')) === ''
            ) {
                continue;
            }

            $rows[] = [
                'row' => $rowNumber,
                'values' => $values
            ];

            // Maksimal 200 data pegawai
            if (count($rows) > 200) {
                fclose($handle);

                return $this->respond([
                    'status' => false,
                    'message' => 'Maksimal 200 pegawai per file CSV.',
                ], 422);
            }
        }

        fclose($handle);

        if ($rows === []) {
            return $this->respond([
                'status' => false,
                'message' => 'File CSV tidak berisi data pegawai.',
            ], 422);
        }

        // ==========================================
        // 4. AMBIL DATA RESORT AKTIF
        // ==========================================

        $activeResorts = [];

        $resorts = (new ResortModel())
            ->where('status', 1)
            ->findAll();

        foreach ($resorts as $resort) {
            $kode = strtoupper((string) $resort['kode']);

            $activeResorts[$kode] = (int) $resort['id'];
        }

        // ==========================================
        // 5. PROSES IMPOR PEGAWAI
        // ==========================================

        $users = new UserModel();

        $success = 0;
        $errors = [];

        foreach ($rows as $row) {

            $rowNo = $row['row'];
            $values = $row['values'];

            // Periksa jumlah kolom
            if (count($values) !== count($columns)) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Jumlah kolom tidak sesuai.'
                ];

                continue;
            }

            $values = array_map(
                static fn ($value) => trim((string) $value),
                $values
            );

            $data = array_combine($columns, $values);

            // Normalisasi data
            $data['username'] = strtolower(
                $data['username']
            );

            $data['email'] = strtolower(
                $data['email']
            );

            $data['resort_kode'] = strtoupper(
                $data['resort_kode']
            );

            // ======================================
            // 6. VALIDASI ENCODING
            // ======================================

            $validUtf8 = array_map(
                static fn ($value) =>
                    preg_match('//u', $value) === 1,
                $data
            );

            if (in_array(false, $validUtf8, true)) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Teks harus menggunakan UTF-8.'
                ];

                continue;
            }

            // ======================================
            // 7. VALIDASI NAMA
            // ======================================

            if (
                $data['name'] === '' ||
                strlen($data['name']) > 255
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Nama wajib diisi dan maksimal 255 byte.'
                ];

                continue;
            }

            // ======================================
            // 8. VALIDASI USERNAME
            // ======================================

            if (
                !preg_match(
                    '/^[a-z0-9._-]{3,100}$/',
                    $data['username']
                )
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Username harus 3-100 karakter dan hanya boleh berisi huruf kecil, angka, titik, underscore, atau minus.'
                ];

                continue;
            }

            // ======================================
            // 9. VALIDASI EMAIL
            // ======================================

            if (
                strlen($data['email']) > 255 ||
                !filter_var(
                    $data['email'],
                    FILTER_VALIDATE_EMAIL
                )
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Email wajib diisi dengan format valid.'
                ];

                continue;
            }

            // ======================================
            // 10. VALIDASI ROLE
            // ======================================

            if (
                !in_array(
                    $data['role'],
                    ['kepala_seksi', 'staf'],
                    true
                )
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Role impor hanya kepala_seksi atau staf.'
                ];

                continue;
            }

            // ======================================
            // 11. VALIDASI JABATAN DAN WHATSAPP
            // ======================================

            if (
                strlen($data['jabatan']) > 100 ||
                strlen($data['no_whatsapp']) > 20
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Jabatan atau nomor WhatsApp terlalu panjang.'
                ];

                continue;
            }

            // ======================================
            // 12. VALIDASI RESORT
            // ======================================

            if (
                !isset(
                    $activeResorts[$data['resort_kode']]
                )
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Kode resort tidak ditemukan atau tidak aktif.'
                ];

                continue;
            }

            // ======================================
            // 13. CEK DATA DUPLIKAT
            // ======================================

            // Cek username
            if (
                $users->where(
                    'username',
                    $data['username']
                )->first()
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Username sudah digunakan.'
                ];

                continue;
            }

            // Cek email
            if (
                $users->where(
                    'email',
                    $data['email']
                )->first()
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Email sudah digunakan.'
                ];

                continue;
            }

            // Cek nomor WhatsApp
            if (
                $data['no_whatsapp'] !== '' &&
                $users->where(
                    'no_whatsapp',
                    $data['no_whatsapp']
                )->first()
            ) {
                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Nomor WhatsApp sudah digunakan.'
                ];

                continue;
            }

            // ======================================
            // 14. SIMPAN PEGAWAI KE DATABASE
            // ======================================

            try {

                // Password acak, tidak ditampilkan
                // dan tidak disimpan dalam bentuk plaintext
                $randomPassword = bin2hex(
                    random_bytes(24)
                );

                $insertData = [
                    'name' => $data['name'],

                    'username' => $data['username'],

                    'email' => $data['email'],

                    'no_whatsapp' =>
                        $data['no_whatsapp'] !== ''
                            ? $data['no_whatsapp']
                            : null,

                    'password' => password_hash(
                        $randomPassword,
                        PASSWORD_BCRYPT
                    ),

                    'role' => $data['role'],

                    'jabatan' =>
                        $data['jabatan'] !== ''
                            ? $data['jabatan']
                            : null,

                    'resort_id' =>
                        $activeResorts[$data['resort_kode']],

                    'status' => 1,
                ];

                $inserted = $users->insert(
                    $insertData,
                    true
                );

                if (!$inserted) {
                    $errors[] = [
                        'baris' => $rowNo,
                        'alasan' => 'Data gagal disimpan.'
                    ];

                    continue;
                }

                $success++;

            } catch (\Throwable $e) {

                log_message(
                    'error',
                    'Impor pegawai gagal: ' .
                    $e->getMessage()
                );

                $errors[] = [
                    'baris' => $rowNo,
                    'alasan' => 'Data gagal disimpan atau sudah digunakan.'
                ];
            }
        }

        // ==========================================
        // 15. RESPONSE HASIL IMPOR
        // ==========================================

        return $this->respond([
            'status' => true,
            'message' => 'Proses impor selesai.',
            'data' => [
                'total' => count($rows),
                'berhasil' => $success,
                'gagal' => count($errors),
                'errors' => $errors,
            ],
        ]);
    }
}
