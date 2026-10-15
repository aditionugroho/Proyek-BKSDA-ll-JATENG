<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ResortModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class UserResortController extends BaseController
{
    use ResponseTrait;

    // ==========================================
    // GET PENEMPATAN RESORT PENGGUNA
    // ==========================================

    public function show($id = null)
    {
        if (!ctype_digit((string) $id) || (int) $id < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'ID pengguna tidak valid.',
            ], 400);
        }

        $users = new UserModel();

        $user = $users
            ->select('id, name, username, role, jabatan, resort_id')
            ->find((int) $id);

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $resort = null;

        if ($user['resort_id'] !== null) {
            $resort = (new ResortModel())
                ->find((int) $user['resort_id']);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Penempatan resort pengguna berhasil diambil.',
            'data' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'username' => $user['username'],
                'role' => $user['role'],
                'jabatan' => $user['jabatan'],
                'resort_id' => $user['resort_id'] === null
                    ? null
                    : (int) $user['resort_id'],
                'resort' => $resort === null ? null : [
                    'id' => (int) $resort['id'],
                    'nama' => $resort['nama'],
                    'kode' => $resort['kode'],
                ],
            ],
        ]);
    }

    // ==========================================
    // UPDATE PENEMPATAN RESORT - ADMIN
    // ==========================================

    public function update($id = null)
    {
        if (!ctype_digit((string) $id) || (int) $id < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'ID pengguna tidak valid.',
            ], 400);
        }

        $users = new UserModel();

        $user = $users->find((int) $id);

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data) || !array_key_exists('resort_id', $data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Field resort_id wajib dikirim melalui JSON.',
            ], 422);
        }

        // Resort ID harus berupa integer positif
        if (!is_int($data['resort_id']) || $data['resort_id'] < 1) {
            return $this->respond([
                'status' => false,
                'message' => 'resort_id harus berupa angka ID resort yang valid.',
            ], 422);
        }

        $resortId = $data['resort_id'];

        // Pastikan resort tersedia dan aktif
        $resort = (new ResortModel())->find($resortId);

        if (!$resort || (int) $resort['status'] !== 1) {
            return $this->respond([
                'status' => false,
                'message' => 'Resort tidak ditemukan atau tidak aktif.',
            ], 422);
        }

        // Simpan resort_id pada pengguna
        if (!$users->update((int) $id, [
            'resort_id' => $resortId,
        ])) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menempatkan pengguna ke resort.',
            ], 500);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Penempatan resort pengguna berhasil diperbarui.',
            'data' => [
                'user_id' => (int) $id,
                'resort_id' => (int) $resort['id'],
                'resort_nama' => $resort['nama'],
                'resort_kode' => $resort['kode'],
            ],
        ]);
    }
}
