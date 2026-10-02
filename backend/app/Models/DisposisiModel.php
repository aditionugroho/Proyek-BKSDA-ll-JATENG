<?php

namespace App\Models;

use CodeIgniter\Model;

class DisposisiModel extends Model
{
    protected $table            = 'disposisi';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';

    protected $allowedFields = [
        'surat_masuk_id',
        'dari_user_id',
        'ke_user_id',
        'catatan',
        'hasil_tindak_lanjut',
        'catatan_revisi',
        'status',
        'deadline',
    ];

    protected $useTimestamps = true;

    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
}