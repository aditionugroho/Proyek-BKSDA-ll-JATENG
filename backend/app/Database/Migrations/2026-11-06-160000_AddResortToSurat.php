<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddResortToSurat extends Migration
{
    public function up()
    {
        foreach (['surat_masuk', 'surat_keluar'] as $table) {
            $this->forge->addColumn($table, [
                'resort_id' => [
                    'type'       => 'BIGINT',
                    'constraint' => 20,
                    'unsigned'   => true,
                    'null'       => true,
                    'after'      => 'created_by',
                ],
            ]);
        }
    }

    public function down()
    {
        foreach (['surat_masuk', 'surat_keluar'] as $table) {
            $this->forge->dropColumn($table, 'resort_id');
        }
    }
}