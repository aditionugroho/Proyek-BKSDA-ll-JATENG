<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\AuthTokenModel;
use App\Models\NotifikasiModel;
use App\Models\SuratKeluarModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class SuratKeluarController extends BaseController
{
    use ResponseTrait;

    protected SuratKeluarModel $suratModel;
    protected AuthTokenModel $tokenModel;
    protected ActivityLogModel $activityLogModel;
    protected NotifikasiModel $notifikasiModel;
    protected UserModel $userModel;

    public function __construct()
    {
        $this->suratModel = new SuratKeluarModel();
        $this->tokenModel = new AuthTokenModel();
        $this->activityLogModel = new ActivityLogModel();
        $this->notifikasiModel = new NotifikasiModel();
        $this->userModel = new UserModel();
    }

    private function getCurrentUserId(): ?int
    {
        $authorization = $this->request
            ->getHeaderLine('Authorization');

        if (
            !$authorization ||
            !preg_match(
                '/^Bearer\s+(\S+)$/i',
                $authorization,
                $matches
            )
        ) {
            return null;
        }

        $tokenHash = hash(
            'sha256',
            $matches[1]
        );

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
            'user_id' => $this->getCurrentUserId(),
            'aktivitas' => $aktivitas,
            'modul' => 'surat_keluar',
            'referensi_id' => $referensiId,
            'deskripsi' => $deskripsi,
            'ip_address' => $this->request->getIPAddress(),
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    private function notifyKepalaSeksi(
        string $pesan,
        string $tipe
    ): void {
        $kepalaList = $this->userModel
            ->where('role', 'kepala_seksi')
            ->where('status', 1)
            ->findAll();

        foreach ($kepalaList as $kepala) {
            $this->notifikasiModel->insert([
                'user_id' => (int) $kepala['id'],
                'pesan' => $pesan,
                'tipe' => $tipe,
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    private function isValidDate(string $date): bool
    {
        $dateObject = \DateTime::createFromFormat(
            'Y-m-d',
            $date
        );

        return $dateObject &&
            $dateObject->format('Y-m-d') === $date;
    }

    public function index()
    {
        $search = trim(
            (string) $this->request->getGet('search')
        );

        $klasifikasi = trim(
            (string) $this->request->getGet('klasifikasi')
        );

        $perPage = (int) (
            $this->request->getGet('per_page') ?? 20
        );

        if ($perPage < 1) {
            $perPage = 20;
        }

        if ($perPage > 50) {
            $perPage = 50;
        }

        $this->suratModel
            ->select(
                'surat_keluar.*, users.name AS created_by_name'
            )
            ->join(
                'users',
                'users.id = surat_keluar.created_by',
                'left'
            );

        if ($search !== '') {
            $this->suratModel
                ->groupStart()
                ->like(
                    'surat_keluar.no_agenda',
                    $search
                )
                ->orLike(
                    'surat_keluar.no_surat',
                    $search
                )
                ->orLike(
                    'surat_keluar.tujuan',
                    $search
                )
                ->orLike(
                    'surat_keluar.perihal',
                    $search
                )
                ->groupEnd();
        }

        if ($klasifikasi !== '') {
            $this->suratModel
                ->where(
                    'surat_keluar.klasifikasi',
                    $klasifikasi
                );
        }

        $data = $this->suratModel
            ->orderBy(
                'surat_keluar.id',
                'DESC'
            )
            ->paginate($perPage);

        return $this->respond([
            'status' => true,
            'message' =>
                'Data surat keluar berhasil diambil.',

            'data' => $data,

            'pagination' => [
                'current_page' =>
                    $this->suratModel
                        ->pager
                        ->getCurrentPage(),

                'per_page' => $perPage,

                'total' =>
                    $this->suratModel
                        ->pager
                        ->getTotal(),

                'last_page' =>
                    $this->suratModel
                        ->pager
                        ->getPageCount(),
            ],
        ]);
    }

    public function show($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID surat keluar tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->select(
                'surat_keluar.*, users.name AS created_by_name'
            )
            ->join(
                'users',
                'users.id = surat_keluar.created_by',
                'left'
            )
            ->where(
                'surat_keluar.id',
                $id
            )
            ->first();

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat keluar tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' =>
                'Detail surat keluar berhasil diambil.',
            'data' => $surat,
        ]);
    }

    public function create()
    {
        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'User tidak terautentikasi.',
            ], 401);
        }

        $data = $this->request
            ->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Request harus menggunakan format JSON.',
            ], 400);
        }

        $noAgenda = trim(
            $data['no_agenda'] ?? ''
        );

        $noSurat = trim(
            $data['no_surat'] ?? ''
        );

        $tanggal = trim(
            $data['tanggal'] ?? ''
        );

        $tujuan = trim(
            $data['tujuan'] ?? ''
        );

        $perihal = trim(
            $data['perihal'] ?? ''
        );

        $klasifikasi = trim(
            $data['klasifikasi'] ?? ''
        );

        if (
            $noAgenda === '' ||
            $noSurat === '' ||
            $tanggal === '' ||
            $tujuan === '' ||
            $perihal === ''
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'No agenda, no surat, tanggal, tujuan, dan perihal wajib diisi.',
            ], 422);
        }

        if (!$this->isValidDate($tanggal)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Format tanggal harus YYYY-MM-DD.',
            ], 422);
        }

        $duplicate = $this->suratModel
            ->where(
                'no_agenda',
                $noAgenda
            )
            ->first();

        if ($duplicate) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Nomor agenda sudah digunakan.',
            ], 409);
        }

        $id = $this->suratModel->insert([
            'created_by' => $userId,
            'no_agenda' => $noAgenda,
            'no_surat' => $noSurat,
            'tanggal' => $tanggal,
            'tujuan' => $tujuan,
            'perihal' => $perihal,
            'klasifikasi' =>
                $klasifikasi !== ''
                    ? $klasifikasi
                    : null,
            'file_path' => null,
        ], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Gagal menambahkan surat keluar.',
            ], 500);
        }

        $this->logActivity(
            'create',
            (int) $id,
            'Menambahkan surat keluar nomor agenda ' .
            $noAgenda
        );

        $this->notifyKepalaSeksi(
            'Surat keluar baru dibuat dengan nomor agenda "' .
            $noAgenda .
            '" dan perihal "' .
            $perihal .
            '".',
            'surat_keluar_baru'
        );

        return $this->respondCreated([
            'status' => true,
            'message' =>
                'Surat keluar berhasil ditambahkan.',
            'data' =>
                $this->suratModel
                    ->find($id),
        ]);
    }

    public function update($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID surat keluar tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat keluar tidak ditemukan.',
            ], 404);
        }

        $data = $this->request
            ->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Request harus menggunakan format JSON.',
            ], 400);
        }

        $allowedFields = [
            'no_agenda',
            'no_surat',
            'tanggal',
            'tujuan',
            'perihal',
            'klasifikasi',
        ];

        $updateData = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                if (
                    is_string($data[$field])
                ) {
                    $updateData[$field] =
                        trim($data[$field]);
                } else {
                    $updateData[$field] =
                        $data[$field];
                }
            }
        }

        if (!$updateData) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Tidak ada data yang dapat diperbarui.',
            ], 422);
        }

        $requiredFields = [
            'no_agenda',
            'no_surat',
            'tanggal',
            'tujuan',
            'perihal',
        ];

        foreach ($requiredFields as $field) {
            if (
                array_key_exists(
                    $field,
                    $updateData
                ) &&
                $updateData[$field] === ''
            ) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        $field .
                        ' tidak boleh kosong.',
                ], 422);
            }
        }

        if (
            isset($updateData['tanggal']) &&
            !$this->isValidDate(
                $updateData['tanggal']
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Format tanggal harus YYYY-MM-DD.',
            ], 422);
        }

        if (
            isset(
                $updateData['no_agenda']
            )
        ) {
            $duplicate = $this->suratModel
                ->where(
                    'no_agenda',
                    $updateData['no_agenda']
                )
                ->where(
                    'id !=',
                    $id
                )
                ->first();

            if ($duplicate) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Nomor agenda sudah digunakan.',
                ], 409);
            }
        }

        if (
            array_key_exists(
                'klasifikasi',
                $updateData
            ) &&
            $updateData['klasifikasi'] === ''
        ) {
            $updateData['klasifikasi'] =
                null;
        }

        $this->suratModel->update(
            $id,
            $updateData
        );

        $this->logActivity(
            'update',
            (int) $id,
            'Memperbarui data surat keluar.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Surat keluar berhasil diperbarui.',
            'data' =>
                $this->suratModel
                    ->find($id),
        ]);
    }

    public function uploadFile($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID surat keluar tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat keluar tidak ditemukan.',
            ], 404);
        }

        $file = $this->request
            ->getFile('file');

        if (
            !$file ||
            !$file->isValid() ||
            $file->hasMoved()
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'File tidak valid atau tidak ditemukan.',
            ], 422);
        }

        if (
            $file->getSize() >
            (10 * 1024 * 1024)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Ukuran file maksimal 10 MB.',
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
            $file->getExtension()
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
                'message' =>
                    'Format file tidak didukung.',
            ], 422);
        }

        $uploadDirectory =
            WRITEPATH .
            'uploads/surat_keluar';

        if (
            !is_dir($uploadDirectory)
        ) {
            mkdir(
                $uploadDirectory,
                0775,
                true
            );
        }

        $newName = $file
            ->getRandomName();

        $file->move(
            $uploadDirectory,
            $newName
        );

        if (
            !empty($surat['file_path'])
        ) {
            $oldFile =
                WRITEPATH .
                'uploads/' .
                $surat['file_path'];

            if (
                is_file($oldFile)
            ) {
                unlink($oldFile);
            }
        }

        $filePath =
            'surat_keluar/' .
            $newName;

        $this->suratModel->update(
            $id,
            [
                'file_path' =>
                    $filePath,
            ]
        );

        $this->logActivity(
            'upload_file',
            (int) $id,
            'Mengunggah lampiran surat keluar.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'File surat keluar berhasil diunggah.',
            'data' => [
                'file_path' =>
                    $filePath,
            ],
        ]);
    }

    public function downloadFile($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID surat keluar tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat keluar tidak ditemukan.',
            ], 404);
        }

        if (
            empty($surat['file_path'])
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat belum memiliki lampiran.',
            ], 404);
        }

        $filePath =
            WRITEPATH .
            'uploads/' .
            $surat['file_path'];

        if (!is_file($filePath)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'File tidak ditemukan di server.',
            ], 404);
        }

        $this->logActivity(
            'download_file',
            (int) $id,
            'Mengunduh lampiran surat keluar.'
        );

        return $this->response
            ->download(
                $filePath,
                null
            );
    }

    public function delete($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID surat keluar tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat keluar tidak ditemukan.',
            ], 404);
        }

        if (
            !empty($surat['file_path'])
        ) {
            $filePath =
                WRITEPATH .
                'uploads/' .
                $surat['file_path'];

            if (is_file($filePath)) {
                unlink($filePath);
            }
        }

        $this->suratModel
            ->delete($id);

        $this->logActivity(
            'delete',
            (int) $id,
            'Menghapus surat keluar nomor agenda ' .
            $surat['no_agenda']
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Surat keluar berhasil dihapus.',
        ]);
    }
}