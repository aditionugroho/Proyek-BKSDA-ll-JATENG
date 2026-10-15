<?php

namespace App\Models;

use CodeIgniter\Model;

class ResortModel extends Model
{
    protected $table = 'resorts';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';

    protected $allowedFields = [
        'nama',
        'kode',
        'status',
    ];

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
}
