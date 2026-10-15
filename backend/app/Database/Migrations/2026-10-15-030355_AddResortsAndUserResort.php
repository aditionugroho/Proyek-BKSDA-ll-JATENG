<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddResortsAndUserResort extends Migration
{
    public function up()
    {
        // Membuat tabel master resort
        $this->db->query("
            CREATE TABLE `resorts` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `nama` VARCHAR(100) NOT NULL,
                `kode` VARCHAR(20) NOT NULL,
                `status` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_resorts_kode` (`kode`)
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        // Menambahkan relasi resort pada pengguna
        $this->db->query("
            ALTER TABLE `users`
                ADD COLUMN `resort_id`
                    BIGINT UNSIGNED NULL DEFAULT NULL
                    AFTER `jabatan`,

                ADD INDEX `idx_users_resort_id`
                    (`resort_id`),

                ADD CONSTRAINT `fk_users_resort`
                    FOREIGN KEY (`resort_id`)
                    REFERENCES `resorts` (`id`)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
        ");
    }

    public function down()
    {
        // Menghapus relasi terlebih dahulu
        $this->db->query("
            ALTER TABLE `users`
                DROP FOREIGN KEY `fk_users_resort`,
                DROP INDEX `idx_users_resort_id`,
                DROP COLUMN `resort_id`
        ");

        // Menghapus tabel master resort
        $this->db->query("
            DROP TABLE `resorts`
        ");
    }
}
