<?php

namespace App\Models;

use CodeIgniter\Model;

class DokumenModel extends Model
{
    protected $table = 'dokumen';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;

    protected $returnType = 'array';
    protected $useSoftDeletes = false;

    protected $allowedFields = [
        'user_id',
        'nama',
        'nomor',
        'kategori',
        'keterangan',
        'status',
        'file_path',
    ];

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $validationRules = [
        'user_id' => 'required|is_natural_no_zero',
        'nama' => 'required|max_length[255]',
        'nomor' => 'permit_empty|max_length[100]',
        'kategori' => 'required|max_length[100]',
        'keterangan' => 'permit_empty|max_length[5000]',
        'status' => 'required|max_length[32]',
        'file_path' => 'permit_empty|max_length[255]',
    ];

    protected $skipValidation = false;

    public function getByUser(int $userId): array
    {
        return $this
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->findAll();
    }
}
