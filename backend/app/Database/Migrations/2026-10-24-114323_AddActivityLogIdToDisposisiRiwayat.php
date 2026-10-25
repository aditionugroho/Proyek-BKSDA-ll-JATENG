<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddActivityLogIdToDisposisiRiwayat extends Migration
{
    public function up()
    {
        $this->forge->addColumn('disposisi_riwayat', [
            'activity_log_id' => [
                'type'       => 'BIGINT',
                'constraint' => 20,
                'unsigned'   => true,
                'null'       => true,
                'after'      => 'disposisi_id',
            ],
        ]);

        $this->db->query(
            'ALTER TABLE disposisi_riwayat
             ADD UNIQUE KEY uq_disposisi_riwayat_activity_log_id
             (activity_log_id)'
        );
    }

    public function down()
    {
        $this->db->query(
            'ALTER TABLE disposisi_riwayat
             DROP INDEX uq_disposisi_riwayat_activity_log_id'
        );

        $this->forge->dropColumn(
            'disposisi_riwayat',
            'activity_log_id'
        );
    }
}
