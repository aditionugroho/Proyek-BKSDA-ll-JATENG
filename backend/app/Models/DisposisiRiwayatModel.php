<?php

namespace App\Models;

use CodeIgniter\Model;

class DisposisiRiwayatModel extends Model
{
    protected $table = 'disposisi_riwayat';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';

    protected $allowedFields = [
    'disposisi_id',
    'activity_log_id',
    'user_id',
    'aktivitas',
    'status_sebelum',
    'status_sesudah',
    'catatan',
    'created_at',
];

    protected $useTimestamps = false;
}
