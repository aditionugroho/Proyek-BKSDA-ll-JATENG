<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTugasKolaborasi extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true
            ],
            'tugas_id' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'user_id' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'isi' => [
                'type' => 'TEXT'
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true
            ]
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('tugas_id');
        $this->forge->addForeignKey(
            'tugas_id', 'tugas', 'id',
            'CASCADE', 'RESTRICT'
        );
        $this->forge->addForeignKey(
            'user_id', 'users', 'id',
            'RESTRICT', 'RESTRICT'
        );
        $this->forge->createTable('tugas_komentar');

        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true
            ],
            'tugas_id' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'user_id' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'nama_asli' => [
                'type' => 'VARCHAR',
                'constraint' => 255
            ],
            'nama_simpan' => [
                'type' => 'VARCHAR',
                'constraint' => 100
            ],
            'ukuran' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true
            ]
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('tugas_id');
        $this->forge->addForeignKey(
            'tugas_id', 'tugas', 'id',
            'CASCADE', 'RESTRICT'
        );
        $this->forge->addForeignKey(
            'user_id', 'users', 'id',
            'RESTRICT', 'RESTRICT'
        );
        $this->forge->createTable('tugas_lampiran');

        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true
            ],
            'tugas_id' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'user_id' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'jenis' => [
                'type' => 'VARCHAR',
                'constraint' => 40
            ],
            'keterangan' => [
                'type' => 'TEXT',
                'null' => true
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => true
            ]
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('tugas_id');
        $this->forge->addForeignKey(
            'tugas_id', 'tugas', 'id',
            'CASCADE', 'RESTRICT'
        );
        $this->forge->addForeignKey(
            'user_id', 'users', 'id',
            'RESTRICT', 'RESTRICT'
        );
        $this->forge->createTable('tugas_aktivitas');
    }

    public function down()
    {
        $this->forge->dropTable('tugas_aktivitas', true);
        $this->forge->dropTable('tugas_lampiran', true);
        $this->forge->dropTable('tugas_komentar', true);
    }
}
