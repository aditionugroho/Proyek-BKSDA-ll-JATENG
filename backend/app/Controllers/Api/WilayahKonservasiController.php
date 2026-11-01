<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ResortModel;
use App\Models\WilayahKonservasiModel;
use CodeIgniter\API\ResponseTrait;
use App\Models\AuthTokenModel;
use App\Models\UserModel;

class WilayahKonservasiController extends BaseController
{
    use ResponseTrait;

    private WilayahKonservasiModel $wilayah;
    private ResortModel $resorts;

    public function __construct()
    {
        $this->wilayah = new WilayahKonservasiModel();
        $this->resorts = new ResortModel();
    }

    // ==========================================
    // GET ALL WILAYAH KONSERVASI
    // ==========================================

    private function getAuthenticatedUser(): ?array
{
    $authHeader = $this->request->getHeaderLine('Authorization');

    if (!preg_match('/^Bearer\s+(\S+)$/i', $authHeader, $matches)) {
        return null;
    }

    $tokenHash = hash('sha256', $matches[1]);

    $token = (new AuthTokenModel())
        ->where('token_hash', $tokenHash)
        ->where('revoked_at', null)
        ->first();

    if (
        !$token ||
        empty($token['expires_at']) ||
        strtotime($token['expires_at']) <= time()
    ) {
        return null;
    }

    return (new UserModel())
        ->where('id', $token['user_id'])
        ->where('status', 1)
        ->first();
}

    public function index()
    {
        $user = $this->getAuthenticatedUser();

if (!$user) {
    return $this->respond([
        'status' => false,
        'message' => 'Pengguna tidak terautentikasi.',
    ], 401);
}

$isStaf = $user['role'] === 'staf';

if ($isStaf && empty($user['resort_id'])) {
    return $this->respond([
        'status' => false,
        'message' => 'Akun belum memiliki resort.',
    ], 403);
}
        $search = trim((string) $this->request->getGet('search'));
        $resortId = $this->request->getGet('resort_id');
        $status = $this->request->getGet('status');

        if (
            $resortId !== null &&
            (
                !ctype_digit((string) $resortId) ||
                (int) $resortId < 1
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Filter resort_id tidak valid.',
            ], 422);
        }

        if (
            $status !== null &&
            !in_array((string) $status, ['0', '1'], true)
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Filter status harus 0 atau 1.',
            ], 422);
        }

        if ($search !== '') {
            $this->wilayah
                ->groupStart()
                ->like('nama', $search)
                ->orLike('kode', $search)
                ->groupEnd();
        }

        if ($isStaf) {
    // Resort Staf ditentukan dari database, bukan URL.
    $this->wilayah->where(
        'resort_id',
        (int) $user['resort_id']
    );
} elseif ($resortId !== null) {
    // Admin dan Kepala Seksi dapat memfilter resort.
    $this->wilayah->where(
        'resort_id',
        (int) $resortId
    );
}

        if ($status !== null) {
            $this->wilayah->where(
                'status',
                (int) $status
            );
        }

        $data = $this->wilayah
            ->orderBy('nama', 'ASC')
            ->findAll();

        return $this->respond([
            'status' => true,
            'message' => 'Daftar wilayah konservasi berhasil diambil.',
            'data' => $data,
        ]);
    }

    // ==========================================
    // GET DETAIL WILAYAH
    // ==========================================

    public function show($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id) ||
            (int) $id < 1
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'ID wilayah tidak valid.',
            ], 400);
        }

        $wilayah = $this->wilayah->find($id);

        if (!$wilayah) {
            return $this->respond([
                'status' => false,
                'message' => 'Wilayah konservasi tidak ditemukan.',
            ], 404);
        }


        $user = $this->getAuthenticatedUser();

if (!$user) {
    return $this->respond([
        'status' => false,
        'message' => 'Pengguna tidak terautentikasi.',
    ], 401);
}

if (
    $user['role'] === 'staf' &&
    (
        empty($user['resort_id']) ||
        (int) $wilayah['resort_id'] !== (int) $user['resort_id']
    )
) {
    return $this->respond([
        'status' => false,
        'message' => 'Wilayah konservasi tidak ditemukan.',
    ], 404);
}


        return $this->respond([
            'status' => true,
            'message' => 'Detail wilayah konservasi berhasil diambil.',
            'data' => $wilayah,
        ]);
    }

    // ==========================================
    // CREATE WILAYAH - ADMIN
    // ==========================================

    public function create()
    {
        $input = $this->request->getJSON(true);

        if (!is_array($input) || $input === [] || array_is_list($input)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body harus berupa JSON object.',
            ], 400);
        }

        $result = $this->validateWilayah($input);

        if (isset($result['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $result['error'],
            ], $result['code'] ?? 422);
        }

        $id = $this->wilayah->insert(
            $result['data'],
            true
        );

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menambahkan wilayah konservasi.',
                'errors' => $this->wilayah->errors(),
            ], 422);
        }

        return $this->respondCreated([
            'status' => true,
            'message' => 'Wilayah konservasi berhasil ditambahkan.',
            'data' => $this->wilayah->find($id),
        ]);
    }

    // ==========================================
    // UPDATE WILAYAH - ADMIN
    // ==========================================

    public function update($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id) ||
            (int) $id < 1
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'ID wilayah tidak valid.',
            ], 400);
        }

        $current = $this->wilayah->find($id);

        if (!$current) {
            return $this->respond([
                'status' => false,
                'message' => 'Wilayah konservasi tidak ditemukan.',
            ], 404);
        }

        $input = $this->request->getJSON(true);

        if (!is_array($input) || $input === [] || array_is_list($input)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid atau kosong.',
            ], 400);
        }

        $result = $this->validateWilayah(
            $input,
            $current
        );

        if (isset($result['error'])) {
            return $this->respond([
                'status' => false,
                'message' => $result['error'],
            ], $result['code'] ?? 422);
        }

        // PATCH parsial:
        // Gabungkan data lama dan data baru agar semua
        // field required pada Model tetap tersedia.
        $updateData = [
            'nama' => $result['data']['nama'],
            'kode' => $result['data']['kode'],
            'resort_id' => $result['data']['resort_id'],
            'status' => $result['data']['status'],
        ];

        if (!$this->wilayah->update($id, $updateData)) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal memperbarui wilayah konservasi.',
                'errors' => $this->wilayah->errors(),
            ], 422);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Wilayah konservasi berhasil diperbarui.',
            'data' => $this->wilayah->find($id),
        ]);
    }

    // ==========================================
    // VALIDASI DATA WILAYAH
    // ==========================================

    private function validateWilayah(
        array $input,
        ?array $current = null
    ): array {
        $allowedFields = [
            'nama',
            'kode',
            'resort_id',
            'status',
        ];

        // Tolak field yang tidak diizinkan.
        foreach (array_keys($input) as $key) {
            if (!in_array($key, $allowedFields, true)) {
                return [
                    'error' => 'Field tidak diizinkan: ' . $key,
                ];
            }
        }

        // Gabungkan data lama dengan perubahan baru.
        $data = $current !== null
            ? array_merge($current, $input)
            : $input;

        if (
            !isset(
                $data['nama'],
                $data['kode'],
                $data['resort_id']
            ) ||
            !is_string($data['nama']) ||
            !is_string($data['kode'])
        ) {
            return [
                'error' => 'Nama, kode, dan resort_id wajib diisi.',
            ];
        }

        $nama = trim($data['nama']);
        $kode = strtoupper(trim($data['kode']));
        $resortId = $data['resort_id'];

        // Validasi nama.
        if (
            mb_strlen($nama) < 3 ||
            mb_strlen($nama) > 150
        ) {
            return [
                'error' => 'Nama wilayah harus 3-150 karakter.',
            ];
        }

        // Validasi kode wilayah.
        if (!preg_match('/^[A-Z0-9_-]{1,30}$/', $kode)) {
            return [
                'error' => 'Format kode wilayah tidak valid.',
            ];
        }

        // Data dari MySQL dapat berupa string angka.
        // Request baru wajib integer JSON.
        if (
            (!is_int($resortId) &&
                !(
                    $current !== null &&
                    !array_key_exists('resort_id', $input) &&
                    is_string($resortId) &&
                    ctype_digit($resortId)
                )
            ) ||
            (int) $resortId < 1
        ) {
            return [
                'error' => 'resort_id harus bilangan bulat positif.',
            ];
        }

        $resortId = (int) $resortId;

        // Status dari DB juga dapat berupa string "0"/"1".
        $status = $data['status'] ?? 1;

        if (
            $current !== null &&
            !array_key_exists('status', $input) &&
            is_string($status) &&
            in_array($status, ['0', '1'], true)
        ) {
            $status = (int) $status;
        }

        if (!in_array($status, [0, 1], true)) {
            return [
                'error' => 'Status harus angka 0 atau 1.',
            ];
        }

        // Pastikan resort induk benar-benar ada.
        $resort = $this->resorts->find($resortId);

        if (!$resort) {
            return [
                'error' => 'Resort tidak ditemukan.',
            ];
        }

        // Cek kode unik.
        $duplicateQuery = $this->wilayah
            ->where('kode', $kode);

        if ($current !== null) {
            $duplicateQuery->where(
                'id !=',
                $current['id']
            );
        }

        if ($duplicateQuery->first()) {
            return [
                'error' => 'Kode wilayah sudah digunakan.',
                'code' => 409,
            ];
        }

        return [
            'data' => [
                'nama' => $nama,
                'kode' => $kode,
                'resort_id' => $resortId,
                'status' => $status,
            ],
        ];
    }
}
