<?php

namespace App\Models;

use CodeIgniter\Model;

class JadwalModel extends Model
{
    protected $table = 'jadwal';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = true;

    protected $returnType = 'array';
    protected $useSoftDeletes = false;

    protected $allowedFields = [
        'user_id',
        'jenis',
        'tanggal',
        'jam_mulai',
        'jam_selesai',
        'judul',
        'lokasi',
        'deskripsi',
        'status',
    ];

    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    protected $validationRules = [
        'user_id' => 'required|is_natural_no_zero',
        'jenis' => 'required|in_list[seksi,pribadi]',
        'tanggal' => 'required|valid_date[Y-m-d]',
        'jam_mulai' => 'required',
        'jam_selesai' => 'required',
        'judul' => 'required|max_length[255]',
        'lokasi' => 'permit_empty|max_length[255]',
        'deskripsi' => 'permit_empty',
        'status' => 'required|max_length[32]',
    ];

    protected $skipValidation = false;

    public function getByUser(int $userId): array
    {
        return $this
            ->where('user_id', $userId)
            ->orderBy('tanggal', 'ASC')
            ->orderBy('jam_mulai', 'ASC')
            ->findAll();
    }

    public function getAgendaSeksi(): array
    {
        return $this
            ->where('jenis', 'seksi')
            ->orderBy('tanggal', 'ASC')
            ->orderBy('jam_mulai', 'ASC')
            ->findAll();
    }

    public function getAgendaPribadi(int $userId): array
    {
        return $this
            ->where('user_id', $userId)
            ->where('jenis', 'pribadi')
            ->orderBy('tanggal', 'ASC')
            ->orderBy('jam_mulai', 'ASC')
            ->findAll();
    }
}