<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddKeteranganToDokumen extends Migration
{
    public function up()
    {
        $this->forge->addColumn('dokumen', [
            'keterangan' => [
                'type' => 'TEXT',
                'null' => true,
                'after' => 'kategori',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('dokumen', 'keterangan');
    }
}
