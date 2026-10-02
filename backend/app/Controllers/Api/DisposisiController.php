<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\AuthTokenModel;
use App\Models\DisposisiModel;
use App\Models\SuratMasukModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class DisposisiController extends BaseController
{
    use ResponseTrait;

    protected DisposisiModel $disposisiModel;
    protected SuratMasukModel $suratModel;
    protected UserModel $userModel;
    protected AuthTokenModel $tokenModel;
    protected ActivityLogModel $activityLogModel;

    public function __construct()
    {
        $this->disposisiModel   = new DisposisiModel();
        $this->suratModel       = new SuratMasukModel();
        $this->userModel        = new UserModel();
        $this->tokenModel       = new AuthTokenModel();
        $this->activityLogModel = new ActivityLogModel();
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

    private function getCurrentUser(): ?array
    {
        $authHeader = $this->request
            ->getHeaderLine('Authorization');

        if (
            !$authHeader ||
            !preg_match(
                '/^Bearer\s+(\S+)$/i',
                $authHeader,
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

        return $this->userModel
            ->where('id', $token['user_id'])
            ->where('status', 1)
            ->first();
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
        $user = $this->getCurrentUser();

        $this->activityLogModel->insert([
            'user_id' =>
                $user['id'] ?? null,

            'aktivitas' =>
                $aktivitas,

            'modul' =>
                'disposisi',

            'referensi_id' =>
                $referensiId,

            'deskripsi' =>
                $deskripsi,

            'ip_address' =>
                $this->request->getIPAddress(),

            'created_at' =>
                date('Y-m-d H:i:s'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    private function detailQuery()
    {
        return $this->disposisiModel
            ->select(
                '
                disposisi.*,
                surat_masuk.no_agenda,
                surat_masuk.no_surat,
                surat_masuk.perihal,
                surat_masuk.asal,
                pengirim.name AS dari_user_name,
                penerima.name AS ke_user_name
                '
            )
            ->join(
                'surat_masuk',
                'surat_masuk.id = disposisi.surat_masuk_id',
                'left'
            )
            ->join(
                'users AS pengirim',
                'pengirim.id = disposisi.dari_user_id',
                'left'
            )
            ->join(
                'users AS penerima',
                'penerima.id = disposisi.ke_user_id',
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
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        $status = trim(
            (string) $this->request->getGet('status')
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

        $this->detailQuery();

        /*
        |--------------------------------------------------------------------------
        | SCOPE BERDASARKAN ROLE
        |--------------------------------------------------------------------------
        */

        if ($user['role'] === 'kepala_seksi') {
            $this->disposisiModel
                ->where(
                    'disposisi.dari_user_id',
                    $user['id']
                );
        }

        if ($user['role'] === 'staf') {
            $this->disposisiModel
                ->where(
                    'disposisi.ke_user_id',
                    $user['id']
                );
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER STATUS
        |--------------------------------------------------------------------------
        */

        if ($status !== '') {
            $allowedStatus = [
                'menunggu',
                'dalam_proses',
                'selesai',
                'dikembalikan',
            ];

            if (
                in_array(
                    $status,
                    $allowedStatus,
                    true
                )
            ) {
                $this->disposisiModel
                    ->where(
                        'disposisi.status',
                        $status
                    );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {
            $this->disposisiModel
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
                    'pengirim.name',
                    $search
                )
                ->orLike(
                    'penerima.name',
                    $search
                )
                ->groupEnd();
        }

        $data = $this->disposisiModel
            ->orderBy(
                'disposisi.id',
                'DESC'
            )
            ->paginate($perPage);

        return $this->respond([
            'status' => true,
            'message' =>
                'Data disposisi berhasil diambil.',

            'data' =>
                $data,

            'pagination' => [
                'current_page' =>
                    $this->disposisiModel
                        ->pager
                        ->getCurrentPage(),

                'per_page' =>
                    $perPage,

                'total' =>
                    $this->disposisiModel
                        ->pager
                        ->getTotal(),

                'last_page' =>
                    $this->disposisiModel
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
                'message' => 'ID disposisi tidak valid.',
            ], 400);
        }

        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        $this->detailQuery();

        $this->disposisiModel
            ->where(
                'disposisi.id',
                $id
            );

        if ($user['role'] === 'kepala_seksi') {
            $this->disposisiModel
                ->where(
                    'disposisi.dari_user_id',
                    $user['id']
                );
        }

        if ($user['role'] === 'staf') {
            $this->disposisiModel
                ->where(
                    'disposisi.ke_user_id',
                    $user['id']
                );
        }

        $disposisi = $this->disposisiModel
            ->first();

        if (!$disposisi) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Disposisi tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' =>
                'Detail disposisi berhasil diambil.',
            'data' =>
                $disposisi,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE DISPOSISI
    |--------------------------------------------------------------------------
    |
    | Hanya Kepala Seksi.
    |
    */

    public function create()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        if ($user['role'] !== 'kepala_seksi') {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Hanya Kepala Seksi yang dapat membuat disposisi.',
            ], 403);
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

        $suratMasukId =
            (int) ($data['surat_masuk_id'] ?? 0);

        $keUserId =
            (int) ($data['ke_user_id'] ?? 0);

        $catatan = trim(
            $data['catatan'] ?? ''
        );

        $deadline = trim(
            $data['deadline'] ?? ''
        );

        if (
            $suratMasukId <= 0 ||
            $keUserId <= 0 ||
            $catatan === ''
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk, staf tujuan, dan catatan wajib diisi.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CEK SURAT
        |--------------------------------------------------------------------------
        */

        $surat = $this->suratModel
            ->find($suratMasukId);

        if (!$surat) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Surat masuk tidak ditemukan.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | CEK STAF TUJUAN
        |--------------------------------------------------------------------------
        */

        $staf = $this->userModel
            ->where('id', $keUserId)
            ->where('role', 'staf')
            ->where('status', 1)
            ->first();

        if (!$staf) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Staf tujuan tidak ditemukan atau tidak aktif.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI DEADLINE
        |--------------------------------------------------------------------------
        */

        if ($deadline !== '') {
            $date = \DateTime::createFromFormat(
                'Y-m-d',
                $deadline
            );

            if (
                !$date ||
                $date->format('Y-m-d') !==
                    $deadline
            ) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Format deadline harus YYYY-MM-DD.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | INSERT
        |--------------------------------------------------------------------------
        */

        $id = $this->disposisiModel
            ->insert([
                'surat_masuk_id' =>
                    $suratMasukId,

                'dari_user_id' =>
                    $user['id'],

                'ke_user_id' =>
                    $keUserId,

                'catatan' =>
                    $catatan,

                'hasil_tindak_lanjut' =>
                    null,

                'catatan_revisi' =>
                    null,

                'status' =>
                    'menunggu',

                'deadline' =>
                    $deadline !== ''
                        ? $deadline
                        : null,
            ], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Gagal membuat disposisi.',
            ], 500);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE STATUS SURAT
        |--------------------------------------------------------------------------
        */

        $this->suratModel->update(
            $suratMasukId,
            [
                'status' => 'didisposisikan',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | LOG
        |--------------------------------------------------------------------------
        */

        $this->logActivity(
            'create',
            (int) $id,
            'Membuat disposisi surat kepada ' .
            $staf['name']
        );

        return $this->respondCreated([
            'status' => true,
            'message' =>
                'Disposisi berhasil dibuat.',

            'data' =>
                $this->disposisiModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TINDAK LANJUT
    |--------------------------------------------------------------------------
    |
    | Hanya staf penerima.
    |
    */

    public function tindakLanjut($id = null)
    {
        $user = $this->getCurrentUser();

        if (
            !$user ||
            $user['role'] !== 'staf'
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Hanya Staf yang dapat mengisi tindak lanjut.',
            ], 403);
        }

        $disposisi = $this->disposisiModel
            ->find($id);

        if (!$disposisi) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Disposisi tidak ditemukan.',
            ], 404);
        }

        if (
            (int) $disposisi['ke_user_id'] !==
            (int) $user['id']
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Disposisi ini bukan ditujukan kepada Anda.',
            ], 403);
        }

        if (
            $disposisi['status'] === 'selesai'
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Disposisi sudah selesai.',
            ], 409);
        }

        $data = $this->request
            ->getJSON(true);

        $hasil = trim(
            $data['hasil_tindak_lanjut'] ?? ''
        );

        if ($hasil === '') {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Hasil tindak lanjut wajib diisi.',
            ], 422);
        }

        $this->disposisiModel->update(
            $id,
            [
                'hasil_tindak_lanjut' =>
                    $hasil,

                'status' =>
                    'dalam_proses',

                'catatan_revisi' =>
                    null,
            ]
        );

        $this->logActivity(
            'tindak_lanjut',
            (int) $id,
            'Mengisi hasil tindak lanjut disposisi.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Tindak lanjut berhasil disimpan.',

            'data' =>
                $this->disposisiModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SELESAI
    |--------------------------------------------------------------------------
    */

    public function selesai($id = null)
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'User tidak terautentikasi.',
            ], 401);
        }

        $disposisi = $this->disposisiModel
            ->find($id);

        if (!$disposisi) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Disposisi tidak ditemukan.',
            ], 404);
        }

        /*
         * Staf hanya disposisi miliknya.
         */

        if (
            $user['role'] === 'staf' &&
            (int) $disposisi['ke_user_id'] !==
            (int) $user['id']
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Disposisi ini bukan ditujukan kepada Anda.',
            ], 403);
        }

        /*
         * Kepala hanya disposisi yang dibuatnya.
         */

        if (
            $user['role'] === 'kepala_seksi' &&
            (int) $disposisi['dari_user_id'] !==
            (int) $user['id']
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Anda tidak memiliki akses ke disposisi ini.',
            ], 403);
        }

        if (
            !in_array(
                $user['role'],
                [
                    'staf',
                    'kepala_seksi',
                ],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Anda tidak dapat menyelesaikan disposisi.',
            ], 403);
        }

        if (
            empty(
                $disposisi['hasil_tindak_lanjut']
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Tindak lanjut harus diisi sebelum disposisi diselesaikan.',
            ], 422);
        }

        $this->disposisiModel->update(
            $id,
            [
                'status' =>
                    'selesai',
            ]
        );

        $this->suratModel->update(
            $disposisi['surat_masuk_id'],
            [
                'status' =>
                    'selesai',
            ]
        );

        $this->logActivity(
            'selesai',
            (int) $id,
            'Menyelesaikan disposisi.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Disposisi berhasil diselesaikan.',

            'data' =>
                $this->disposisiModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | KEMBALIKAN UNTUK REVISI
    |--------------------------------------------------------------------------
    |
    | Hanya Kepala Seksi pembuat disposisi.
    |
    */

    public function kembalikan($id = null)
    {
        $user = $this->getCurrentUser();

        if (
            !$user ||
            $user['role'] !== 'kepala_seksi'
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Hanya Kepala Seksi yang dapat mengembalikan disposisi.',
            ], 403);
        }

        $disposisi = $this->disposisiModel
            ->find($id);

        if (!$disposisi) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Disposisi tidak ditemukan.',
            ], 404);
        }

        if (
            (int) $disposisi['dari_user_id'] !==
            (int) $user['id']
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Anda tidak memiliki akses ke disposisi ini.',
            ], 403);
        }

        $data = $this->request
            ->getJSON(true);

        $catatanRevisi = trim(
            $data['catatan_revisi'] ?? ''
        );

        if ($catatanRevisi === '') {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Catatan revisi wajib diisi.',
            ], 422);
        }

        $this->disposisiModel->update(
            $id,
            [
                'status' =>
                    'dikembalikan',

                'catatan_revisi' =>
                    $catatanRevisi,
            ]
        );

        $this->logActivity(
            'revisi',
            (int) $id,
            'Mengembalikan disposisi untuk revisi.'
        );

        return $this->respond([
            'status' => true,
            'message' =>
                'Disposisi berhasil dikembalikan untuk revisi.',

            'data' =>
                $this->disposisiModel
                    ->find($id),
        ]);
    }
}