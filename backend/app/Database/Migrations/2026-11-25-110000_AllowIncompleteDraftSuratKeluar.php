<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AllowIncompleteDraftSuratKeluar extends Migration
{
    public function up()
    {
        $columns = array_column($this->db->query(
            'SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_SET_NAME, COLLATION_NAME
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
            ['surat_keluar']
        )->getResultArray(), null, 'COLUMN_NAME');

        $types = [
            'no_surat' => 'varchar(100)',
            'tanggal' => 'date',
            'tujuan' => 'varchar(255)',
            'perihal' => 'text',
        ];
        $changes = [];
        foreach ($types as $name => $type) {
            $column = $columns[$name] ?? null;
            if (!$column || strtolower($column['COLUMN_TYPE']) !== $type) {
                throw new \RuntimeException('Definisi surat_keluar.' . $name . ' perlu ditinjau.');
            }
            if ($column['IS_NULLABLE'] === 'YES') {
                continue;
            }
            if ($column['COLUMN_DEFAULT'] !== null) {
                throw new \RuntimeException('Default surat_keluar.' . $name . ' perlu ditinjau.');
            }

            $charset = $column['CHARACTER_SET_NAME'];
            $collation = $column['COLLATION_NAME'];
            $definition = $type;
            if ($charset !== null || $collation !== null) {
                if (!preg_match('/^[A-Za-z0-9_]+$/D', $charset ?? '')
                    || !preg_match('/^[A-Za-z0-9_]+$/D', $collation ?? '')) {
                    throw new \RuntimeException('Character set atau collation surat_keluar.' . $name . ' tidak valid.');
                }
                $definition .= ' CHARACTER SET ' . $charset . ' COLLATE ' . $collation;
            }
            $changes[] = 'MODIFY `' . $name . '` ' . $definition . ' NULL';
        }

        if ($changes !== []) {
            $this->db->query('ALTER TABLE surat_keluar ' . implode(', ', $changes));
        }
    }

    public function down()
    {
        throw new \RuntimeException('Rollback otomatis dinonaktifkan untuk menjaga Draft yang belum lengkap.');
    }
}
