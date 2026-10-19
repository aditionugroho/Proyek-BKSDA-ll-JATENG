<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class SuratExtractController extends BaseController
{
    use ResponseTrait;

    public function extract()
    {
        // ==========================================
        // 1. VALIDASI FILE UPLOAD
        // ==========================================

        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid() || $file->hasMoved()) {
            return $this->respond([
                'status' => false,
                'message' => 'File wajib diunggah melalui field file.',
            ], 422);
        }

        // Maksimal 10 MB
        if (
            $file->getSize() <= 0 ||
            $file->getSize() > 10 * 1024 * 1024
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Ukuran file harus antara 1 byte dan 10 MB.',
            ], 422);
        }

        // ==========================================
        // 2. VALIDASI FORMAT FILE
        // ==========================================

        $ext = strtolower(
            (string) $file->getClientExtension()
        );

        $mimes = [
            'pdf'  => ['application/pdf'],
            'png'  => ['image/png'],
            'jpg'  => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
        ];

        if (
            !isset($mimes[$ext]) ||
            !in_array(
                strtolower((string) $file->getMimeType()),
                $mimes[$ext],
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'File harus PDF, PNG, JPG, atau JPEG yang valid.',
            ], 422);
        }

        $path = $file->getTempName();

        // ==========================================
        // 3. VALIDASI RESOLUSI GAMBAR
        // ==========================================

        if ($ext !== 'pdf') {
            $info = @getimagesize($path);

            if (
                !$info ||
                ((int) $info[0] * (int) $info[1]) > 30000000
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Gambar rusak atau resolusinya terlalu besar.',
                ], 422);
            }
        }

        // ==========================================
        // 4. KONFIGURASI PYTHON
        // ==========================================

        $python = ROOTPATH
            . '.venv'
            . DIRECTORY_SEPARATOR
            . 'Scripts'
            . DIRECTORY_SEPARATOR
            . 'python.exe';

        $script = ROOTPATH
            . 'scripts'
            . DIRECTORY_SEPARATOR
            . 'extract_surat.py';

        if (
            !is_file($python) ||
            !is_file($script) ||
            !function_exists('proc_open')
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Layanan ekstraksi belum dikonfigurasi di server.',
            ], 503);
        }

        // ==========================================
        // 5. FILE OUTPUT SEMENTARA
        // ==========================================

        // File sementara dipakai agar output Python
        // tidak menyebabkan pipe blocking.

        $outPath = tempnam(
            sys_get_temp_dir(),
            'sx_out_'
        );

        $errPath = tempnam(
            sys_get_temp_dir(),
            'sx_err_'
        );

        if ($outPath === false || $errPath === false) {
            if ($outPath !== false) {
                @unlink($outPath);
            }

            if ($errPath !== false) {
                @unlink($errPath);
            }

            return $this->respond([
                'status' => false,
                'message' => 'Gagal menyiapkan proses ekstraksi.',
            ], 503);
        }

        $process = null;

        try {

            // ======================================
            // 6. JALANKAN SCRIPT PYTHON
            // ======================================

            // Argumen dipisah menggunakan array,
            // bukan dijalankan lewat command shell.

            $process = @proc_open(
                [
                    $python,
                    $script,
                    $path,
                    $ext
                ],
                [
                    0 => ['pipe', 'r'],
                    1 => ['file', $outPath, 'w'],
                    2 => ['file', $errPath, 'w'],
                ],
                $pipes,
                ROOTPATH,
                null,
                ['bypass_shell' => true]
            );

            if (!is_resource($process)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Proses ekstraksi tidak dapat dijalankan.',
                ], 503);
            }

            if (
                isset($pipes[0]) &&
                is_resource($pipes[0])
            ) {
                fclose($pipes[0]);
            }

            // ======================================
            // 7. TIMEOUT MAKSIMAL 25 DETIK
            // ======================================

            $deadline = microtime(true) + 25;

            while (true) {

                $state = proc_get_status($process);

                if (!$state['running']) {
                    break;
                }

                if (microtime(true) >= $deadline) {

                    @proc_terminate($process);
                    @proc_close($process);

                    $process = null;

                    return $this->respond([
                        'status' => false,
                        'message' => 'Ekstraksi melewati batas waktu 25 detik.',
                    ], 504);
                }

                usleep(100000);
            }

            // ======================================
            // 8. PERIKSA HASIL PROSES PYTHON
            // ======================================

            $exitCode = (int) $state['exitcode'];

            $closeCode = proc_close($process);

            $process = null;

            if ($exitCode === -1) {
                $exitCode = $closeCode;
            }

            if ($exitCode !== 0) {

                log_message(
                    'error',
                    'Ekstraksi Python gagal dengan kode ' .
                    $exitCode
                );

                return $this->respond([
                    'status' => false,
                    'message' => 'Terjadi kesalahan ketika membaca dokumen.',
                ], 500);
            }

            // ======================================
            // 9. BATASI OUTPUT PYTHON
            // ======================================

            $size = @filesize($outPath);

            if (
                $size === false ||
                $size < 2 ||
                $size > 65536
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Output ekstraksi tidak sesuai batas yang diizinkan.',
                ], 500);
            }

            // ======================================
            // 10. BACA JSON HASIL EKSTRAKSI
            // ======================================

            $stdout = @file_get_contents($outPath);

            $result = json_decode(
                (string) $stdout,
                true
            );

            if (!is_array($result)) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Hasil ekstraksi tidak dapat dibaca.',
                ], 500);
            }

            // ======================================
            // 11. PERIKSA STATUS EKSTRAKSI
            // ======================================

            if (($result['status'] ?? false) !== true) {
                return $this->respond([
                    'status' => false,
                    'message' => (string) (
                        $result['message']
                        ?? 'Dokumen tidak dapat diproses.'
                    ),
                ], 422);
            }

            // ======================================
            // 12. RESPONSE BERHASIL
            // ======================================

            return $this->respond([
                'status' => true,
                'message' => 'Ekstraksi selesai. Mohon periksa nomor surat sebelum menyimpan.',
                'data' => $result,
            ]);

        } catch (\Throwable $e) {

            log_message(
                'error',
                'Ekstraksi surat mengalami kegagalan internal.'
            );

            return $this->respond([
                'status' => false,
                'message' => 'Ekstraksi gagal diproses.',
            ], 500);

        } finally {

            // ======================================
            // 13. BERSIHKAN PROSES DAN FILE
            // ======================================

            if (is_resource($process)) {
                @proc_terminate($process);
                @proc_close($process);
            }

            @unlink($outPath);
            @unlink($errPath);
        }
    }
}
