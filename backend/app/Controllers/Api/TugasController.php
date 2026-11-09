<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\TugasModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class TugasController extends BaseController
{
    use ResponseTrait;

    private function currentUser(): ?array
    {
        $header = $this->request->getHeaderLine(
            'Authorization'
        );

        if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
            return null;
        }

        $token = (new AuthTokenModel())
            ->where('token_hash', hash('sha256', $m[1]))
            ->where('revoked_at', null)
            ->first();

        if (!$token) {
            return null;
        }

        if (
            !empty($token['expires_at']) &&
            strtotime($token['expires_at']) <= time()
        ) {
            return null;
        }

        return (new UserModel())
            ->where('id', $token['user_id'])
            ->where('status', 1)
            ->first();
    }

    private function queryFor(array $user)
    {
        $query = (new TugasModel())
            ->select(
                'tugas.*, ' .
                'assignee.name AS pic_nama, ' .
                'assignee.jabatan AS pic_jabatan, ' .
                'creator.name AS pemberi_nama'
            )
            ->join(
                'users AS assignee',
                'assignee.id = tugas.assigned_to',
                'left'
            )
            ->join(
                'users AS creator',
                'creator.id = tugas.created_by',
                'left'
            );

        if ($user['role'] === 'staf') {
            $query->where(
                'tugas.assigned_to',
                $user['id']
            );
        }

        if ($user['role'] === 'kepala_seksi') {
            $query->where(
                'tugas.created_by',
                $user['id']
            );
        }

        return $query;
    }

    private function formatRow(array $row): array
    {
        $nama = $row['pic_nama'] ?? 'Staf';
        $status = $row['status'] ?? 'Belum Mulai';
        $progress = (int) ($row['progress'] ?? 0);

        $pemberi = $row['pemberi_nama']
            ?? 'Kepala Seksi';

        $priority = $row['prioritas'] ?? 'NORMAL';

        return [
            'id' => (int) $row['id'],
            'kode' => 'TGS-' . str_pad(
                (string) $row['id'],
                5,
                '0',
                STR_PAD_LEFT
            ),
            'judul' => $row['judul'],
            'deskripsi' => $row['deskripsi'] ?? '',
            'pic' => $nama,
            'picRole' => $row['pic_jabatan'] ?? 'Staf',
            'avatar' => strtoupper(
                substr($nama, 0, 2)
            ),
            'avatarTone' => 'gray',
            'prioritas' => $priority,
            'deadline' => $row['deadline'] ?? null,
            'lewatDeadline' => (
                !empty($row['deadline']) &&
                $row['deadline'] < date('Y-m-d') &&
                $status !== 'Selesai'
            ),
            'progress' => $progress,
            'status' => $status,
            'pemberi_nama' => $pemberi,
            'assigned_to' => (int) $row['assigned_to'],
            'created_by' => (int) $row['created_by']
        ];
    }

    public function index()
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'Tidak terautentikasi.'
            ], 401);
        }

        $rows = $this->queryFor($user)
            ->orderBy('tugas.id', 'DESC')
            ->findAll(100);

        return $this->respond([
            'status' => true,
            'data' => array_map(
                fn ($row) => $this->formatRow($row),
                $rows
            )
        ]);
    }

    public function show($id)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'Tidak terautentikasi.'
            ], 401);
        }

        if (!ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID tugas tidak valid.'
            ], 400);
        }

        $row = $this->queryFor($user)
            ->where('tugas.id', (int) $id)
            ->first();

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan.'
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'data' => $this->formatRow($row)
        ]);
    }

    public function create()
    {
        $user = $this->currentUser();

        if (
            !$user ||
            !in_array(
                $user['role'],
                ['admin', 'kepala_seksi'],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Akses ditolak.'
            ], 403);
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON wajib diisi.'
            ], 400);
        }

        $judul = trim((string) ($data['judul'] ?? ''));
        $deskripsi = trim(
            (string) ($data['deskripsi'] ?? '')
        );

        $stafId = filter_var(
            $data['assigned_to'] ?? null,
            FILTER_VALIDATE_INT
        );

        $prioritas = strtoupper(
            (string) ($data['prioritas'] ?? 'NORMAL')
        );

        $deadline = $data['deadline'] ?? null;

        if (
            mb_strlen($judul) < 3 ||
            mb_strlen($judul) > 255 ||
            !$stafId ||
            !in_array(
                $prioritas,
                ['NORMAL', 'TINGGI'],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Data tugas tidak valid.'
            ], 422);
        }

        if ($deadline !== null && $deadline !== '') {
            $valid = preg_match(
                '/^\d{4}-\d{2}-\d{2}$/',
                (string) $deadline
            );

            if (!$valid) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Format deadline harus YYYY-MM-DD.'
                ], 422);
            }

            [$year, $month, $day] = array_map(
                'intval',
                explode('-', $deadline)
            );

            if (!checkdate($month, $day, $year)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Tanggal deadline tidak valid.'
                ], 422);
            }
        }

        $staf = (new UserModel())
            ->where('id', $stafId)
            ->where('role', 'staf')
            ->where('status', 1)
            ->first();

        if (!$staf) {
            return $this->respond([
                'status' => false,
                'message' => 'Staf tujuan tidak valid.'
            ], 422);
        }

        $id = (new TugasModel())->insert([
            'judul' => $judul,
            'deskripsi' => $deskripsi,
            'assigned_to' => (int) $stafId,
            'created_by' => (int) $user['id'],
            'prioritas' => $prioritas,
            'deadline' => $deadline ?: null,
            'progress' => 0,
            'status' => 'Belum Mulai'
        ], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menyimpan tugas.'
            ], 500);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Tugas berhasil dibuat.',
            'data' => ['id' => (int) $id]
        ], 201);
    }

    public function updateProgress($id)
    {
        $user = $this->currentUser();

        if (!$user || $user['role'] !== 'staf') {
            return $this->respond([
                'status' => false,
                'message' => 'Akses ditolak.'
            ], 403);
        }

        $model = new TugasModel();

        $tugas = ctype_digit((string) $id)
            ? $model->find((int) $id)
            : null;

        if (
            !$tugas ||
            (int) $tugas['assigned_to'] !== (int) $user['id']
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan.'
            ], 404);
        }


        if (in_array(
            $tugas['status'],
            ['Menunggu Review', 'Selesai'],
            true
        )) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Progress terkunci selama review ' .
                    'atau setelah tugas selesai.'
            ], 409);
        }

        $data = $this->request->getJSON(true);

        $progress = filter_var(
            $data['progress'] ?? null,
            FILTER_VALIDATE_INT
        );

        if (
            $progress === false ||
            $progress === null ||
            $progress < 0 ||
            $progress > 100
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Progress harus 0 sampai 100.'
            ], 422);
        }

        $status = $progress === 100
            ? 'Menunggu Review'
            : ($progress === 0
                ? 'Belum Mulai'
                : 'Berjalan');

        $db = db_connect();
        $db->transBegin();

        $updated = $db->table('tugas')
            ->where('id', (int) $id)
            ->where('assigned_to', (int) $user['id'])
            ->whereNotIn(
                'status',
                ['Menunggu Review', 'Selesai']
            )
            ->update([
                'progress' => $progress,
                'status' => $status,
                'updated_at' => date('Y-m-d H:i:s')
            ]);

        if (!$updated || $db->affectedRows() !== 1) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' =>
                    'Progress tidak dapat diperbarui ' .
                    'pada status tugas saat ini.'
            ], 409);
        }

        $logged = $db->table('tugas_aktivitas')->insert([
            'tugas_id' => (int) $id,
            'user_id' => (int) $user['id'],
            'jenis' => 'progress',
            'keterangan' =>
                'Progress diperbarui menjadi ' .
                $progress . '%. Status: ' . $status . '.',
            'created_at' => date('Y-m-d H:i:s')
        ]);

        if (!$logged || $db->transStatus() === false) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Riwayat progress gagal disimpan.'
            ], 500);
        }

        $db->transCommit();

        return $this->respond([
            'status' => true,
            'message' => 'Progress tugas berhasil disimpan.'
        ]);
    }


    public function review($id)
    {
        $user = $this->currentUser();

        if (
            !$user ||
            $user['role'] !== 'kepala_seksi'
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Akses review ditolak.'
            ], 403);
        }

        if (!ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID tugas tidak valid.'
            ], 400);
        }

        $body = $this->request->getJSON(true);

        if (!is_array($body)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid.'
            ], 400);
        }

        $action = $body['action'] ?? '';

        if (!in_array($action, ['approve', 'revise'], true)) {
            return $this->respond([
                'status' => false,
                'message' => 'Aksi review tidak valid.'
            ], 422);
        }

        $reason = trim((string) ($body['reason'] ?? ''));

        // Revisi wajib memiliki catatan yang jelas.
        if (
            $action === 'revise' &&
            (mb_strlen($reason) < 5 || mb_strlen($reason) > 1000)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Alasan revisi wajib diisi, ' .
                    'minimal 5 dan maksimal 1000 karakter.'
            ], 422);
        }

        $db = db_connect();

        $values = $action === 'approve'
            ? [
                'status' => 'Selesai',
                'progress' => 100,
                'updated_at' => date('Y-m-d H:i:s')
            ]
            : [
                'status' => 'Berjalan',
                'progress' => 90,
                'updated_at' => date('Y-m-d H:i:s')
            ];

        $db->transBegin();

        // Hanya pembuat tugas yang boleh mereview.
        // Update bersyarat mencegah review ganda.
        $updated = $db->table('tugas')
            ->where('id', (int) $id)
            ->where('created_by', (int) $user['id'])
            ->where('status', 'Menunggu Review')
            ->where('progress', 100)
            ->update($values);

        if (!$updated || $db->affectedRows() !== 1) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' =>
                    'Tugas bukan milik Anda atau ' .
                    'tidak sedang menunggu review.'
            ], 409);
        }

        // Alasan revisi masuk ke diskusi.
        // Dengan begitu Staf dapat langsung membacanya.
        if ($action === 'revise') {
            $commentSaved = $db->table('tugas_komentar')
                ->insert([
                    'tugas_id' => (int) $id,
                    'user_id' => (int) $user['id'],
                    'isi' => 'CATATAN REVISI: ' . $reason,
                    'created_at' => date('Y-m-d H:i:s')
                ]);

            if (!$commentSaved) {
                $db->transRollback();

                return $this->respond([
                    'status' => false,
                    'message' => 'Catatan revisi gagal disimpan.'
                ], 500);
            }
        }

        // Catat keputusan dalam riwayat aktivitas.
        $description = $action === 'approve'
            ? 'Kepala Seksi menyetujui hasil tugas. Status: Selesai.'
            : 'Kepala Seksi meminta revisi: ' . $reason;

        $logged = $db->table('tugas_aktivitas')->insert([
            'tugas_id' => (int) $id,
            'user_id' => (int) $user['id'],
            'jenis' => $action === 'approve'
                ? 'persetujuan'
                : 'revisi',
            'keterangan' => $description,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        if (!$logged || $db->transStatus() === false) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Riwayat review gagal disimpan.'
            ], 500);
        }

        $db->transCommit();

        return $this->respond([
            'status' => true,
            'message' => $action === 'approve'
                ? 'Tugas berhasil disetujui.'
                : 'Tugas dikembalikan untuk revisi.',
            'data' => [
                'id' => (int) $id,
                'status' => $values['status'],
                'progress' => $values['progress']
            ]
        ]);
    }

}
