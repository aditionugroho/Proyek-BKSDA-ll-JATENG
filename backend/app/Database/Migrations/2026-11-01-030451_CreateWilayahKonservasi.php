<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateWilayahKonservasi extends Migration
{
    public function up()
    {
        $this->db->query("
            CREATE TABLE `wilayah_konservasi` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `resort_id` BIGINT UNSIGNED NOT NULL,
                `nama` VARCHAR(150) NOT NULL,
                `kode` VARCHAR(30) NOT NULL,
                `status` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_wilayah_kode` (`kode`),
                INDEX `idx_wilayah_resort` (`resort_id`),

                CONSTRAINT `fk_wilayah_resort`
                    FOREIGN KEY (`resort_id`)
                    REFERENCES `resorts` (`id`)
                    ON UPDATE CASCADE
                    ON DELETE RESTRICT
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down()
    {
        $this->db->query("
            DROP TABLE IF EXISTS `wilayah_konservasi`
        ");
    }
}
