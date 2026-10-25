<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use App\Models\ArsipModel;
use App\Models\AuthTokenModel;
use App\Models\DisposisiModel;
use App\Models\NotifikasiModel;
use App\Models\SuratMasukModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use App\Models\DisposisiRiwayatModel;

class DisposisiController extends BaseController
{
    use ResponseTrait;

    protected DisposisiModel $disposisiModel;
    protected SuratMasukModel $suratModel;
    protected UserModel $userModel;
    protected AuthTokenModel $tokenModel;
    protected ActivityLogModel $activityLogModel;
    protected NotifikasiModel $notifikasiModel;
    protected ArsipModel $arsipModel;
    protected DisposisiRiwayatModel $riwayatModel;

    public function __construct()
    {
        $this->disposisiModel = new DisposisiModel();
        $this->suratModel = new SuratMasukModel();
        $this->userModel = new UserModel();
        $this->tokenModel = new AuthTokenModel();
        $this->activityLogModel = new ActivityLogModel();
        $this->notifikasiModel = new NotifikasiModel();
        $this->arsipModel = new ArsipModel();
        $this->riwayatModel = new DisposisiRiwayatModel();
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
): int {
    $user = $this->getCurrentUser();

    $result = $this->activityLogModel->insert([
        'user_id' => $user['id'] ?? null,
        'aktivitas' => $aktivitas,
        'modul' => 'disposisi',
        'referensi_id' => $referensiId,
        'deskripsi' => $deskripsi,
        'ip_address' => $this->request->getIPAddress(),
        'created_at' => date('Y-m-d H:i:s'),
    ]);

    if ($result === false) {
        throw new \RuntimeException(
            'Gagal menyimpan activity log.'
        );
    }
    return (int) $result;
}

    /*
    |--------------------------------------------------------------------------
    | SIMPAN RIWAYAT DISPOSISI
    |--------------------------------------------------------------------------
    */


    private function simpanRiwayat(
        int $disposisiId,
        int $userId,
        string $aktivitas,
        ?string $statusSebelum,
        string $statusSesudah,
        ?string $catatan,
        int $activityLogId
    ): void {

    $result = $this->riwayatModel->insert([
        'disposisi_id' => $disposisiId,
        'activity_log_id' => $activityLogId,
        'user_id' => $userId,
        'aktivitas' => $aktivitas,
        'status_sebelum' => $statusSebelum,
        'status_sesudah' => $statusSesudah,
        'catatan' => $catatan,
        'created_at' => date('Y-m-d H:i:s'),
    ]);

    if ($result === false) {
        throw new \RuntimeException(
            'Gagal menyimpan riwayat disposisi.'
        );
    }
}
    /*
    |--------------------------------------------------------------------------
    | CREATE NOTIFICATION
    |--------------------------------------------------------------------------
    */

    private function createNotification(
    int $userId,
    string $pesan,
    string $tipe
): void {
    $result = $this->notifikasiModel->insert([
        'user_id' => $userId,
        'pesan' => $pesan,
        'tipe' => $tipe,
        'is_read' => 0,
        'created_at' => date('Y-m-d H:i:s'),
    ]);

    if ($result === false) {
        throw new \RuntimeException(
            'Gagal menyimpan notifikasi.'
        );
    }
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
        | SCOPE ROLE
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
                !in_array(
                    $status,
                    $allowedStatus,
                    true
                )
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Status disposisi tidak valid.',
                ], 422);
            }

            $this->disposisiModel
                ->where(
                    'disposisi.status',
                    $status
                );
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
            'message' => 'Data disposisi berhasil diambil.',
            'data' => $data,

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
            'data' => $disposisi,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TIMELINE RIWAYAT DISPOSISI
    |--------------------------------------------------------------------------
    */

    public function timeline($id = null)
    {
        if (!$id || !ctype_digit((string) $id) || (int) $id < 1) {
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

        // Periksa akses menggunakan aturan yang sama dengan show().
        $this->detailQuery();

        $this->disposisiModel->where('disposisi.id', (int) $id);

        if ($user['role'] === 'kepala_seksi') {
            $this->disposisiModel->where(
                'disposisi.dari_user_id',
                $user['id']
            );
        } elseif ($user['role'] === 'staf') {
            $this->disposisiModel->where(
                'disposisi.ke_user_id',
                $user['id']
            );
        } elseif ($user['role'] !== 'admin') {
            return $this->respond([
                'status' => false,
                'message' => 'Akses tidak diizinkan.',
            ], 403);
        }

        $disposisi = $this->disposisiModel->first();

        if (!$disposisi) {
            return $this->respond([
                'status' => false,
                'message' => 'Disposisi tidak ditemukan atau tidak dapat diakses.',
            ], 404);
        }

        // Ambil activity log, termasuk aktivitas historis.
        $activityLogs = $this->activityLogModel
            ->select(
                'activity_logs.id,
                 activity_logs.user_id,
                 users.name AS user_name,
                 activity_logs.aktivitas,
                 activity_logs.deskripsi,
                 activity_logs.created_at'
            )
            ->join(
                'users',
                'users.id = activity_logs.user_id',
                'left'
            )
            ->where('activity_logs.modul', 'disposisi')
            ->where('activity_logs.referensi_id', (int) $id)
            ->orderBy('activity_logs.created_at', 'ASC')
            ->orderBy('activity_logs.id', 'ASC')
            ->findAll();

        // Ambil semua snapshot riwayat.
        $snapshots = $this->riwayatModel
            ->select(
                'disposisi_riwayat.id,
                 disposisi_riwayat.activity_log_id,
                 disposisi_riwayat.user_id,
                 users.name AS user_name,
                 disposisi_riwayat.aktivitas,
                 disposisi_riwayat.status_sebelum,
                 disposisi_riwayat.status_sesudah,
                 disposisi_riwayat.catatan,
                 disposisi_riwayat.created_at'
            )
            ->join(
                'users',
                'users.id = disposisi_riwayat.user_id',
                'left'
            )
            ->where('disposisi_riwayat.disposisi_id', (int) $id)
            ->orderBy('disposisi_riwayat.created_at', 'ASC')
            ->orderBy('disposisi_riwayat.id', 'ASC')
            ->findAll();

        $snapshotsByLogId = [];
        $snapshotsTanpaRelasi = [];

        foreach ($snapshots as $snapshot) {
            if ($snapshot['activity_log_id'] !== null) {
                $snapshotsByLogId[(int) $snapshot['activity_log_id']] =
                    $snapshot;
            } else {
                $snapshotsTanpaRelasi[] = $snapshot;
            }
        }

        $logs = [];

        // Untuk snapshot lama yang belum memiliki relasi eksplisit,
        // pertahankan perilaku sebelumnya agar tidak menampilkan
        // duplikasi yang belum bisa dicocokkan secara pasti.

        if ($snapshotsTanpaRelasi !== []) {
            log_message(
                'error',
                'Timeline disposisi ID ' . (int) $id .
                ' memiliki snapshot tanpa activity_log_id.'
            );

            return $this->respond([
                'status' => false,
                'message' =>
                    'Timeline belum dapat ditampilkan karena terdapat riwayat yang belum terhubung.',
            ], 500);
        }

        foreach ($activityLogs as $log) {
            $logId = (int) $log['id'];

            if (isset($snapshotsByLogId[$logId])) {
                $snapshot = $snapshotsByLogId[$logId];

                $logs[] = [
                    'id' => $snapshot['id'],
                    'activity_log_id' => $logId,
                    'user_id' => $snapshot['user_id'],
                    'user_name' => $snapshot['user_name'],
                    'aktivitas' => $snapshot['aktivitas'],
                    'status_sebelum' => $snapshot['status_sebelum'],
                    'status_sesudah' => $snapshot['status_sesudah'],
                    'catatan' => $snapshot['catatan'],
                    'deskripsi' => $log['deskripsi'],
                    'created_at' => $snapshot['created_at'],
                ];
            } else {
                $logs[] = [
                    'id' => $log['id'],
                    'activity_log_id' => $logId,
                    'user_id' => $log['user_id'],
                    'user_name' => $log['user_name'],
                    'aktivitas' => $log['aktivitas'],
                    'status_sebelum' => null,
                    'status_sesudah' => null,
                    'catatan' => null,
                    'deskripsi' => $log['deskripsi'],
                    'created_at' => $log['created_at'],
                ];
            }
        }

        $sumberRiwayat = $snapshotsByLogId !== []
            ? 'campuran'
            : 'activity_logs';

            return $this->respond([
            'status' => true,
            'message' => 'Timeline disposisi berhasil diambil.',
            'data' => [
                'disposisi_id' => (int) $disposisi['id'],
                'no_agenda' => $disposisi['no_agenda'],
                'no_surat' => $disposisi['no_surat'],
                'status_terkini' => $disposisi['status'],
                'sumber_riwayat' => $sumberRiwayat,
                'timeline' => $logs,
            ],
        ], 200);
    }
    /*
    |--------------------------------------------------------------------------
    | CREATE DISPOSISI
    |--------------------------------------------------------------------------
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
            'message' => 'Hanya Kepala Seksi yang dapat membuat disposisi.',
        ], 403);
    }

    $data = $this->request->getJSON(true);

    if (!is_array($data) || $data === []) {
        return $this->respond([
            'status' => false,
            'message' => 'Request harus menggunakan format JSON.',
        ], 400);
    }

    $suratMasukId = filter_var(
        $data['surat_masuk_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    $keUserId = filter_var(
        $data['ke_user_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );

    $catatan = $data['catatan'] ?? '';
    $deadline = $data['deadline'] ?? '';

    if (!is_string($catatan) || !is_string($deadline)) {
        return $this->respond([
            'status' => false,
            'message' => 'Catatan dan deadline harus berupa teks.',
        ], 422);
    }

    $catatan = trim($catatan);
    $deadline = trim($deadline);

    if (
        $suratMasukId === false ||
        $keUserId === false ||
        $catatan === ''
    ) {
        return $this->respond([
            'status' => false,
            'message' => 'Surat masuk, staf tujuan, dan catatan wajib diisi.',
        ], 422);
    }

    // CEK SURAT MASUK
    $surat = $this->suratModel->find($suratMasukId);

    if (!$surat) {
        return $this->respond([
            'status' => false,
            'message' => 'Surat masuk tidak ditemukan.',
        ], 404);
    }

    // CEK STAF TUJUAN
    $staf = $this->userModel
        ->where('id', $keUserId)
        ->where('role', 'staf')
        ->where('status', 1)
        ->first();

    if (!$staf) {
        return $this->respond([
            'status' => false,
            'message' => 'Staf tujuan tidak ditemukan atau tidak aktif.',
        ], 422);
    }

    // VALIDASI DEADLINE
    if ($deadline !== '') {
        $date = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $deadline
        );

        if (!$date || $date->format('Y-m-d') !== $deadline) {
            return $this->respond([
                'status' => false,
                'message' => 'Format deadline harus YYYY-MM-DD.',
            ], 422);
        }
    }

    // MULAI DATABASE TRANSACTION
    $db = \Config\Database::connect();

    if (!$db->transBegin()) {
        return $this->respond([
            'status' => false,
            'message' => 'Gagal memulai transaksi database.',
        ], 500);
    }

    try {
        // KUNCI SURAT MASUK SELAMA TRANSAKSI
$suratTerkunci = $db->query(
    'SELECT id, status FROM surat_masuk WHERE id = ? FOR UPDATE',
    [$suratMasukId]
)->getRowArray();

if (!$suratTerkunci) {
    throw new \RuntimeException(
        'Surat masuk tidak ditemukan saat transaksi.'
    );
}

// CEGAH DISPOSISI BARU UNTUK SURAT SELESAI
if ($suratTerkunci['status'] === 'selesai') {
    $db->transRollback();

    return $this->respond([
        'status' => false,
        'message' =>
            'Surat masuk sudah selesai dan tidak dapat didisposisikan kembali.',
    ], 409);
}
        // INSERT DISPOSISI
        $id = $this->disposisiModel->insert([
            'surat_masuk_id' => $suratMasukId,
            'dari_user_id' => $user['id'],
            'ke_user_id' => $keUserId,
            'catatan' => $catatan,
            'hasil_tindak_lanjut' => null,
            'catatan_revisi' => null,
            'status' => 'menunggu',
            'deadline' => $deadline !== '' ? $deadline : null,
        ], true);

        if (!$id) {
            throw new \RuntimeException(
                'Gagal membuat disposisi.'
            );
        }

        // UPDATE STATUS SURAT MASUK
        $suratUpdated = $this->suratModel->update(
            $suratMasukId,
            ['status' => 'didisposisikan']
        );

        if (!$suratUpdated) {
            throw new \RuntimeException(
                'Gagal memperbarui status surat masuk.'
            );
        }

        // ACTIVITY LOG
        $activityLogId = $this->logActivity(
            'create',
            (int) $id,
            'Membuat disposisi surat kepada ' . $staf['name']
        );
        // RIWAYAT DISPOSISI
        $this->simpanRiwayat(
            (int) $id,
            (int) $user['id'],
            'create',
            null,
            'menunggu',
            $catatan,
            $activityLogId
        );
        // NOTIFIKASI STAF
        $this->createNotification(
            (int) $staf['id'],
            'Anda menerima disposisi baru untuk surat "' .
            ($surat['perihal'] ?? 'Surat Masuk') . '".',
            'disposisi_baru'
        );

        // CEK DAN COMMIT
        if ($db->transStatus() === false) {
            throw new \RuntimeException(
                'Terjadi kegagalan transaksi database.'
            );
        }

        if (!$db->transCommit()) {
            throw new \RuntimeException(
                'Gagal melakukan commit transaksi.'
            );
        }

    } catch (\Throwable $e) {
        $db->transRollback();

        log_message(
            'error',
            'Gagal membuat disposisi: ' . $e->getMessage()
        );

        return $this->respond([
            'status' => false,
            'message' =>
                'Gagal membuat disposisi. Transaksi dibatalkan jika belum di-commit.',
        ], 500);
    }

    return $this->respondCreated([
        'status' => true,
        'message' => 'Disposisi berhasil dibuat.',
        'data' => $this->disposisiModel->find($id),
    ]);
}

    /*
    |--------------------------------------------------------------------------
    | TINDAK LANJUT
    |--------------------------------------------------------------------------
    */

    public function tindakLanjut($id = null)
{
    $user = $this->getCurrentUser();

    // VALIDASI ROLE
    if (!$user || $user['role'] !== 'staf') {
        return $this->respond([
            'status' => false,
            'message' => 'Hanya Staf yang dapat mengisi tindak lanjut.',
        ], 403);
    }

    // VALIDASI ID
    if (!$id || !ctype_digit((string) $id)) {
        return $this->respond([
            'status' => false,
            'message' => 'ID disposisi tidak valid.',
        ], 400);
    }

    // CEK DISPOSISI
    $disposisi = $this->disposisiModel->find($id);

    if (!$disposisi) {
        return $this->respond([
            'status' => false,
            'message' => 'Disposisi tidak ditemukan.',
        ], 404);
    }

    // VALIDASI KEPEMILIKAN
    if (
        (int) $disposisi['ke_user_id'] !==
        (int) $user['id']
    ) {
        return $this->respond([
            'status' => false,
            'message' => 'Disposisi ini bukan ditujukan kepada Anda.',
        ], 403);
    }

    // VALIDASI STATUS
    if ($disposisi['status'] === 'selesai') {
        return $this->respond([
            'status' => false,
            'message' => 'Disposisi sudah selesai.',
        ], 409);
    }

    // VALIDASI REQUEST JSON
    $data = $this->request->getJSON(true);

    if (!is_array($data)) {
        return $this->respond([
            'status' => false,
            'message' => 'Request harus menggunakan format JSON.',
        ], 400);
    }

    $hasil = $data['hasil_tindak_lanjut'] ?? '';

    if (!is_string($hasil) || trim($hasil) === '') {
        return $this->respond([
            'status' => false,
            'message' =>
                'Hasil tindak lanjut wajib diisi dengan teks.',
        ], 422);
    }

    $hasil = trim($hasil);

    // MULAI DATABASE TRANSACTION
    $db = \Config\Database::connect();

    if (!$db->transBegin()) {
        return $this->respond([
            'status' => false,
            'message' => 'Gagal memulai transaksi database.',
        ], 500);
    }

    try {
        /*
         * UPDATE BERSYARAT
         * Mencegah tindak lanjut pada disposisi
         * yang sudah diselesaikan oleh request lain.
         */

        // KUNCI DISPOSISI DAN AMBIL STATUS SEBELUMNYA
        $disposisiTerkunci = $db->query(
            'SELECT id, ke_user_id, status
             FROM disposisi
             WHERE id = ?
             FOR UPDATE',
            [(int) $id]
        )->getRowArray();

        if (!$disposisiTerkunci) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Disposisi tidak ditemukan.',
            ], 404);
        }

        if (
            (int) $disposisiTerkunci['ke_user_id'] !==
            (int) $user['id']
        ) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Disposisi ini bukan ditujukan kepada Anda.',
            ], 403);
        }

        if ($disposisiTerkunci['status'] === 'selesai') {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Disposisi sudah selesai.',
            ], 409);
        }

        $statusSebelum = $disposisiTerkunci['status'];

        $updated = $db->table('disposisi')
            ->where('id', (int) $id)
            ->where('ke_user_id', (int) $user['id'])
            ->whereIn('status', [
                'menunggu',
                'dalam_proses',
                'dikembalikan',
            ])
            ->update([
                'hasil_tindak_lanjut' => $hasil,
                'status' => 'dalam_proses',
                'catatan_revisi' => null,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        if (!$updated) {
            throw new \RuntimeException(
                'Gagal menyimpan tindak lanjut.'
            );
        }

        // CEK BARIS YANG BERUBAH
        if ($db->affectedRows() !== 1) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' =>
                    'Status disposisi telah berubah atau hasil tidak diperbarui.',
            ], 409);
        }

        // ACTIVITY LOG
        $activityLogId = $this->logActivity(
            'tindak_lanjut',
            (int) $id,
            'Mengisi hasil tindak lanjut disposisi.'
        );

        // SNAPSHOT RIWAYAT TINDAK LANJUT
        $this->simpanRiwayat(
            (int) $id,
            (int) $user['id'],
            'tindak_lanjut',
            $statusSebelum,
            'dalam_proses',
            $hasil,
            $activityLogId
        );

        // AMBIL DATA SURAT
        $surat = $this->suratModel->find(
            $disposisi['surat_masuk_id']
        );

        // NOTIFIKASI KEPALA SEKSI
        $this->createNotification(
            (int) $disposisi['dari_user_id'],
            'Staf telah mengisi tindak lanjut untuk disposisi surat "' .
            ($surat['perihal'] ?? 'Surat Masuk') . '".',
            'tindak_lanjut'
        );
        // CEK TRANSACTION
        if ($db->transStatus() === false) {
            throw new \RuntimeException(
                'Terjadi kegagalan transaksi database.'
            );
        }

        // COMMIT
        if (!$db->transCommit()) {
            throw new \RuntimeException(
                'Gagal melakukan commit transaksi.'
            );
        }

    } catch (\Throwable $e) {
        $db->transRollback();

        log_message(
            'error',
            'Gagal menindaklanjuti disposisi ID ' .
            $id . ': ' . $e->getMessage()
        );

        return $this->respond([
            'status' => false,
            'message' =>
                'Gagal menyimpan tindak lanjut. Transaksi dibatalkan jika belum di-commit.',
        ], 500);
    }

    return $this->respond([
        'status' => true,
        'message' => 'Tindak lanjut berhasil disimpan.',
        'data' => $this->disposisiModel->find($id),
    ]);
}

    /*
    |--------------------------------------------------------------------------
    | SELESAI
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | AUTO ARCHIVE SURAT MASUK
    |--------------------------------------------------------------------------
    */

    private function archiveSuratMasukIfNeeded(
        int $suratMasukId
    ): ?int {
        $existing = $this->arsipModel
            ->where(
                'jenis',
                'surat_masuk'
            )
            ->where(
                'referensi_id',
                $suratMasukId
            )
            ->first();

        if ($existing) {
            return (int) $existing['id'];
        }

        $surat = $this->suratModel
            ->find($suratMasukId);

        if (!$surat) {
            return null;
        }

        $arsipId = $this->arsipModel
            ->insert([
                'jenis' => 'surat_masuk',
                'referensi_id' => $suratMasukId,
                'kategori' =>
                    !empty($surat['klasifikasi'])
                        ? $surat['klasifikasi']
                        : null,
                'tanggal_arsip' =>
                    date('Y-m-d H:i:s'),
            ], true);

        if (!$arsipId) {
            return null;
        }

        $user = $this->getCurrentUser();

        $archiveLogged = $this->activityLogModel->insert([

            'user_id' => $user['id'] ?? null,
            'aktivitas' => 'auto_archive',
            'modul' => 'arsip',
            'referensi_id' => (int) $arsipId,
            'deskripsi' =>
                'Surat masuk ID ' .
                $suratMasukId .
                ' otomatis diarsipkan setelah disposisi selesai.',
            'ip_address' =>
                $this->request->getIPAddress(),
            'created_at' =>
                date('Y-m-d H:i:s'),
        ]);
        if ($archiveLogged === false) {
    throw new \RuntimeException(
        'Gagal mencatat aktivitas pengarsipan.'
    );
}
        return (int) $arsipId;
    }


public function selesai($id = null)
{
    $user = $this->getCurrentUser();

    if (!$user) {
        return $this->respond([
            'status' => false,
            'message' => 'User tidak terautentikasi.',
        ], 401);
    }

    if (!$id || !ctype_digit((string) $id)) {
        return $this->respond([
            'status' => false,
            'message' => 'ID disposisi tidak valid.',
        ], 400);
    }

    $disposisi = $this->disposisiModel->find($id);

    if (!$disposisi) {
        return $this->respond([
            'status' => false,
            'message' => 'Disposisi tidak ditemukan.',
        ], 404);
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI ROLE DAN HAK AKSES
    |--------------------------------------------------------------------------
    */

    if (!in_array(
        $user['role'],
        ['staf', 'kepala_seksi'],
        true
    )) {
        return $this->respond([
            'status' => false,
            'message' => 'Anda tidak dapat menyelesaikan disposisi.',
        ], 403);
    }

    if (
        $user['role'] === 'staf' &&
        (int) $disposisi['ke_user_id'] !== (int) $user['id']
    ) {
        return $this->respond([
            'status' => false,
            'message' => 'Disposisi ini bukan ditujukan kepada Anda.',
        ], 403);
    }

    if (
        $user['role'] === 'kepala_seksi' &&
        (int) $disposisi['dari_user_id'] !== (int) $user['id']
    ) {
        return $this->respond([
            'status' => false,
            'message' => 'Anda tidak memiliki akses ke disposisi ini.',
        ], 403);
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI STATUS
    |--------------------------------------------------------------------------
    */

    if ($disposisi['status'] !== 'dalam_proses') {
        return $this->respond([
            'status' => false,
            'message' =>
                'Hanya disposisi dalam proses yang dapat diselesaikan.',
        ], 409);
    }

    if (trim((string) $disposisi['hasil_tindak_lanjut']) === '') {
        return $this->respond([
            'status' => false,
            'message' =>
                'Tindak lanjut harus diisi sebelum disposisi diselesaikan.',
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE TRANSACTION
    |--------------------------------------------------------------------------
    */

    $db = \Config\Database::connect();

if (!$db->transBegin()) {
    return $this->respond([
        'status' => false,
        'message' => 'Gagal memulai transaksi database.',
    ], 500);
}
try {

        /*
        |--------------------------------------------------------------------------
        | KUNCI DISPOSISI DAN VALIDASI STATUS TERBARU
        |--------------------------------------------------------------------------
        */

        $disposisiTerkunci = $db->query(
            'SELECT id, dari_user_id, ke_user_id,
                    surat_masuk_id, status, hasil_tindak_lanjut
             FROM disposisi
             WHERE id = ?
             FOR UPDATE',
            [(int) $id]
        )->getRowArray();

        if (!$disposisiTerkunci) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Disposisi tidak ditemukan.',
            ], 404);
        }

        // Validasi ulang kepemilikan setelah baris dikunci
        $berhak = (
            $user['role'] === 'kepala_seksi' &&
            (int) $disposisiTerkunci['dari_user_id'] === (int) $user['id']
        ) || (
            $user['role'] === 'staf' &&
            (int) $disposisiTerkunci['ke_user_id'] === (int) $user['id']
        );

        if (!$berhak) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Anda tidak memiliki akses ke disposisi ini.',
            ], 403);
        }

        if ($disposisiTerkunci['status'] !== 'dalam_proses') {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' =>
                    'Hanya disposisi dalam proses yang dapat diselesaikan.',
            ], 409);
        }

        if (trim((string) $disposisiTerkunci['hasil_tindak_lanjut']) === '') {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' =>
                    'Tindak lanjut harus diisi sebelum disposisi diselesaikan.',
            ], 422);
        }

        $statusSebelum = $disposisiTerkunci['status'];

        /*
        |--------------------------------------------------------------------------
        | UPDATE DISPOSISI
        |--------------------------------------------------------------------------
        | Update bersyarat untuk mencegah penyelesaian berulang.
        */

        $updated = $db->table('disposisi')
            ->where('id', (int) $id)
            ->where('status', 'dalam_proses')
            ->update([
                'status' => 'selesai',
            ]);

        if (!$updated) {
            throw new \RuntimeException(
                'Gagal memperbarui status disposisi.'
            );
        }

        if ($db->affectedRows() !== 1) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' =>
                    'Status disposisi telah berubah atau sudah selesai.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE SURAT MASUK
        |--------------------------------------------------------------------------
        */

        $suratUpdated = $this->suratModel->update(
            $disposisi['surat_masuk_id'],
            [
                'status' => 'selesai',
            ]
        );

        if (!$suratUpdated) {
            throw new \RuntimeException(
                'Gagal memperbarui status surat masuk.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AUTO ARCHIVE
        |--------------------------------------------------------------------------
        */

        $arsipId = $this->archiveSuratMasukIfNeeded(
            (int) $disposisi['surat_masuk_id']
        );

        if ($arsipId === null) {
            throw new \RuntimeException(
                'Gagal membuat arsip surat masuk.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ACTIVITY LOG
        |--------------------------------------------------------------------------
        */

        $activityLogId = $this->logActivity(
            'selesai',
            (int) $id,
            'Menyelesaikan disposisi.'
        );


        /*
        |--------------------------------------------------------------------------
        | SNAPSHOT RIWAYAT PENYELESAIAN
        |--------------------------------------------------------------------------
        */

        $this->simpanRiwayat(
            (int) $id,
            (int) $user['id'],
            'selesai',
            $statusSebelum,
            'selesai',
            null,
            $activityLogId
        );
        /*
        |--------------------------------------------------------------------------
        | NOTIFIKASI
        |--------------------------------------------------------------------------
        */

        $surat = $this->suratModel->find(
            $disposisi['surat_masuk_id']
        );

        if ($user['role'] === 'kepala_seksi') {
            $notificationUserId =
                (int) $disposisi['ke_user_id'];
        } else {
            $notificationUserId =
                (int) $disposisi['dari_user_id'];
        }

        $this->createNotification(
            $notificationUserId,
            'Disposisi surat "' .
            ($surat['perihal'] ?? 'Surat Masuk') .
            '" telah diselesaikan.',
            'disposisi_selesai'
        );
        /*
        |--------------------------------------------------------------------------
        | CEK TRANSACTION
        |--------------------------------------------------------------------------
        */

        if ($db->transStatus() === false) {
            throw new \RuntimeException(
                'Terjadi kegagalan transaksi database.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | COMMIT
        |--------------------------------------------------------------------------
        */

        if (!$db->transCommit()) {
            throw new \RuntimeException(
                'Gagal melakukan commit transaksi.'
            );
        }

    } catch (\Throwable $e) {

        $db->transRollback();

        log_message(
            'error',
            'Gagal menyelesaikan disposisi ID ' .
            $id . ': ' . $e->getMessage()
        );

        return $this->respond([
            'status' => false,
            'message' =>
                'Gagal menyelesaikan disposisi. Perubahan database dibatalkan apabila transaksi belum berhasil di-commit.',
        ], 500);
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return $this->respond([
        'status' => true,
        'message' => 'Disposisi berhasil diselesaikan.',
        'data' => $this->disposisiModel->find($id),
    ]);
}

    /*
    |--------------------------------------------------------------------------
    | KEMBALIKAN UNTUK REVISI
    |--------------------------------------------------------------------------
    */


public function kembalikan($id = null)
{
    $user = $this->getCurrentUser();

    // VALIDASI ROLE KEPALA SEKSI
    if (!$user || $user['role'] !== 'kepala_seksi') {
        return $this->respond([
            'status' => false,
            'message' =>
                'Hanya Kepala Seksi yang dapat mengembalikan disposisi.',
        ], 403);
    }

    // VALIDASI ID
    if (!$id || !ctype_digit((string) $id)) {
        return $this->respond([
            'status' => false,
            'message' => 'ID disposisi tidak valid.',
        ], 400);
    }

    // CEK DISPOSISI
    $disposisi = $this->disposisiModel->find($id);

    if (!$disposisi) {
        return $this->respond([
            'status' => false,
            'message' => 'Disposisi tidak ditemukan.',
        ], 404);
    }

    // VALIDASI KEPEMILIKAN
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

    // VALIDASI STATUS
    if ($disposisi['status'] !== 'dalam_proses') {
        return $this->respond([
            'status' => false,
            'message' =>
                'Hanya disposisi dalam proses yang dapat dikembalikan untuk revisi.',
        ], 409);
    }

    // VALIDASI REQUEST JSON
    $data = $this->request->getJSON(true);

    if (!is_array($data)) {
        return $this->respond([
            'status' => false,
            'message' => 'Request harus menggunakan format JSON.',
        ], 400);
    }

    $catatanRevisi = $data['catatan_revisi'] ?? '';

    if (
        !is_string($catatanRevisi) ||
        trim($catatanRevisi) === ''
    ) {
        return $this->respond([
            'status' => false,
            'message' =>
                'Catatan revisi wajib diisi dengan teks.',
        ], 422);
    }

    $catatanRevisi = trim($catatanRevisi);

    // MULAI DATABASE TRANSACTION
    $db = \Config\Database::connect();

    if (!$db->transBegin()) {
        return $this->respond([
            'status' => false,
            'message' => 'Gagal memulai transaksi database.',
        ], 500);
    }

    try {


        // KUNCI DISPOSISI DAN VALIDASI STATUS TERBARU
        $disposisiTerkunci = $db->query(
            'SELECT id, dari_user_id, status
             FROM disposisi
             WHERE id = ?
             FOR UPDATE',
            [(int) $id]
        )->getRowArray();

        if (!$disposisiTerkunci) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Disposisi tidak ditemukan.',
            ], 404);
        }

        if (
            (int) $disposisiTerkunci['dari_user_id'] !==
            (int) $user['id']
        ) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Anda tidak memiliki akses ke disposisi ini.',
            ], 403);
        }

        if ($disposisiTerkunci['status'] !== 'dalam_proses') {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' =>
                    'Hanya disposisi dalam proses yang dapat dikembalikan untuk revisi.',
            ], 409);
        }

        $statusSebelum = $disposisiTerkunci['status'];
        // UPDATE DISPOSISI BERSYARAT
        $updated = $db->table('disposisi')
            ->where('id', (int) $id)
            ->where('dari_user_id', (int) $user['id'])
            ->where('status', 'dalam_proses')
            ->update([
                'status' => 'dikembalikan',
                'catatan_revisi' => $catatanRevisi,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        if (!$updated) {
            throw new \RuntimeException(
                'Gagal mengembalikan disposisi.'
            );
        }

        // CEK BARIS YANG BERUBAH
        if ($db->affectedRows() !== 1) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Status disposisi telah berubah.',
            ], 409);
        }

        // ACTIVITY LOG
        $activityLogId = $this->logActivity(
            'revisi',
            (int) $id,
            'Mengembalikan disposisi untuk revisi.'
        );
        // SNAPSHOT RIWAYAT REVISI
        $this->simpanRiwayat(
            (int) $id,
            (int) $user['id'],
            'revisi',
            $statusSebelum,
            'dikembalikan',
            $catatanRevisi,
            $activityLogId
        );

        // AMBIL DATA SURAT
        $surat = $this->suratModel->find(
            $disposisi['surat_masuk_id']
        );

        // NOTIFIKASI STAF
        $this->createNotification(
            (int) $disposisi['ke_user_id'],
            'Disposisi surat "' .
            ($surat['perihal'] ?? 'Surat Masuk') .
            '" dikembalikan untuk revisi. Catatan: ' .
            $catatanRevisi,
            'revisi_disposisi'
        );
        // CEK TRANSACTION
        if ($db->transStatus() === false) {
            throw new \RuntimeException(
                'Terjadi kegagalan transaksi database.'
            );
        }

        // COMMIT
        if (!$db->transCommit()) {
            throw new \RuntimeException(
                'Gagal melakukan commit transaksi.'
            );
        }

    } catch (\Throwable $e) {
        $db->transRollback();

        log_message(
            'error',
            'Gagal revisi disposisi ID ' .
            $id . ': ' . $e->getMessage()
        );

        return $this->respond([
            'status' => false,
            'message' =>
                'Gagal mengembalikan disposisi. Transaksi dibatalkan jika belum di-commit.',
        ], 500);
    }

    return $this->respond([
        'status' => true,
        'message' =>
            'Disposisi berhasil dikembalikan untuk revisi.',
        'data' => $this->disposisiModel->find($id),
    ]);
}

}