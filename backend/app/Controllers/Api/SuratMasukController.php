<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\AuthTokenModel;
use App\Models\DisposisiModel;
use App\Models\NotifikasiModel;
use App\Models\SuratMasukModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;


class SuratMasukController extends BaseController
{
    use ResponseTrait;

    protected SuratMasukModel $suratModel;
    protected DisposisiModel $disposisiModel;
    protected AuthTokenModel $tokenModel;
    protected ActivityLogModel $activityLogModel;
    protected NotifikasiModel $notifikasiModel;
    protected UserModel $userModel;

    public function __construct()
    {
        $this->suratModel = new SuratMasukModel();
        $this->disposisiModel = new DisposisiModel();
        $this->tokenModel = new AuthTokenModel();
        $this->activityLogModel = new ActivityLogModel();
        $this->notifikasiModel = new NotifikasiModel();
        $this->userModel = new UserModel();
    }

    private function getCurrentUserId(): ?int
    {
        $authorization = $this->request->getHeaderLine('Authorization');

        if (!preg_match('/^Bearer\s+(\S+)$/i', $authorization, $matches)) {
            return null;
        }

        $token = $this->tokenModel
            ->where('token_hash', hash('sha256', $matches[1]))
            ->where('revoked_at', null)
            ->first();

        return $token ? (int) $token['user_id'] : null;
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

    private function notifyKepalaSeksi(string $pesan, string $tipe): void
    {
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

    /**
     * E04: Surat dikunci jika sudah memiliki disposisi.
     */
    private function sudahDidisposisi(int $suratMasukId): bool
    {
        return $this->disposisiModel
            ->where('surat_masuk_id', $suratMasukId)
            ->first() !== null;
    }

    private function isValidDate(string $date): bool
    {
        $dateObject = \DateTime::createFromFormat('!Y-m-d', $date);

        return $dateObject !== false &&
            $dateObject->format('Y-m-d') === $date;
    }

    // ==========================================
    // GET ALL SURAT MASUK
    // ==========================================

    public function index()
    {
        $search = trim((string) $this->request->getGet('search'));
        $status = trim((string) $this->request->getGet('status'));
        $tanggalMulai = trim((string) $this->request->getGet('tanggal_mulai'));
        $tanggalAkhir = trim((string) $this->request->getGet('tanggal_akhir'));

        $perPage = (int) ($this->request->getGet('per_page') ?? 20);
        $perPage = max(1, min($perPage, 50));

        $this->suratModel
            ->select('surat_masuk.*, users.name AS created_by_name')
            ->join('users', 'users.id = surat_masuk.created_by', 'left');

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
            $this->suratModel->where('surat_masuk.status', $status);
        }

        if ($tanggalMulai !== '') {
            $this->suratModel->where(
                'surat_masuk.tanggal >=',
                $tanggalMulai
            );
        }

        if ($tanggalAkhir !== '') {
            $this->suratModel->where(
                'surat_masuk.tanggal <=',
                $tanggalAkhir
            );
        }

        $data = $this->suratModel
            ->orderBy('surat_masuk.id', 'DESC')
            ->paginate($perPage);

        return $this->respond([
            'status' => true,
            'message' => 'Data surat masuk berhasil diambil.',
            'data' => $data,
            'pagination' => [
                'current_page' => $this->suratModel->pager->getCurrentPage(),
                'per_page' => $perPage,
                'total' => $this->suratModel->pager->getTotal(),
                'last_page' => $this->suratModel->pager->getPageCount(),
            ],
        ]);
    }

    // ==========================================
    // GET DETAIL SURAT MASUK
    // ==========================================

    public function show($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel
            ->select('surat_masuk.*, users.name AS created_by_name')
            ->join('users', 'users.id = surat_masuk.created_by', 'left')
            ->where('surat_masuk.id', $id)
            ->first();

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        // Memberi informasi status kunci untuk frontend.
        $surat['is_locked'] = $this->sudahDidisposisi((int) $id);

        return $this->respond([
            'status' => true,
            'message' => 'Detail surat masuk berhasil diambil.',
            'data' => $surat,
        ]);
    }

    // ==========================================
    // CREATE SURAT MASUK
    // ==========================================

    public function create()
    {
        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data) || !$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Request harus menggunakan format JSON.',
            ], 400);
        }

        $required = [
            'no_agenda',
            'no_surat',
            'tanggal',
            'asal',
            'perihal',
        ];

        foreach ($required as $field) {
            if (
                !isset($data[$field]) ||
                !is_string($data[$field]) ||
                trim($data[$field]) === ''
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => "$field wajib diisi dengan teks yang tidak kosong.",
                ], 422);
            }
        }

        $noAgenda = trim($data['no_agenda']);
        $noSurat = trim($data['no_surat']);
        $tanggal = trim($data['tanggal']);
        $asal = trim($data['asal']);
        $perihal = trim($data['perihal']);

        if (!$this->isValidDate($tanggal)) {
            return $this->respond([
                'status' => false,
                'message' => 'Format tanggal harus YYYY-MM-DD.',
            ], 422);
        }

        if (
            isset($data['klasifikasi']) &&
            !is_string($data['klasifikasi'])
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Klasifikasi harus berupa teks.',
            ], 422);
        }

        $klasifikasi = trim((string) ($data['klasifikasi'] ?? ''));

        $duplicate = $this->suratModel
            ->where('no_agenda', $noAgenda)
            ->first();

        if ($duplicate) {
            return $this->respond([
                'status' => false,
                'message' => 'Nomor agenda sudah digunakan.',
            ], 409);
        }

        // Nomor agenda masih manual sambil menunggu SOP BKSDA.
        $id = $this->suratModel->insert([
            'created_by' => $userId,
            'no_agenda' => $noAgenda,
            'no_surat' => $noSurat,
            'tanggal' => $tanggal,
            'asal' => $asal,
            'perihal' => $perihal,
            'klasifikasi' => $klasifikasi !== '' ? $klasifikasi : null,
            'file_path' => null,
            'status' => 'baru',
        ], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menambahkan surat masuk.',
            ], 500);
        }

        $this->logActivity(
            'create',
            (int) $id,
            'Menambahkan surat masuk nomor agenda ' . $noAgenda
        );

        $this->notifyKepalaSeksi(
            'Surat masuk baru diterima dengan nomor agenda "' .
            $noAgenda .
            '" dan perihal "' . $perihal . '".',
            'surat_masuk_baru'
        );

        return $this->respondCreated([
            'status' => true,
            'message' => 'Surat masuk berhasil ditambahkan.',
            'data' => $this->suratModel->find($id),
        ]);
    }

    // ==========================================
    // UPDATE SURAT MASUK
    // ==========================================

    public function update($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        // ======================================
        // FITUR E04: KUNCI SETELAH DISPOSISI
        // ======================================

        if ($this->sudahDidisposisi((int) $id)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk tidak dapat diubah karena sudah memiliki disposisi.',
            ], 409);
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data) || !$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Request harus menggunakan format JSON.',
            ], 400);
        }

        // Status tidak boleh diubah langsung.
        if (array_key_exists('status', $data)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Status surat tidak dapat diubah langsung. Gunakan alur disposisi.',
            ], 422);
        }

        $allowedFields = [
            'no_agenda',
            'no_surat',
            'tanggal',
            'asal',
            'perihal',
            'klasifikasi',
        ];

        $updateData = [];

        foreach ($allowedFields as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }

            if (
                $data[$field] !== null &&
                !is_string($data[$field])
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => "$field harus berupa teks.",
                ], 422);
            }

            $updateData[$field] = is_string($data[$field])
                ? trim($data[$field])
                : null;
        }

        if (!$updateData) {
            return $this->respond([
                'status' => false,
                'message' => 'Tidak ada data yang dapat diperbarui.',
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
                array_key_exists($field, $updateData) &&
                (
                    $updateData[$field] === null ||
                    $updateData[$field] === ''
                )
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => "$field tidak boleh kosong.",
                ], 422);
            }
        }

        if (
            isset($updateData['tanggal']) &&
            !$this->isValidDate($updateData['tanggal'])
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Format tanggal harus YYYY-MM-DD.',
            ], 422);
        }

        // Cek nomor agenda duplikat.
        if (isset($updateData['no_agenda'])) {
            $duplicate = $this->suratModel
                ->where('no_agenda', $updateData['no_agenda'])
                ->where('id !=', $id)
                ->first();

            if ($duplicate) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nomor agenda sudah digunakan.',
                ], 409);
            }
        }

        if (
            array_key_exists('klasifikasi', $updateData) &&
            $updateData['klasifikasi'] === ''
        ) {
            $updateData['klasifikasi'] = null;
        }

        // Simpan perubahan.
        if (!$this->suratModel->update($id, $updateData)) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal memperbarui surat masuk.',
            ], 500);
        }

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

    // ==========================================
    // UPLOAD FILE SURAT MASUK
    // ==========================================

    public function uploadFile($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        // ======================================
        // E04: KUNCI LAMPIRAN SETELAH DISPOSISI
        // ======================================

        if ($this->sudahDidisposisi((int) $id)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Lampiran tidak dapat diubah karena surat sudah memiliki disposisi.',
            ], 409);
        }

        $file = $this->request->getFile('file');

        if (
            !$file ||
            !$file->isValid() ||
            $file->hasMoved()
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'File tidak valid atau tidak ditemukan.',
            ], 422);
        }

        // Maksimal 10 MB.
        if ($file->getSize() > 10 * 1024 * 1024) {
            return $this->respond([
                'status' => false,
                'message' => 'Ukuran file maksimal 10 MB.',
            ], 422);
        }

        // Format file yang diperbolehkan.
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

        $extension = strtolower($file->getClientExtension());

        if (!array_key_exists($extension, $allowedFileTypes)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Format file harus PDF, DOCX, JPG/JPEG, atau PNG.',
            ], 422);
        }

        $mimeType = strtolower((string) $file->getMimeType());

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

        // Validasi dokumen DOCX.
        if ($extension === 'docx') {
            if (!class_exists(\ZipArchive::class)) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Ekstensi PHP ZipArchive belum aktif pada server.',
                ], 500);
            }

            $zip = new \ZipArchive();

            if ($zip->open($file->getTempName()) !== true) {
                return $this->respond([
                    'status' => false,
                    'message' => 'File DOCX tidak valid.',
                ], 422);
            }

            $valid =
                $zip->locateName('[Content_Types].xml') !== false &&
                $zip->locateName('word/document.xml') !== false;

            $zip->close();

            if (!$valid) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'File bukan dokumen DOCX yang valid.',
                ], 422);
            }
        }

        // Siapkan folder penyimpanan.
        $uploadDirectory = WRITEPATH . 'uploads/surat_masuk';

        if (
            !is_dir($uploadDirectory) &&
            !mkdir($uploadDirectory, 0775, true) &&
            !is_dir($uploadDirectory)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Folder upload tidak dapat dibuat.',
            ], 500);
        }

        // Simpan file dengan nama acak.
        $newName = $file->getRandomName();

        $file->move($uploadDirectory, $newName);

        $filePath = 'surat_masuk/' . $newName;

        // Simpan lokasi file di database.
        if (!$this->suratModel->update($id, [
            'file_path' => $filePath,
        ])) {
            @unlink($uploadDirectory . DIRECTORY_SEPARATOR . $newName);

            return $this->respond([
                'status' => false,
                'message' => 'Gagal menyimpan lampiran surat.',
            ], 500);
        }

        // Hapus lampiran lama setelah data berhasil diperbarui.
        if (!empty($surat['file_path'])) {
            $oldFile = WRITEPATH . 'uploads/' . $surat['file_path'];

            if (is_file($oldFile)) {
                unlink($oldFile);
            }
        }

        $this->logActivity(
            'upload_file',
            (int) $id,
            'Mengunggah lampiran surat masuk.'
        );

        return $this->respond([
            'status' => true,
            'message' => 'File surat masuk berhasil diunggah.',
            'data' => [
                'file_path' => $filePath,
            ],
        ]);
    }

    // ==========================================
    // DOWNLOAD FILE SURAT MASUK
    // ==========================================

    public function downloadFile($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat masuk tidak valid.',
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
                'message' => 'Surat belum memiliki lampiran.',
            ], 404);
        }

        $filePath = WRITEPATH . 'uploads/' . $surat['file_path'];

        if (!is_file($filePath)) {
            return $this->respond([
                'status' => false,
                'message' => 'File tidak ditemukan di server.',
            ], 404);
        }

        $this->logActivity(
            'download_file',
            (int) $id,
            'Mengunduh lampiran surat masuk.'
        );

        return $this->response->download($filePath, null);
    }

    // ==========================================
    // DELETE SURAT MASUK
    // ==========================================

    public function delete($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat masuk tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat masuk tidak ditemukan.',
            ], 404);
        }

        // Tidak boleh hapus surat yang sudah didisposisi.
        if ($this->sudahDidisposisi((int) $id)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat tidak dapat dihapus karena sudah memiliki disposisi.',
            ], 409);
        }

        if (!$this->suratModel->delete($id)) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menghapus surat masuk.',
            ], 500);
        }

        // Hapus file lampiran.
        if (!empty($surat['file_path'])) {
            $filePath = WRITEPATH . 'uploads/' . $surat['file_path'];

            if (is_file($filePath)) {
                unlink($filePath);
            }
        }

        $this->logActivity(
            'delete',
            (int) $id,
            'Menghapus surat masuk nomor agenda ' . $surat['no_agenda']
        );

        return $this->respond([
            'status' => true,
            'message' => 'Surat masuk berhasil dihapus.',
        ]);
    }
}
