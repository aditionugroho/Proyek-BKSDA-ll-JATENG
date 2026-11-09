<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTugasChecklist extends Migration
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
            'teks' => [
                'type' => 'VARCHAR',
                'constraint' => 500
            ],
            'selesai' => [
                'type' => 'TINYINT',
                'constraint' => 1,
                'default' => 0
            ],
            'dibuat_oleh' => [
                'type' => 'BIGINT',
                'unsigned' => true
            ],
            'diselesaikan_oleh' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'null' => true
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
        $this->forge->addKey('tugas_id');

        $this->forge->addForeignKey(
            'tugas_id', 'tugas', 'id',
            'CASCADE', 'RESTRICT'
        );

        $this->forge->addForeignKey(
            'dibuat_oleh', 'users', 'id',
            'RESTRICT', 'RESTRICT'
        );

        $this->forge->addForeignKey(
            'diselesaikan_oleh', 'users', 'id',
            'RESTRICT', 'RESTRICT'
        );

        $this->forge->createTable('tugas_checklist', true);
    }

    public function down()
    {
        $this->forge->dropTable('tugas_checklist', true);
    }
}
