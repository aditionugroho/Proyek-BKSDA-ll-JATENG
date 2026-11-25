<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSuratKeluarDraftCreateKey extends Migration
{
    public function up()
    {
        $this->db->query(
            'ALTER TABLE surat_keluar
             ADD draft_create_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
             ADD UNIQUE INDEX uq_surat_keluar_draft_create (created_by, draft_create_key)'
        );
    }

    public function down()
    {
        $this->db->query(
            'ALTER TABLE surat_keluar
             DROP INDEX uq_surat_keluar_draft_create, DROP COLUMN draft_create_key'
        );
    }
}
