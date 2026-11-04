<?php

namespace App\Services;

use App\Models\UploadRequestModel;

class UploadRetryService
{
    protected UploadRequestModel $uploadRequestModel;

    public function __construct()
    {
        $this->uploadRequestModel = new UploadRequestModel();
    }

    public function findRequest(
        int $userId,
        string $resourceType,
        int $resourceId,
        string $idempotencyKey
    ): ?array {
        return $this->uploadRequestModel
            ->where('user_id', $userId)
            ->where('resource_type', $resourceType)
            ->where('resource_id', $resourceId)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

    }


public function reserveRequest(
    int $userId,
    string $resourceType,
    int $resourceId,
    string $idempotencyKey,
    string $fileHash
): array {
    $existingRequest = $this->findRequest(
        $userId,
        $resourceType,
        $resourceId,
        $idempotencyKey
    );

    if ($existingRequest !== null) {
        return $this->checkRetry(
            $existingRequest,
            $fileHash
        );
    }

    $now = date('Y-m-d H:i:s');

    try {
        $insertId = $this->uploadRequestModel->insert([
            'user_id' => $userId,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'idempotency_key' => $idempotencyKey,
            'file_hash' => $fileHash,
            'file_path' => null,
            'status' => 'processing',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if ($insertId === false) {
            return [
                'status' => 'error',
                'http_code' => 500,
                'message' =>
                    'Gagal mencatat permintaan upload.',
            ];
        }

        return [
            'status' => 'reserved',
            'http_code' => 201,
            'request_id' => (int) $insertId,
            'message' =>
                'Permintaan upload berhasil dicatat.',
        ];
    } catch (\Throwable $exception) {
        // Jangan langsung menganggap semua exception
        // merupakan duplikasi key.
        // Periksa ulang apakah request sudah tercatat.
        $existingRequest = $this->findRequest(
            $userId,
            $resourceType,
            $resourceId,
            $idempotencyKey
        );

        if ($existingRequest !== null) {
            return $this->checkRetry(
                $existingRequest,
                $fileHash
            );
        }

        log_message(
            'error',
            'Gagal melakukan reservasi upload: ' .
            $exception->getMessage()
        );

        return [
            'status' => 'error',
            'http_code' => 500,
            'message' =>
                'Terjadi kesalahan saat mencatat upload.',
        ];
    }
}

    public function checkRetry(
        array $existingRequest,
        string $fileHash
    ): array {
        if (
            !hash_equals(
                (string) $existingRequest['file_hash'],
                $fileHash
            )
        ) {
            return [
                'status' => 'conflict',
                'http_code' => 409,
                'message' =>
                    'Idempotency-Key sudah digunakan untuk file berbeda.',
            ];
        }

        if ($existingRequest['status'] === 'failed') {
            return $this->retryFailedRequest(
                $existingRequest,
                $fileHash
            );
        }


        if ($existingRequest['status'] === 'completed') {
            $resourceType = (string) $existingRequest['resource_type'];
            $resourceId = (int) $existingRequest['resource_id'];
            $storedPath = (string) ($existingRequest['file_path'] ?? '');

            $validPath = in_array(
                $resourceType,
                ['surat_masuk', 'surat_keluar'],
                true
            ) && preg_match(
                '#^' . preg_quote($resourceType, '#') . '/[A-Za-z0-9._-]+$#D',
                $storedPath
            );

            if ($validPath) {
                try {
                    $db = \Config\Database::connect();

                    $surat = $db->table($resourceType)
                        ->select('file_path')
                        ->where('id', $resourceId)
                        ->get()
                        ->getRowArray();

                    $absolutePath = WRITEPATH . 'uploads/' . $storedPath;

                    if (
                        $surat !== null &&
                        ($surat['file_path'] ?? null) === $storedPath &&
                        is_file($absolutePath) &&
                        is_readable($absolutePath)
                    ) {
                        return [
                            'status' => 'completed',
                            'http_code' => 200,
                            'message' =>
                                'File sebelumnya sudah berhasil diunggah.',
                            'file_path' => $storedPath,
                        ];
                    }
                } catch (\Throwable $exception) {
                    log_message(
                        'error',
                        'E14 gagal memverifikasi retry completed: ' .
                        $exception->getMessage()
                    );

                    return [
                        'status' => 'error',
                        'http_code' => 500,
                        'message' =>
                            'Gagal memverifikasi status upload.',
                    ];
                }
            }

            return [
                'status' => 'conflict',
                'http_code' => 409,
                'message' =>
                    'Upload sebelumnya tercatat selesai, tetapi file tidak tersedia atau bukan lagi lampiran aktif.',
            ];
        }


        return [
            'status' => 'processing',
            'http_code' => 409,
            'message' =>
                'Upload dengan Idempotency-Key ini sedang diproses atau perlu pemulihan.',
        ];
    }




public function completeRequest(
    int $requestId,
    string $filePath
): bool {
    if ($requestId <= 0 || $filePath === '') {
        return false;
    }

    try {
        $db = \Config\Database::connect();

        $result = $db->table('upload_requests')
            ->where('id', $requestId)
            ->where('status', 'processing')
            ->update([
                'status' => 'completed',
                'file_path' => $filePath,
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        if ($result === false) {
            return false;
        }

        return $db->affectedRows() === 1;

    } catch (\Throwable $exception) {
        log_message(
            'error',
            'Gagal menyelesaikan metadata upload: ' .
            $exception->getMessage()
        );

        return false;
    }
}


    private function retryFailedRequest(
        array $existingRequest,
        string $fileHash
    ): array {
        $requestId = (int) $existingRequest['id'];

        try {
            $db = \Config\Database::connect();

            $updated = $db->table('upload_requests')
                ->where('id', $requestId)
                ->where('status', 'failed')
                ->where('file_hash', $fileHash)
                ->update([
                    'status' => 'processing',
                    'file_path' => null,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);

            if ($updated && $db->affectedRows() === 1) {
                return [
                    'status' => 'reserved',
                    'http_code' => 201,
                    'request_id' => $requestId,
                    'message' => 'Permintaan upload ulang diterima.',
                ];
            }

            return [
                'status' => 'processing',
                'http_code' => 409,
                'message' => 'Upload sedang diproses oleh permintaan lain.',
            ];
        } catch (\Throwable $exception) {
            log_message(
                'error',
                'Gagal mengaktifkan ulang upload: ' .
                $exception->getMessage()
            );

            return [
                'status' => 'error',
                'http_code' => 500,
                'message' => 'Gagal memproses permintaan upload ulang.',
            ];
        }
    }


    public function completeUploadTransaction(
        int $requestId,
        string $resourceType,
        int $resourceId,
        string $filePath
    ): bool {
        if (
            $requestId <= 0 ||
            $resourceId <= 0 ||
            $filePath === '' ||
            !in_array($resourceType, ['surat_masuk', 'surat_keluar'], true)
        ) {
            return false;
        }


        // E14: Pastikan path mengarah ke folder resource yang benar.
        if (!preg_match(
            '#^' . preg_quote($resourceType, '#') . '/[A-Za-z0-9._-]+$#D',
            $filePath
        )) {
            return false;
        }

        // Jangan menandai upload selesai jika file fisik tidak ada.
        $absolutePath = WRITEPATH . 'uploads/' . $filePath;

        if (!is_file($absolutePath) || !is_readable($absolutePath)) {
            return false;
        }

        $db = \Config\Database::connect();

        try {
            if (!$db->transBegin()) {
                return false;
            }

            // Pastikan surat masih ada dan kunci baris
            // selama transaksi berlangsung.
            $surat = $db->query(
                "SELECT id FROM {$resourceType} WHERE id = ? FOR UPDATE",
                [$resourceId]
            )->getRowArray();

            if (!$surat) {
                $db->transRollback();
                return false;
            }

            // E04: Lampiran surat masuk terkunci
            // setelah surat memiliki disposisi.
            if ($resourceType === 'surat_masuk') {
                $disposisi = $db->table('disposisi')
                    ->where('surat_masuk_id', $resourceId)
                    ->countAllResults();

                if ($disposisi > 0) {
                    $db->transRollback();
                    return false;
                }
            }

            $requestUpdated = $db->table('upload_requests')
                ->where('id', $requestId)
                ->where('resource_type', $resourceType)
                ->where('resource_id', $resourceId)
                ->where('status', 'processing')
                ->update([
                    'status' => 'completed',
                    'file_path' => $filePath,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);

            if (
                !$requestUpdated ||
                $db->affectedRows() !== 1
            ) {
                $db->transRollback();
                return false;
            }

            $suratUpdated = $db->table($resourceType)
                ->where('id', $resourceId)
                ->update([
                    'file_path' => $filePath,
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);

            if (
                !$suratUpdated ||
                $db->affectedRows() !== 1 ||
                $db->transStatus() === false
            ) {
                $db->transRollback();
                return false;
            }

            return $db->transCommit();

        } catch (\Throwable $exception) {
            $db->transRollback();

            log_message(
                'error',
                'Gagal menyelesaikan transaksi upload: ' .
                $exception->getMessage()
            );

            return false;
        }
    }

    public function failRequest(int $requestId): bool
    {
        if ($requestId <= 0) {
            return false;
        }

        try {
            $db = \Config\Database::connect();

            $result = $db->table('upload_requests')
                ->where('id', $requestId)
                ->where('status', 'processing')
                ->update([
                    'status' => 'failed',
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);

            if ($result === false) {
                return false;
            }

            return $db->affectedRows() === 1;

        } catch (\Throwable $exception) {
            log_message(
                'error',
                'Gagal memperbarui status upload gagal: ' .
                $exception->getMessage()
            );

            return false;
        }
    }


}
