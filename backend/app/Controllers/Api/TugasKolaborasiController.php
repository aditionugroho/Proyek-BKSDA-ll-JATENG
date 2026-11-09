<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\TugasModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class TugasKolaborasiController extends BaseController
{
    use ResponseTrait;

    private function currentUser(): ?array
    {
        $header = $this->request->getHeaderLine('Authorization');

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

    private function access($id): ?array
    {
        $user = $this->currentUser();

        if (!$user || !ctype_digit((string) $id)) {
            return null;
        }

        $task = (new TugasModel())->find((int) $id);

        if (!$task) {
            return null;
        }

        $allowed = $user['role'] === 'admin'
            || (
                $user['role'] === 'kepala_seksi'
                && (int) $task['created_by'] === (int) $user['id']
            )
            || (
                $user['role'] === 'staf'
                && (int) $task['assigned_to'] === (int) $user['id']
            );

        return $allowed ? [
            'user' => $user,
            'task' => $task
        ] : null;
    }

    private function record(
        int $taskId,
        int $userId,
        string $type,
        string $description
    ): void {
        db_connect()->table('tugas_aktivitas')->insert([
            'tugas_id' => $taskId,
            'user_id' => $userId,
            'jenis' => $type,
            'keterangan' => $description,
            'created_at' => date('Y-m-d H:i:s')
        ]);
    }

    public function comments($id)
    {
        if (!$this->access($id)) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan atau akses ditolak.'
            ], 404);
        }

        $data = db_connect()->table('tugas_komentar AS k')
            ->select('k.id, k.isi, k.created_at, u.name AS nama, u.role')
            ->join('users AS u', 'u.id = k.user_id')
            ->where('k.tugas_id', (int) $id)
            ->orderBy('k.id', 'ASC')
            ->limit(200)
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => true,
            'data' => $data
        ]);
    }

    public function addComment($id)
    {
        $access = $this->access($id);

        if (!$access) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan atau akses ditolak.'
            ], 404);
        }

        $body = $this->request->getJSON(true);

        if (!is_array($body)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid.'
            ], 400);
        }

        $isi = trim((string) ($body['isi'] ?? ''));

        if ($isi === '' || mb_strlen($isi) > 2000) {
            return $this->respond([
                'status' => false,
                'message' => 'Komentar wajib diisi, maksimal 2000 karakter.'
            ], 422);
        }

        $userId = (int) $access['user']['id'];

        db_connect()->table('tugas_komentar')->insert([
            'tugas_id' => (int) $id,
            'user_id' => $userId,
            'isi' => $isi,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        $this->record(
            (int) $id,
            $userId,
            'komentar',
            'Menambahkan komentar tugas.'
        );

        return $this->respond([
            'status' => true,
            'message' => 'Komentar berhasil disimpan.'
        ], 201);
    }

    public function activities($id)
    {
        if (!$this->access($id)) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan atau akses ditolak.'
            ], 404);
        }

        $data = db_connect()->table('tugas_aktivitas AS a')
            ->select(
                'a.id, a.jenis, a.keterangan, ' .
                'a.created_at, u.name AS nama'
            )
            ->join('users AS u', 'u.id = a.user_id')
            ->where('a.tugas_id', (int) $id)
            ->orderBy('a.id', 'DESC')
            ->limit(200)
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => true,
            'data' => $data
        ]);
    }

    public function attachments($id)
    {
        if (!$this->access($id)) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan atau akses ditolak.'
            ], 404);
        }

        $data = db_connect()->table('tugas_lampiran AS l')
            ->select(
                'l.id, l.nama_asli, l.ukuran, ' .
                'l.created_at, u.name AS pengunggah'
            )
            ->join('users AS u', 'u.id = l.user_id')
            ->where('l.tugas_id', (int) $id)
            ->orderBy('l.id', 'DESC')
            ->get()
            ->getResultArray();

        return $this->respond([
            'status' => true,
            'data' => $data
        ]);
    }

    public function upload($id)
    {
        $access = $this->access($id);

        if (!$access) {
            return $this->respond([
                'status' => false,
                'message' => 'Tugas tidak ditemukan atau akses ditolak.'
            ], 404);
        }

        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->respond([
                'status' => false,
                'message' => 'File tidak valid.'
            ], 422);
        }

        $size = $file->getSize();

        if ($size <= 0 || $size > 10 * 1024 * 1024) {
            return $this->respond([
                'status' => false,
                'message' => 'Ukuran file maksimal 10 MB.'
            ], 422);
        }

        // Tahap awal: format yang dapat divalidasi
        // dengan signature/MIME secara ketat.
        $allowed = [
            'pdf' => 'application/pdf',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png'
        ];

        $original = basename($file->getClientName());
        $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
        $mime = $file->getMimeType();

        if (
            !isset($allowed[$ext])
            || $mime !== $allowed[$ext]
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Format yang didukung: PDF, JPG, PNG.'
            ], 422);
        }

        $directory = WRITEPATH . 'uploads/tugas/' . (int) $id;

        if (
            !is_dir($directory) &&
            !mkdir($directory, 0770, true)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Direktori upload tidak dapat dibuat.'
            ], 500);
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $ext;

        if (!$file->move($directory, $filename)) {
            return $this->respond([
                'status' => false,
                'message' => 'Upload gagal.'
            ], 500);
        }

        $db = db_connect();

        $success = $db->table('tugas_lampiran')->insert([
            'tugas_id' => (int) $id,
            'user_id' => (int) $access['user']['id'],
            'nama_asli' => mb_substr($original, 0, 255),
            'nama_simpan' => $filename,
            'ukuran' => $size,
            'created_at' => date('Y-m-d H:i:s')
        ]);

        if (!$success) {
            @unlink($directory . DIRECTORY_SEPARATOR . $filename);

            return $this->respond([
                'status' => false,
                'message' => 'Metadata lampiran gagal disimpan.'
            ], 500);
        }

        $lampiranId = (int) $db->insertID();

        $this->record(
            (int) $id,
            (int) $access['user']['id'],
            'lampiran',
            'Mengunggah lampiran tugas.'
        );

        return $this->respond([
            'status' => true,
            'message' => 'Lampiran berhasil diunggah.',
            'data' => [
                'id' => $lampiranId
            ]
        ], 201);
    }

    public function download($id, $fileId)
    {
        if (
            !$this->access($id)
            || !ctype_digit((string) $fileId)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Akses ditolak.'
            ], 404);
        }

        $row = db_connect()->table('tugas_lampiran')
            ->where('tugas_id', (int) $id)
            ->where('id', (int) $fileId)
            ->get()
            ->getRowArray();

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Lampiran tidak ditemukan.'
            ], 404);
        }

        $path = WRITEPATH . 'uploads/tugas/' .
            (int) $id . '/' . basename($row['nama_simpan']);

        if (!is_file($path)) {
            return $this->respond([
                'status' => false,
                'message' => 'Berkas tidak ditemukan di penyimpanan.'
            ], 404);
        }

        return $this->response
            ->download($path, null)
            ->setFileName(basename($row['nama_asli']));
    }
}
