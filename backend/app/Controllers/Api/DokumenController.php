<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\DokumenModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class DokumenController extends BaseController
{
    use ResponseTrait;

    private const KATEGORI = [
        'Laporan',
        'Surat Keputusan',
        'Pengajuan Dana',
        'Proposal',
        'Nota Dinas',
        'Lainnya',
    ];

    private const STATUS = [
        'draft'     => ['text' => 'Draft', 'tone' => 'gray'],
        'terkirim'  => ['text' => 'Terkirim', 'tone' => 'blue'],
        'disetujui' => ['text' => 'Disetujui', 'tone' => 'green'],
        'ditolak'   => ['text' => 'Ditolak', 'tone' => 'red'],
        'arsip'     => ['text' => 'Arsip', 'tone' => 'gray'],
    ];

    private const STATUS_KIRIM = ['draft', 'terkirim'];

    private const IKON_KATEGORI = [
        'Laporan'          => 'doc',
        'Surat Keputusan'  => 'clipboard',
        'Pengajuan Dana'   => 'mail',
        'Proposal'         => 'folder',
        'Nota Dinas'       => 'doc',
    ];

    private const BULAN = [
        1  => 'Jan',
        2  => 'Feb',
        3  => 'Mar',
        4  => 'Apr',
        5  => 'Mei',
        6  => 'Jun',
        7  => 'Jul',
        8  => 'Agu',
        9  => 'Sep',
        10 => 'Okt',
        11 => 'Nov',
        12 => 'Des',
    ];

    private const EKSTENSI_DIIZINKAN = [
        'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png',
    ];

    private const MAKSIMAL_UKURAN = 5 * 1024 * 1024;

    private const DIREKTORI_UPLOAD = 'uploads/dokumen';

    private function currentUser(): ?array
    {
        $header = $this->request->getHeaderLine('Authorization');

        if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
            return null;
        }

        $token = (new AuthTokenModel())
            ->where('token_hash', hash('sha256', $matches[1]))
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

    private function unauthorized()
    {
        return $this->respond([
            'status' => false,
            'message' => 'Tidak terautentikasi.',
        ], 401);
    }

    private function formatTanggal(?string $waktu): string
    {
        if (!$waktu) {
            return '-';
        }

        $stamp = strtotime($waktu);

        if ($stamp === false) {
            return '-';
        }

        return date('d ', $stamp)
            . self::BULAN[(int) date('n', $stamp)]
            . date(' Y', $stamp);
    }

    private function formatDokumen(array $row): array
    {
        $status = self::STATUS[$row['status']] ?? self::STATUS['draft'];

        $adaFile = !empty($row['file_path']);

        $fileNama = null;

        if ($adaFile) {
            $ekstensi = strtolower(
                pathinfo($row['file_path'], PATHINFO_EXTENSION)
            );

            $fileNama = $row['nama'] . '.' . $ekstensi;
        }

        return [
            'id' => (int) $row['id'],
            'nama' => $row['nama'],
            'icon' => self::IKON_KATEGORI[$row['kategori']] ?? 'folder',
            'nomor' => $row['nomor'] !== null && $row['nomor'] !== ''
                ? $row['nomor']
                : '-',
            'tanggal' => $this->formatTanggal($row['created_at']),
            'kategori' => $row['kategori'],
            'keterangan' => $row['keterangan'] ?? '',
            'status' => [
                'text' => $status['text'],
                'tone' => $status['tone'],
            ],
            'adaFile' => $adaFile,
            'fileNama' => $fileNama,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI INPUT
    |--------------------------------------------------------------------------
    */

    private function validateDokumen(array $data): ?string
    {
        $nama = trim((string) ($data['nama'] ?? ''));

        if (mb_strlen($nama) < 3) {
            return 'Nama dokumen minimal 3 karakter.';
        }

        if (mb_strlen($nama) > 255) {
            return 'Nama dokumen maksimal 255 karakter.';
        }

        $kategori = trim((string) ($data['kategori'] ?? ''));

        if (!in_array($kategori, self::KATEGORI, true)) {
            return 'Kategori tidak valid.';
        }

        $nomor = trim((string) ($data['nomor'] ?? ''));

        if (mb_strlen($nomor) > 100) {
            return 'Nomor dokumen maksimal 100 karakter.';
        }

        if (mb_strlen((string) ($data['keterangan'] ?? '')) > 5000) {
            return 'Keterangan maksimal 5000 karakter.';
        }

        return null;
    }

    private function validateStatusKirim(array $data): ?string
    {
        $status = trim((string) ($data['status'] ?? 'draft'));

        if ($status === '') {
            $status = 'draft';
        }

        if (!in_array($status, self::STATUS_KIRIM, true)) {
            return 'Status hanya boleh draft atau terkirim.';
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI & SIMPAN LAMPIRAN
    |--------------------------------------------------------------------------
    */

    private function simpanLampiran($file): array
    {
        $ekstensi = strtolower((string) $file->getClientExtension());

        if (!in_array($ekstensi, self::EKSTENSI_DIIZINKAN, true)) {
            return [
                null,
                'Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG.',
            ];
        }

        if ((int) $file->getSize() > self::MAKSIMAL_UKURAN) {
            return [
                null,
                'Ukuran file maksimal 5MB.',
            ];
        }

        $direktori = WRITEPATH . self::DIREKTORI_UPLOAD;

        if (!is_dir($direktori)) {
            mkdir($direktori, 0775, true);
        }

        /*
         * Nama acak memakai ekstensi klien yang sudah
         * tervalidasi supaya nama file unduhan konsisten.
         */
        $namaBaru = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ekstensi;

        if (!$file->move($direktori, $namaBaru)) {
            return [
                null,
                'File gagal disimpan.',
            ];
        }

        return [
            self::DIREKTORI_UPLOAD . '/' . $namaBaru,
            null,
        ];
    }

    private function hapusLampiran(?string $filePath): void
    {
        if (!$filePath) {
            return;
        }

        $absolut = WRITEPATH . $filePath;

        $realPath = realpath($absolut);

        $realBase = realpath(WRITEPATH . self::DIREKTORI_UPLOAD);

        if (
            $realPath === false ||
            $realBase === false ||
            !str_starts_with($realPath, $realBase . DIRECTORY_SEPARATOR) ||
            !is_file($realPath)
        ) {
            return;
        }

        @unlink($realPath);
    }

    private function cariDokumenMilik(int $id, int $userId): ?array
    {
        return (new DokumenModel())
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | BODY REQUEST: JSON atau multipart/form-data
    |--------------------------------------------------------------------------
    */

    private function ambilBody(): ?array
    {
        $contentType = $this->request->getHeaderLine('Content-Type');

        if (stripos($contentType, 'application/json') !== false) {
            try {
                $data = $this->request->getJSON(true);
            } catch (\Throwable $e) {
                return null;
            }

            return is_array($data) ? $data : null;
        }

        $data = $this->request->getPost();

        return is_array($data) && $data !== [] ? $data : null;
    }

    /*
    |--------------------------------------------------------------------------
    | DAFTAR DOKUMEN MILIK USER LOGIN
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $rows = (new DokumenModel())->getByUser((int) $user['id']);

        return $this->respond([
            'status' => true,
            'data' => array_map(
                fn ($row) => $this->formatDokumen($row),
                $rows
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL DOKUMEN MILIK USER LOGIN
    |--------------------------------------------------------------------------
    */

    public function show($id = null)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $row = $this->cariDokumenMilik((int) $id, (int) $user['id']);

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'data' => $this->formatDokumen($row),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BUAT DOKUMEN BARU (DRAFT / LANGSUNG KIRIM)
    |--------------------------------------------------------------------------
    | Menerima multipart/form-data (dengan lampiran) atau JSON.
    */

    public function create()
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $data = $this->ambilBody();

        if (!is_array($data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body tidak valid.',
            ], 400);
        }

        $error = $this->validateDokumen($data);

        if ($error !== null) {
            return $this->respond([
                'status' => false,
                'message' => $error,
            ], 422);
        }

        $error = $this->validateStatusKirim($data);

        if ($error !== null) {
            return $this->respond([
                'status' => false,
                'message' => $error,
            ], 422);
        }

        $status = trim((string) ($data['status'] ?? 'draft')) ?: 'draft';

        $filePath = null;

        $file = $this->request->getFile('file');

        if ($file !== null && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            if (!$file->isValid()) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Unggahan file gagal. Periksa kembali ukuran file.',
                ], 422);
            }

            [$filePath, $error] = $this->simpanLampiran($file);

            if ($error !== null) {
                return $this->respond([
                    'status' => false,
                    'message' => $error,
                ], 422);
            }
        }

        $model = new DokumenModel();

        $id = $model->insert([
            'user_id' => (int) $user['id'],
            'nama' => trim((string) $data['nama']),
            'nomor' => trim((string) ($data['nomor'] ?? '')) ?: null,
            'kategori' => trim((string) $data['kategori']),
            'keterangan' => trim((string) ($data['keterangan'] ?? '')) ?: null,
            'status' => $status,
            'file_path' => $filePath,
        ], true);

        if (!$id) {
            if ($filePath !== null) {
                $this->hapusLampiran($filePath);
            }

            return $this->respond([
                'status' => false,
                'message' => 'Dokumen gagal disimpan.',
            ], 500);
        }

        return $this->respond([
            'status' => true,
            'message' => $status === 'terkirim'
                ? 'Dokumen berhasil dikirim.'
                : 'Dokumen berhasil dibuat.',
            'data' => [
                'id' => (int) $id,
            ],
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | UBAH DOKUMEN (HANYA DRAFT)
    |--------------------------------------------------------------------------
    */

    public function update($id = null)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $row = $this->cariDokumenMilik((int) $id, (int) $user['id']);

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        if ($row['status'] !== 'draft') {
            return $this->respond([
                'status' => false,
                'message' => 'Hanya dokumen berstatus draft yang dapat diubah.',
            ], 422);
        }

        $data = $this->ambilBody();

        if (!is_array($data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body tidak valid.',
            ], 400);
        }

        $error = $this->validateDokumen($data);

        if ($error !== null) {
            return $this->respond([
                'status' => false,
                'message' => $error,
            ], 422);
        }

        $payload = [
            'nama' => trim((string) $data['nama']),
            'nomor' => trim((string) ($data['nomor'] ?? '')) ?: null,
            'kategori' => trim((string) $data['kategori']),
            'keterangan' => trim((string) ($data['keterangan'] ?? '')) ?: null,
        ];

        $file = $this->request->getFile('file');

        if ($file !== null && $file->getError() !== UPLOAD_ERR_NO_FILE) {
            if (!$file->isValid()) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Unggahan file gagal. Periksa kembali ukuran file.',
                ], 422);
            }

            [$filePathBaru, $error] = $this->simpanLampiran($file);

            if ($error !== null) {
                return $this->respond([
                    'status' => false,
                    'message' => $error,
                ], 422);
            }

            $payload['file_path'] = $filePathBaru;
        }

        $model = new DokumenModel();

        if (!$model->update((int) $id, $payload)) {
            if (isset($payload['file_path'])) {
                $this->hapusLampiran($payload['file_path']);
            }

            return $this->respond([
                'status' => false,
                'message' => 'Dokumen gagal diperbarui.',
            ], 500);
        }

        if (isset($payload['file_path'])) {
            $this->hapusLampiran($row['file_path']);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Dokumen berhasil diperbarui.',
            'data' => [
                'id' => (int) $id,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | KIRIM DOKUMEN (DRAFT -> TERKIRIM)
    |--------------------------------------------------------------------------
    */

    public function kirim($id = null)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $row = $this->cariDokumenMilik((int) $id, (int) $user['id']);

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        if ($row['status'] !== 'draft') {
            return $this->respond([
                'status' => false,
                'message' => 'Hanya dokumen berstatus draft yang dapat dikirim.',
            ], 422);
        }

        (new DokumenModel())->update((int) $id, [
            'status' => 'terkirim',
        ]);

        return $this->respond([
            'status' => true,
            'message' => 'Dokumen berhasil dikirim untuk diperiksa.',
            'data' => [
                'id' => (int) $id,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | HAPUS DOKUMEN
    |--------------------------------------------------------------------------
    */

    public function delete($id = null)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $row = $this->cariDokumenMilik((int) $id, (int) $user['id']);

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        (new DokumenModel())->delete((int) $id);

        $this->hapusLampiran($row['file_path']);

        return $this->respond([
            'status' => true,
            'message' => 'Dokumen berhasil dihapus.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UNDUH LAMPIRAN DOKUMEN
    |--------------------------------------------------------------------------
    */

    public function file($id = null)
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $row = $this->cariDokumenMilik((int) $id, (int) $user['id']);

        if (!$row) {
            return $this->respond([
                'status' => false,
                'message' => 'Dokumen tidak ditemukan.',
            ], 404);
        }

        if (empty($row['file_path'])) {
            return $this->respond([
                'status' => false,
                'message' => 'Dokumen belum memiliki lampiran.',
            ], 404);
        }

        $realPath = realpath(WRITEPATH . $row['file_path']);
        $realBase = realpath(WRITEPATH . self::DIREKTORI_UPLOAD);

        if (
            $realPath === false ||
            $realBase === false ||
            !str_starts_with($realPath, $realBase . DIRECTORY_SEPARATOR) ||
            !is_file($realPath)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Lampiran tidak ditemukan.',
            ], 404);
        }

        $ekstensi = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));

        $namaUnduhan = $row['nama'] . '.' . $ekstensi;

        return $this->response
            ->download($realPath, null)
            ->setFileName($namaUnduhan);
    }
}
