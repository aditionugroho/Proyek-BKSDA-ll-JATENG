<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\TugasModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class TugasChecklistController extends BaseController
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

        if (!$token) return null;

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

    private function access($id): ?array
    {
        $user = $this->currentUser();

        if (!$user || !ctype_digit((string) $id)) {
            return null;
        }

        $task = (new TugasModel())->find((int) $id);

        if (!$task) return null;

        $allowed =
            (
                $user['role'] === 'kepala_seksi' &&
                (int) $task['created_by'] === (int) $user['id']
            ) ||
            (
                $user['role'] === 'staf' &&
                (int) $task['assigned_to'] === (int) $user['id']
            );

        return $allowed
            ? ['user' => $user, 'task' => $task]
            : null;
    }

    public function index($id)
    {
        $access = $this->access($id);

        if (!$access) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan.'
            ], 404);
        }

        $db = db_connect();

        $data = $db->table('tugas_checklist')
            ->select('id, teks, selesai, created_at, updated_at')
            ->where('tugas_id', (int) $id)
            ->orderBy('id', 'ASC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => true,
            'data' => $data
        ]);
    }

    public function create($id)
    {
        $access = $this->access($id);

        if (
            !$access ||
            $access['user']['role'] !== 'kepala_seksi'
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Akses ditolak.'
            ], 403);
        }

        if ($access['task']['status'] === 'Selesai') {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas selesai tidak dapat diubah.'
            ], 409);
        }

        $body = $this->request->getJSON(true);

        if (!is_array($body)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid.'
            ], 400);
        }

        $teks = trim((string) ($body['teks'] ?? ''));

        if (
            mb_strlen($teks) < 3 ||
            mb_strlen($teks) > 500
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Checklist harus berisi 3?500 karakter.'
            ], 422);
        }

        $db = db_connect();

        // Batasi jumlah checklist per tugas.
        $jumlah = $db->table('tugas_checklist')
            ->where('tugas_id', (int) $id)
            ->countAllResults();

        if ($jumlah >= 100) {
            return $this->respond([
                'status' => false,
                'message' => 'Maksimal 100 checklist per tugas.'
            ], 422);
        }

        $now = date('Y-m-d H:i:s');

        $saved = $db->table('tugas_checklist')->insert([
            'tugas_id' => (int) $id,
            'teks' => $teks,
            'selesai' => 0,
            'dibuat_oleh' => (int) $access['user']['id'],
            'created_at' => $now,
            'updated_at' => $now
        ]);

        if (!$saved) {
            return $this->respond([
                'status' => false,
                'message' => 'Checklist gagal disimpan.'
            ], 500);
        }

        $checklistId = (int) $db->insertID();

        $db->table('tugas_aktivitas')->insert([
            'tugas_id' => (int) $id,
            'user_id' => (int) $access['user']['id'],
            'jenis' => 'checklist',
            'keterangan' => 'Menambahkan checklist: ' . $teks,
            'created_at' => $now
        ]);

        return $this->respond([
            'status' => true,
            'message' => 'Checklist berhasil ditambahkan.',
            'data' => ['id' => $checklistId]
        ], 201);
    }

    public function update($id, $checklistId)
    {
        $access = $this->access($id);

        if (
            !$access ||
            $access['user']['role'] !== 'staf'
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Akses ditolak.'
            ], 403);
        }

        if (
            !ctype_digit((string) $checklistId) ||
            in_array(
                $access['task']['status'],
                ['Menunggu Review', 'Selesai'],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Checklist tidak dapat diubah.'
            ], 409);
        }

        $body = $this->request->getJSON(true);

        if (
            !is_array($body) ||
            !array_key_exists('selesai', $body) ||
            !is_bool($body['selesai'])
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Field selesai harus boolean.'
            ], 422);
        }

        $db = db_connect();

        $row = $db->table('tugas_checklist')
            ->where('id', (int) $checklistId)
            ->where('tugas_id', (int) $id)
            ->get()
            ->getRowArray();

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Checklist tidak ditemukan.'
            ], 404);
        }

        $done = $body['selesai'];
        $now = date('Y-m-d H:i:s');

        $db->transBegin();

        $saved = $db->table('tugas_checklist')
            ->where('id', (int) $checklistId)
            ->where('tugas_id', (int) $id)
            ->update([
                'selesai' => $done ? 1 : 0,
                'diselesaikan_oleh' => $done
                    ? (int) $access['user']['id']
                    : null,
                'updated_at' => $now
            ]);

        if (!$saved) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Checklist gagal diperbarui.'
            ], 500);
        }

        // Tidak membuat log berulang jika nilainya sama.
        if ((bool) $row['selesai'] !== $done) {
            $db->table('tugas_aktivitas')->insert([
                'tugas_id' => (int) $id,
                'user_id' => (int) $access['user']['id'],
                'jenis' => 'checklist',
                'keterangan' => ($done
                    ? 'Menyelesaikan checklist: '
                    : 'Membuka kembali checklist: ') . $row['teks'],
                'created_at' => $now
            ]);
        }

        if ($db->transStatus() === false) {
            $db->transRollback();

            return $this->respond([
                'status' => false,
                'message' => 'Penyimpanan checklist gagal.'
            ], 500);
        }

        $db->transCommit();

        return $this->respond([
            'status' => true,
            'message' => 'Checklist berhasil diperbarui.'
        ]);
    }
}
