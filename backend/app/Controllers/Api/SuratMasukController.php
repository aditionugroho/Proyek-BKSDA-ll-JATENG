<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\AuthTokenModel;
use App\Models\NotifikasiModel;
use App\Models\SuratMasukModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class SuratMasukController extends BaseController
{
    use ResponseTrait;

    protected SuratMasukModel $suratModel;
    protected AuthTokenModel $tokenModel;
    protected ActivityLogModel $activityLogModel;
    protected NotifikasiModel $notifikasiModel;
    protected UserModel $userModel;

    public function __construct()
    {
        $this->suratModel = new SuratMasukModel();
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
            'modul' => 'surat_masuk',
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

        $status = trim(
            (string) $this->request->getGet('status')
        );

        $tanggalMulai = trim(
            (string) $this->request->getGet('tanggal_mulai')
        );

        $tanggalAkhir = trim(
            (string) $this->request->getGet('tanggal_akhir')
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
                'surat_masuk.*, users.name AS created_by_name'
            )
            ->join(
                'users',
                'users.id = surat_masuk.created_by',
                'left'
            );

        if ($search !== '') {
            $this->suratModel
                ->groupStart()
                ->like(
                    'surat_masuk.no_agenda',
                    $search
                )
                ->orLike(
                    'surat_masuk.no_surat',
                    $search
                )
                ->orLike(
                    'surat_masuk.asal',
                    $search
                )
                ->orLike(
                    'surat_masuk.perihal',
                    $search
                )
                ->orLike(
                    'surat_masuk.klasifikasi',
                    $search
                )
                ->groupEnd();
        }

        if ($status !== '') {
            $this->suratModel
                ->where(
                    'surat_masuk.status',
                    $status
                );
        }

        if ($tanggalMulai !== '') {
            $this->suratModel
                ->where(
                    'surat_masuk.tanggal >=',
                    $tanggalMulai
                );
        }

        if ($tanggalAkhir !== '') {
            $this->suratModel
                ->where(
                    'surat_masuk.tanggal <=',
                    $tanggalAkhir
                );
        }

        $data = $this->suratModel
            ->orderBy(
                'surat_masuk.id',
                'DESC'
            )
            ->paginate($perPage);

        return $this->respond([
            'status' => true,
            'message' =>
                'Data surat masuk berhasil diambil.',

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
                    'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->select(
                'surat_masuk.*, users.name AS created_by_name'
            )
            ->join(
                'users',
                'users.id = surat_masuk.created_by',
                'left'
            )
            ->where(
                'surat_masuk.id',
                $id
            )
            ->first();

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' =>
                'Detail surat masuk berhasil diambil.',
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

        $data = $this->request->getJSON(true);

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

        $asal = trim(
            $data['asal'] ?? ''
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
            $asal === '' ||
            $perihal === ''
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'No agenda, no surat, tanggal, asal, dan perihal wajib diisi.',
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
            'asal' => $asal,
            'perihal' => $perihal,
            'klasifikasi' =>
                $klasifikasi !== ''
                    ? $klasifikasi
                    : null,
            'file_path' => null,
            'status' => 'baru',
        ], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Gagal menambahkan surat masuk.',
            ], 500);
        }

        $this->logActivity(
            'create',
            (int) $id,
            'Menambahkan surat masuk nomor agenda ' .
            $noAgenda
        );

        $this->notifyKepalaSeksi(
            'Surat masuk baru diterima dengan nomor agenda "' .
            $noAgenda .
            '" dan perihal "' .
            $perihal .
            '".',
            'surat_masuk_baru'
        );

        return $this->respondCreated([
            'status' => true,
            'message' =>
                'Surat masuk berhasil ditambahkan.',
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
                    'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk tidak ditemukan.',
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
            'asal',
            'perihal',
            'klasifikasi',
            'status',
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
            'asal',
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
            'Memperbarui data surat masuk.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Surat masuk berhasil diperbarui.',
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
                    'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk tidak ditemukan.',
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

        $allowedFileTypes = [
            'pdf' => [
                'application/pdf',
            ],

            'docx' => [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/zip',
            ],

            'jpg' => [
                'image/jpeg',
            ],

            'jpeg' => [
                'image/jpeg',
            ],

            'png' => [
                'image/png',
            ],
        ];

        $extension = strtolower(
            $file->getClientExtension()
        );

        if (
            !array_key_exists(
                $extension,
                $allowedFileTypes
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Format file harus PDF, DOCX, JPG/JPEG, atau PNG.',
            ], 422);
        }

        $mimeType = strtolower(
            (string) $file->getMimeType()
        );

        if (
            !in_array(
                $mimeType,
                $allowedFileTypes[$extension],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Tipe isi file tidak sesuai dengan format file.',
            ], 422);
        }
        if ($extension === 'docx') {
            $zip = new \ZipArchive();

            $zipResult = $zip->open(
                $file->getTempName()
            );

            if ($zipResult !== true) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'File DOCX tidak valid.',
                ], 422);
            }

            $hasContentTypes =
                $zip->locateName(
                    '[Content_Types].xml'
                ) !== false;

            $hasWordDocument =
                $zip->locateName(
                    'word/document.xml'
                ) !== false;

            $zip->close();

            if (
                !$hasContentTypes ||
                !$hasWordDocument
            ) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'File bukan dokumen DOCX yang valid.',
                ], 422);
            }
        }

        $uploadDirectory =
            WRITEPATH .
            'uploads/surat_masuk';

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
            'surat_masuk/' .
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
            'Mengunggah lampiran surat masuk.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'File surat masuk berhasil diunggah.',
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
                    'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk tidak ditemukan.',
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
            'Mengunduh lampiran surat masuk.'
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
                    'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk tidak ditemukan.',
            ], 404);
        }

        $db = db_connect();

        $jumlahDisposisi = $db
            ->table('disposisi')
            ->where(
                'surat_masuk_id',
                $id
            )
            ->countAllResults();

        if ($jumlahDisposisi > 0) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat tidak dapat dihapus karena sudah memiliki disposisi.',
            ], 409);
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
            'Menghapus surat masuk nomor agenda ' .
            $surat['no_agenda']
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Surat masuk berhasil dihapus.',
        ]);
    }
}