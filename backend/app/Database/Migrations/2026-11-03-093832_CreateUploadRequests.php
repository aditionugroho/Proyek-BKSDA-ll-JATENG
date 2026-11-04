<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUploadRequests extends Migration
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
            'user_id' => [
                'type' => 'BIGINT',
                'constraint' => 20,
                'unsigned' => true,
            ],
            'resource_type' => [
                'type' => 'VARCHAR',
                'constraint' => 30,
            ],
            'resource_id' => [
                'type' => 'BIGINT',
                'constraint' => 20,
                'unsigned' => true,
            ],
            'idempotency_key' => [
                'type' => 'VARCHAR',
                'constraint' => 100,
            ],
            'file_hash' => [
                'type' => 'CHAR',
                'constraint' => 64,
            ],
            'file_path' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => true,
            ],
            'status' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'default' => 'processing',
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addPrimaryKey('id');

        // Mencegah key yang sama diproses dua kali
        // untuk user dan resource yang sama.
        $this->forge->addUniqueKey(
            [
                'user_id',
                'resource_type',
                'resource_id',
                'idempotency_key',
            ],
            'uq_upload_request'
        );

        $this->forge->addKey(
            ['resource_type', 'resource_id'],
            false,
            false,
            'idx_upload_resource'
        );

        $this->forge->addKey(
            'status',
            false,
            false,
            'idx_upload_status'
        );

        $this->forge->createTable(
            'upload_requests',
            true
        );
    }

    public function down()
    {
        $this->forge->dropTable(
            'upload_requests',
            true
        );
    }
}
