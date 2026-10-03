<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\AuthTokenModel;
use App\Models\SuratKeluarModel;
use CodeIgniter\API\ResponseTrait;

class SuratKeluarController extends BaseController
{
    use ResponseTrait;

    protected SuratKeluarModel $suratKeluarModel;
    protected AuthTokenModel $authTokenModel;
    protected ActivityLogModel $activityLogModel;

    public function __construct()
    {
        $this->suratKeluarModel = new SuratKeluarModel();
        $this->authTokenModel   = new AuthTokenModel();
        $this->activityLogModel = new ActivityLogModel();
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

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

        $token = $this->authTokenModel
            ->where('token_hash', $tokenHash)
            ->where('revoked_at', null)
            ->first();

        if (!$token) {
            return null;
        }

        return (int) $token['user_id'];
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

    private function logActivity(
        string $aktivitas,
        ?int $referensiId = null,
        ?string $deskripsi = null
    ): void {
        $this->activityLogModel->insert([
            'user_id'       => $this->getCurrentUserId(),
            'aktivitas'     => $aktivitas,
            'modul'         => 'surat_keluar',
            'referensi_id'  => $referensiId,
            'deskripsi'     => $deskripsi,
            'ip_address'    => $this->request->getIPAddress(),
            'created_at'    => date('Y-m-d H:i:s'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */

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

        $this->suratKeluarModel
            ->select(
                '
                surat_keluar.*,
                users.name AS created_by_name
                '
            )
            ->join(
                'users',
                'users.id = surat_keluar.created_by',
                'left'
            );

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {
            $this->suratKeluarModel
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

        /*
        |--------------------------------------------------------------------------
        | FILTER KLASIFIKASI
        |--------------------------------------------------------------------------
        */

        if ($klasifikasi !== '') {
            $this->suratKeluarModel
                ->where(
                    'surat_keluar.klasifikasi',
                    $klasifikasi
                );
        }

        $data = $this->suratKeluarModel
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
                    $this->suratKeluarModel
                        ->pager
                        ->getCurrentPage(),

                'per_page' =>
                    $perPage,

                'total' =>
                    $this->suratKeluarModel
                        ->pager
                        ->getTotal(),

                'last_page' =>
                    $this->suratKeluarModel
                        ->pager
                        ->getPageCount(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL
    |--------------------------------------------------------------------------
    */

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

        $surat = $this->suratKeluarModel
            ->select(
                '
                surat_keluar.*,
                users.name AS created_by_name
                '
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
            'data' =>
                $surat,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

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

        /*
        |--------------------------------------------------------------------------
        | VALIDASI REQUIRED
        |--------------------------------------------------------------------------
        */

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
                    'Nomor agenda, nomor surat, tanggal, tujuan, dan perihal wajib diisi.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI TANGGAL
        |--------------------------------------------------------------------------
        */

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
                'message' =>
                    'Format tanggal harus YYYY-MM-DD.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | NOMOR AGENDA UNIQUE
        |--------------------------------------------------------------------------
        */

        $existingAgenda = $this
            ->suratKeluarModel
            ->where(
                'no_agenda',
                $noAgenda
            )
            ->first();

        if ($existingAgenda) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Nomor agenda sudah digunakan.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | INSERT
        |--------------------------------------------------------------------------
        */

        $id = $this->suratKeluarModel
            ->insert([
                'created_by' =>
                    $userId,

                'no_agenda' =>
                    $noAgenda,

                'no_surat' =>
                    $noSurat,

                'tanggal' =>
                    $tanggal,

                'tujuan' =>
                    $tujuan,

                'perihal' =>
                    $perihal,

                'klasifikasi' =>
                    $klasifikasi !== ''
                        ? $klasifikasi
                        : null,

                'file_path' =>
                    null,
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
            'Menambahkan surat keluar dengan nomor agenda ' .
            $noAgenda . '.'
        );

        return $this->respondCreated([
            'status' => true,
            'message' =>
                'Surat keluar berhasil ditambahkan.',

            'data' =>
                $this->suratKeluarModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

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

        $surat = $this
            ->suratKeluarModel
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
                    'Tidak ada data yang diperbarui.',
            ], 400);
        }

        $updateData = [];

        /*
        |--------------------------------------------------------------------------
        | NO AGENDA
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'no_agenda',
            $data
        )) {
            $noAgenda = trim(
                $data['no_agenda']
            );

            if ($noAgenda === '') {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Nomor agenda tidak boleh kosong.',
                ], 422);
            }

            $existing = $this
                ->suratKeluarModel
                ->where(
                    'no_agenda',
                    $noAgenda
                )
                ->where(
                    'id !=',
                    $id
                )
                ->first();

            if ($existing) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Nomor agenda sudah digunakan.',
                ], 409);
            }

            $updateData['no_agenda'] =
                $noAgenda;
        }

        /*
        |--------------------------------------------------------------------------
        | NO SURAT
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'no_surat',
            $data
        )) {
            $noSurat = trim(
                $data['no_surat']
            );

            if ($noSurat === '') {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Nomor surat tidak boleh kosong.',
                ], 422);
            }

            $updateData['no_surat'] =
                $noSurat;
        }

        /*
        |--------------------------------------------------------------------------
        | TANGGAL
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'tanggal',
            $data
        )) {
            $tanggal = trim(
                $data['tanggal']
            );

            $date = \DateTime::createFromFormat(
                'Y-m-d',
                $tanggal
            );

            if (
                !$date ||
                $date->format('Y-m-d') !==
                    $tanggal
            ) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Format tanggal harus YYYY-MM-DD.',
                ], 422);
            }

            $updateData['tanggal'] =
                $tanggal;
        }

        /*
        |--------------------------------------------------------------------------
        | TUJUAN
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'tujuan',
            $data
        )) {
            $tujuan = trim(
                $data['tujuan']
            );

            if ($tujuan === '') {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Tujuan tidak boleh kosong.',
                ], 422);
            }

            $updateData['tujuan'] =
                $tujuan;
        }

        /*
        |--------------------------------------------------------------------------
        | PERIHAL
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'perihal',
            $data
        )) {
            $perihal = trim(
                $data['perihal']
            );

            if ($perihal === '') {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Perihal tidak boleh kosong.',
                ], 422);
            }

            $updateData['perihal'] =
                $perihal;
        }

        /*
        |--------------------------------------------------------------------------
        | KLASIFIKASI
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'klasifikasi',
            $data
        )) {
            $klasifikasi = trim(
                $data['klasifikasi'] ?? ''
            );

            $updateData['klasifikasi'] =
                $klasifikasi !== ''
                    ? $klasifikasi
                    : null;
        }

        if (empty($updateData)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Tidak ada data valid untuk diperbarui.',
            ], 422);
        }

        $this->suratKeluarModel
            ->update(
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
                $this->suratKeluarModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPLOAD FILE
    |--------------------------------------------------------------------------
    */

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

        $surat = $this
            ->suratKeluarModel
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
            !$file->isValid()
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'File lampiran wajib diunggah.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | MAX 10 MB
        |--------------------------------------------------------------------------
        */

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

        /*
        |--------------------------------------------------------------------------
        | EXTENSION
        |--------------------------------------------------------------------------
        */

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
                    'Format file tidak diperbolehkan.',
            ], 422);
        }

        $uploadPath =
            WRITEPATH .
            'uploads/surat_keluar';

        if (!is_dir($uploadPath)) {
            mkdir(
                $uploadPath,
                0755,
                true
            );
        }

        /*
        |--------------------------------------------------------------------------
        | HAPUS FILE LAMA
        |--------------------------------------------------------------------------
        */

        if (
            !empty($surat['file_path'])
        ) {
            $oldFile =
                WRITEPATH .
                $surat['file_path'];

            if (is_file($oldFile)) {
                unlink($oldFile);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SIMPAN FILE
        |--------------------------------------------------------------------------
        */

        $newName =
            $file->getRandomName();

        $file->move(
            $uploadPath,
            $newName
        );

        $relativePath =
            'uploads/surat_keluar/' .
            $newName;

        $this->suratKeluarModel
            ->update(
                $id,
                [
                    'file_path' =>
                        $relativePath,
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
                'Lampiran berhasil diunggah.',

            'data' => [
                'file_path' =>
                    $relativePath,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD FILE
    |--------------------------------------------------------------------------
    */

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

        $surat = $this
            ->suratKeluarModel
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
                    'Surat keluar belum memiliki lampiran.',
            ], 404);
        }

        $filePath =
            WRITEPATH .
            $surat['file_path'];

        if (!is_file($filePath)) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'File lampiran tidak ditemukan.',
            ], 404);
        }

        return $this->response
            ->download(
                $filePath,
                null
            );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

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

        $surat = $this
            ->suratKeluarModel
            ->find($id);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat keluar tidak ditemukan.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | HAPUS FILE
        |--------------------------------------------------------------------------
        */

        if (
            !empty($surat['file_path'])
        ) {
            $filePath =
                WRITEPATH .
                $surat['file_path'];

            if (is_file($filePath)) {
                unlink($filePath);
            }
        }

        $noAgenda =
            $surat['no_agenda'];

        $this->suratKeluarModel
            ->delete($id);

        $this->logActivity(
            'delete',
            (int) $id,
            'Menghapus surat keluar dengan nomor agenda ' .
            $noAgenda . '.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Surat keluar berhasil dihapus.',
        ]);
    }
}