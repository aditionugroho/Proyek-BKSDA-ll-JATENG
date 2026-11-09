<?php

namespace App\Models;

use CodeIgniter\Model;

class TugasModel extends Model
{
    protected $table = 'tugas';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = [
        'judul',
        'deskripsi',
        'assigned_to',
        'created_by',
        'prioritas',
        'deadline',
        'progress',
        'status'
    ];

    protected $useTimestamps = true;
}
