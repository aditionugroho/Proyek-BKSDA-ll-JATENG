<?php

namespace App\Models;

use CodeIgniter\Model;

class PasswordResetOtpModel extends Model
{
    protected $table            = 'password_reset_otps';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';

    protected $allowedFields = [
        'user_id',
        'channel',
        'destination',
        'otp_hash',
        'expires_at',
        'verified_at',
        'attempt_count',
        'reset_token_hash',
        'reset_token_expires_at',
    ];

    protected $useTimestamps = false;
}