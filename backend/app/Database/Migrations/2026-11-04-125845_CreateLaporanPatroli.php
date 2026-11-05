<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateLaporanPatroli extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'unsigned'       => true,
                'auto_increment' => true,
            ],
            'user_id' => [
                'type'     => 'BIGINT',
                'unsigned' => true,
            ],
            'resort_id' => [
                'type'     => 'BIGINT',
                'unsigned' => true,
                'null'     => true,
            ],
            'tanggal_patroli' => [
                'type' => 'DATE',
            ],
            'lokasi' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'keterangan' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 30,
                'default'    => 'draft',
            ],
            'client_uuid' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
                'null'       => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('client_uuid');

        $this->forge->addForeignKey(
            'user_id', 'users', 'id', 'RESTRICT', 'CASCADE'
        );

        $this->forge->addForeignKey(
            'resort_id', 'resorts', 'id', 'SET NULL', 'CASCADE'
        );

        $this->forge->createTable('laporan_patroli');
    }

    public function down()
    {
        $this->forge->dropTable('laporan_patroli', true);
    }
}
