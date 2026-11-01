<?php

namespace App\Models;

use CodeIgniter\Model;

class TargetTriwulanModel extends Model
{
    protected $table = 'target_triwulan';
    protected $primaryKey = 'id';
    protected $returnType = 'array';

    protected $allowedFields = [
        'resort_id',
        'indikator',
        'tahun',
        'triwulan',
        'nilai_target',
        'satuan',
    ];

    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';

    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $validationRules = [
        'resort_id' => 'required|is_natural_no_zero',
        'indikator' => 'required|min_length[3]|max_length[150]',
        'tahun' => 'required|integer|greater_than_equal_to[2000]|less_than_equal_to[2100]',
        'triwulan' => 'required|in_list[1,2,3,4]',
        'nilai_target' => 'required|decimal|greater_than_equal_to[0]',
        'satuan' => 'required|max_length[30]',
    ];

    protected $skipValidation = false;
}