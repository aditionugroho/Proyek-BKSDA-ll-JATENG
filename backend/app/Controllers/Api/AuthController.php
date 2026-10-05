<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Models\LoginLogModel;
use App\Models\PasswordResetOtpModel;
use App\Models\UserModel;
use App\Services\OtpService;
use CodeIgniter\API\ResponseTrait;

class AuthController extends BaseController
{
    use ResponseTrait;

    protected UserModel $userModel;
    protected AuthTokenModel $tokenModel;
    protected PasswordResetOtpModel $otpModel;
    protected OtpService $otpService;
    protected LoginLogModel $loginLogModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->tokenModel = new AuthTokenModel();
        $this->otpModel = new PasswordResetOtpModel();
        $this->otpService = new OtpService();
        $this->loginLogModel = new LoginLogModel();
    }

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    public function login()
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Request harus menggunakan format JSON.',
            ], 400);
        }

        $username = trim(
            $data['username'] ?? ''
        );

        $password =
            $data['password'] ?? '';

        if (
            $username === '' ||
            $password === ''
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Username dan password wajib diisi.',
            ], 422);
        }

        /*
         * Rate limit:
         * maksimal 5 request / 15 menit
         */

        $ipAddress =
            $this->request->getIPAddress();

        $rateLimitKey =
            'login-' .
            hash(
                'sha256',
                $ipAddress .
                '-' .
                strtolower($username)
            );

        $throttler =
            service('throttler');

        if (
            !$throttler->check(
                $rateLimitKey,
                5,
                900
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Terlalu banyak percobaan login. Coba kembali dalam 15 menit.',
            ], 429);
        }

        $user =
            $this->userModel
                ->where(
                    'username',
                    $username
                )
                ->first();

        if (
            !$user ||
            (int) $user['status'] !== 1 ||
            !password_verify(
                $password,
                $user['password']
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Username atau password salah.',
            ], 401);
        }

        /*
         * Generate Bearer Token
         */

        $plainToken =
            bin2hex(
                random_bytes(32)
            );

        $tokenHash =
            hash(
                'sha256',
                $plainToken
            );

        $expiresAt =
            date(
                'Y-m-d H:i:s',
                time() + (8 * 60 * 60)
            );

        $userAgent =
            $this->request
                ->getUserAgent()
                ->getAgentString();

        /*
         * Simpan token autentikasi
         */

        $this->tokenModel->insert([
            'user_id' =>
                $user['id'],

            'token_hash' =>
                $tokenHash,

            'ip_address' =>
                $ipAddress,

            'user_agent' =>
                substr(
                    $userAgent,
                    0,
                    255
                ),

            'last_used_at' =>
                date('Y-m-d H:i:s'),

            'expires_at' =>
                $expiresAt,

            'revoked_at' =>
                null,
        ]);

        /*
         * Catat riwayat login
         */

        $this->loginLogModel->insert([
            'user_id' =>
                (int) $user['id'],

            'ip_address' =>
                $ipAddress,

            'login_at' =>
                date('Y-m-d H:i:s'),

            'logout_at' =>
                null,
        ]);

        return $this->respond([
            'status' => true,

            'message' =>
                'Login berhasil.',

            'data' => [

                'token' =>
                    $plainToken,

                'token_type' =>
                    'Bearer',

                'expires_at' =>
                    $expiresAt,

                'user' => [

                    'id' =>
                        $user['id'],

                    'name' =>
                        $user['name'],

                    'username' =>
                        $user['username'],

                    'email' =>
                        $user['email'] ?? null,

                    'no_whatsapp' =>
                        $user['no_whatsapp'] ?? null,

                    'role' =>
                        $user['role'],

                    'jabatan' =>
                        $user['jabatan'],
                ],
            ],
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    public function logout()
    {
        $authHeader =
            $this->request
                ->getHeaderLine(
                    'Authorization'
                );

        if (
            !$authHeader ||
            !preg_match(
                '/^Bearer\s+(\S+)$/i',
                $authHeader,
                $matches
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Token autentikasi tidak ditemukan.',
            ], 401);
        }

        $tokenHash =
            hash(
                'sha256',
                $matches[1]
            );

        $token =
            $this->tokenModel
                ->where(
                    'token_hash',
                    $tokenHash
                )
                ->where(
                    'revoked_at',
                    null
                )
                ->first();

        if (!$token) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Token tidak valid atau sudah tidak aktif.',
            ], 401);
        }

        /*
         * Cari riwayat login aktif
         * milik user dari IP yang sama.
         */

        $loginLog =
            $this->loginLogModel
                ->where(
                    'user_id',
                    $token['user_id']
                )
                ->where(
                    'ip_address',
                    $token['ip_address']
                )
                ->where(
                    'logout_at',
                    null
                )
                ->orderBy(
                    'id',
                    'DESC'
                )
                ->first();

        /*
         * Revoke token
         */

        $this->tokenModel->update(
            $token['id'],
            [
                'revoked_at' =>
                    date('Y-m-d H:i:s'),
            ]
        );

        /*
         * Catat waktu logout
         */

        if ($loginLog) {
            $this->loginLogModel->update(
                $loginLog['id'],
                [
                    'logout_at' =>
                        date('Y-m-d H:i:s'),
                ]
            );
        }

        return $this->respond([
            'status' => true,
            'message' =>
                'Logout berhasil.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | FORGOT PASSWORD
    |--------------------------------------------------------------------------
    */

    public function forgotPassword()
    {
        $data =
            $this->request->getJSON(true);

        $genericResponse = [
            'status' => true,
            'message' =>
                'Jika akun ditemukan, kode OTP akan dikirim ke email yang terdaftar.',
        ];

        if (!$data) {
            return $this->respond(
                $genericResponse
            );
        }

        $email =
            strtolower(
                trim(
                    $data['email'] ?? ''
                )
            );

        /*
         * Jangan memberitahukan apakah
         * email terdaftar atau tidak.
         */

        if ($email === '') {
            return $this->respond(
                $genericResponse
            );
        }

        /*
         * Rate limit:
         * 3 OTP / 10 menit
         */

        $rateLimitKey =
            'forgot-password-' .
            hash(
                'sha256',
                $this->request
                    ->getIPAddress()
                . '-' .
                $email
            );

        $throttler =
            service('throttler');

        if (
            !$throttler->check(
                $rateLimitKey,
                3,
                600
            )
        ) {
            return $this->respond([
                'status' => false,

                'message' =>
                    'Terlalu banyak permintaan OTP. Coba kembali beberapa menit lagi.',
            ], 429);
        }

        $user =
            $this->userModel
                ->where(
                    'email',
                    $email
                )
                ->where(
                    'status',
                    1
                )
                ->first();

        /*
         * Tetap response generic
         * jika user tidak ditemukan.
         */

        if (!$user) {
            return $this->respond(
                $genericResponse
            );
        }

        /*
         * Generate OTP
         */

        $otp =
            $this->otpService
                ->generateOtp();

        /*
         * Hash OTP.
         * OTP mentah tidak disimpan.
         */

        $otpHash =
            password_hash(
                $otp,
                PASSWORD_BCRYPT
            );

        /*
         * OTP hanya berlaku 5 menit.
         */

        $expiresAt =
            date(
                'Y-m-d H:i:s',
                time() + (5 * 60)
            );

        /*
         * Hapus OTP lama milik user.
         */

        $this->otpModel
            ->where(
                'user_id',
                $user['id']
            )
            ->delete();

        /*
         * Simpan OTP baru.
         */

        $this->otpModel->insert([

            'user_id' =>
                $user['id'],

            'channel' =>
                'email',

            'destination' =>
                $email,

            'otp_hash' =>
                $otpHash,

            'expires_at' =>
                $expiresAt,

            'verified_at' =>
                null,

            'attempt_count' =>
                0,

            'reset_token_hash' =>
                null,

            'reset_token_expires_at' =>
                null,
        ]);

        /*
         * Kirim OTP.
         */

        $sent =
            $this->otpService
                ->sendEmailOtp(
                    $email,
                    $otp
                );

        if (!$sent) {

            log_message(
                'error',
                'Gagal mengirim OTP ke email user ID: ' .
                $user['id']
            );

            /*
             * Jangan memberitahu client
             * detail error SMTP.
             */

            return $this->respond(
                $genericResponse
            );
        }

        return $this->respond(
            $genericResponse
        );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
    */

    public function verifyOtp()
    {
        $data =
            $this->request
                ->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Request tidak valid.',
            ], 400);
        }

        $email =
            strtolower(
                trim(
                    $data['email'] ?? ''
                )
            );

        $otp =
            trim(
                $data['otp'] ?? ''
            );

        if (
            $email === '' ||
            $otp === ''
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Email dan OTP wajib diisi.',
            ], 422);
        }

        $user =
            $this->userModel
                ->where(
                    'email',
                    $email
                )
                ->where(
                    'status',
                    1
                )
                ->first();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'OTP tidak valid atau sudah kedaluwarsa.',
            ], 400);
        }

        /*
         * Ambil OTP terbaru.
         */

        $otpRecord =
            $this->otpModel
                ->where(
                    'user_id',
                    $user['id']
                )
                ->where(
                    'channel',
                    'email'
                )
                ->orderBy(
                    'id',
                    'DESC'
                )
                ->first();

        if (!$otpRecord) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'OTP tidak valid atau sudah kedaluwarsa.',
            ], 400);
        }

        /*
         * Sudah pernah diverifikasi.
         */

        if (
            !empty(
                $otpRecord['verified_at']
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'OTP sudah pernah digunakan.',
            ], 400);
        }

        /*
         * Cek expired.
         */

        if (
            strtotime(
                $otpRecord['expires_at']
            ) < time()
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'OTP sudah kedaluwarsa.',
            ], 400);
        }

        /*
         * Maksimal 5 percobaan.
         */

        if (
            (int)
            $otpRecord['attempt_count']
            >= 5
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Batas percobaan OTP telah tercapai. Silakan minta OTP baru.',
            ], 429);
        }

        /*
         * OTP salah.
         */

        if (
            !password_verify(
                $otp,
                $otpRecord['otp_hash']
            )
        ) {

            $this->otpModel->update(
                $otpRecord['id'],
                [
                    'attempt_count' =>
                        (int)
                        $otpRecord['attempt_count']
                        + 1,
                ]
            );

            return $this->respond([
                'status' => false,
                'message' =>
                    'OTP tidak valid.',
            ], 400);
        }

        /*
         * OTP benar.
         */

        $resetToken =
            bin2hex(
                random_bytes(32)
            );

        /*
         * Database hanya menyimpan hash.
         */

        $resetTokenHash =
            hash(
                'sha256',
                $resetToken
            );

        /*
         * Reset token berlaku 10 menit.
         */

        $resetTokenExpiresAt =
            date(
                'Y-m-d H:i:s',
                time() + (10 * 60)
            );

        $this->otpModel->update(
            $otpRecord['id'],
            [
                'verified_at' =>
                    date('Y-m-d H:i:s'),

                'reset_token_hash' =>
                    $resetTokenHash,

                'reset_token_expires_at' =>
                    $resetTokenExpiresAt,
            ]
        );

        return $this->respond([
            'status' => true,

            'message' =>
                'OTP berhasil diverifikasi.',

            'data' => [

                'reset_token' =>
                    $resetToken,

                'expires_at' =>
                    $resetTokenExpiresAt,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | RESET PASSWORD
    |--------------------------------------------------------------------------
    */

    public function resetPassword()
    {
        $data =
            $this->request
                ->getJSON(true);

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Request tidak valid.',
            ], 400);
        }

        $resetToken =
            trim(
                $data['reset_token'] ?? ''
            );

        $newPassword =
            $data['new_password'] ?? '';

        $confirmPassword =
            $data['confirm_password'] ?? '';

        if (
            $resetToken === '' ||
            $newPassword === '' ||
            $confirmPassword === ''
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Semua field wajib diisi.',
            ], 422);
        }

        if (
            $newPassword !==
            $confirmPassword
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Konfirmasi password tidak sama.',
            ], 422);
        }

        /*
         * Minimal password.
         */

        if (
            strlen($newPassword) < 8
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Password minimal 8 karakter.',
            ], 422);
        }

        $resetTokenHash =
            hash(
                'sha256',
                $resetToken
            );

        $otpRecord =
            $this->otpModel
                ->where(
                    'reset_token_hash',
                    $resetTokenHash
                )
                ->first();

        if (!$otpRecord) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Reset token tidak valid.',
            ], 400);
        }

        /*
         * OTP harus sudah diverifikasi.
         */

        if (
            empty(
                $otpRecord['verified_at']
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'OTP belum diverifikasi.',
            ], 400);
        }

        /*
         * Reset token expired.
         */

        if (
            empty(
                $otpRecord[
                    'reset_token_expires_at'
                ]
            ) ||
            strtotime(
                $otpRecord[
                    'reset_token_expires_at'
                ]
            ) < time()
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Reset token sudah kedaluwarsa.',
            ], 400);
        }

        /*
         * Update password.
         */

        $passwordHash =
            password_hash(
                $newPassword,
                PASSWORD_BCRYPT
            );

        $this->userModel->update(
            $otpRecord['user_id'],
            [
                'password' =>
                    $passwordHash,
            ]
        );

        /*
         * Hapus semua login token lama.
         * User harus login ulang.
         */

        $activeTokens =
            $this->tokenModel
                ->where(
                    'user_id',
                    $otpRecord['user_id']
                )
                ->where(
                    'revoked_at',
                    null
                )
                ->findAll();

        foreach (
            $activeTokens as $token
        ) {
            $this->tokenModel->update(
                $token['id'],
                [
                    'revoked_at' =>
                        date('Y-m-d H:i:s'),
                ]
            );
        }

        /*
         * Hapus OTP setelah berhasil.
         */

        $this->otpModel
            ->delete(
                $otpRecord['id']
            );

        return $this->respond([
            'status' => true,
            'message' =>
                'Password berhasil diubah. Silakan login kembali.',
        ]);
    }
}