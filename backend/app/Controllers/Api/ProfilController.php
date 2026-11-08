<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class ProfilController extends BaseController
{
    use ResponseTrait;

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

        if (!$token ||
            empty($token['expires_at']) ||
            strtotime($token['expires_at']) <= time() ||
            (!empty($token['last_used_at']) &&
             time() - strtotime($token['last_used_at']) > 1800)
        ) {
            return null;
        }

        return (new UserModel())
            ->where('id', $token['user_id'])
            ->where('status', 1)
            ->first();
    }

    private function safeProfile(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'nama' => $user['name'],
            'username' => $user['username'],
            'email' => $user['email'] ?? '',
            'telepon' => $user['no_whatsapp'] ?? '',
            'jabatan' => $user['jabatan'] ?? '',
            'role' => $user['role'],
            'resort_id' => $user['resort_id'] ?? null,
            'status' => (int) $user['status'],
            'nip' => null,
            'unit' => null,
        ];
    }

    public function show()
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->failUnauthorized('Sesi tidak valid.');
        }

        return $this->respond([
            'status' => true,
            'message' => 'Profil berhasil diambil.',
            'data' => $this->safeProfile($user),
        ]);
    }

    public function update()
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->failUnauthorized('Sesi tidak valid.');
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data) || !$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Data perubahan wajib diisi.',
            ], 422);
        }

        $allowed = ['nama', 'email', 'telepon'];

        foreach (array_keys($data) as $key) {
            if (!in_array($key, $allowed, true)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Field tidak boleh diubah: ' . $key,
                ], 422);
            }
        }

        $changes = [];
        $model = new UserModel();

        if (array_key_exists('nama', $data)) {
            if (!is_string($data['nama'])) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nama harus berupa teks.',
                ], 422);
            }

            $name = trim($data['nama']);

            if ($name === '' || mb_strlen($name) > 150) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nama harus diisi dan maksimal 150 karakter.',
                ], 422);
            }

            $changes['name'] = $name;
        }

        if (array_key_exists('email', $data)) {
            if (!is_string($data['email'])) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Email harus berupa teks.',
                ], 422);
            }

            $email = strtolower(trim($data['email']));

            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Format email tidak valid.',
                ], 422);
            }

            if (strlen($email) > 254) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Email terlalu panjang.',
                ], 422);
            }

            if ($email !== '') {
                $existing = (new UserModel())
                    ->where('email', $email)
                    ->where('id !=', $user['id'])
                    ->first();

                if ($existing) {
                    return $this->respond([
                        'status' => false,
                        'message' => 'Email sudah digunakan.',
                    ], 409);
                }
            }

            $changes['email'] = $email !== '' ? $email : null;
        }

        if (array_key_exists('telepon', $data)) {
            if (!is_string($data['telepon'])) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nomor telepon harus berupa teks.',
                ], 422);
            }

            $phone = trim($data['telepon']);

            if (strlen($phone) > 30 ||
                ($phone !== '' && !preg_match('/^\+?[0-9 ()-]{7,30}$/', $phone))
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Nomor telepon tidak valid.',
                ], 422);
            }

            if ($phone !== '') {
                $existing = (new UserModel())
                    ->where('no_whatsapp', $phone)
                    ->where('id !=', $user['id'])
                    ->first();

                if ($existing) {
                    return $this->respond([
                        'status' => false,
                        'message' => 'Nomor telepon sudah digunakan.',
                    ], 409);
                }
            }

            $changes['no_whatsapp'] = $phone !== '' ? $phone : null;
        }

        if (!$changes) {
            return $this->respond([
                'status' => false,
                'message' => 'Tidak ada perubahan.',
            ], 422);
        }

        if (!$model->update($user['id'], $changes)) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal memperbarui profil.',
            ], 500);
        }

        $updated = (new UserModel())->find($user['id']);

        return $this->respond([
            'status' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $this->safeProfile($updated),
        ]);
    }

    public function changePassword()
    {
        $user = $this->currentUser();

        if (!$user) {
            return $this->failUnauthorized('Sesi tidak valid.');
        }

        $key = 'profile-password-' .
            hash('sha256', (string) $user['id'] . ':' .
                $this->request->getIPAddress());

        if (!service('throttler')->check($key, 5, 900)) {
            return $this->respond([
                'status' => false,
                'message' => 'Terlalu banyak percobaan. Coba lagi nanti.',
            ], 429);
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Format request harus JSON.',
            ], 400);
        }

        $old = $data['kata_sandi_lama'] ?? null;
        $new = $data['kata_sandi_baru'] ?? null;

        if (!is_string($old) || !is_string($new) ||
            strlen($new) < 8 || strlen($new) > 128) {
            return $this->respond([
                'status' => false,
                'message' => 'Password baru harus 8?128 karakter.',
            ], 422);
        }

        if (!password_verify($old, $user['password'])) {
            return $this->respond([
                'status' => false,
                'message' => 'Password lama tidak sesuai.',
            ], 422);
        }

        if (password_verify($new, $user['password'])) {
            return $this->respond([
                'status' => false,
                'message' => 'Password baru harus berbeda.',
            ], 422);
        }

        $model = new UserModel();

        if (!$model->update($user['id'], [
            'password' => password_hash($new, PASSWORD_BCRYPT),
        ])) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal mengubah password.',
            ], 500);
        }

        // Cabut seluruh token, termasuk token sesi saat ini.
        $tokenModel = new AuthTokenModel();
        $tokens = $tokenModel
            ->where('user_id', $user['id'])
            ->where('revoked_at', null)
            ->findAll();

        foreach ($tokens as $token) {
            $tokenModel->update($token['id'], [
                'revoked_at' => date('Y-m-d H:i:s'),
            ]);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Password berhasil diubah. Silakan login kembali.',
        ]);
    }
}
