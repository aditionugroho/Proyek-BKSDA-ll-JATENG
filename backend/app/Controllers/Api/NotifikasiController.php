<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\NotifikasiModel;
use CodeIgniter\API\ResponseTrait;

class NotifikasiController extends BaseController
{
    use ResponseTrait;

    protected NotifikasiModel $notifikasiModel;
    protected AuthTokenModel $authTokenModel;

    public function __construct()
    {
        $this->notifikasiModel = new NotifikasiModel();
        $this->authTokenModel = new AuthTokenModel();
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

    private function getCurrentUserId(): ?int
    {
        $authorization = $this->request
            ->getHeaderLine('Authorization');

        if (
            !$authorization ||
            !preg_match(
                '/^Bearer\s+(\S+)$/i',
                $authorization,
                $matches
            )
        ) {
            return null;
        }

        $tokenHash = hash(
            'sha256',
            $matches[1]
        );

        $token = $this->authTokenModel
            ->where('token_hash', $tokenHash)
            ->where('revoked_at', null)
            ->first();

        if (!$token) {
            return null;
        }

        return (int) $token['user_id'];
    }

    /*
    |--------------------------------------------------------------------------
    | GET NOTIFIKASI USER
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        $isRead = $this->request->getGet('is_read');

        $tipe = trim(
            (string) $this->request->getGet('tipe')
        );

        $perPage = (int) (
            $this->request->getGet('per_page') ?? 20
        );

        if ($perPage < 1) {
            $perPage = 20;
        }

        if ($perPage > 50) {
            $perPage = 50;
        }

        $this->notifikasiModel
            ->where('user_id', $userId);

        /*
        |--------------------------------------------------------------------------
        | FILTER STATUS BACA
        |--------------------------------------------------------------------------
        */

        if ($isRead !== null && $isRead !== '') {
            if (!in_array(
                (string) $isRead,
                ['0', '1'],
                true
            )) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Parameter is_read harus 0 atau 1.',
                ], 422);
            }

            $this->notifikasiModel
                ->where(
                    'is_read',
                    (int) $isRead
                );
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER TIPE
        |--------------------------------------------------------------------------
        */

        if ($tipe !== '') {
            $this->notifikasiModel
                ->where(
                    'tipe',
                    $tipe
                );
        }

        $data = $this->notifikasiModel
            ->orderBy(
                'id',
                'DESC'
            )
            ->paginate($perPage);

        return $this->respond([
            'status' => true,
            'message' =>
                'Data notifikasi berhasil diambil.',

            'data' => $data,

            'pagination' => [
                'current_page' =>
                    $this->notifikasiModel
                        ->pager
                        ->getCurrentPage(),

                'per_page' =>
                    $perPage,

                'total' =>
                    $this->notifikasiModel
                        ->pager
                        ->getTotal(),

                'last_page' =>
                    $this->notifikasiModel
                        ->pager
                        ->getPageCount(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UNREAD COUNT
    |--------------------------------------------------------------------------
    */

    public function unreadCount()
    {
        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'User tidak terautentikasi.',
            ], 401);
        }

        $count = $this->notifikasiModel
            ->where(
                'user_id',
                $userId
            )
            ->where(
                'is_read',
                0
            )
            ->countAllResults();

        return $this->respond([
            'status' => true,
            'message' =>
                'Jumlah notifikasi belum dibaca berhasil diambil.',

            'data' => [
                'unread_count' =>
                    $count,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MARK ONE AS READ
    |--------------------------------------------------------------------------
    */

    public function markAsRead($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID notifikasi tidak valid.',
            ], 400);
        }

        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'User tidak terautentikasi.',
            ], 401);
        }

        $notification = $this->notifikasiModel
            ->where(
                'id',
                $id
            )
            ->where(
                'user_id',
                $userId
            )
            ->first();

        if (!$notification) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Notifikasi tidak ditemukan.',
            ], 404);
        }

        if ((int) $notification['is_read'] === 1) {
            return $this->respond([
                'status' => true,
                'message' =>
                    'Notifikasi sudah dibaca.',

                'data' =>
                    $notification,
            ]);
        }

        $this->notifikasiModel
            ->update(
                $id,
                [
                    'is_read' => 1,
                ]
            );

        return $this->respond([
            'status' => true,
            'message' =>
                'Notifikasi berhasil ditandai sebagai sudah dibaca.',

            'data' =>
                $this->notifikasiModel
                    ->find($id),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | MARK ALL AS READ
    |--------------------------------------------------------------------------
    */

    public function markAllAsRead()
    {
        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'User tidak terautentikasi.',
            ], 401);
        }

        $this->notifikasiModel
            ->where(
                'user_id',
                $userId
            )
            ->where(
                'is_read',
                0
            )
            ->set([
                'is_read' => 1,
            ])
            ->update();

        return $this->respond([
            'status' => true,
            'message' =>
                'Semua notifikasi berhasil ditandai sebagai sudah dibaca.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function delete($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID notifikasi tidak valid.',
            ], 400);
        }

        $userId = $this->getCurrentUserId();

        if (!$userId) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'User tidak terautentikasi.',
            ], 401);
        }

        $notification = $this->notifikasiModel
            ->where(
                'id',
                $id
            )
            ->where(
                'user_id',
                $userId
            )
            ->first();

        if (!$notification) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Notifikasi tidak ditemukan.',
            ], 404);
        }

        $this->notifikasiModel
            ->delete($id);

        return $this->respond([
            'status' => true,
            'message' =>
                'Notifikasi berhasil dihapus.',
        ]);
    }
}