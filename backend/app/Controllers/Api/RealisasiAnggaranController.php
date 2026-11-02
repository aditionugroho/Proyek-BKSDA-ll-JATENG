<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\RealisasiAnggaranModel;
use App\Models\ResortModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class CsvValidationException extends \RuntimeException
{
}

class RealisasiAnggaranController extends BaseController
{
    use ResponseTrait;

    private RealisasiAnggaranModel $realisasi;

    public function __construct()
    {
        $this->realisasi = new RealisasiAnggaranModel();
    }

    private function authenticatedUser(): ?array
    {
        $header = $this->request->getHeaderLine('Authorization');

        if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $matches)) {
            return null;
        }

        $token = (new AuthTokenModel())
            ->where('token_hash', hash('sha256', $matches[1]))
            ->where('revoked_at', null)
            ->first();

        if (
            !$token ||
            empty($token['expires_at']) ||
            strtotime($token['expires_at']) <= time() ||
            (
                !empty($token['last_used_at']) &&
                time() - strtotime($token['last_used_at']) > 1800
            )
        ) {
            return null;
        }

        return (new UserModel())
            ->where('id', $token['user_id'])
            ->where('status', 1)
            ->first();
    }

    private function authorize(bool $write = false): array
    {
        $user = $this->authenticatedUser();

        if (!$user) {
            return [
                'error' => 'Pengguna tidak terautentikasi.',
                'code' => 401,
            ];
        }

        $allowed = $write
            ? ['admin', 'kepala_seksi']
            : ['admin', 'kepala_seksi', 'staf'];

        if (!in_array($user['role'], $allowed, true)) {
            return [
                'error' => 'Akses ditolak.',
                'code' => 403,
            ];
        }

        if (
            $user['role'] === 'staf' &&
            empty($user['resort_id'])
        ) {
            return [
                'error' => 'Akun belum memiliki resort.',
                'code' => 403,
            ];
        }

        return ['user' => $user];
    }

    private function failure(array $auth)
    {
        return $this->respond([
            'status' => false,
            'message' => $auth['error'],
        ], $auth['code']);
    }

    public function index()
    {
        $auth = $this->authorize();

        if (isset($auth['error'])) {
            return $this->failure($auth);
        }

        $user = $auth['user'];

        $filters = [
            'resort_id' => $this->request->getGet('resort_id'),
            'tahun' => $this->request->getGet('tahun'),
            'triwulan' => $this->request->getGet('triwulan'),
        ];

        foreach ($filters as $field => $value) {
            if ($value === null) {
                continue;
            }

            if (
                !is_scalar($value) ||
                !ctype_digit((string) $value) ||
                (int) $value < 1
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => "Filter {$field} tidak valid.",
                ], 422);
            }
        }

        if (
            $filters['tahun'] !== null &&
            (
                (int) $filters['tahun'] < 2000 ||
                (int) $filters['tahun'] > 2100
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Tahun tidak valid.',
            ], 422);
        }

        if (
            $filters['triwulan'] !== null &&
            (int) $filters['triwulan'] > 4
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Triwulan harus 1 sampai 4.',
            ], 422);
        }

        if ($user['role'] === 'staf') {
            $this->realisasi->where(
                'resort_id',
                (int) $user['resort_id']
            );
        } elseif ($filters['resort_id'] !== null) {
            $this->realisasi->where(
                'resort_id',
                (int) $filters['resort_id']
            );
        }

        foreach (['tahun', 'triwulan'] as $field) {
            if ($filters[$field] !== null) {
                $this->realisasi->where(
                    $field,
                    (int) $filters[$field]
                );
            }
        }

        return $this->respond([
            'status' => true,
            'message' => 'Daftar realisasi anggaran berhasil diambil.',
            'data' => $this->realisasi
                ->orderBy('tahun', 'DESC')
                ->orderBy('triwulan', 'ASC')
                ->findAll(),
        ]);
    }

    public function show($id = null)
    {
        $auth = $this->authorize();

        if (isset($auth['error'])) {
            return $this->failure($auth);
        }

        if (!ctype_digit((string) $id) || (int) $id < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'ID realisasi tidak valid.',
            ], 400);
        }

        $query = $this->realisasi->where('id', (int) $id);

        if ($auth['user']['role'] === 'staf') {
            $query->where(
                'resort_id',
                (int) $auth['user']['resort_id']
            );
        }

        $data = $query->first();

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Realisasi anggaran tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Detail realisasi anggaran berhasil diambil.',
            'data' => $data,
        ]);
    }

    public function create()
    {
        $auth = $this->authorize(true);

        if (isset($auth['error'])) {
            return $this->failure($auth);
        }

        $input = $this->request->getJSON(true);

        if (
            !is_array($input) ||
            $input === [] ||
            array_is_list($input)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Body harus berupa JSON object.',
            ], 400);
        }

        $validated = $this->validateRealisasi($input);

        if (isset($validated['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $validated['error'],
            ], $validated['code'] ?? 422);
        }

        try {
            $id = $this->realisasi->insert(
                $validated['data'],
                true
            );

            if (!$id) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Gagal menyimpan realisasi anggaran.',
                    'errors' => $this->realisasi->errors(),
                ], 422);
            }

            return $this->respondCreated([
                'status' => true,
                'message' => 'Realisasi anggaran berhasil ditambahkan.',
                'data' => $this->realisasi->find($id),
            ]);
        } catch (\Throwable $e) {
            log_message('error', 'Gagal membuat realisasi anggaran: {message}', [
                'message' => $e->getMessage(),
            ]);

            return $this->respond([
                'status' => false,
                'message' => 'Terjadi kesalahan saat menyimpan realisasi anggaran.',
            ], 500);
        }
    }

    public function update($id = null)
    {
        $auth = $this->authorize(true);

        if (isset($auth['error'])) {
            return $this->failure($auth);
        }

        if (!ctype_digit((string) $id) || (int) $id < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'ID realisasi tidak valid.',
            ], 400);
        }

        $current = $this->realisasi->find((int) $id);

        if (!$current) {
            return $this->respond([
                'status' => false,
                'message' => 'Realisasi anggaran tidak ditemukan.',
            ], 404);
        }

        $input = $this->request->getJSON(true);

        if (
            !is_array($input) ||
            $input === [] ||
            array_is_list($input)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid atau kosong.',
            ], 400);
        }

        $validated = $this->validateRealisasi($input, $current);

        if (isset($validated['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $validated['error'],
            ], $validated['code'] ?? 422);
        }

        try {
            if (!$this->realisasi->update(
                (int) $id,
                $validated['data']
            )) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Gagal memperbarui realisasi anggaran.',
                    'errors' => $this->realisasi->errors(),
                ], 422);
            }

            return $this->respond([
                'status' => true,
                'message' => 'Realisasi anggaran berhasil diperbarui.',
                'data' => $this->realisasi->find((int) $id),
            ]);
        } catch (\Throwable $e) {
            log_message('error', 'Gagal memperbarui realisasi anggaran: {message}', [
                'message' => $e->getMessage(),
            ]);

            return $this->respond([
                'status' => false,
                'message' => 'Terjadi kesalahan saat memperbarui realisasi anggaran.',
            ], 500);
        }
    }

    public function import()
    {
        $auth = $this->authorize(true);

        if (isset($auth['error'])) {
            return $this->failure($auth);
        }

        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->respond([
                'status' => false,
                'message' => 'File CSV tidak ditemukan atau gagal diunggah.',
            ], 422);
        }

        $size = $file->getSize();

        if (
            $size === false ||
            $size === 0 ||
            $size > 2 * 1024 * 1024
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Ukuran file harus lebih dari 0 dan maksimal 2 MB.',
            ], 422);
        }

        if (strtolower($file->getClientExtension()) !== 'csv') {
            return $this->respond([
                'status' => false,
                'message' => 'Hanya file .csv yang diperbolehkan.',
            ], 422);
        }

        $handle = fopen($file->getTempName(), 'rb');

        if ($handle === false) {
            return $this->respond([
                'status' => false,
                'message' => 'File CSV tidak dapat dibaca.',
            ], 422);
        }

        $expectedHeader = [
            'resort_id',
            'tahun',
            'triwulan',
            'kode_kegiatan',
            'nama_kegiatan',
            'pagu_anggaran',
            'nilai_realisasi',
        ];

        $db = db_connect();
        $transactionStarted = false;

        try {
            $header = fgetcsv($handle, 0, ',', '"', '');

            if (!is_array($header)) {
                throw new CsvValidationException(
                    'Header CSV tidak ditemukan.'
                );
            }

            // Hapus UTF-8 BOM jika file berasal dari Excel.
            $header[0] = preg_replace(
                '/^\xEF\xBB\xBF/',
                '',
                $header[0]
            );

            if ($header !== $expectedHeader) {
                throw new CsvValidationException(
                    'Format kolom CSV tidak sesuai. Kolom wajib: ' .
                    implode(', ', $expectedHeader)
                );
            }

            $db->transBegin();
            $transactionStarted = true;

            $inserted = 0;
            $lineNumber = 1;

            while (
                ($row = fgetcsv($handle, 0, ',', '"', ''))
                !== false
            ) {
                $lineNumber++;

                if (
                    count($row) === 1 &&
                    trim($row[0]) === ''
                ) {
                    continue;
                }

                if ($inserted >= 500) {
                    throw new CsvValidationException(
                        'Maksimal 500 baris data per impor.'
                    );
                }

                if (count($row) !== count($expectedHeader)) {
                    throw new CsvValidationException(
                        "Jumlah kolom tidak sesuai pada baris {$lineNumber}."
                    );
                }

                $input = array_combine(
                    $expectedHeader,
                    $row
                );

                foreach ($input as $field => $value) {
                    $input[$field] = trim($value);
                }

                foreach (['resort_id', 'tahun', 'triwulan'] as $field) {
                    if (!ctype_digit($input[$field])) {
                        throw new CsvValidationException(
                            "{$field} tidak valid pada baris {$lineNumber}."
                        );
                    }

                    $input[$field] = (int) $input[$field];
                }

                $validated = $this->validateRealisasi(
                    $input
                );

                if (isset($validated['error'])) {
                    throw new CsvValidationException(
                        "Baris {$lineNumber}: {$validated['error']}"
                    );
                }

                $id = $this->realisasi->insert(
                    $validated['data'],
                    true
                );

                if (!$id) {
                    // Jika insert gagal, bedakan error validasi
                    // dan kesalahan database.
                    $modelErrors = $this->realisasi->errors();

                    if (!empty($modelErrors)) {
                        throw new CsvValidationException(
                            "Baris {$lineNumber}: " .
                            implode('; ', $modelErrors)
                        );
                    }

                    throw new \RuntimeException(
                        'Gagal menyimpan data impor.'
                    );
                }

                $inserted++;
            }

            if ($inserted === 0) {
                throw new CsvValidationException(
                    'File CSV tidak memiliki baris data.'
                );
            }

            if ($db->transStatus() === false) {
                throw new \RuntimeException(
                    'Transaksi database gagal.'
                );
            }

            if ($db->transCommit() === false) {
                throw new \RuntimeException(
                    'Gagal menyelesaikan transaksi database.'
                );
            }

            $transactionStarted = false;

            return $this->respondCreated([
                'status' => true,
                'message' => 'Impor realisasi anggaran berhasil.',
                'total_imported' => $inserted,
            ]);
        } catch (CsvValidationException $e) {
            if ($transactionStarted) {
                $db->transRollback();
            }

            return $this->respond([
                'status' => false,
                'message' => 'Impor dibatalkan. Tidak ada data yang disimpan.',
                'errors' => [
                    $e->getMessage(),
                ],
            ], 422);
        } catch (\Throwable $e) {
            if ($transactionStarted) {
                $db->transRollback();
            }

            log_message(
                'error',
                'Impor realisasi anggaran gagal: {message}',
                ['message' => $e->getMessage()]
            );

            return $this->respond([
                'status' => false,
                'message' => 'Terjadi kesalahan internal saat mengimpor data.',
            ], 500);
        } finally {
            fclose($handle);
        }
    }

    private function validateRealisasi(
        array $input,
        ?array $current = null
    ): array {
        $allowed = [
            'resort_id',
            'tahun',
            'triwulan',
            'kode_kegiatan',
            'nama_kegiatan',
            'pagu_anggaran',
            'nilai_realisasi',
        ];

        foreach (array_keys($input) as $field) {
            if (!in_array($field, $allowed, true)) {
                return [
                    'error' => "Field tidak diizinkan: {$field}",
                ];
            }
        }

        $data = $current === null
            ? $input
            : array_merge($current, $input);

        foreach ($allowed as $field) {
            if (
                !array_key_exists($field, $data) ||
                $data[$field] === null
            ) {
                return [
                    'error' => "Field {$field} wajib diisi.",
                ];
            }
        }

        foreach (['resort_id', 'tahun', 'triwulan'] as $field) {
            $value = $data[$field];

            if (
                !is_int($value) &&
                !(
                    $current !== null &&
                    !array_key_exists($field, $input) &&
                    is_string($value) &&
                    ctype_digit($value)
                )
            ) {
                return [
                    'error' => "{$field} harus berupa integer JSON.",
                ];
            }

            $data[$field] = (int) $value;
        }

        if (
            $data['resort_id'] < 1 ||
            $data['tahun'] < 2000 ||
            $data['tahun'] > 2100 ||
            !in_array($data['triwulan'], [1, 2, 3, 4], true)
        ) {
            return [
                'error' => 'Resort, tahun, atau triwulan tidak valid.',
            ];
        }

        foreach (['kode_kegiatan', 'nama_kegiatan'] as $field) {
            if (!is_string($data[$field])) {
                return [
                    'error' => "{$field} harus berupa teks.",
                ];
            }

            $data[$field] = trim($data[$field]);
        }

        if (
            mb_strlen($data['kode_kegiatan']) < 1 ||
            mb_strlen($data['kode_kegiatan']) > 50 ||
            mb_strlen($data['nama_kegiatan']) < 3 ||
            mb_strlen($data['nama_kegiatan']) > 200
        ) {
            return [
                'error' => 'Kode atau nama kegiatan tidak valid.',
            ];
        }

        foreach (['pagu_anggaran', 'nilai_realisasi'] as $field) {
            $value = $data[$field];

            if (
                !(
                    is_int($value) ||
                    is_float($value) ||
                    (is_string($value) && is_numeric($value))
                ) ||
                !preg_match(
                    '/^\d{1,16}(\.\d{1,2})?$/',
                    (string) $value
                )
            ) {
                return [
                    'error' => "{$field} harus angka nonnegatif dengan maksimal 2 desimal.",
                ];
            }

            $data[$field] = (string) $value;
        }

        if (!(new ResortModel())->find($data['resort_id'])) {
            return [
                'error' => 'Resort tidak ditemukan.',
            ];
        }

        $duplicate = $this->realisasi
            ->where('resort_id', $data['resort_id'])
            ->where('tahun', $data['tahun'])
            ->where('triwulan', $data['triwulan'])
            ->where('kode_kegiatan', $data['kode_kegiatan']);

        if ($current !== null) {
            $duplicate->where('id !=', $current['id']);
        }

        if ($duplicate->first()) {
            return [
                'error' => 'Realisasi kegiatan pada triwulan tersebut sudah ada.',
                'code' => 409,
            ];
        }

        return [
            'data' => array_intersect_key(
                $data,
                array_flip($allowed)
            ),
        ];
    }
}
