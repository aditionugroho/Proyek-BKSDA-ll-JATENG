<?php

namespace App\Models;

use CodeIgniter\Model;

class RealisasiAnggaranModel extends Model
{
    protected $table = 'realisasi_anggaran';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;
    protected $returnType = 'array';

    protected $allowedFields = [
        'resort_id',
        'tahun',
        'triwulan',
        'kode_kegiatan',
        'nama_kegiatan',
        'pagu_anggaran',
        'nilai_realisasi',
    ];

    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';

    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $validationRules = [
        'resort_id' => 'required|is_natural_no_zero',
        'tahun' => 'required|integer|greater_than_equal_to[2000]|less_than_equal_to[2100]',
        'triwulan' => 'required|in_list[1,2,3,4]',
        'kode_kegiatan' => 'required|max_length[50]',
        'nama_kegiatan' => 'required|min_length[3]|max_length[200]',
        'pagu_anggaran' => 'required|decimal|greater_than_equal_to[0]',
        'nilai_realisasi' => 'required|decimal|greater_than_equal_to[0]',
    ];

    protected $skipValidation = false;
}

