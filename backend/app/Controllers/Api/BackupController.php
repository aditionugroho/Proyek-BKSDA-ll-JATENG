<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\AuthTokenModel;
use App\Services\BackupService;
use CodeIgniter\API\ResponseTrait;
use Throwable;

class BackupController extends BaseController
{
    use ResponseTrait;

    protected BackupService $backupService;
    protected AuthTokenModel $tokenModel;

    protected $db;

    public function __construct()
    {
        $this->backupService =
            new BackupService();

        $this->tokenModel =
            new AuthTokenModel();

        $this->db =
            db_connect();
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT USER
    |--------------------------------------------------------------------------
    */

    private function currentUserId(): ?int
    {
        $authHeader =
            $this->request
                ->getHeaderLine(
                    'Authorization'
                );

        if (
            !$authHeader ||
            !preg_match(
                '/^Bearer\s+(\S+)$/i',
                $authHeader,
                $matches
            )
        ) {
            return null;
        }

        $tokenHash =
            hash(
                'sha256',
                $matches[1]
            );

        $token =
            $this->tokenModel
                ->where(
                    'token_hash',
                    $tokenHash
                )
                ->where(
                    'revoked_at',
                    null
                )
                ->first();

        if (!$token) {
            return null;
        }

        return (int) $token['user_id'];
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVITY LOG
    |--------------------------------------------------------------------------
    */

    private function activityLog(
        string $aktivitas,
        string $deskripsi
    ): void {
        $userId =
            $this->currentUserId();

        if ($userId !== null) {

            $userExists =
                $this->db
                    ->table('users')
                    ->where(
                        'id',
                        $userId
                    )
                    ->countAllResults() > 0;

            if (!$userExists) {
                $userId = null;
            }
        }

        try {

            $this->db
                ->table('activity_logs')
                ->insert([
                    'user_id' =>
                        $userId,

                    'aktivitas' =>
                        $aktivitas,

                    'modul' =>
                        'backup',

                    'referensi_id' =>
                        null,

                    'deskripsi' =>
                        $deskripsi,

                    'ip_address' =>
                        $this->request
                            ->getIPAddress(),

                    'created_at' =>
                        date('Y-m-d H:i:s'),
                ]);

        } catch (Throwable $e) {

            log_message(
                'error',
                'Gagal mencatat activity log backup: '
                . $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LIST BACKUP
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        try {

            $data =
                $this->backupService
                    ->listBackups();

            return $this->respond([
                'status' =>
                    true,

                'message' =>
                    'Daftar backup berhasil diambil.',

                'data' =>
                    $data,
            ]);

        } catch (Throwable $e) {

            log_message(
                'error',
                'List backup gagal: '
                . $e->getMessage()
            );

            return $this->respond([
                'status' =>
                    false,

                'message' =>
                    'Gagal mengambil daftar backup.',
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | MANUAL BACKUP
    |--------------------------------------------------------------------------
    */

    public function create()
    {
        try {

            $backup =
                $this->backupService
                    ->createBackup(
                        'manual'
                    );

            $this->activityLog(
                'backup_manual',
                'Membuat backup database manual: '
                . $backup['filename']
            );

            return $this->respond([
                'status' =>
                    true,

                'message' =>
                    'Backup database berhasil dibuat.',

                'data' => [
                    'filename' =>
                        $backup['filename'],

                    'size' =>
                        $backup['size'],

                    'created_at' =>
                        $backup['created_at'],
                ],
            ], 201);

        } catch (Throwable $e) {

            log_message(
                'error',
                'Backup manual gagal: '
                . $e->getMessage()
            );

            return $this->respond([
                'status' =>
                    false,

                'message' =>
                    'Backup database gagal.',

                'error' =>
                    ENVIRONMENT === 'development'
                        ? $e->getMessage()
                        : null,
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD BACKUP
    |--------------------------------------------------------------------------
    */

    public function download(
        string $filename = ''
    ) {
        try {

            $path =
                $this->backupService
                    ->getBackupPath(
                        $filename
                    );

            $safeFilename =
                basename($path);

            $this->activityLog(
                'download_backup',
                'Mengunduh file backup: '
                . $safeFilename
            );

            return $this->response
                ->download(
                    $path,
                    null
                )
                ->setFileName(
                    $safeFilename
                );

        } catch (Throwable $e) {

            return $this->respond([
                'status' =>
                    false,

                'message' =>
                    'File backup tidak ditemukan atau tidak valid.',
            ], 404);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE DATABASE
    |--------------------------------------------------------------------------
    */

    public function restore()
    {
        $json =
            $this->request
                ->getJSON(true);

        if (!is_array($json)) {
            $json = [];
        }

        $confirmation =
            trim(
                (string) (
                    $this->request
                        ->getPost(
                            'confirmation'
                        )
                    ??
                    $json['confirmation']
                    ??
                    ''
                )
            );

        if ($confirmation !== 'RESTORE') {

            return $this->respond([
                'status' =>
                    false,

                'message' =>
                    'Konfirmasi restore tidak valid. Gunakan nilai RESTORE.',
            ], 422);
        }

        $temporaryFile =
            null;

        try {

            $uploadedFile =
                $this->request
                    ->getFile(
                        'backup_file'
                    );

            /*
             * Restore dari upload file.
             */

            if (
                $uploadedFile &&
                $uploadedFile->isValid() &&
                !$uploadedFile->hasMoved()
            ) {

                $extension =
                    strtolower(
                        $uploadedFile
                            ->getClientExtension()
                    );

                if ($extension !== 'sql') {

                    return $this->respond([
                        'status' =>
                            false,

                        'message' =>
                            'File restore harus berformat .sql.',
                    ], 422);
                }

                $temporaryDirectory =
                    WRITEPATH
                    . 'uploads'
                    . DIRECTORY_SEPARATOR
                    . 'restore';

                if (
                    !is_dir(
                        $temporaryDirectory
                    )
                ) {
                    mkdir(
                        $temporaryDirectory,
                        0755,
                        true
                    );
                }

                $temporaryName =
                    'restore_'
                    . date('Ymd_His')
                    . '_'
                    . bin2hex(
                        random_bytes(4)
                    )
                    . '.sql';

                $uploadedFile->move(
                    $temporaryDirectory,
                    $temporaryName
                );

                $temporaryFile =
                    $temporaryDirectory
                    . DIRECTORY_SEPARATOR
                    . $temporaryName;

                $restoreFile =
                    $temporaryFile;

            } else {

                /*
                 * Restore dari file backup
                 * yang sudah ada di server.
                 */

                $filename =
                    trim(
                        (string) (
                            $this->request
                                ->getPost(
                                    'filename'
                                )
                            ??
                            $json['filename']
                            ??
                            ''
                        )
                    );

                if ($filename === '') {

                    return $this->respond([
                        'status' =>
                            false,

                        'message' =>
                            'File backup atau filename wajib diberikan.',
                    ], 422);
                }

                $restoreFile =
                    $this->backupService
                        ->getBackupPath(
                            $filename
                        );
            }

            /*
             * Safety backup sebelum restore.
             */

            $safetyBackup =
                $this->backupService
                    ->createBackup(
                        'pre_restore'
                    );

            /*
             * Jalankan restore.
             */

            $this->backupService
                ->restore(
                    $restoreFile
                );

            $this->activityLog(
                'restore_database',
                'Melakukan restore database. Safety backup: '
                . $safetyBackup['filename']
            );

            return $this->respond([
                'status' =>
                    true,

                'message' =>
                    'Restore database berhasil.',

                'data' => [
                    'safety_backup' =>
                        $safetyBackup['filename'],
                ],
            ]);

        } catch (Throwable $e) {

            log_message(
                'error',
                'Restore database gagal: '
                . $e->getMessage()
            );

            return $this->respond([
                'status' =>
                    false,

                'message' =>
                    'Restore database gagal.',

                'error' =>
                    ENVIRONMENT === 'development'
                        ? $e->getMessage()
                        : null,
            ], 500);

        } finally {

            if (
                $temporaryFile !== null &&
                is_file(
                    $temporaryFile
                )
            ) {
                @unlink(
                    $temporaryFile
                );
            }
        }
    }
}