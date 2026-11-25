<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\ResortAccessPolicy;
use App\Libraries\SuratAttachmentPath;
use App\Models\ResortModel;
use App\Models\ActivityLogModel;
use App\Models\ArsipModel;
use App\Models\AuthTokenModel;
use App\Models\NotifikasiModel;
use App\Models\SuratKeluarModel;
use App\Models\UserModel;
use App\Services\UploadRetryService;
use CodeIgniter\API\ResponseTrait;

class SuratKeluarController extends BaseController
{
    use ResponseTrait;

    private const FIELDS = ['no_agenda', 'no_surat', 'tanggal', 'tujuan', 'perihal', 'klasifikasi', 'isi'];
    private const REQUIRED = ['no_surat', 'tanggal', 'tujuan', 'perihal'];

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

    private function currentAccessUser(): ?array
    {
        $id = $this->getCurrentUserId();
        return $id ? $this->userModel->where('id', $id)->where('status', 1)->first() : null;
    }

    // Fail closed before any detail, write, preview, or file access.
    private function guardDocumentAccess($id)
    {
        $user = $this->currentAccessUser();
        if (!$user) {
            return $this->respond(['status' => false, 'message' => 'Akun tidak aktif atau tidak terautentikasi.'], 401);
        }
        $surat = $this->suratModel->find((int) $id);
        if ($surat && (!$this->canReadDraft($surat, $user) || !ResortAccessPolicy::canAccess(
            $user,
            isset($surat['resort_id']) ? (int) $surat['resort_id'] : null
        ))) {
            return $this->respond(['status' => false, 'message' => 'Dokumen tidak ditemukan atau tidak dapat diakses.'], 404);
        }
        return null;
    }

    private function canReadDraft(array $surat, array $actor): bool
    {
        return $surat['status'] !== SuratKeluarModel::DRAFT
            || $actor['role'] === 'admin'
            || ($actor['role'] === 'staf' && (int) $surat['created_by'] === (int) $actor['id']);
    }

    private function canEdit(array $surat, array $actor): bool
    {
        if ($surat['status'] === SuratKeluarModel::REGISTERED) {
            return $actor['role'] === 'admin';
        }
        return $surat['status'] === SuratKeluarModel::DRAFT
            && ($actor['role'] === 'admin'
                || ($actor['role'] === 'staf' && (int) $surat['created_by'] === (int) $actor['id']));
    }

    private function failure(string $message, int $code)
    {
        return $this->respond(['status' => false, 'message' => $message], $code);
    }

    private function readFields(array $data): array
    {
        $fields = [];
        foreach (self::FIELDS as $field) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            if ($data[$field] !== null && !is_string($data[$field])) {
                throw new \InvalidArgumentException($field . ' harus berupa teks.');
            }
            $value = trim($data[$field] ?? '');
            $fields[$field] = $value === '' ? null : $value;
        }
        foreach (['no_agenda' => 50, 'no_surat' => 100, 'tujuan' => 255, 'klasifikasi' => 100] as $field => $length) {
            if (isset($fields[$field]) && mb_strlen($fields[$field]) > $length) {
                throw new \InvalidArgumentException($field . ' melebihi batas panjang.');
            }
        }
        foreach (['perihal', 'isi'] as $field) {
            if (isset($fields[$field]) && strlen($fields[$field]) > 65535) {
                throw new \InvalidArgumentException($field . ' melebihi batas panjang.');
            }
        }
        if (isset($fields['tanggal']) && !$this->isValidDate($fields['tanggal'])) {
            throw new \InvalidArgumentException('Format tanggal harus YYYY-MM-DD.');
        }
        return $fields;
    }

    private function requireComplete(array $fields, string $status): void
    {
        $required = self::REQUIRED;
        if ($status === SuratKeluarModel::SUBMITTED) {
            $required[] = 'isi';
        }
        foreach ($required as $field) {
            if (empty($fields[$field]) && ($fields[$field] ?? null) !== '0') {
                throw new \InvalidArgumentException($field . ' wajib diisi.');
            }
        }
    }

    private function notifySubmitted(array $surat): void
    {
        $this->notifyKepalaSeksi(
            'Surat keluar diajukan dengan nomor agenda "' . $surat['no_agenda']
                . '" dan perihal "' . $surat['perihal'] . '".',
            'surat_keluar_baru'
        );
    }

    private function logActivity(
        string $aktivitas,
        ?int $referensiId = null,
        ?string $deskripsi = null
    ): bool {
        return $this->activityLogModel->insert([
            'user_id' => $this->getCurrentUserId(),
            'aktivitas' => $aktivitas,
            'modul' => 'surat_keluar',
            'referensi_id' => $referensiId,
            'deskripsi' => $deskripsi,
            'ip_address' => $this->request->getIPAddress(),
            'created_at' => date('Y-m-d H:i:s'),
        ]) !== false;
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
            $written = $this->notifikasiModel->insert([
                'user_id' => (int) $kepala['id'],
                'pesan' => $pesan,
                'tipe' => $tipe,
                'is_read' => 0,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            if ($written === false) {
                throw new \RuntimeException('Notifikasi gagal disimpan.');
            }
        }
    }

    private function afterSuratWrite(string $operation, array $surat, bool $submitting = false): void
    {
        $id = (int) $surat['id'];
        $effects = [
            'activity_log' => fn () => $this->logActivity($operation, $id, 'Status surat keluar: ' . $surat['status'] . '.'),
        ];
        if ($submitting) {
            $effects['notification'] = fn () => $this->notifySubmitted($surat);
        }
        foreach ($effects as $name => $effect) {
            try {
                if ($effect() === false) {
                    throw new \RuntimeException('Efek pascasimpan gagal disimpan.');
                }
            } catch (\Throwable $error) {
                log_message('error', 'Surat Keluar {id}: efek pascasimpan {effect} gagal ({type}).', [
                    'id' => $id, 'effect' => $name, 'type' => get_class($error),
                ]);
            }
        }
    }

    private function draftReplay(array $actor, int $resortId, string $keyHash)
    {
        $surat = $this->suratModel->where('created_by', $actor['id'])->where('draft_create_key', $keyHash)->first();
        if (!$surat) {
            return null;
        }
        if ((int) $surat['resort_id'] !== $resortId) {
            return $this->failure('Permintaan ini sudah digunakan untuk resort lain.', 409);
        }
        unset($surat['draft_create_key']);
        return $this->respond(['status' => true, 'data' => $surat, 'replayed' => true]);
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
        return $this->listSurat(false);
    }

    public function dokumenSaya()
    {
        return $this->listSurat(true);
    }

    private function listSurat(bool $ownedOnly)
    {
        $user = $this->currentAccessUser();
        if (!$user) {
            return $this->respond(['status' => false, 'message' => 'Akun tidak terautentikasi.'], 401);
        }
        ResortAccessPolicy::scopeQuery($this->suratModel, 'surat_keluar', $user);
        if ($ownedOnly) {
            $status = $this->request->getGet('status');
            if ($status !== null && !in_array($status, [
                SuratKeluarModel::DRAFT, SuratKeluarModel::SUBMITTED, SuratKeluarModel::REGISTERED,
            ], true)) {
                return $this->failure('Filter status dokumen tidak valid.', 422);
            }
            $this->suratModel->where('surat_keluar.created_by', $user['id']);
            if ($status !== null) {
                $this->suratModel->where('surat_keluar.status', $status);
            }
        } elseif ($user['role'] !== 'admin') {
            $this->suratModel->groupStart()->where('surat_keluar.status !=', SuratKeluarModel::DRAFT);
            if ($user['role'] === 'staf') {
                $this->suratModel->orWhere('surat_keluar.created_by', $user['id']);
            }
            $this->suratModel->groupEnd();
        }

        $search = $this->request->getGet('search') ?? '';
        $klasifikasi = $this->request->getGet('klasifikasi') ?? '';
        $pageSize = $this->request->getGet('per_page') ?? '20';
        $page = $this->request->getGet('page');
        if (!is_string($search) || !is_string($klasifikasi) || !ctype_digit((string) (is_scalar($pageSize) ? $pageSize : ''))
            || ($page !== null && (!is_string($page) || !ctype_digit($page) || (int) $page < 1))) {
            return $this->failure('Parameter daftar surat tidak valid.', 422);
        }
        $search = trim($search);
        $klasifikasi = trim($klasifikasi);
        $perPage = (int) $pageSize;

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
        return $this->findSurat($id, false);
    }

    public function detailDokumenSaya($id = null)
    {
        return $this->findSurat($id, true);
    }

    private function findSurat($id, bool $ownedOnly)
    {
        if (!$ownedOnly && $id !== null && ctype_digit((string) $id)) {
            $denied = $this->guardDocumentAccess($id);
            if ($denied !== null) {
                return $denied;
            }
        }

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

        if ($ownedOnly) {
            $user = $this->currentAccessUser();
            if (!$user) {
                return $this->failure('Akun tidak terautentikasi.', 401);
            }
            ResortAccessPolicy::scopeQuery($this->suratModel, 'surat_keluar', $user);
            $this->suratModel->where('surat_keluar.created_by', $user['id']);
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
        $actor = $this->currentAccessUser();
        if (!$actor) {
            return $this->failure('Akun tidak terautentikasi.', 401);
        }
        try {
            $data = $this->request->getJSON(true);
        } catch (\CodeIgniter\HTTP\Exceptions\HTTPException) {
            return $this->failure('Request harus menggunakan format JSON.', 400);
        }
        if (!is_array($data) || !$data) {
            return $this->failure('Request harus menggunakan format JSON.', 400);
        }
        if (array_key_exists('status', $data) && $data['status'] !== SuratKeluarModel::DRAFT) {
            return $this->failure('Surat keluar baru harus dibuat sebagai Draft.', 422);
        }
        try {
            $fields = $this->readFields($data);
        } catch (\InvalidArgumentException $error) {
            return $this->failure($error->getMessage(), 422);
        }

        $requestedResortId = $data['resort_id'] ?? null;
        if ($actor['role'] === 'staf') {
            $chosenResortId = (int) ($actor['resort_id'] ?? 0);
            if ($chosenResortId < 1) {
                return $this->respond(['status' => false, 'message' => 'Staf belum ditempatkan pada resort.'], 403);
            }
            if ($requestedResortId !== null &&
                (!ctype_digit((string) $requestedResortId) || (int) $requestedResortId !== $chosenResortId)) {
                return $this->respond(['status' => false, 'message' => 'Tidak dapat membuat surat untuk resort lain.'], 403);
            }
        } elseif ($actor['role'] === 'admin') {
            if (!ctype_digit((string) $requestedResortId) || (int) $requestedResortId < 1) {
                return $this->respond(['status' => false, 'message' => 'resort_id wajib diisi untuk admin.'], 422);
            }
            $chosenResortId = (int) $requestedResortId;
        } else {
            return $this->respond(['status' => false, 'message' => 'Role tidak diizinkan.'], 403);
        }
        $resort = (new ResortModel())->where('id', $chosenResortId)->where('status', 1)->first();
        if (!$resort) {
            return $this->respond(['status' => false, 'message' => 'Resort tidak aktif atau tidak ditemukan.'], 422);
        }

        $key = $this->request->getHeaderLine('Idempotency-Key');
        if ($key !== '' && !preg_match('/\A[A-Za-z0-9_-]{16,128}\z/', $key)) {
            return $this->failure('Idempotency-Key tidak valid.', 422);
        }
        $keyHash = $key === '' ? null : hash('sha256', $key);
        if ($keyHash !== null) {
            $replay = $this->draftReplay($actor, $chosenResortId, $keyHash);
            if ($replay !== null) {
                return $replay;
            }
        }
        unset($fields['no_agenda']);
        $db = db_connect();
        if (!$db->transBegin()) {
            return $this->failure('Gagal memulai penyimpanan surat keluar.', 500);
        }
        try {
            $id = $this->suratModel->insert($fields + [
                'created_by' => $actor['id'],
                'resort_id' => $chosenResortId,
                'no_agenda' => 'TMP-' . bin2hex(random_bytes(16)),
                'status' => SuratKeluarModel::DRAFT,
                'draft_create_key' => $keyHash,
            ], true);
            if (!$id) {
                throw new \RuntimeException('Gagal menyimpan surat keluar.');
            }
            $year = isset($fields['tanggal']) ? substr($fields['tanggal'], 0, 4) : date('Y');
            $agenda = sprintf('SKK/%s/%04d', $year, (int) $id);
            if (!$this->suratModel->update($id, ['no_agenda' => $agenda])) {
                throw new \RuntimeException('Gagal menetapkan nomor agenda.');
            }
            $surat = $this->suratModel->find($id);
            if (!$surat || !$db->transStatus() || !$db->transCommit()) {
                throw new \RuntimeException('Gagal menyelesaikan transaksi surat keluar.');
            }
        } catch (\Throwable $error) {
            $db->transRollback();
            if ($keyHash !== null) {
                $replay = $this->draftReplay($actor, $chosenResortId, $keyHash);
                if ($replay !== null) {
                    return $replay;
                }
            }
            log_message('error', 'Penyimpanan Surat Keluar gagal: {type}', ['type' => get_class($error)]);
            return $this->failure('Gagal menyimpan surat keluar.', 500);
        }

        unset($surat['draft_create_key']);
        $this->afterSuratWrite('create', $surat);
        return $this->respondCreated(['status' => true, 'data' => $surat]);
    }

    public function update($id = null)
    {
        $denied = $this->guardDocumentAccess($id);
        if ($denied !== null) {
            return $denied;
        }
        $surat = $this->suratModel->find($id);
        if (!$surat) {
            return $this->failure('Surat keluar tidak ditemukan.', 404);
        }
        $actor = $this->currentAccessUser();
        if (!$actor || !$this->canEdit($surat, $actor)) {
            return $this->failure('Surat keluar tidak dapat diubah.', 403);
        }
        try {
            $data = $this->request->getJSON(true);
        } catch (\CodeIgniter\HTTP\Exceptions\HTTPException) {
            return $this->failure('Request harus menggunakan format JSON.', 400);
        }
        if (!is_array($data) || !$data) {
            return $this->failure('Request harus menggunakan format JSON.', 400);
        }
        $currentStatus = $surat['status'];
        $status = $data['status'] ?? $currentStatus;
        $submitting = $currentStatus === SuratKeluarModel::DRAFT && $status === SuratKeluarModel::SUBMITTED;
        if ($status !== $currentStatus && !$submitting) {
            return $this->failure('Perubahan status surat tidak valid.', 422);
        }
        try {
            $fields = $this->readFields($data);
            if ($status !== SuratKeluarModel::DRAFT) {
                $this->requireComplete($fields + $surat, $status);
            }
        } catch (\InvalidArgumentException $error) {
            return $this->failure($error->getMessage(), 422);
        }
        if (array_key_exists('no_agenda', $fields) && $fields['no_agenda'] !== $surat['no_agenda']) {
            return $this->failure('Nomor agenda ditetapkan oleh sistem.', 422);
        }
        unset($fields['no_agenda']);
        if (!$fields && !$submitting && !array_key_exists('status', $data)) {
            return $this->failure('Tidak ada data yang dapat diperbarui.', 422);
        }
        $this->suratModel->where('id', $id)->where('status', $currentStatus);
        if ($submitting) {
            // Pastikan data yang telah divalidasi masih sama ketika status berubah.
            foreach (array_merge(self::REQUIRED, ['isi']) as $field) {
                $this->suratModel->where($field, $surat[$field]);
            }
        }
        try {
            $updated = $this->suratModel->set($fields + ['status' => $status])->update();
        } catch (\CodeIgniter\Database\Exceptions\DatabaseException $error) {
            if ((int) $error->getCode() !== 1062) {
                throw $error;
            }
            return $this->failure('Nomor agenda sudah digunakan.', 409);
        }
        if (!$updated) {
            return $this->failure('Gagal memperbarui surat keluar.', 500);
        }
        if ($submitting && db_connect()->affectedRows() !== 1) {
            return $this->failure('Status surat sudah berubah. Muat ulang detail.', 409);
        }
        $surat = $this->suratModel->find($id);
        if (!$surat || $surat['status'] !== $status) {
            return $this->failure('Status surat sudah berubah. Muat ulang detail.', 409);
        }
        unset($surat['draft_create_key']);
        $this->afterSuratWrite('update', $surat, $submitting);
        return $this->respond(['status' => true, 'data' => $surat]);
    }

    public function uploadFile($id = null)
    {
        if ($id !== null && ctype_digit((string) $id)) {
            $denied = $this->guardDocumentAccess($id);
            if ($denied !== null) {
                return $denied;
            }
        }

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

        $actor = $this->currentAccessUser();
        if (!$actor || !$this->canEdit($surat, $actor)) {
            return $this->failure('Lampiran surat tidak dapat diubah.', 403);
        }

        // E14: Setiap percobaan ulang upload menggunakan key yang sama.
        $idempotencyKey = trim(
            $this->request->getHeaderLine('Idempotency-Key')
        );

        if (
            $idempotencyKey === '' ||
            strlen($idempotencyKey) > 100 ||
            !preg_match('/^[A-Za-z0-9_-]+$/D', $idempotencyKey)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Idempotency-Key wajib diisi (maksimal 100 karakter, huruf, angka, _ atau -).',
            ], 400);
        }

        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'Pengguna tidak terautentikasi.',
            ], 401);
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
            if (!class_exists(\ZipArchive::class)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Ekstensi PHP ZipArchive belum aktif pada server.',
                ], 500);
            }

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

        // E14: Hitung hash file sebelum melakukan reservasi.
        $fileHash = hash_file('sha256', $file->getTempName());

        if ($fileHash === false) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menghitung hash file upload.',
            ], 500);
        }

        $uploadRetryService = new UploadRetryService();

        $retryResult = $uploadRetryService->reserveRequest(
            $userId,
            'surat_keluar',
            (int) $id,
            $idempotencyKey,
            $fileHash
        );

        // Retry upload yang telah selesai.
        if ($retryResult['status'] === 'completed') {
            return $this->respond([
                'status' => true,
                'message' => $retryResult['message'],
                'data' => [
                    'file_path' => $retryResult['file_path'],
                ],
            ], 200);
        }

        // Cegah upload ganda atau penggunaan key untuk file berbeda.
        if ($retryResult['status'] !== 'reserved') {
            return $this->respond([
                'status' => false,
                'message' => $retryResult['message'],
            ], $retryResult['http_code']);
        }

        $uploadRequestId = (int) $retryResult['request_id'];


        // E14: Simpan file fisik dan selesaikan upload
        // melalui transaksi metadata dan surat keluar.
        $uploadDirectory = WRITEPATH . 'uploads/surat_keluar';
        $newFileAbsolutePath = null;

        try {
            if (
                !is_dir($uploadDirectory) &&
                !mkdir($uploadDirectory, 0775, true) &&
                !is_dir($uploadDirectory)
            ) {
                throw new \RuntimeException('Folder upload tidak dapat dibuat.');
            }

            $newName = $file->getRandomName();

            if (!$file->move($uploadDirectory, $newName)) {
                throw new \RuntimeException('File gagal dipindahkan.');
            }

            $newFileAbsolutePath = $uploadDirectory .
                DIRECTORY_SEPARATOR . $newName;

            $filePath = 'surat_keluar/' . $newName;

            if (!$uploadRetryService->completeUploadTransaction(
                (int) $uploadRequestId,
                'surat_keluar',
                (int) $id,
                $filePath
            )) {
                throw new \RuntimeException(
                    'Gagal menyelesaikan transaksi upload.'
                );
            }

        } catch (\Throwable $e) {
            // Jangan hapus file ketika status commit tidak dapat dipastikan.
            $safeToDeleteNewFile = false;

            try {
                $currentSurat = $this->suratModel->find($id);

                if ($currentSurat && $newFileAbsolutePath !== null) {
                    $safeToDeleteNewFile =
                        ($currentSurat['file_path'] ?? null) !==
                        ('surat_keluar/' . basename($newFileAbsolutePath));
                }
            } catch (\Throwable $lookupException) {
                log_message(
                    'error',
                    'E14 gagal memverifikasi lampiran aktif surat keluar: ' .
                    $lookupException->getMessage()
                );
            }

            if (
                $safeToDeleteNewFile &&
                $newFileAbsolutePath !== null &&
                is_file($newFileAbsolutePath)
            ) {
                @unlink($newFileAbsolutePath);
            }

            // Hanya request processing yang dapat ditandai failed.
            $uploadRetryService->failRequest((int) $uploadRequestId);

            log_message(
                'error',
                'E14 surat keluar gagal: ' . $e->getMessage()
            );

            return $this->respond([
                'status' => false,
                'message' => 'Upload belum berhasil. Silakan coba lagi.',
            ], 500);
        }


        // E14: File lama tidak dihapus otomatis di sini.
        // Pembersihan file orphan dilakukan terpisah
        // setelah referensi database diverifikasi.
        try {
            $this->logActivity(
                'upload_file',
                (int) $id,
                'Mengunggah lampiran surat keluar.'
            );
        } catch (\Throwable $e) {
            log_message('error', 'E14 gagal mencatat aktivitas upload: ' . $e->getMessage());
        }

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
        if ($id !== null && ctype_digit((string) $id)) {
            $denied = $this->guardDocumentAccess($id);
            if ($denied !== null) {
                return $denied;
            }
        }

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

        $attachment = $this->resolveAttachment($surat['file_path']);
        if ($attachment['status'] !== 'valid') {
            return $this->failure('File lampiran tidak ditemukan.', 404);
        }

        $this->logActivity(
            'download_file',
            (int) $id,
            'Mengunduh lampiran surat keluar.'
        );

        return $this->response
            ->download(
                $attachment['path'],
                null
            );
    }

    public function previewFile($id = null)
    {
        if ($id !== null && ctype_digit((string) $id)) {
            $denied = $this->guardDocumentAccess($id);
            if ($denied !== null) {
                return $denied;
            }
        }

        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID surat keluar tidak valid.',
            ], 400);
        }

        $surat = $this->suratModel->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat keluar tidak ditemukan.',
            ], 404);
        }

        if (empty($surat['file_path'])) {
            return $this->respond([
                'status' => false,
                'message' => 'Surat belum memiliki lampiran.',
            ], 404);
        }

        $attachment = $this->resolveAttachment($surat['file_path']);
        if ($attachment['status'] !== 'valid') {
            return $this->failure('File lampiran tidak ditemukan.', 404);
        }
        $filePath = $attachment['path'];
        $extension = strtolower(pathinfo($attachment['name'], PATHINFO_EXTENSION));
        $allowedMimes = [
            'pdf' => 'application/pdf',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
        ];
        if (!isset($allowedMimes[$extension])) {
            return $this->failure('Preview hanya mendukung PDF, JPG/JPEG, dan PNG.', 415);
        }

        $actualMime = (new \finfo(FILEINFO_MIME_TYPE))
            ->file($filePath);

        if ($actualMime !== $allowedMimes[$extension]) {
            return $this->respond([
                'status' => false,
                'message' => 'Tipe isi file tidak valid untuk preview.',
            ], 415);
        }

        $this->logActivity(
            'preview_file',
            (int) $id,
            'Melihat preview surat keluar.'
        );

        return $this->response
            ->download($filePath, null, true)
            ->inline()
            ->setHeader('Content-Type', $actualMime)
            ->setHeader('X-Content-Type-Options', 'nosniff')
            ->setHeader(
                'Cache-Control',
                'private, no-store, max-age=0'
            );
    }

    public function delete($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->failure('ID surat keluar tidak valid.', 400);
        }
        $actor = $this->currentAccessUser();
        if (!$actor) {
            return $this->failure('Akun tidak aktif atau tidak terautentikasi.', 401);
        }
        if ($actor['role'] !== 'admin') {
            return $this->failure('Hanya admin yang dapat menghapus surat keluar.', 403);
        }

        try {
            $surat = $this->deleteSuratRecord((int) $id);
        } catch (\DomainException $error) {
            return $this->failure($error->getMessage(), 409);
        } catch (\Throwable $error) {
            log_message('error', 'Penghapusan record surat keluar {id} gagal: {type}', [
                'id' => $id, 'type' => get_class($error),
            ]);
            return $this->failure('Gagal menghapus surat keluar.', 500);
        }
        if ($surat === null) {
            return $this->failure('Surat keluar tidak ditemukan.', 404);
        }

        $cleanup = $this->cleanupDeletedAttachment($surat['file_path'], (int) $id);
        try {
            $this->logActivity(
                'delete',
                (int) $id,
                'Menghapus surat keluar nomor agenda ' . $surat['no_agenda']
            );
        } catch (\Throwable $error) {
            log_message('error', 'Gagal mencatat aktivitas penghapusan surat keluar {id}: {type}', [
                'id' => $id, 'type' => get_class($error),
            ]);
        }

        return $this->respond([
            'status' => true,
            'message' => $cleanup === 'pending' || $cleanup === 'unsafe'
                ? 'Surat keluar berhasil dihapus. Lampiran memerlukan penanganan terpisah.'
                : 'Surat keluar berhasil dihapus.',
            'data' => ['attachment_cleanup' => $cleanup],
        ]);
    }

    protected function deleteSuratRecord(int $id): ?array
    {
        $db = db_connect();
        if (!$db->transBegin()) {
            throw new \RuntimeException('Gagal memulai transaksi penghapusan.');
        }
        try {
            // Upload lampiran juga mengunci baris ini sebelum mengubah file_path.
            $surat = $db->query(
                'SELECT no_agenda, file_path FROM surat_keluar WHERE id = ? FOR UPDATE',
                [$id]
            )->getRowArray();
            if ($surat === null) {
                $db->transRollback();
                return null;
            }
            if ((new ArsipModel())->findReferenceForUpdate('surat_keluar', $id) !== null) {
                throw new \DomainException('Surat keluar masih digunakan oleh arsip dan tidak dapat dihapus.');
            }
            if (!$this->suratModel->delete($id) || $db->affectedRows() !== 1
                || !$db->transStatus() || !$db->transCommit()) {
                throw new \RuntimeException('Database tidak mengonfirmasi penghapusan.');
            }
            return $surat;
        } catch (\Throwable $error) {
            $db->transRollback();
            throw $error;
        }
    }

    private function resolveAttachment(?string $relativePath): array
    {
        return SuratAttachmentPath::resolve('surat_keluar', $relativePath);
    }

    private function cleanupDeletedAttachment(?string $relativePath, int $id): string
    {
        $attachment = $this->resolveAttachment($relativePath);
        if ($attachment['status'] === 'unsafe') {
            log_message('warning', 'Path lampiran surat keluar {id} tidak aman; pembersihan dilewati.', ['id' => $id]);
        } elseif ($attachment['status'] === 'missing') {
            log_message('notice', 'Lampiran surat keluar {id} sudah tidak ada saat record dihapus.', ['id' => $id]);
        }
        if ($attachment['status'] !== 'valid') {
            return $attachment['status'];
        }

        try {
            $removed = $this->unlinkAttachment($attachment['path']);
        } catch (\Throwable) {
            $removed = false;
        }
        if (!$removed) {
            log_message('error', 'Lampiran yatim surat keluar {id}: surat_keluar/{attachment}; pembersihan gagal.', [
                'id' => $id, 'attachment' => $attachment['name'],
            ]);
            return 'pending';
        }

        return 'removed';
    }

    protected function unlinkAttachment(string $file): bool
    {
        return @unlink($file);
    }
}
