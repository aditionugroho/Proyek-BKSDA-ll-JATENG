<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateFotoPatroli extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'laporan_patroli_id' => [
                'type'     => 'BIGINT',
                'unsigned' => true,
            ],
            'file_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'file_path' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'mime_type' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'file_size' => [
                'type'     => 'BIGINT',
                'unsigned' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');

        $this->forge->addForeignKey(
            'laporan_patroli_id',
            'laporan_patroli',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->forge->createTable('foto_patroli');
    }

    public function down()
    {
        $this->forge->dropTable('foto_patroli', true);
    }
}
