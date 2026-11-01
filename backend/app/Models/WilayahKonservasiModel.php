<?php

namespace App\Models;

use CodeIgniter\Model;

class WilayahKonservasiModel extends Model
{
    protected $table = 'wilayah_konservasi';

    protected $primaryKey = 'id';

    protected $returnType = 'array';

    protected $useAutoIncrement = true;

    protected $protectFields = true;

    protected $allowedFields = [
        'resort_id',
        'nama',
        'kode',
        'status',
    ];

    protected $useTimestamps = true;

    protected $createdField = 'created_at';

    protected $updatedField = 'updated_at';

    protected $dateFormat = 'datetime';

    protected $validationRules = [
        'resort_id' => 'required|is_natural_no_zero',
        'nama'      => 'required|min_length[3]|max_length[150]',
        'kode'      => 'required|alpha_dash|max_length[30]',
        'status'    => 'permit_empty|in_list[0,1]',
    ];

    protected $validationMessages = [
        'resort_id' => [
            'required' => 'Resort wajib dipilih.',
        ],
        'nama' => [
            'required' => 'Nama wilayah wajib diisi.',
        ],
        'kode' => [
            'required' => 'Kode wilayah wajib diisi.',
        ],
    ];

    protected $skipValidation = false;
}
