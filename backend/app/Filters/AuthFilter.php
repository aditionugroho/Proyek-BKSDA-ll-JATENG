<?php

namespace App\Filters;

use App\Models\AuthTokenModel;
use App\Models\LoginLogModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\UserModel;

class AuthFilter implements FilterInterface
{
    public function before(
        RequestInterface $request,
        $arguments = null
    ) {
        /*
         * ==============================
         * AMBIL AUTHORIZATION HEADER
         * ==============================
         */

        $authHeader = $request
            ->getHeaderLine('Authorization');

        if (
            !$authHeader ||
            !preg_match(
                '/^Bearer\s+(\S+)$/i',
                $authHeader,
                $matches
            )
        ) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'status'  => false,
                    'message' => 'Token autentikasi tidak ditemukan.',
                ]);
        }

        /*
         * ==============================
         * HASH TOKEN
         * ==============================
         */

        $plainToken = $matches[1];

        $tokenHash = hash(
            'sha256',
            $plainToken
        );

        $tokenModel = new AuthTokenModel();

        /*
         * ==============================
         * CARI TOKEN
         * ==============================
         */

        $token = $tokenModel
            ->where('token_hash', $tokenHash)
            ->where('revoked_at', null)
            ->first();

        if (!$token) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'status'  => false,
                    'message' => 'Token tidak valid.',
                ]);
        }

        $now = time();

        /*
         * ==============================
         * CEK ABSOLUTE EXPIRY
         * ==============================
         */

        if (
            empty($token['expires_at']) ||
            strtotime($token['expires_at']) <= $now
        ) {
            $tokenModel->update(
                $token['id'],
                [
                    'revoked_at' => date('Y-m-d H:i:s'),
                ]
            );

            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'status'  => false,
                    'message' => 'Token sudah kedaluwarsa.',
                ]);
        }

        /*
         * ==============================
         * IDLE TIMEOUT 30 MENIT
         * ==============================
         */

        if (!empty($token['last_used_at'])) {

            $lastUsedTime = strtotime(
                $token['last_used_at']
            );

            $idleSeconds =
                $now - $lastUsedTime;

            if ($idleSeconds > 1800) {

                /*
                 * 1800 detik = 30 menit
                 */

                $tokenModel->update(
                    $token['id'],
                    [
                        'revoked_at' => date(
                            'Y-m-d H:i:s'
                        ),
                    ]
                );

                return service('response')
                    ->setStatusCode(401)
                    ->setJSON([
                        'status'  => false,
                        'message' => 'Sesi berakhir karena tidak aktif selama 30 menit.',
                    ]);
            }
        }

        // Pastikan pengguna masih aktif.
$user = (new UserModel())
    ->where('id', $token['user_id'])
    ->where('status', 1)
    ->first();

if (!$user) {
    return service('response')
        ->setStatusCode(401)
        ->setJSON([
            'status' => false,
            'message' => 'Akun tidak ditemukan atau sudah tidak aktif.',
        ]);
}

        /*
         * ==============================
         * UPDATE LAST USED
         * ==============================
         */

        $tokenModel->update(
            $token['id'],
            [
                'last_used_at' => date(
                    'Y-m-d H:i:s'
                ),
            ]
        );

        /*
         * ==============================
         * RETENSI TOKEN & LOG LOGIN
         * ==============================
         *
         * Dijalankan pada sebagian kecil request:
         * token kedaluwarsa/dicabut > 30 hari dan
         * log login > 90 hari dihapus agar tabel
         * tidak tumbuh tanpa batas.
         */

        if (random_int(1, 100) === 1) {
            $tokenCutoff =
                date('Y-m-d H:i:s', $now - 30 * 86400);

            $tokenModel
                ->where('expires_at <', $tokenCutoff)
                ->delete();

            $tokenModel
                ->where('revoked_at <', $tokenCutoff)
                ->delete();

            (new LoginLogModel())
                ->where(
                    'login_at <',
                    date('Y-m-d H:i:s', $now - 90 * 86400)
                )
                ->delete();
        }

        /*
         * Request boleh lanjut ke controller.
         */

        return null;
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
        return null;
    }
}