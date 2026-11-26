<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateExportHistory extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'jenis' => [
                'type' => 'VARCHAR',
                'constraint' => 24,
            ],
            'format' => [
                'type' => 'VARCHAR',
                'constraint' => 8,
            ],
            'filename' => [
                'type' => 'VARCHAR',
                'constraint' => 180,
            ],
            'created_at' => [
                'type' => 'DATETIME',
            ],
        ]);

        $this->forge->addPrimaryKey('id');

        $this->forge->createTable('export_history', true);
    }

    public function down()
    {
        $this->forge->dropTable('export_history', true);
    }
}
