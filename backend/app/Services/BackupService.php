<?php

namespace App\Services;

use RuntimeException;

class BackupService
{
    protected array $dbConfig;

    protected string $mysqldumpPath;
    protected string $mysqlPath;
    protected string $backupDirectory;

    protected int $retentionDays;

    public function __construct()
    {
        $databaseConfig = config('Database');

        $this->dbConfig =
            $databaseConfig->default;

        $this->mysqldumpPath =
            (string) env(
                'backup.mysqldumpPath',
                'mysqldump'
            );

        $this->mysqlPath =
            (string) env(
                'backup.mysqlPath',
                'mysql'
            );

        $this->backupDirectory =
            rtrim(
                (string) env(
                    'backup.directory',
                    ''
                ),
                '/\\'
            );

        $this->retentionDays =
            (int) env(
                'backup.retentionDays',
                30
            );

        if ($this->backupDirectory === '') {
            throw new RuntimeException(
                'Direktori backup belum dikonfigurasi.'
            );
        }

        $this->ensureBackupDirectory();
    }

    /*
    |--------------------------------------------------------------------------
    | ENSURE BACKUP DIRECTORY
    |--------------------------------------------------------------------------
    */

    protected function ensureBackupDirectory(): void
    {
        if (is_dir($this->backupDirectory)) {
            return;
        }

        if (
            !mkdir(
                $this->backupDirectory,
                0755,
                true
            ) &&
            !is_dir($this->backupDirectory)
        ) {
            throw new RuntimeException(
                'Gagal membuat direktori backup.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE INFO
    |--------------------------------------------------------------------------
    */

    protected function getDatabaseInfo(): array
    {
        return [
            'host' =>
                $this->dbConfig['hostname']
                ?? '127.0.0.1',

            'port' =>
                (string) (
                    $this->dbConfig['port']
                    ?? 3306
                ),

            'username' =>
                $this->dbConfig['username']
                ?? '',

            'password' =>
                $this->dbConfig['password']
                ?? '',

            'database' =>
                $this->dbConfig['database']
                ?? '',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PROCESS ENVIRONMENT
    |--------------------------------------------------------------------------
    */

    protected function getProcessEnvironment(
        string $password
    ): array {
        $environment = getenv();

        if (!is_array($environment)) {
            $environment = [];
        }

        /*
         * Password tidak ditaruh di command argument.
         */

        $environment['MYSQL_PWD'] =
            $password;

        return $environment;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE BACKUP
    |--------------------------------------------------------------------------
    */

    public function createBackup(
        string $type = 'manual'
    ): array {
        $database =
            $this->getDatabaseInfo();

        if ($database['database'] === '') {
            throw new RuntimeException(
                'Nama database tidak ditemukan.'
            );
        }

        $safeType =
            preg_replace(
                '/[^a-zA-Z0-9_-]/',
                '',
                $type
            );

        if ($safeType === '') {
            $safeType = 'manual';
        }

        $safeDatabase =
            preg_replace(
                '/[^a-zA-Z0-9_-]/',
                '',
                $database['database']
            );

        $filename =
            $safeDatabase
            . '_'
            . $safeType
            . '_'
            . date('Ymd_His')
            . '.sql';

        $filePath =
            $this->backupDirectory
            . DIRECTORY_SEPARATOR
            . $filename;

        $command = [
            $this->mysqldumpPath,

            '--host=' .
                $database['host'],

            '--port=' .
                $database['port'],

            '--user=' .
                $database['username'],

            '--protocol=TCP',

            '--default-character-set=utf8mb4',

            '--single-transaction',

            '--quick',

            '--routines',

            '--triggers',

            '--events',

            '--set-gtid-purged=OFF',

            '--no-tablespaces',

            '--result-file=' .
                $filePath,

            $database['database'],
        ];

        $descriptorSpec = [
            0 => [
                'pipe',
                'r',
            ],

            1 => [
                'pipe',
                'w',
            ],

            2 => [
                'pipe',
                'w',
            ],
        ];

        $process =
            proc_open(
                $command,
                $descriptorSpec,
                $pipes,
                null,
                $this->getProcessEnvironment(
                    $database['password']
                )
            );

        if (!is_resource($process)) {
            throw new RuntimeException(
                'Gagal menjalankan proses backup.'
            );
        }

        fclose($pipes[0]);

        $stdout =
            stream_get_contents(
                $pipes[1]
            );

        fclose($pipes[1]);

        $stderr =
            stream_get_contents(
                $pipes[2]
            );

        fclose($pipes[2]);

        $exitCode =
            proc_close($process);

        if ($exitCode !== 0) {

            if (is_file($filePath)) {
                @unlink($filePath);
            }

            throw new RuntimeException(
                'Backup database gagal. '
                . trim(
                    $stderr !== ''
                        ? $stderr
                        : $stdout
                )
            );
        }

        if (
            !is_file($filePath) ||
            filesize($filePath) === 0
        ) {
            throw new RuntimeException(
                'File backup tidak berhasil dibuat.'
            );
        }

        $deletedFiles =
            $this->cleanupOldBackups();

        return [
            'filename' =>
                $filename,

            'path' =>
                $filePath,

            'size' =>
                (int) filesize($filePath),

            'created_at' =>
                date(
                    'Y-m-d H:i:s',
                    filemtime($filePath)
                ),

            'type' =>
                $safeType,

            'deleted_old_backups' =>
                $deletedFiles,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LIST BACKUPS
    |--------------------------------------------------------------------------
    */

    public function listBackups(): array
    {
        $files =
            glob(
                $this->backupDirectory
                . DIRECTORY_SEPARATOR
                . '*.sql'
            );

        if ($files === false) {
            return [];
        }

        $result = [];

        foreach ($files as $file) {

            if (!is_file($file)) {
                continue;
            }

            $result[] = [
                'filename' =>
                    basename($file),

                'size' =>
                    (int) filesize($file),

                'created_at' =>
                    date(
                        'Y-m-d H:i:s',
                        filemtime($file)
                    ),
            ];
        }

        usort(
            $result,
            static function (
                array $a,
                array $b
            ): int {
                return strcmp(
                    $b['created_at'],
                    $a['created_at']
                );
            }
        );

        return $result;
    }

    /*
    |--------------------------------------------------------------------------
    | GET BACKUP PATH
    |--------------------------------------------------------------------------
    */

    public function getBackupPath(
        string $filename
    ): string {
        $filename =
            basename($filename);

        if (
            !preg_match(
                '/^[a-zA-Z0-9._-]+\.sql$/',
                $filename
            )
        ) {
            throw new RuntimeException(
                'Nama file backup tidak valid.'
            );
        }

        $path =
            $this->backupDirectory
            . DIRECTORY_SEPARATOR
            . $filename;

        if (!is_file($path)) {
            throw new RuntimeException(
                'File backup tidak ditemukan.'
            );
        }

        return $path;
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE DATABASE
    |--------------------------------------------------------------------------
    */

    public function restore(
        string $filePath
    ): void {
        if (!is_file($filePath)) {
            throw new RuntimeException(
                'File restore tidak ditemukan.'
            );
        }

        if (
            strtolower(
                pathinfo(
                    $filePath,
                    PATHINFO_EXTENSION
                )
            ) !== 'sql'
        ) {
            throw new RuntimeException(
                'File restore harus berformat .sql.'
            );
        }

        $database =
            $this->getDatabaseInfo();

        $command = [
            $this->mysqlPath,

            '--host=' .
                $database['host'],

            '--port=' .
                $database['port'],

            '--user=' .
                $database['username'],

            '--protocol=TCP',

            '--default-character-set=utf8mb4',

            $database['database'],
        ];

        /*
         * File SQL langsung menjadi STDIN mysql.
         */

        $descriptorSpec = [
            0 => [
                'file',
                $filePath,
                'r',
            ],

            1 => [
                'pipe',
                'w',
            ],

            2 => [
                'pipe',
                'w',
            ],
        ];

        $process =
            proc_open(
                $command,
                $descriptorSpec,
                $pipes,
                null,
                $this->getProcessEnvironment(
                    $database['password']
                )
            );

        if (!is_resource($process)) {
            throw new RuntimeException(
                'Gagal menjalankan proses restore.'
            );
        }

        $stdout =
            stream_get_contents(
                $pipes[1]
            );

        fclose($pipes[1]);

        $stderr =
            stream_get_contents(
                $pipes[2]
            );

        fclose($pipes[2]);

        $exitCode =
            proc_close($process);

        if ($exitCode !== 0) {
            throw new RuntimeException(
                'Restore database gagal. '
                . trim(
                    $stderr !== ''
                        ? $stderr
                        : $stdout
                )
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CLEANUP BACKUP LAMA
    |--------------------------------------------------------------------------
    */

    public function cleanupOldBackups(): array
    {
        $files =
            glob(
                $this->backupDirectory
                . DIRECTORY_SEPARATOR
                . '*.sql'
            );

        if ($files === false) {
            return [];
        }

        $deleted = [];

        $cutoff =
            time() -
            (
                $this->retentionDays
                * 86400
            );

        foreach ($files as $file) {

            if (!is_file($file)) {
                continue;
            }

            $modifiedAt =
                filemtime($file);

            if (
                $modifiedAt !== false &&
                $modifiedAt < $cutoff
            ) {
                $filename =
                    basename($file);

                if (@unlink($file)) {
                    $deleted[] =
                        $filename;
                }
            }
        }

        return $deleted;
    }

    /*
    |--------------------------------------------------------------------------
    | BACKUP DIRECTORY
    |--------------------------------------------------------------------------
    */

    public function getBackupDirectory(): string
    {
        return $this->backupDirectory;
    }
}