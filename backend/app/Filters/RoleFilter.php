<?php

namespace App\Filters;

use App\Models\AuthTokenModel;
use App\Models\UserModel;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class RoleFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (
            !$authHeader ||
            !preg_match('/^Bearer\s+(\S+)$/i', $authHeader, $matches)
        ) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'status'  => false,
                    'message' => 'Token autentikasi tidak ditemukan.',
                ]);
        }

        $plainToken = $matches[1];

        $tokenHash = hash(
            'sha256',
            $plainToken
        );

        $tokenModel = new AuthTokenModel();

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
        |--------------------------------------------------------------------------
        | CEK TOKEN EXPIRED
        |--------------------------------------------------------------------------
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
        |--------------------------------------------------------------------------
        | IDLE TIMEOUT 30 MENIT
        |--------------------------------------------------------------------------
        */

        if (!empty($token['last_used_at'])) {
            $lastUsed = strtotime($token['last_used_at']);

            if (($now - $lastUsed) > 1800) {
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
                        'message' => 'Sesi berakhir karena tidak aktif selama 30 menit.',
                    ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | AMBIL USER
        |--------------------------------------------------------------------------
        */

        $userModel = new UserModel();

        $user = $userModel
            ->where('id', $token['user_id'])
            ->where('status', 1)
            ->first();

        if (!$user) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON([
                    'status'  => false,
                    'message' => 'Akun tidak ditemukan atau sudah tidak aktif.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | CEK ROLE
        |--------------------------------------------------------------------------
        */

        if (
            !empty($arguments) &&
            !in_array($user['role'], $arguments, true)
        ) {
            return service('response')
                ->setStatusCode(403)
                ->setJSON([
                    'status'  => false,
                    'message' => 'Anda tidak memiliki akses ke fitur ini.',
                ]);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE LAST USED
        |--------------------------------------------------------------------------
        */

        $tokenModel->update(
            $token['id'],
            [
                'last_used_at' => date('Y-m-d H:i:s'),
            ]
        );

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