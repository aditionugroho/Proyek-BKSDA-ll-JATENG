<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDraftStatusToSuratKeluar extends Migration
{
    public function up()
    {
        $columns = array_column($this->db->query(
            'SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
            ['surat_keluar']
        )->getResultArray(), null, 'COLUMN_NAME');

        $changes = [];
        $isi = $columns['isi'] ?? null;
        if ($isi === null) {
            $changes[] = 'ADD isi TEXT NULL';
        } elseif (strtolower($isi['COLUMN_TYPE']) !== 'text' || $isi['IS_NULLABLE'] !== 'YES') {
            throw new \RuntimeException('Definisi surat_keluar.isi perlu ditinjau.');
        }

        $status = $columns['status'] ?? null;
        if ($status === null) {
            $changes[] = "ADD status VARCHAR(30) NOT NULL DEFAULT 'Diajukan'";
        } elseif (strtolower($status['COLUMN_TYPE']) !== 'varchar(30)'
            || $status['IS_NULLABLE'] !== 'NO'
            || !in_array($status['COLUMN_DEFAULT'], ['Diajukan', "'Diajukan'"], true)) {
            throw new \RuntimeException('Definisi surat_keluar.status perlu ditinjau.');
        }

        if ($changes !== []) {
            $this->db->query('ALTER TABLE surat_keluar ' . implode(', ', $changes));
        }
    }

    public function down()
    {
        throw new \RuntimeException('Rollback otomatis dinonaktifkan untuk menjaga isi dan status surat.');
    }
}
