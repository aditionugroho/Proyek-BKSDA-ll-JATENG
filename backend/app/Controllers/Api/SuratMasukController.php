<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\AuthTokenModel;
use App\Models\SuratMasukModel;
use CodeIgniter\API\ResponseTrait;

class SuratMasukController extends BaseController
{
    use ResponseTrait;

    protected SuratMasukModel $suratModel;
    protected AuthTokenModel $tokenModel;
    protected ActivityLogModel $activityLogModel;

    public function __construct()
    {
        $this->suratModel = new SuratMasukModel();
        $this->tokenModel = new AuthTokenModel();
        $this->activityLogModel = new ActivityLogModel();
    }

    private function getCurrentUserId(): ?int
    {
        $authHeader = $this->request->getHeaderLine('Authorization');

        if (
            !$authHeader ||
            !preg_match('/^Bearer\s+(\S+)$/i', $authHeader, $matches)
        ) {
            return null;
        }

        $tokenHash = hash('sha256', $matches[1]);

        $token = $this->tokenModel
            ->where('token_hash', $tokenHash)
            ->where('revoked_at', null)
            ->first();

        if (!$token) {
            return null;
        }

        return (int) $token['user_id'];
    }

    private function logActivity(
        string $aktivitas,
        ?int $referensiId = null,
        ?string $deskripsi = null
    ): void {
        $this->activityLogModel->insert([
            'user_id'      => $this->getCurrentUserId(),
            'aktivitas'    => $aktivitas,
            'modul'        => 'surat_masuk',
            'referensi_id' => $referensiId,
            'deskripsi'    => $deskripsi,
            'ip_address'   => $this->request->getIPAddress(),
            'created_at'   => date('Y-m-d H:i:s'),
        ]);
    }

    public function index()
    {
        $search = trim((string) $this->request->getGet('search'));
        $status = trim((string) $this->request->getGet('status'));

        $perPage = (int) ($this->request->getGet('per_page') ?? 20);

        if ($perPage < 1) {
            $perPage = 20;
        }

        if ($perPage > 50) {
            $perPage = 50;
        }

        $this->suratModel
            ->select('surat_masuk.*, users.name AS created_by_name')
            ->join(
                'users',
                'users.id = surat_masuk.created_by',
                'left'
            );

        if ($search !== '') {
            $this->suratModel
                ->groupStart()
                ->like('surat_masuk.no_agenda', $search)
                ->orLike('surat_masuk.no_surat', $search)
                ->orLike('surat_masuk.asal', $search)
                ->orLike('surat_masuk.perihal', $search)
                ->orLike('surat_masuk.klasifikasi', $search)
                ->groupEnd();
        }

        if ($status !== '') {
            $this->suratModel
                ->where('surat_masuk.status', $status);
        }

        $data = $this->suratModel
            ->orderBy('surat_masuk.id', 'DESC')
            ->paginate($perPage);

        return $this->respond([
            'status' => true,
            'message' => 'Data surat masuk berhasil diambil.',
            'data' => $data,

            'pagination' => [
                'current_page' =>
                    $this->suratModel->pager->getCurrentPage(),

                'per_page' =>
                    $perPage,

                'total' =>
                    $this->suratModel->pager->getTotal(),

                'last_page' =>
                    $this->suratModel->pager->getPageCount(),
            ],
        ]);
    }

    public function show($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->select('surat_masuk.*, users.name AS created_by_name')
            ->join(
                'users',
                'users.id = surat_masuk.created_by',
                'left'
            )
            ->where('surat_masuk.id', $id)
            ->first();

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Detail surat masuk berhasil diambil.',
            'data' => $surat,
        ]);
    }

    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Request harus menggunakan format JSON.',
            ], 400);
        }

        $noAgenda = trim($data['no_agenda'] ?? '');
        $noSurat = trim($data['no_surat'] ?? '');
        $tanggal = trim($data['tanggal'] ?? '');
        $asal = trim($data['asal'] ?? '');
        $perihal = trim($data['perihal'] ?? '');
        $klasifikasi = trim($data['klasifikasi'] ?? '');

        if (
            $noAgenda === '' ||
            $noSurat === '' ||
            $tanggal === '' ||
            $asal === '' ||
            $perihal === ''
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Nomor agenda, nomor surat, tanggal, asal, dan perihal wajib diisi.',
            ], 422);
        }

        $date = \DateTime::createFromFormat(
            'Y-m-d',
            $tanggal
        );

        if (
            !$date ||
            $date->format('Y-m-d') !== $tanggal
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Format tanggal harus YYYY-MM-DD.',
            ], 422);
        }

        $existing = $this->suratModel
            ->where('no_agenda', $noAgenda)
            ->first();

        if ($existing) {
            return $this->respond([
                'status' => false,
                'message' => 'Nomor agenda sudah digunakan.',
            ], 409);
        }

        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        $suratId = $this->suratModel->insert([
            'created_by'  => $userId,
            'no_agenda'   => $noAgenda,
            'no_surat'    => $noSurat,
            'tanggal'     => $tanggal,
            'asal'        => $asal,
            'perihal'     => $perihal,
            'klasifikasi' => $klasifikasi !== ''
                ? $klasifikasi
                : null,
            'file_path'   => null,
            'status'      => 'baru',
        ], true);

        if (!$suratId) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menambahkan surat masuk.',
            ], 500);
        }

        $this->logActivity(
            'create',
            (int) $suratId,
            'Menambahkan surat masuk nomor agenda ' . $noAgenda
        );

        return $this->respondCreated([
            'status' => true,
            'message' => 'Surat masuk berhasil ditambahkan.',
            'data' => $this->suratModel->find($suratId),
        ]);
    }

    public function update($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Request harus menggunakan format JSON.',
            ], 400);
        }

        $updateData = [];

        $fields = [
            'no_surat',
            'asal',
            'perihal',
            'klasifikasi',
            'status',
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $value = trim((string) ($data[$field] ?? ''));

                if (
                    in_array(
                        $field,
                        ['no_surat', 'asal', 'perihal'],
                        true
                    ) &&
                    $value === ''
                ) {
                    return $this->respond([
                        'status' => false,
                        'message' => $field . ' tidak boleh kosong.',
                    ], 422);
                }

                $updateData[$field] =
                    $value !== '' ? $value : null;
            }
        }

        if (array_key_exists('no_agenda', $data)) {
            $noAgenda = trim((string) $data['no_agenda']);

            if ($noAgenda === '') {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nomor agenda tidak boleh kosong.',
                ], 422);
            }

            $existing = $this->suratModel
                ->where('no_agenda', $noAgenda)
                ->where('id !=', $id)
                ->first();

            if ($existing) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nomor agenda sudah digunakan.',
                ], 409);
            }

            $updateData['no_agenda'] = $noAgenda;
        }

        if (array_key_exists('tanggal', $data)) {
            $tanggal = trim((string) $data['tanggal']);

            $date = \DateTime::createFromFormat(
                'Y-m-d',
                $tanggal
            );

            if (
                !$date ||
                $date->format('Y-m-d') !== $tanggal
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Format tanggal harus YYYY-MM-DD.',
                ], 422);
            }

            $updateData['tanggal'] = $tanggal;
        }

        if (empty($updateData)) {
            return $this->respond([
                'status' => false,
                'message' => 'Tidak ada data yang diperbarui.',
            ], 422);
        }

        $this->suratModel->update(
            $id,
            $updateData
        );

        $this->logActivity(
            'update',
            (int) $id,
            'Memperbarui data surat masuk.'
        );

        return $this->respond([
            'status' => true,
            'message' => 'Surat masuk berhasil diperbarui.',
            'data' => $this->suratModel->find($id),
        ]);
    }

    public function uploadFile($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->respond([
                'status' => false,
                'message' => 'File tidak ditemukan atau tidak valid.',
            ], 422);
        }

        if ($file->getSize() > (10 * 1024 * 1024)) {
            return $this->respond([
                'status' => false,
                'message' => 'Ukuran file maksimal 10 MB.',
            ], 422);
        }

        $allowedExtensions = [
            'pdf',
            'doc',
            'docx',
            'jpg',
            'jpeg',
            'png',
        ];

        $extension = strtolower(
            $file->getClientExtension()
        );

        if (
            !in_array(
                $extension,
                $allowedExtensions,
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Format file tidak diperbolehkan.',
            ], 422);
        }

        $uploadDirectory =
            WRITEPATH .
            'uploads' .
            DIRECTORY_SEPARATOR .
            'surat_masuk';

        if (!is_dir($uploadDirectory)) {
            mkdir(
                $uploadDirectory,
                0755,
                true
            );
        }

        if (!empty($surat['file_path'])) {
            $oldFile =
                WRITEPATH .
                'uploads' .
                DIRECTORY_SEPARATOR .
                $surat['file_path'];

            if (is_file($oldFile)) {
                unlink($oldFile);
            }
        }

        $newName = $file->getRandomName();

        $file->move(
            $uploadDirectory,
            $newName
        );

        $relativePath =
            'surat_masuk/' .
            $newName;

        $this->suratModel->update(
            $id,
            [
                'file_path' => $relativePath,
            ]
        );

        $this->logActivity(
            'upload_file',
            (int) $id,
            'Mengunggah lampiran surat masuk.'
        );

        return $this->respond([
            'status' => true,
            'message' => 'File surat berhasil diunggah.',
            'data' => [
                'file_path' => $relativePath,
            ],
        ]);
    }

    public function downloadFile($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        if (empty($surat['file_path'])) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat tidak memiliki lampiran.',
            ], 404);
        }

        $filePath =
            WRITEPATH .
            'uploads' .
            DIRECTORY_SEPARATOR .
            $surat['file_path'];

        if (!is_file($filePath)) {
            return $this->respond([
                'status' => false,
                'message' => 'File tidak ditemukan di server.',
            ], 404);
        }

        return $this->response->download(
            $filePath,
            null
        );
    }

    public function delete($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        $db = db_connect();

        $jumlahDisposisi = $db
            ->table('disposisi')
            ->where('surat_masuk_id', $id)
            ->countAllResults();

        if ($jumlahDisposisi > 0) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat tidak dapat dihapus karena sudah memiliki disposisi.',
            ], 409);
        }

        if (!empty($surat['file_path'])) {
            $filePath =
                WRITEPATH .
                'uploads' .
                DIRECTORY_SEPARATOR .
                $surat['file_path'];

            if (is_file($filePath)) {
                unlink($filePath);
            }
        }

        $this->suratModel->delete($id);

        $this->logActivity(
            'delete',
            (int) $id,
            'Menghapus surat masuk nomor agenda ' .
            $surat['no_agenda']
        );

        return $this->respond([
            'status' => true,
            'message' => 'Surat masuk berhasil dihapus.',
        ]);
    }
}