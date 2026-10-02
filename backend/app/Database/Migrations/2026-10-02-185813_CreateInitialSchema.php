<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateInitialSchema extends Migration
{
    public function up()
    {
        /*
        |--------------------------------------------------------------------------
        | USERS
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `users` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
                `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `no_whatsapp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
                `role` enum('admin','kepala_seksi','staf')
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `jabatan` varchar(100)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `status` tinyint(1) NOT NULL DEFAULT '1',
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                UNIQUE KEY `username` (`username`),
                UNIQUE KEY `email` (`email`)
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | AUTH TOKENS
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `auth_tokens` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `user_id` bigint unsigned NOT NULL,
                `token_hash` varchar(64)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `ip_address` varchar(45)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `user_agent` varchar(255)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `last_used_at` datetime DEFAULT NULL,
                `expires_at` datetime NOT NULL,
                `revoked_at` datetime DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                UNIQUE KEY `token_hash` (`token_hash`),
                KEY `idx_auth_token_user` (`user_id`),
                KEY `idx_auth_token_expiry` (`expires_at`),

                CONSTRAINT `fk_auth_tokens_user`
                    FOREIGN KEY (`user_id`)
                    REFERENCES `users` (`id`)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | PASSWORD RESET OTP
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `password_reset_otps` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `user_id` bigint unsigned NOT NULL,
                `otp_hash` varchar(255)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `channel` enum('email','whatsapp')
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `destination` varchar(255)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `expires_at` datetime NOT NULL,
                `verified_at` datetime DEFAULT NULL,
                `attempt_count` int NOT NULL DEFAULT '0',
                `reset_token_hash` varchar(64)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `reset_token_expires_at` datetime DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                KEY `fk_password_reset_user` (`user_id`),

                CONSTRAINT `fk_password_reset_user`
                    FOREIGN KEY (`user_id`)
                    REFERENCES `users` (`id`)
                    ON DELETE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | SURAT MASUK
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `surat_masuk` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `created_by` bigint unsigned NOT NULL,
                `no_agenda` varchar(50)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `no_surat` varchar(100)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `tanggal` date NOT NULL,
                `asal` varchar(255)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `perihal` text
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `klasifikasi` varchar(100)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `file_path` varchar(255)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `status` varchar(30)
                    COLLATE utf8mb4_unicode_ci NOT NULL
                    DEFAULT 'baru',
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                UNIQUE KEY `no_agenda` (`no_agenda`),
                KEY `fk_surat_masuk_user` (`created_by`),

                CONSTRAINT `fk_surat_masuk_user`
                    FOREIGN KEY (`created_by`)
                    REFERENCES `users` (`id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | SURAT KELUAR
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `surat_keluar` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `created_by` bigint unsigned NOT NULL,
                `no_agenda` varchar(50)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `no_surat` varchar(100)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `tanggal` date NOT NULL,
                `tujuan` varchar(255)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `perihal` text
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `klasifikasi` varchar(100)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `file_path` varchar(255)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                UNIQUE KEY `no_agenda` (`no_agenda`),
                KEY `fk_surat_keluar_user` (`created_by`),

                CONSTRAINT `fk_surat_keluar_user`
                    FOREIGN KEY (`created_by`)
                    REFERENCES `users` (`id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | DISPOSISI
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `disposisi` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `surat_masuk_id` bigint unsigned NOT NULL,
                `dari_user_id` bigint unsigned NOT NULL,
                `ke_user_id` bigint unsigned NOT NULL,
                `catatan` text
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `hasil_tindak_lanjut` text
                    COLLATE utf8mb4_unicode_ci,
                `catatan_revisi` text
                    COLLATE utf8mb4_unicode_ci,
                `status` enum(
                    'menunggu',
                    'dalam_proses',
                    'selesai',
                    'dikembalikan'
                ) COLLATE utf8mb4_unicode_ci
                    NOT NULL DEFAULT 'menunggu',
                `deadline` date DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                KEY `fk_disposisi_surat_masuk` (`surat_masuk_id`),
                KEY `fk_disposisi_dari_user` (`dari_user_id`),
                KEY `fk_disposisi_ke_user` (`ke_user_id`),
                KEY `idx_disposisi_status` (`status`),
                KEY `idx_disposisi_deadline` (`deadline`),

                CONSTRAINT `fk_disposisi_dari_user`
                    FOREIGN KEY (`dari_user_id`)
                    REFERENCES `users` (`id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE,

                CONSTRAINT `fk_disposisi_ke_user`
                    FOREIGN KEY (`ke_user_id`)
                    REFERENCES `users` (`id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE,

                CONSTRAINT `fk_disposisi_surat_masuk`
                    FOREIGN KEY (`surat_masuk_id`)
                    REFERENCES `surat_masuk` (`id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | ARSIP
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `arsip` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `jenis` enum('surat_masuk','surat_keluar')
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `referensi_id` bigint unsigned NOT NULL,
                `kategori` varchar(100)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `tanggal_arsip` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                UNIQUE KEY `uk_arsip_referensi`
                    (`jenis`,`referensi_id`),
                KEY `idx_arsip_kategori` (`kategori`),
                KEY `idx_arsip_tanggal` (`tanggal_arsip`)
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | LOGIN LOGS
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `login_logs` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `user_id` bigint unsigned NOT NULL,
                `ip_address` varchar(45)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `login_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                `logout_at` timestamp NULL DEFAULT NULL,

                PRIMARY KEY (`id`),
                KEY `idx_login_logs_user` (`user_id`),
                KEY `idx_login_logs_login_at` (`login_at`),

                CONSTRAINT `fk_login_logs_user`
                    FOREIGN KEY (`user_id`)
                    REFERENCES `users` (`id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | NOTIFIKASI
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `notifikasi` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `user_id` bigint unsigned NOT NULL,
                `pesan` text
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `tipe` varchar(50)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `is_read` tinyint(1) NOT NULL DEFAULT '0',
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                KEY `idx_notifikasi_user_read`
                    (`user_id`,`is_read`),

                CONSTRAINT `fk_notifikasi_user`
                    FOREIGN KEY (`user_id`)
                    REFERENCES `users` (`id`)
                    ON DELETE RESTRICT
                    ON UPDATE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");

        /*
        |--------------------------------------------------------------------------
        | ACTIVITY LOGS
        |--------------------------------------------------------------------------
        */

        $this->db->query("
            CREATE TABLE `activity_logs` (
                `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                `user_id` bigint unsigned DEFAULT NULL,
                `aktivitas` varchar(100)
                    COLLATE utf8mb4_unicode_ci NOT NULL,
                `modul` varchar(100)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `referensi_id` bigint unsigned DEFAULT NULL,
                `deskripsi` text
                    COLLATE utf8mb4_unicode_ci,
                `ip_address` varchar(45)
                    COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (`id`),
                KEY `idx_activity_user` (`user_id`),
                KEY `idx_activity_modul` (`modul`),
                KEY `idx_activity_created_at` (`created_at`),

                CONSTRAINT `fk_activity_logs_user`
                    FOREIGN KEY (`user_id`)
                    REFERENCES `users` (`id`)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down()
    {
        /*
         * Drop tabel anak terlebih dahulu
         * supaya foreign key tidak bermasalah.
         */

        $this->db->query(
            'DROP TABLE IF EXISTS `activity_logs`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `notifikasi`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `login_logs`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `arsip`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `disposisi`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `surat_keluar`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `surat_masuk`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `password_reset_otps`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `auth_tokens`'
        );

        $this->db->query(
            'DROP TABLE IF EXISTS `users`'
        );
    }
}