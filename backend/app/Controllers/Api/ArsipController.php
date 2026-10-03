<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\ArsipModel;
use App\Models\AuthTokenModel;
use App\Models\SuratKeluarModel;
use App\Models\SuratMasukModel;
use CodeIgniter\API\ResponseTrait;

class ArsipController extends BaseController
{
    use ResponseTrait;

    protected ArsipModel $arsipModel;
    protected SuratMasukModel $suratMasukModel;
    protected SuratKeluarModel $suratKeluarModel;
    protected AuthTokenModel $authTokenModel;
    protected ActivityLogModel $activityLogModel;

    public function __construct()
    {
        $this->arsipModel = new ArsipModel();
        $this->suratMasukModel = new SuratMasukModel();
        $this->suratKeluarModel = new SuratKeluarModel();
        $this->authTokenModel = new AuthTokenModel();
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
            'user_id' => $this->getCurrentUserId(),
            'aktivitas' => $aktivitas,
            'modul' => 'arsip',
            'referensi_id' => $referensiId,
            'deskripsi' => $deskripsi,
            'ip_address' => $this->request->getIPAddress(),
            'created_at' => date('Y-m-d H:i:s'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    private function baseQuery()
    {
        return $this->arsipModel
            ->select("
                arsip.*,

                COALESCE(
                    surat_masuk.no_agenda,
                    surat_keluar.no_agenda
                ) AS no_agenda,

                COALESCE(
                    surat_masuk.no_surat,
                    surat_keluar.no_surat
                ) AS no_surat,

                COALESCE(
                    surat_masuk.tanggal,
                    surat_keluar.tanggal
                ) AS tanggal_surat,

                COALESCE(
                    surat_masuk.perihal,
                    surat_keluar.perihal
                ) AS perihal,

                surat_masuk.asal AS asal,

                surat_keluar.tujuan AS tujuan,

                COALESCE(
                    surat_masuk.klasifikasi,
                    surat_keluar.klasifikasi
                ) AS klasifikasi
            ")
            ->join(
                'surat_masuk',
                "surat_masuk.id = arsip.referensi_id
                AND arsip.jenis = 'surat_masuk'",
                'left'
            )
            ->join(
                'surat_keluar',
                "surat_keluar.id = arsip.referensi_id
                AND arsip.jenis = 'surat_keluar'",
                'left'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $jenis = trim(
            (string) $this->request->getGet('jenis')
        );

        $kategori = trim(
            (string) $this->request->getGet('kategori')
        );

        $search = trim(
            (string) $this->request->getGet('search')
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

        /*
        |--------------------------------------------------------------------------
        | VALIDASI JENIS
        |--------------------------------------------------------------------------
        */

        if (
            $jenis !== '' &&
            !in_array(
                $jenis,
                [
                    'surat_masuk',
                    'surat_keluar',
                ],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Jenis arsip tidak valid.',
            ], 422);
        }

        $this->baseQuery();

        /*
        |--------------------------------------------------------------------------
        | FILTER JENIS
        |--------------------------------------------------------------------------
        */

        if ($jenis !== '') {
            $this->arsipModel
                ->where(
                    'arsip.jenis',
                    $jenis
                );
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER KATEGORI
        |--------------------------------------------------------------------------
        */

        if ($kategori !== '') {
            $this->arsipModel
                ->where(
                    'arsip.kategori',
                    $kategori
                );
        }

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {
            $this->arsipModel
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
                    'surat_masuk.perihal',
                    $search
                )
                ->orLike(
                    'surat_masuk.asal',
                    $search
                )
                ->orLike(
                    'surat_keluar.no_agenda',
                    $search
                )
                ->orLike(
                    'surat_keluar.no_surat',
                    $search
                )
                ->orLike(
                    'surat_keluar.perihal',
                    $search
                )
                ->orLike(
                    'surat_keluar.tujuan',
                    $search
                )
                ->orLike(
                    'arsip.kategori',
                    $search
                )
                ->groupEnd();
        }

        $data = $this->arsipModel
            ->orderBy(
                'arsip.id',
                'DESC'
            )
            ->paginate($perPage);

        return $this->respond([
            'status' => true,
            'message' =>
                'Data arsip berhasil diambil.',

            'data' => $data,

            'pagination' => [
                'current_page' =>
                    $this->arsipModel
                        ->pager
                        ->getCurrentPage(),

                'per_page' =>
                    $perPage,

                'total' =>
                    $this->arsipModel
                        ->pager
                        ->getTotal(),

                'last_page' =>
                    $this->arsipModel
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
                    'ID arsip tidak valid.',
            ], 400);
        }

        $arsip = $this->baseQuery()
            ->where(
                'arsip.id',
                $id
            )
            ->first();

        if (!$arsip) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Arsip tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' =>
                'Detail arsip berhasil diambil.',
            'data' =>
                $arsip,
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

        $jenis = trim(
            $data['jenis'] ?? ''
        );

        $referensiId = (int) (
            $data['referensi_id'] ?? 0
        );

        $kategori = trim(
            $data['kategori'] ?? ''
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDASI REQUIRED
        |--------------------------------------------------------------------------
        */

        if (
            $jenis === '' ||
            $referensiId <= 0
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Jenis dan referensi surat wajib diisi.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI JENIS
        |--------------------------------------------------------------------------
        */

        if (
            !in_array(
                $jenis,
                [
                    'surat_masuk',
                    'surat_keluar',
                ],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Jenis arsip harus surat_masuk atau surat_keluar.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CEK SURAT
        |--------------------------------------------------------------------------
        */

        if ($jenis === 'surat_masuk') {
            $surat = $this->suratMasukModel
                ->find($referensiId);
        } else {
            $surat = $this->suratKeluarModel
                ->find($referensiId);
        }

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat yang akan diarsipkan tidak ditemukan.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | CEK DUPLIKAT
        |--------------------------------------------------------------------------
        */

        $existing = $this->arsipModel
            ->where(
                'jenis',
                $jenis
            )
            ->where(
                'referensi_id',
                $referensiId
            )
            ->first();

        if ($existing) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat tersebut sudah diarsipkan.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | INSERT
        |--------------------------------------------------------------------------
        */

        $id = $this->arsipModel
            ->insert([
                'jenis' =>
                    $jenis,

                'referensi_id' =>
                    $referensiId,

                'kategori' =>
                    $kategori !== ''
                        ? $kategori
                        : null,

                'tanggal_arsip' =>
                    date('Y-m-d H:i:s'),
            ], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Gagal menambahkan arsip.',
            ], 500);
        }

        $this->logActivity(
            'create',
            (int) $id,
            'Mengarsipkan ' .
            $jenis .
            ' dengan referensi ID ' .
            $referensiId .
            '.'
        );

        return $this->respondCreated([
            'status' => true,
            'message' =>
                'Surat berhasil diarsipkan.',

            'data' =>
                $this->arsipModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE KATEGORI
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
                    'ID arsip tidak valid.',
            ], 400);
        }

        $arsip = $this->arsipModel
            ->find($id);

        if (!$arsip) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Arsip tidak ditemukan.',
            ], 404);
        }

        $data = $this->request
            ->getJSON(true);

        if (
            !$data ||
            !array_key_exists(
                'kategori',
                $data
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Kategori wajib dikirim.',
            ], 422);
        }

        $kategori = trim(
            $data['kategori'] ?? ''
        );

        $this->arsipModel
            ->update(
                $id,
                [
                    'kategori' =>
                        $kategori !== ''
                            ? $kategori
                            : null,
                ]
            );

        $this->logActivity(
            'update',
            (int) $id,
            'Memperbarui kategori arsip.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Kategori arsip berhasil diperbarui.',

            'data' =>
                $this->arsipModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    |
    | Menghapus data arsip saja.
    | Surat asli tetap tersimpan.
    |
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
                    'ID arsip tidak valid.',
            ], 400);
        }

        $arsip = $this->arsipModel
            ->find($id);

        if (!$arsip) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Arsip tidak ditemukan.',
            ], 404);
        }

        $this->arsipModel
            ->delete($id);

        $this->logActivity(
            'delete',
            (int) $id,
            'Menghapus data arsip ' .
            $arsip['jenis'] .
            ' dengan referensi ID ' .
            $arsip['referensi_id'] .
            '.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Data arsip berhasil dihapus.',
        ]);
    }
}