<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ResortModel;
use CodeIgniter\API\ResponseTrait;

class ResortController extends BaseController
{
    use ResponseTrait;

    private ResortModel $resorts;

    public function __construct()
    {
        $this->resorts = new ResortModel();
    }

    // ==========================================
    // GET ALL RESORT
    // ==========================================

    public function index()
    {
        $search = trim(
            (string) $this->request->getGet('search')
        );

        $status = $this->request->getGet('status');

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
            $this->resorts
                ->groupStart()
                ->like('nama', $search)
                ->orLike('kode', $search)
                ->groupEnd();
        }

        if ($status !== null) {
            $this->resorts->where(
                'status',
                (int) $status
            );
        }

        return $this->respond([
            'status' => true,
            'message' => 'Daftar resort berhasil diambil.',
            'data' => $this->resorts
                ->orderBy('nama', 'ASC')
                ->findAll(),
        ]);
    }

    // ==========================================
    // GET DETAIL RESORT
    // ==========================================

    public function show($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID resort tidak valid.',
            ], 400);
        }

        $resort = $this->resorts->find($id);

        if (!$resort) {
            return $this->respond([
                'status' => false,
                'message' => 'Resort tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Detail resort berhasil diambil.',
            'data' => $resort,
        ]);
    }

    // ==========================================
    // CREATE RESORT - ADMIN
    // ==========================================

    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body harus berupa JSON object.',
            ], 400);
        }

        $nama = $data['nama'] ?? null;
        $kode = $data['kode'] ?? null;

        if (!is_string($nama) || !is_string($kode)) {
            return $this->respond([
                'status' => false,
                'message' => 'Nama dan kode harus berupa teks.',
            ], 422);
        }

        $nama = trim($nama);
        $kode = strtoupper(trim($kode));

        if (
            $nama === '' ||
            strlen($nama) > 100 ||
            !preg_match('/^[A-Z0-9_-]{1,20}$/', $kode)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Nama wajib 1-100 karakter dan kode 1-20 karakter.',
            ], 422);
        }

        $duplicate = $this->resorts
            ->where('kode', $kode)
            ->first();

        if ($duplicate) {
            return $this->respond([
                'status' => false,
                'message' => 'Kode resort sudah digunakan.',
            ], 409);
        }

        $id = $this->resorts->insert([
            'nama' => $nama,
            'kode' => $kode,
            'status' => 1,
        ], true);

        if (!$id) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menambah resort.',
            ], 500);
        }

        return $this->respondCreated([
            'status' => true,
            'message' => 'Resort berhasil ditambahkan.',
            'data' => $this->resorts->find($id),
        ]);
    }

    // ==========================================
    // UPDATE RESORT - ADMIN
    // ==========================================

    public function update($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status' => false,
                'message' => 'ID resort tidak valid.',
            ], 400);
        }

        $current = $this->resorts->find($id);

        if (!$current) {
            return $this->respond([
                'status' => false,
                'message' => 'Resort tidak ditemukan.',
            ], 404);
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data) || $data === []) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid atau kosong.',
            ], 400);
        }

        $update = [];

        // Validasi nama
        if (array_key_exists('nama', $data)) {
            if (
                !is_string($data['nama']) ||
                trim($data['nama']) === '' ||
                strlen(trim($data['nama'])) > 100
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nama resort tidak valid.',
                ], 422);
            }

            $update['nama'] = trim($data['nama']);
        }

        // Validasi kode
        if (array_key_exists('kode', $data)) {
            if (!is_string($data['kode'])) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Kode resort harus berupa teks.',
                ], 422);
            }

            $kode = strtoupper(trim($data['kode']));

            if (!preg_match('/^[A-Z0-9_-]{1,20}$/', $kode)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Format kode tidak valid.',
                ], 422);
            }

            $duplicate = $this->resorts
                ->where('kode', $kode)
                ->where('id !=', $id)
                ->first();

            if ($duplicate) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Kode resort sudah digunakan.',
                ], 409);
            }

            $update['kode'] = $kode;
        }

        // Aktif/nonaktif resort
        if (array_key_exists('status', $data)) {
            if (!in_array($data['status'], [0, 1], true)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Status harus angka 0 atau 1.',
                ], 422);
            }

            // Hindari nonaktifkan resort yang masih
            // memiliki pegawai.
            if ($data['status'] === 0) {
                $jumlahPegawai = db_connect()
                    ->table('users')
                    ->where('resort_id', $id)
                    ->countAllResults();

                if ($jumlahPegawai > 0) {
                    return $this->respond([
                        'status' => false,
                        'message' =>
                            'Resort masih memiliki pegawai. Pindahkan pegawai terlebih dahulu.',
                    ], 409);
                }
            }

            $update['status'] = $data['status'];
        }

        if ($update === []) {
            return $this->respond([
                'status' => false,
                'message' => 'Tidak ada data yang diperbarui.',
            ], 422);
        }

        if (!$this->resorts->update($id, $update)) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal memperbarui resort.',
            ], 500);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Resort berhasil diperbarui.',
            'data' => $this->resorts->find($id),
        ]);
    }
}
