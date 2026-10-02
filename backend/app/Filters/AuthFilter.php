<?php

namespace App\Filters;

use App\Models\AuthTokenModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

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