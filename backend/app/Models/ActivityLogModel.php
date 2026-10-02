<?php

namespace App\Models;

use CodeIgniter\Model;

class ActivityLogModel extends Model
{
    protected $table            = 'activity_logs';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';

    protected $allowedFields = [
        'user_id',
        'aktivitas',
        'modul',
        'referensi_id',
        'deskripsi',
        'ip_address',
        'created_at',
    ];

    protected $useTimestamps = false;
}