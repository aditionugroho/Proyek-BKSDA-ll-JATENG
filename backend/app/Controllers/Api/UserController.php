<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    protected UserModel $userModel;
    protected AuthTokenModel $tokenModel;

    public function __construct()
    {
        $this->userModel  = new UserModel();
        $this->tokenModel = new AuthTokenModel();
    }

    /*
    |--------------------------------------------------------------------------
    | LIST USER
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $search = trim(
            (string) $this->request->getGet('search')
        );

        $role = trim(
            (string) $this->request->getGet('role')
        );

        $perPage = (int) (
            $this->request->getGet('per_page') ?? 20
        );

        if ($perPage < 1) {
            $perPage = 20;
        }

        if ($perPage > 100) {
            $perPage = 100;
        }

        $this->userModel->select(
            'id, name, username, email, no_whatsapp, role, jabatan, status, created_at, updated_at'
        );

        if ($search !== '') {
            $this->userModel
                ->groupStart()
                ->like('name', $search)
                ->orLike('username', $search)
                ->orLike('email', $search)
                ->groupEnd();
        }

        if (
            $role !== '' &&
            in_array(
                $role,
                ['admin', 'kepala_seksi', 'staf'],
                true
            )
        ) {
            $this->userModel
                ->where('role', $role);
        }

        $users = $this->userModel
            ->orderBy('id', 'DESC')
            ->paginate($perPage);

        return $this->respond([
            'status'  => true,
            'message' => 'Data user berhasil diambil.',

            'data' => $users,

            'pagination' => [
                'current_page' => $this->userModel
                    ->pager
                    ->getCurrentPage(),

                'per_page' => $perPage,

                'total' => $this->userModel
                    ->pager
                    ->getTotal(),

                'last_page' => $this->userModel
                    ->pager
                    ->getPageCount(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL USER
    |--------------------------------------------------------------------------
    */

    public function show($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status'  => false,
                'message' => 'ID user tidak valid.',
            ], 400);
        }

        $user = $this->userModel
            ->select(
                'id, name, username, email, no_whatsapp, role, jabatan, status, created_at, updated_at'
            )
            ->find($id);

        if (!$user) {
            return $this->respond([
                'status'  => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status'  => true,
            'message' => 'Detail user berhasil diambil.',
            'data'    => $user,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE USER
    |--------------------------------------------------------------------------
    */

    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status'  => false,
                'message' => 'Request harus menggunakan format JSON.',
            ], 400);
        }

        $name = trim(
            $data['name'] ?? ''
        );

        $username = strtolower(
            trim(
                $data['username'] ?? ''
            )
        );

        $email = strtolower(
            trim(
                $data['email'] ?? ''
            )
        );

        $noWhatsapp = trim(
            $data['no_whatsapp'] ?? ''
        );

        $password =
            $data['password'] ?? '';

        $role = trim(
            $data['role'] ?? ''
        );

        $jabatan = trim(
            $data['jabatan'] ?? ''
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDASI WAJIB
        |--------------------------------------------------------------------------
        */

        if (
            $name === '' ||
            $username === '' ||
            $password === '' ||
            $role === ''
        ) {
            return $this->respond([
                'status'  => false,
                'message' => 'Nama, username, password, dan role wajib diisi.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI ROLE
        |--------------------------------------------------------------------------
        */

        $allowedRoles = [
            'admin',
            'kepala_seksi',
            'staf',
        ];

        if (!in_array($role, $allowedRoles, true)) {
            return $this->respond([
                'status'  => false,
                'message' => 'Role tidak valid.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI PASSWORD
        |--------------------------------------------------------------------------
        */

        if (strlen($password) < 8) {
            return $this->respond([
                'status'  => false,
                'message' => 'Password minimal 8 karakter.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI EMAIL
        |--------------------------------------------------------------------------
        */

        if (
            $email !== '' &&
            !filter_var(
                $email,
                FILTER_VALIDATE_EMAIL
            )
        ) {
            return $this->respond([
                'status'  => false,
                'message' => 'Format email tidak valid.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CEK USERNAME
        |--------------------------------------------------------------------------
        */

        $usernameExists = $this->userModel
            ->where('username', $username)
            ->first();

        if ($usernameExists) {
            return $this->respond([
                'status'  => false,
                'message' => 'Username sudah digunakan.',
            ], 409);
        }

        /*
        |--------------------------------------------------------------------------
        | CEK EMAIL
        |--------------------------------------------------------------------------
        */

        if ($email !== '') {
            $emailExists = $this->userModel
                ->where('email', $email)
                ->first();

            if ($emailExists) {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Email sudah digunakan.',
                ], 409);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | CEK NOMOR WHATSAPP
        |--------------------------------------------------------------------------
        */

        if ($noWhatsapp !== '') {
            $waExists = $this->userModel
                ->where(
                    'no_whatsapp',
                    $noWhatsapp
                )
                ->first();

            if ($waExists) {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Nomor WhatsApp sudah digunakan.',
                ], 409);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | INSERT
        |--------------------------------------------------------------------------
        */

        $insertData = [
            'name' =>
                $name,

            'username' =>
                $username,

            'email' =>
                $email !== ''
                    ? $email
                    : null,

            'no_whatsapp' =>
                $noWhatsapp !== ''
                    ? $noWhatsapp
                    : null,

            'password' =>
                password_hash(
                    $password,
                    PASSWORD_BCRYPT
                ),

            'role' =>
                $role,

            'jabatan' =>
                $jabatan !== ''
                    ? $jabatan
                    : null,

            'status' =>
                1,
        ];

        $userId = $this->userModel
            ->insert(
                $insertData,
                true
            );

        if (!$userId) {
            return $this->respond([
                'status'  => false,
                'message' => 'Gagal menambahkan user.',
            ], 500);
        }

        $user = $this->userModel
            ->select(
                'id, name, username, email, no_whatsapp, role, jabatan, status, created_at, updated_at'
            )
            ->find($userId);

        return $this->respondCreated([
            'status'  => true,
            'message' => 'User berhasil ditambahkan.',
            'data'    => $user,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |--------------------------------------------------------------------------
    */

    public function update($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status'  => false,
                'message' => 'ID user tidak valid.',
            ], 400);
        }

        $user = $this->userModel->find($id);

        if (!$user) {
            return $this->respond([
                'status'  => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status'  => false,
                'message' => 'Request harus menggunakan format JSON.',
            ], 400);
        }

        $updateData = [];

        /*
        |--------------------------------------------------------------------------
        | NAME
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('name', $data)) {
            $name = trim($data['name']);

            if ($name === '') {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Nama tidak boleh kosong.',
                ], 422);
            }

            $updateData['name'] = $name;
        }

        /*
        |--------------------------------------------------------------------------
        | USERNAME
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('username', $data)) {
            $username = strtolower(
                trim($data['username'])
            );

            if ($username === '') {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Username tidak boleh kosong.',
                ], 422);
            }

            $existingUsername =
                $this->userModel
                    ->where(
                        'username',
                        $username
                    )
                    ->where(
                        'id !=',
                        $id
                    )
                    ->first();

            if ($existingUsername) {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Username sudah digunakan.',
                ], 409);
            }

            $updateData['username'] =
                $username;
        }

        /*
        |--------------------------------------------------------------------------
        | EMAIL
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('email', $data)) {
            $email = strtolower(
                trim($data['email'] ?? '')
            );

            if (
                $email !== '' &&
                !filter_var(
                    $email,
                    FILTER_VALIDATE_EMAIL
                )
            ) {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Format email tidak valid.',
                ], 422);
            }

            if ($email !== '') {
                $existingEmail =
                    $this->userModel
                        ->where(
                            'email',
                            $email
                        )
                        ->where(
                            'id !=',
                            $id
                        )
                        ->first();

                if ($existingEmail) {
                    return $this->respond([
                        'status'  => false,
                        'message' => 'Email sudah digunakan.',
                    ], 409);
                }
            }

            $updateData['email'] =
                $email !== ''
                    ? $email
                    : null;
        }

        /*
        |--------------------------------------------------------------------------
        | WHATSAPP
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'no_whatsapp',
            $data
        )) {
            $noWhatsapp = trim(
                $data['no_whatsapp'] ?? ''
            );

            if ($noWhatsapp !== '') {
                $existingWA =
                    $this->userModel
                        ->where(
                            'no_whatsapp',
                            $noWhatsapp
                        )
                        ->where(
                            'id !=',
                            $id
                        )
                        ->first();

                if ($existingWA) {
                    return $this->respond([
                        'status'  => false,
                        'message' => 'Nomor WhatsApp sudah digunakan.',
                    ], 409);
                }
            }

            $updateData['no_whatsapp'] =
                $noWhatsapp !== ''
                    ? $noWhatsapp
                    : null;
        }

        /*
        |--------------------------------------------------------------------------
        | ROLE
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('role', $data)) {
            $role = trim(
                $data['role']
            );

            if (
                !in_array(
                    $role,
                    [
                        'admin',
                        'kepala_seksi',
                        'staf',
                    ],
                    true
                )
            ) {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Role tidak valid.',
                ], 422);
            }

            $updateData['role'] =
                $role;
        }

        /*
        |--------------------------------------------------------------------------
        | JABATAN
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'jabatan',
            $data
        )) {
            $jabatan = trim(
                $data['jabatan'] ?? ''
            );

            $updateData['jabatan'] =
                $jabatan !== ''
                    ? $jabatan
                    : null;
        }

        /*
        |--------------------------------------------------------------------------
        | PASSWORD
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'password',
                $data
            ) &&
            $data['password'] !== ''
        ) {
            if (
                strlen(
                    $data['password']
                ) < 8
            ) {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Password minimal 8 karakter.',
                ], 422);
            }

            $updateData['password'] =
                password_hash(
                    $data['password'],
                    PASSWORD_BCRYPT
                );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        if (array_key_exists(
            'status',
            $data
        )) {
            $status =
                (int) $data['status'];

            if (
                !in_array(
                    $status,
                    [0, 1],
                    true
                )
            ) {
                return $this->respond([
                    'status'  => false,
                    'message' => 'Status hanya boleh 0 atau 1.',
                ], 422);
            }

            $updateData['status'] =
                $status;
        }

        if (empty($updateData)) {
            return $this->respond([
                'status'  => false,
                'message' => 'Tidak ada data yang diperbarui.',
            ], 422);
        }

        $this->userModel->update(
            $id,
            $updateData
        );

        /*
         * Kalau user dinonaktifkan,
         * revoke semua token aktifnya.
         */

        if (
            isset($updateData['status']) &&
            (int) $updateData['status'] === 0
        ) {
            $tokens = $this->tokenModel
                ->where('user_id', $id)
                ->where('revoked_at', null)
                ->findAll();

            foreach ($tokens as $token) {
                $this->tokenModel->update(
                    $token['id'],
                    [
                        'revoked_at' =>
                            date('Y-m-d H:i:s'),
                    ]
                );
            }
        }

        $updatedUser = $this->userModel
            ->select(
                'id, name, username, email, no_whatsapp, role, jabatan, status, created_at, updated_at'
            )
            ->find($id);

        return $this->respond([
            'status'  => true,
            'message' => 'User berhasil diperbarui.',
            'data'    => $updatedUser,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE / NONAKTIFKAN USER
    |--------------------------------------------------------------------------
    */

    public function delete($id = null)
    {
        if (!$id || !ctype_digit((string) $id)) {
            return $this->respond([
                'status'  => false,
                'message' => 'ID user tidak valid.',
            ], 400);
        }

        $user = $this->userModel->find($id);

        if (!$user) {
            return $this->respond([
                'status'  => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        /*
         * Tidak hard delete.
         * User dinonaktifkan supaya data relasi
         * surat/disposisi/log tetap aman.
         */

        $this->userModel->update(
            $id,
            [
                'status' => 0,
            ]
        );

        /*
         * Semua token user dicabut.
         */

        $tokens = $this->tokenModel
            ->where('user_id', $id)
            ->where('revoked_at', null)
            ->findAll();

        foreach ($tokens as $token) {
            $this->tokenModel->update(
                $token['id'],
                [
                    'revoked_at' =>
                        date('Y-m-d H:i:s'),
                ]
            );
        }

        return $this->respond([
            'status'  => true,
            'message' => 'User berhasil dinonaktifkan.',
        ]);
    }
}