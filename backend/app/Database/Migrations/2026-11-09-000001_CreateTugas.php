<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTugas extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true
            ],
            'judul' => [
                'type' => 'VARCHAR',
                'constraint' => 255
            ],
            'deskripsi' => [
                'type' => 'TEXT',
                'null' => true
            ],
            'assigned_to' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'created_by' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'prioritas' => [
                'type' => 'VARCHAR',
                'constraint' => 16,
                'default' => 'NORMAL'
            ],
            'deadline' => [
                'type' => 'DATE',
                'null' => true
            ],
            'progress' => [
                'type' => 'INT',
                'default' => 0
            ],
            'status' => [
                'type' => 'VARCHAR',
                'constraint' => 32,
                'default' => 'Belum Mulai'
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => true
            ]
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('assigned_to');

        $this->forge->addForeignKey(
            'assigned_to', 'users', 'id',
            'CASCADE', 'RESTRICT'
        );

        $this->forge->addForeignKey(
            'created_by', 'users', 'id',
            'CASCADE', 'RESTRICT'
        );

        $this->forge->createTable('tugas', true);
    }

    public function down()
    {
        $this->forge->dropTable('tugas', true);
    }
}
