<?php

namespace App\Commands;

use App\Services\BackupService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

class AutoBackup extends BaseCommand
{
    protected $group =
        'Backup';

    protected $name =
        'backup:auto';

    protected $description =
        'Membuat backup database otomatis dan membersihkan backup lama.';

    public function run(array $params)
    {
        try {

            $backupService =
                new BackupService();

            $backup =
                $backupService
                    ->createBackup(
                        'auto'
                    );

            /*
             * Catat activity log sebagai sistem.
             */

            try {

                $db =
                    db_connect();

                $db
                    ->table(
                        'activity_logs'
                    )
                    ->insert([
                        'user_id' =>
                            null,

                        'aktivitas' =>
                            'backup_otomatis',

                        'modul' =>
                            'backup',

                        'referensi_id' =>
                            null,

                        'deskripsi' =>
                            'Backup otomatis berhasil dibuat: '
                            . $backup['filename'],

                        'ip_address' =>
                            null,

                        'created_at' =>
                            date(
                                'Y-m-d H:i:s'
                            ),
                    ]);

            } catch (Throwable $e) {

                log_message(
                    'error',
                    'Gagal mencatat log backup otomatis: '
                    . $e->getMessage()
                );
            }

            CLI::write(
                'Backup otomatis berhasil.',
                'green'
            );

            CLI::write(
                'File: '
                . $backup['filename']
            );

            CLI::write(
                'Ukuran: '
                . $backup['size']
                . ' bytes'
            );

            if (
                !empty(
                    $backup[
                        'deleted_old_backups'
                    ]
                )
            ) {

                CLI::write(
                    'Backup lama yang dihapus: '
                    . implode(
                        ', ',
                        $backup[
                            'deleted_old_backups'
                        ]
                    ),
                    'yellow'
                );
            }

        } catch (Throwable $e) {

            log_message(
                'error',
                'Backup otomatis gagal: '
                . $e->getMessage()
            );

            CLI::error(
                'Backup otomatis gagal: '
                . $e->getMessage()
            );
        }
    }
}