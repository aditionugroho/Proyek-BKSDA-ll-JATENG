<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddClientUuidToFotoPatroli extends Migration
{
    public function up()
    {
        // Tambahkan identitas unik foto dari aplikasi Flutter.
        // Nullable agar data foto lama tetap kompatibel.
        $this->forge->addColumn('foto_patroli', [
            'client_uuid' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
                'null'       => true,
                'after'      => 'laporan_patroli_id',
            ],
        ]);

        // Cegah duplikasi UUID foto pada tingkat database.
        $this->db->query(
            'ALTER TABLE foto_patroli
             ADD UNIQUE KEY foto_patroli_client_uuid_unique (client_uuid)'
        );
    }

    public function down()
    {
        // Hapus UNIQUE index sebelum menghapus kolom.
        $this->db->query(
            'ALTER TABLE foto_patroli
             DROP INDEX foto_patroli_client_uuid_unique'
        );

        $this->forge->dropColumn('foto_patroli', 'client_uuid');
    }
}
