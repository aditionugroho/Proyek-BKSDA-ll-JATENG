<?php

namespace App\Models;

use CodeIgniter\Model;

class ArsipModel extends Model
{
    protected $table            = 'arsip';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';

    protected $allowedFields = [
        'jenis',
        'referensi_id',
        'kategori',
        'tanggal_arsip',
    ];

    protected $useTimestamps = false;
}