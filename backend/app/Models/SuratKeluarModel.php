<?php

namespace App\Models;

use CodeIgniter\Model;

class SuratKeluarModel extends Model
{
    public const DRAFT = 'Draft';
    public const SUBMITTED = 'Diajukan';
    public const REGISTERED = 'Terdaftar';

    protected $table            = 'surat_keluar';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';

    protected $allowedFields = [
        'created_by',
        'resort_id',
        'no_agenda',
        'no_surat',
        'tanggal',
        'tujuan',
        'perihal',
        'klasifikasi',
        'file_path',
        'isi',
        'status',
        'draft_create_key',
    ];

    protected $useTimestamps = true;

    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
}
