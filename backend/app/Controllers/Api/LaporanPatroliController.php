<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\FotoPatroliModel;
use App\Models\LaporanPatroliModel;
use CodeIgniter\API\ResponseTrait;
use App\Models\UserModel;
use App\Models\ResortModel;

class LaporanPatroliController extends BaseController
{
    use ResponseTrait;

    /**
     * Mengambil user ID berdasarkan Bearer Token.
     *
     * Pemeriksaan role dan masa berlaku token tetap dilakukan
     * oleh route filter: role:admin,staf.
     */
    private function getAuthenticatedUserId(): ?int
    {
        $authorization = $this->request->getHeaderLine('Authorization');

        if (!preg_match('/^Bearer\s+(\S+)$/i', $authorization, $matches)) {
            return null;
        }

        $token = (new AuthTokenModel())
            ->where('token_hash', hash('sha256', $matches[1]))
            ->where('revoked_at', null)
            ->first();

        if (!$token) {
            return null;
        }

        return (int) $token['user_id'];
    }


    /**
     * GET /api/laporan-patroli
     * Menampilkan laporan sesuai hak akses pengguna.
     */

    /**
     * GET /api/laporan-patroli/foto/{id}
     * Menampilkan foto dengan autentikasi dan otorisasi.
     */
    public function tampilFoto($id)
    {
        $userId = $this->getAuthenticatedUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'Pengguna tidak terautentikasi.',
            ], 401);
        }

        $user = (new UserModel())
            ->where('id', $userId)
            ->where('status', 1)
            ->first();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'Akun tidak aktif.',
            ], 401);
        }

        $role = $user['role'];

        if (!in_array($role, ['admin', 'kepala_seksi', 'staf'], true)) {
            return $this->respond([
                'status' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $foto = (new FotoPatroliModel())->find((int) $id);

        if (!$foto) {
            return $this->respond([
                'status' => false,
                'message' => 'Foto tidak ditemukan.',
            ], 404);
        }

        $laporan = (new LaporanPatroliModel())
            ->find((int) $foto['laporan_patroli_id']);

        if (!$laporan) {
            return $this->respond([
                'status' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if ($role === 'staf') {
            $resortId = (int) ($user['resort_id'] ?? 0);

            if (
                $resortId < 1 ||
                (int) $laporan['user_id'] !== $userId ||
                (int) $laporan['resort_id'] !== $resortId
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Akses foto ditolak.',
                ], 403);
            }
        }

        $baseDir = realpath(WRITEPATH . 'uploads/patroli');

        if ($baseDir === false) {
            return $this->respond([
                'status' => false,
                'message' => 'Foto tidak ditemukan.',
            ], 404);
        }

        $relativePath = str_replace('\\', '/', $foto['file_path']);

        if (!str_starts_with($relativePath, 'uploads/patroli/')) {
            return $this->respond([
                'status' => false,
                'message' => 'Path foto tidak valid.',
            ], 404);
        }

        $filePath = realpath(
            WRITEPATH . str_replace('/', DIRECTORY_SEPARATOR, $relativePath)
        );

        if (
            $filePath === false ||
            !str_starts_with(
                $filePath,
                $baseDir . DIRECTORY_SEPARATOR
            ) ||
            !is_file($filePath)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'File foto tidak ditemukan.',
            ], 404);
        }

        $mime = $foto['mime_type'];

        if (!in_array($mime, ['image/jpeg', 'image/png'], true)) {
            return $this->respond([
                'status' => false,
                'message' => 'Format foto tidak didukung.',
            ], 415);
        }

        return $this->response
            ->setHeader('Content-Type', $mime)
            ->setHeader('X-Content-Type-Options', 'nosniff')
            ->setHeader('Cache-Control', 'private, no-store')
            ->setBody(file_get_contents($filePath));
    }

    public function index()
    {
        $userId = $this->getAuthenticatedUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'Pengguna tidak terautentikasi.',
            ], 401);
        }

        $user = (new UserModel())
            ->where('id', $userId)
            ->where('status', 1)
            ->first();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'Akun tidak aktif atau tidak ditemukan.',
            ], 401);
        }

        $role = $user['role'];

        if (!in_array($role, ['admin', 'kepala_seksi', 'staf'], true)) {
            return $this->respond([
                'status' => false,
                'message' => 'Akses ditolak.',
            ], 403);
        }

        $db = db_connect();

        $query = $db->table('laporan_patroli lp')
            ->select('lp.id, lp.user_id, lp.resort_id,
                      lp.tanggal_patroli, lp.keterangan,
                      lp.status, lp.created_at,
                      u.name AS petugas,
                      r.nama AS resort')
            ->join('users u', 'u.id = lp.user_id', 'left')
            ->join('resorts r', 'r.id = lp.resort_id', 'left');

        if ($role === 'staf') {
            $resortId = (int) ($user['resort_id'] ?? 0);

            if ($resortId < 1) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Akun staf belum memiliki resort.',
                ], 403);
            }

            $query->where('lp.user_id', $userId)
                  ->where('lp.resort_id', $resortId);
        }

        $rows = $query
            ->orderBy('lp.created_at', 'DESC')
            ->orderBy('lp.id', 'DESC')
            ->get()
            ->getResultArray();

        $fotoRows = [];

        if (!empty($rows)) {
            $laporanIds = array_column($rows, 'id');

            $fotoRows = $db->table('foto_patroli')
                ->select('id, laporan_patroli_id')
                ->whereIn('laporan_patroli_id', $laporanIds)
                ->orderBy('id', 'ASC')
                ->get()
                ->getResultArray();
        }

        $fotoByLaporan = [];

        foreach ($fotoRows as $foto) {
            $laporanId = (int) $foto['laporan_patroli_id'];
            $fotoByLaporan[$laporanId][] = (int) $foto['id'];
        }

        $data = [];

        foreach ($rows as $row) {
            $data[] = [
                'id' => (int) $row['id'],
                'petugas' => $row['petugas'] ?? '',
                'resort' => $row['resort'] ?? '',
                'tanggal' => $row['tanggal_patroli'],
                'catatan' => $row['keterangan'] ?? '',
                'status' => $row['status'] === 'draft'
                    ? 'Terkirim'
                    : $row['status'],
                'dibuatPada' => $row['created_at'],
                'foto' => $fotoByLaporan[(int) $row['id']] ?? [],
            ];
        }

        return $this->respond($data, 200);
    }

    /**
     * POST /api/laporan-patroli
     *
     * Membuat laporan patroli baru.
     */
    public function create()
    {
        $userId = $this->getAuthenticatedUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'Pengguna tidak terautentikasi.',
            ], 401);
        }

        $input = $this->request->getJSON(true);

        if (!is_array($input)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid.',
            ], 400);
        }

        $tanggal = $input['tanggal_patroli'] ?? null;

        if (
            !is_string($tanggal) ||
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Tanggal patroli harus berformat YYYY-MM-DD.',
            ], 422);
        }

                // Ambil data pengguna yang sedang login.
        $user = (new UserModel())
            ->where('id', $userId)
            ->where('status', 1)
            ->first();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'Akun pengguna tidak ditemukan atau tidak aktif.',
            ], 401);
        }

        $resortId = $input['resort_id'] ?? null;

        // Pastikan resort_id berisi angka positif jika diberikan.
        if (
            $resortId !== null &&
            (!ctype_digit((string) $resortId) || (int) $resortId < 1)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'resort_id tidak valid.',
            ], 422);
        }

        if ($user['role'] === 'staf') {
            // Staf wajib memiliki resort yang terdaftar pada akunnya.
            if (empty($user['resort_id'])) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Akun staf belum memiliki resort.',
                ], 403);
            }

            // Staf tidak boleh memilih resort berbeda.
            if (
                $resortId !== null &&
                (int) $resortId !== (int) $user['resort_id']
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Anda tidak memiliki akses ke resort tersebut.',
                ], 403);
            }

            // Gunakan resort dari akun staf, bukan dari request.
            $resortId = (int) $user['resort_id'];
        }

        // Pastikan resort yang dipilih benar-benar tersedia.
        if (
            $resortId !== null &&
            !(new ResortModel())->find((int) $resortId)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Resort tidak ditemukan.',
            ], 422);
        }

        $model = new LaporanPatroliModel();

// Identitas unik laporan dari aplikasi Flutter.
$clientUuid = $input['client_uuid'] ?? null;

if ($clientUuid !== null) {
    if (
        !is_string($clientUuid) ||
        !preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $clientUuid
        )
    ) {
        return $this->respond([
            'status' => false,
            'message' => 'client_uuid harus berupa UUID yang valid.',
        ], 422);
    }

    // Jika laporan sudah pernah diterima, gunakan ID sebelumnya.
    $existing = $model
        ->where('client_uuid', $clientUuid)
        ->first();

    if ($existing) {
        if ((int) $existing['user_id'] !== $userId) {
            return $this->respond([
                'status' => false,
                'message' => 'client_uuid sudah digunakan.',
            ], 409);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Laporan patroli sudah tersimpan sebelumnya.',
            'data' => [
                'id' => (int) $existing['id'],
                'duplicate' => true,
            ],
        ], 200);
    }
}
        $data = [
            'user_id' => $userId,
            'resort_id' => $resortId,
            'tanggal_patroli' => $tanggal,
            'lokasi' => $input['lokasi'] ?? null,
            'keterangan' => $input['keterangan'] ?? null,
            'status' => 'draft',
            'client_uuid' => $clientUuid,
        ];

        try {
            $id = $model->insert($data);

            if (!$id) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Gagal menyimpan laporan patroli.',
                    'errors' => $model->errors(),
                ], 422);
            }

            return $this->respond([
                'status' => true,
                'message' => 'Laporan patroli berhasil dibuat.',
                'data' => [
                    'id' => (int) $id,
                ],
            ], 201);
        } catch (\Throwable $e) {
    // Error MySQL 1062 = Duplicate entry.
    $isDuplicate = $e instanceof \CodeIgniter\Database\Exceptions\DatabaseException
        && preg_match('/Duplicate entry|1062/i', $e->getMessage());

    if ($isDuplicate && $clientUuid !== null) {
        try {
            $existing = (new LaporanPatroliModel())
                ->where('client_uuid', $clientUuid)
                ->first();

            if ($existing) {
                if ((int) $existing['user_id'] !== $userId) {
                    return $this->respond([
                        'status' => false,
                        'message' => 'client_uuid sudah digunakan.',
                    ], 409);
                }

                return $this->respond([
                    'status' => true,
                    'message' => 'Laporan patroli sudah tersimpan sebelumnya.',
                    'data' => [
                        'id' => (int) $existing['id'],
                        'duplicate' => true,
                    ],
                ], 200);
            }
        } catch (\Throwable $lookupError) {
            log_message(
                'error',
                'Gagal memeriksa duplikasi laporan patroli: '
                . $lookupError->getMessage()
            );
        }
    }

    log_message(
        'error',
        'Gagal membuat laporan patroli: ' . $e->getMessage()
    );

    return $this->respond([
        'status' => false,
        'message' => 'Terjadi kesalahan saat menyimpan laporan.',
    ], 500);
}
    }

    /**
     * POST /api/laporan-patroli/{id}/foto
     *
     * Mengunggah foto untuk laporan patroli.
     *
     * Form-data:
     * foto = file JPG/JPEG/PNG
     */
    public function uploadFoto($id)
    {
        $userId = $this->getAuthenticatedUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'Pengguna tidak terautentikasi.',
            ], 401);
        }

        if (!ctype_digit((string) $id) || (int) $id < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'ID laporan tidak valid.',
            ], 422);
        }

        $laporan = (new LaporanPatroliModel())->find((int) $id);

        if (!$laporan) {
            return $this->respond([
                'status' => false,
                'message' => 'Laporan patroli tidak ditemukan.',
            ], 404);
        }

        // Pengguna hanya boleh mengunggah foto pada laporannya sendiri.
        if ((int) $laporan['user_id'] !== $userId) {
            return $this->respond([
                'status' => false,
                'message' => 'Anda tidak memiliki akses ke laporan ini.',
            ], 403);
        }
        // Periksa penempatan resort pengguna saat ini.
$user = (new UserModel())
    ->where('id', $userId)
    ->where('status', 1)
    ->first();

if (!$user) {
    return $this->respond([
        'status' => false,
        'message' => 'Akun pengguna tidak ditemukan atau tidak aktif.',
    ], 401);
}

// Staf hanya boleh mengunggah foto ke laporan
// yang berasal dari resort penempatannya saat ini.
if ($user['role'] === 'staf') {
    if (
        empty($user['resort_id']) ||
        empty($laporan['resort_id']) ||
        (int) $laporan['resort_id'] !== (int) $user['resort_id']
    ) {
        return $this->respond([
            'status' => false,
            'message' => 'Laporan patroli berada di luar resort penempatan Anda.',
        ], 403);
    }
}
                // Identitas unik foto untuk sinkronisasi offline Flutter.
        $clientUuid = $this->request->getPost('client_uuid');

        if ($clientUuid !== null) {
            if (
                !is_string($clientUuid) ||
                !preg_match(
                    '/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                    $clientUuid
                )
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'client_uuid foto harus berupa UUID yang valid.',
                ], 422);
            }

            $existingFoto = (new FotoPatroliModel())
                ->where('client_uuid', $clientUuid)
                ->first();

            if ($existingFoto) {
                // UUID foto tidak boleh digunakan untuk laporan lain.
                if ((int) $existingFoto['laporan_patroli_id'] !== (int) $id) {
                    return $this->respond([
                        'status' => false,
                        'message' => 'client_uuid foto sudah digunakan.',
                    ], 409);
                }

                return $this->respond([
                    'status' => true,
                    'message' => 'Foto patroli sudah tersimpan sebelumnya.',
                    'data' => [
                        'id' => (int) $existingFoto['id'],
                        'laporan_patroli_id' => (int) $id,
                        'duplicate' => true,
                    ],
                ], 200);
            }
        }

        $foto = $this->request->getFile('foto');

        if (!$foto || !$foto->isValid()) {
            return $this->respond([
                'status' => false,
                'message' => 'File foto tidak valid atau tidak ditemukan.',
            ], 422);
        }

        // Batas maksimal 5 MB.
        $maxSize = 5 * 1024 * 1024;

        if ($foto->getSize() > $maxSize) {
            return $this->respond([
                'status' => false,
                'message' => 'Ukuran foto maksimal 5 MB.',
            ], 422);
        }

        // Validasi MIME berdasarkan isi file.
        $mime = $foto->getMimeType();

        $allowedMime = [
            'image/jpeg',
            'image/png',
        ];

        if (!in_array($mime, $allowedMime, true)) {
            return $this->respond([
                'status' => false,
                'message' => 'Foto harus berformat JPG atau PNG.',
            ], 422);
        }

        // Menyimpan foto di folder private writable.
        $folder = WRITEPATH . 'uploads/patroli/' . (int) $id;

        if (!is_dir($folder) && !mkdir($folder, 0750, true) && !is_dir($folder)) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menyiapkan penyimpanan foto.',
            ], 500);
        }

        $extension = $mime === 'image/png' ? 'png' : 'jpg';
        $namaFile = bin2hex(random_bytes(16)) . '.' . $extension;

        $pathLengkap = $folder . DIRECTORY_SEPARATOR . $namaFile;

        try {
            $fileSize = $foto->getSize();

            if (!$foto->move($folder, $namaFile)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Gagal menyimpan file foto.',
                ], 500);
            }

            $model = new FotoPatroliModel();

            $fotoId = $model->insert([
                'laporan_patroli_id' => (int) $id,
                'client_uuid' => $clientUuid,
                'file_name' => $namaFile,
                'file_path' => 'uploads/patroli/' . (int) $id . '/' . $namaFile,
                'mime_type' => $mime,
                'file_size' => $fileSize,
            ]);

            if (!$fotoId) {
                @unlink($pathLengkap);

                return $this->respond([
                    'status' => false,
                    'message' => 'Gagal menyimpan metadata foto.',
                    'errors' => $model->errors(),
                ], 422);
            }

            return $this->respond([
                'status' => true,
                'message' => 'Foto patroli berhasil diunggah.',
                'data' => [
                    'id' => (int) $fotoId,
                    'laporan_patroli_id' => (int) $id,
                    'file_name' => $namaFile,
                    'mime_type' => $mime,
                    'file_size' => $fileSize,
                ],
            ], 201);
                } catch (\Throwable $e) {
            // Bersihkan file baru jika penyimpanan metadata gagal.
            if (is_file($pathLengkap)) {
                @unlink($pathLengkap);
            }

            // MySQL 1062 menandakan pelanggaran UNIQUE constraint.
            $isDuplicate = (int) $e->getCode() === 1062
                || (
                    $e instanceof \CodeIgniter\Database\Exceptions\DatabaseException
                    && preg_match('/Duplicate entry|1062/i', $e->getMessage())
                );

            if ($isDuplicate && $clientUuid !== null) {
                try {
                    $existingFoto = (new FotoPatroliModel())
                        ->where('client_uuid', $clientUuid)
                        ->first();

                    if ($existingFoto) {
                        if (
                            (int) $existingFoto['laporan_patroli_id']
                            !== (int) $id
                        ) {
                            return $this->respond([
                                'status' => false,
                                'message' => 'client_uuid foto sudah digunakan.',
                            ], 409);
                        }

                        return $this->respond([
                            'status' => true,
                            'message' => 'Foto patroli sudah tersimpan sebelumnya.',
                            'data' => [
                                'id' => (int) $existingFoto['id'],
                                'laporan_patroli_id' => (int) $id,
                                'duplicate' => true,
                            ],
                        ], 200);
                    }
                } catch (\Throwable $lookupError) {
                    log_message(
                        'error',
                        'Gagal memeriksa duplikasi foto patroli: '
                        . $lookupError->getMessage()
                    );
                }
            }

            log_message(
                'error',
                'Upload foto patroli gagal: ' . $e->getMessage()
            );

            return $this->respond([
                'status' => false,
                'message' => 'Terjadi kesalahan saat mengunggah foto.',
            ], 500);
        }
    }
}
