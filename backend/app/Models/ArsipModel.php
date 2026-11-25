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

    /** Call after locking the source letter in the same transaction. */
    public function findReferenceForUpdate(string $jenis, int $referensiId): ?array
    {
        return $this->db->query(
            'SELECT id FROM arsip WHERE jenis = ? AND referensi_id = ? FOR UPDATE',
            [$jenis, $referensiId]
        )->getRowArray();
    }
}