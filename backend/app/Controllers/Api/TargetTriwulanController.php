<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\ResortModel;
use App\Models\TargetTriwulanModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class TargetTriwulanController extends BaseController
{
    use ResponseTrait;

    private TargetTriwulanModel $target;

    public function __construct()
    {
        $this->target = new TargetTriwulanModel();
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

    private function authorizedUser(bool $write = false): array
    {
        $user = $this->authenticatedUser();

        if (!$user) {
            return ['error' => 'Pengguna tidak terautentikasi.', 'code' => 401];
        }

        $allowed = $write
            ? ['admin', 'kepala_seksi']
            : ['admin', 'kepala_seksi', 'staf'];

        if (!in_array($user['role'], $allowed, true)) {
            return ['error' => 'Akses ditolak.', 'code' => 403];
        }

        if ($user['role'] === 'staf' && empty($user['resort_id'])) {
            return ['error' => 'Akun belum memiliki resort.', 'code' => 403];
        }

        return ['user' => $user];
    }

    public function index()
    {
        $auth = $this->authorizedUser();

        if (isset($auth['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $auth['error'],
            ], $auth['code']);
        }

        $user = $auth['user'];

        $resortId = $this->request->getGet('resort_id');
        $tahun = $this->request->getGet('tahun');
        $triwulan = $this->request->getGet('triwulan');

        if (
            $resortId !== null &&
            (!ctype_digit((string) $resortId) || (int) $resortId < 1)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Filter resort_id tidak valid.',
            ], 422);
        }

        if (
            $tahun !== null &&
            (
                !ctype_digit((string) $tahun) ||
                (int) $tahun < 2000 ||
                (int) $tahun > 2100
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Filter tahun tidak valid.',
            ], 422);
        }

        if (
            $triwulan !== null &&
            !in_array((string) $triwulan, ['1', '2', '3', '4'], true)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Filter triwulan harus 1 sampai 4.',
            ], 422);
        }

        if ($user['role'] === 'staf') {
            // Selalu gunakan resort dari akun, bukan parameter URL.
            $this->target->where('resort_id', (int) $user['resort_id']);
        } elseif ($resortId !== null) {
            $this->target->where('resort_id', (int) $resortId);
        }

        if ($tahun !== null) {
            $this->target->where('tahun', (int) $tahun);
        }

        if ($triwulan !== null) {
            $this->target->where('triwulan', (int) $triwulan);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Daftar target triwulan berhasil diambil.',
            'data' => $this->target
                ->orderBy('tahun', 'DESC')
                ->orderBy('triwulan', 'ASC')
                ->findAll(),
        ]);
    }

    public function show($id = null)
    {
        $auth = $this->authorizedUser();

        if (isset($auth['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $auth['error'],
            ], $auth['code']);
        }

        if (!ctype_digit((string) $id) || (int) $id < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'ID target tidak valid.',
            ], 400);
        }

        $user = $auth['user'];

        $query = $this->target->where('id', (int) $id);

        if ($user['role'] === 'staf') {
            $query->where('resort_id', (int) $user['resort_id']);
        }

        $target = $query->first();

        if (!$target) {
            return $this->respond([
                'status' => false,
                'message' => 'Target tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Detail target berhasil diambil.',
            'data' => $target,
        ]);
    }

    public function create()
    {
        $auth = $this->authorizedUser(true);

        if (isset($auth['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $auth['error'],
            ], $auth['code']);
        }

        $input = $this->request->getJSON(true);

        if (!is_array($input) || $input === [] || array_is_list($input)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body harus berupa JSON object.',
            ], 400);
        }

        $validated = $this->validateTarget($input);

        if (isset($validated['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $validated['error'],
            ], $validated['code'] ?? 422);
        }

        $id = $this->target->insert($validated['data'], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menambahkan target.',
                'errors' => $this->target->errors(),
            ], 422);
        }

        return $this->respondCreated([
            'status' => true,
            'message' => 'Target berhasil ditambahkan.',
            'data' => $this->target->find($id),
        ]);
    }

    public function update($id = null)
    {
        $auth = $this->authorizedUser(true);

        if (isset($auth['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $auth['error'],
            ], $auth['code']);
        }

        if (!ctype_digit((string) $id) || (int) $id < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'ID target tidak valid.',
            ], 400);
        }

        $current = $this->target->find((int) $id);

        if (!$current) {
            return $this->respond([
                'status' => false,
                'message' => 'Target tidak ditemukan.',
            ], 404);
        }

        $input = $this->request->getJSON(true);

        if (!is_array($input) || $input === [] || array_is_list($input)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body harus berupa JSON object.',
            ], 400);
        }

        $validated = $this->validateTarget($input, $current);

        if (isset($validated['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $validated['error'],
            ], $validated['code'] ?? 422);
        }

        if (!$this->target->update((int) $id, $validated['data'])) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal memperbarui target.',
                'errors' => $this->target->errors(),
            ], 422);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Target berhasil diperbarui.',
            'data' => $this->target->find((int) $id),
        ]);
    }

    private function validateTarget(
        array $input,
        ?array $current = null
    ): array {
        $allowed = [
            'resort_id',
            'indikator',
            'tahun',
            'triwulan',
            'nilai_target',
            'satuan',
        ];

        foreach (array_keys($input) as $key) {
            if (!in_array($key, $allowed, true)) {
                return ['error' => 'Field tidak diizinkan: ' . $key];
            }
        }

        $data = $current === null
            ? $input
            : array_merge($current, $input);

        foreach ($allowed as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === null) {
                return ['error' => "Field {$field} wajib diisi."];
            }
        }

        foreach (['resort_id', 'tahun', 'triwulan'] as $field) {
            $value = $data[$field];

            // Data lama dari MySQL bisa berupa string angka.
            $isExistingDbValue = $current !== null &&
                !array_key_exists($field, $input) &&
                is_string($value) &&
                ctype_digit($value);

            if (!is_int($value) && !$isExistingDbValue) {
                return ['error' => "{$field} harus berupa integer JSON."];
            }

            $data[$field] = (int) $value;
        }

        if (
            $data['resort_id'] < 1 ||
            $data['tahun'] < 2000 ||
            $data['tahun'] > 2100 ||
            !in_array($data['triwulan'], [1, 2, 3, 4], true)
        ) {
            return ['error' => 'Resort, tahun, atau triwulan tidak valid.'];
        }

        if (
            !is_string($data['indikator']) ||
            !is_string($data['satuan'])
        ) {
            return ['error' => 'Indikator dan satuan harus berupa teks.'];
        }

        $data['indikator'] = trim($data['indikator']);
        $data['satuan'] = trim($data['satuan']);

        if (
            mb_strlen($data['indikator']) < 3 ||
            mb_strlen($data['indikator']) > 150 ||
            mb_strlen($data['satuan']) < 1 ||
            mb_strlen($data['satuan']) > 30
        ) {
            return ['error' => 'Panjang indikator atau satuan tidak valid.'];
        }

        $nilai = $data['nilai_target'];

        if (
            !(is_int($nilai) || is_float($nilai) ||
              (is_string($nilai) && is_numeric($nilai))) ||
            !preg_match('/^\d{1,13}(\.\d{1,2})?$/', (string) $nilai)
        ) {
            return [
                'error' => 'Nilai target harus angka nonnegatif dengan maksimal 2 desimal.',
            ];
        }

        $data['nilai_target'] = (string) $nilai;

        if (!(new ResortModel())->find($data['resort_id'])) {
            return ['error' => 'Resort tidak ditemukan.'];
        }

        $duplicate = $this->target
            ->where('resort_id', $data['resort_id'])
            ->where('indikator', $data['indikator'])
            ->where('tahun', $data['tahun'])
            ->where('triwulan', $data['triwulan']);

        if ($current !== null) {
            $duplicate->where('id !=', $current['id']);
        }

        if ($duplicate->first()) {
            return [
                'error' => 'Target untuk kombinasi tersebut sudah ada.',
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
