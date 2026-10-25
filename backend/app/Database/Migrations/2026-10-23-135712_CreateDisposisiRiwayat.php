<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateDisposisiRiwayat extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'constraint' => 20,
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'disposisi_id' => [
                'type' => 'BIGINT',
                'constraint' => 20,
                'unsigned' => true,
            ],
            'user_id' => [
                'type' => 'BIGINT',
                'constraint' => 20,
                'unsigned' => true,
                'null' => true,
            ],
            'aktivitas' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
            ],
            'status_sebelum' => [
                'type' => 'VARCHAR',
                'constraint' => 30,
                'null' => true,
            ],
            'status_sesudah' => [
                'type' => 'VARCHAR',
                'constraint' => 30,
            ],
            'catatan' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('disposisi_id');
        $this->forge->addKey('user_id');

        $this->forge->addForeignKey(
            'disposisi_id',
            'disposisi',
            'id',
            'CASCADE',
            'CASCADE'
        );

        $this->forge->addForeignKey(
            'user_id',
            'users',
            'id',
            'SET NULL',
            'CASCADE'
        );

        $this->forge->createTable('disposisi_riwayat', true);
    }

    public function down()
    {
        $this->forge->dropTable('disposisi_riwayat', true);
    }
}
