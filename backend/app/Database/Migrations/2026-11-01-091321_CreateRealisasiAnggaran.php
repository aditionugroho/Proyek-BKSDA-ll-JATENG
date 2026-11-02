<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateRealisasiAnggaran extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true,
            ],
            'resort_id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
            ],
            'tahun' => [
                'type' => 'SMALLINT',
                'unsigned' => true,
            ],
            'triwulan' => [
                'type' => 'TINYINT',
                'unsigned' => true,
            ],
            'kode_kegiatan' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
            ],
            'nama_kegiatan' => [
                'type' => 'VARCHAR',
                'constraint' => 200,
            ],
            'pagu_anggaran' => [
                'type' => 'DECIMAL',
                'constraint' => '18,2',
            ],
            'nilai_realisasi' => [
                'type' => 'DECIMAL',
                'constraint' => '18,2',
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

        // Mencegah duplikasi kegiatan per resort dan triwulan.
        $this->forge->addUniqueKey(
            ['resort_id', 'tahun', 'triwulan', 'kode_kegiatan'],
            'uk_realisasi_anggaran'
        );

        // Urutan: ON UPDATE, lalu ON DELETE.
        $this->forge->addForeignKey(
            'resort_id',
            'resorts',
            'id',
            'CASCADE',
            'RESTRICT',
            'fk_realisasi_anggaran_resort'
        );

        $this->forge->createTable('realisasi_anggaran', true);
    }

    public function down()
    {
        $this->forge->dropTable('realisasi_anggaran', true);
    }
}
