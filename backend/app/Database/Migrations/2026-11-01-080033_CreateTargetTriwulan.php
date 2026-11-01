<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTargetTriwulan extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'BIGINT',
                'constraint'     => 20,
                'unsigned'       => true,
                'auto_increment' => true,
            ],

            'resort_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
            ],

            'indikator' => [
                'type'       => 'VARCHAR',
                'constraint' => 150,
            ],

            'tahun' => [
                'type'     => 'SMALLINT',
                'unsigned' => true,
            ],

            'triwulan' => [
                'type'     => 'TINYINT',
                'unsigned' => true,
            ],

            'nilai_target' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
            ],

            'satuan' => [
                'type'       => 'VARCHAR',
                'constraint' => 30,
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

        $this->forge->addKey('id', true);

        // Satu target per indikator, resort, tahun, dan triwulan.
        $this->forge->addUniqueKey(
            ['resort_id', 'indikator', 'tahun', 'triwulan'],
            'uk_target_triwulan'
        );

        $this->forge->addForeignKey(
        'resort_id',
        'resorts',
        'id',
        'CASCADE',
        'RESTRICT',
        'fk_target_triwulan_resort'
    );

        $this->forge->createTable('target_triwulan', true);
    }

    public function down()
    {
        $this->forge->dropTable('target_triwulan', true);
    }
}