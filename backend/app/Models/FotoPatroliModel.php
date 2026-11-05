<?php

namespace App\Models;

use CodeIgniter\Model;

class FotoPatroliModel extends Model
{
    protected $table = 'foto_patroli';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = [
        'laporan_patroli_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'client_uuid',
    ];

    protected $useTimestamps = false;

    protected $validationRules = [
        'laporan_patroli_id' => 'required|is_natural_no_zero',
        'file_name' => 'required|max_length[255]',
        'file_path' => 'required|max_length[255]',
        'mime_type' => 'required|max_length[100]',
        'file_size' => 'required|is_natural_no_zero',
    ];
}
