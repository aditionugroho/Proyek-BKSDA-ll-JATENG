<?php

namespace App\Models;

use CodeIgniter\Model;

class LaporanPatroliModel extends Model
{
    protected $table = 'laporan_patroli';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = [
        'user_id',
        'resort_id',
        'tanggal_patroli',
        'lokasi',
        'keterangan',
        'status',
        'client_uuid',
    ];

    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $validationRules = [
        'user_id' => 'required|is_natural_no_zero',
        'tanggal_patroli' => 'required|valid_date[Y-m-d]',
    ];
}
