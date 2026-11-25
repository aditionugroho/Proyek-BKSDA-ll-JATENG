<?php

namespace App\Libraries;

final class SuratAttachmentPath
{
    /** @return array{status: string, path?: string, name?: string} */
    public static function resolve(string $folder, ?string $relativePath): array
    {
        if ($relativePath === null || $relativePath === '') {
            return ['status' => 'none'];
        }

        if (!in_array($folder, ['surat_masuk', 'surat_keluar'], true)) {
            return ['status' => 'unsafe'];
        }

        $relativePath = str_replace('\\', '/', $relativePath);
        if (!preg_match('#^' . $folder . '/([A-Za-z0-9._-]+)$#D', $relativePath, $matches)
            || in_array($matches[1], ['.', '..'], true)) {
            return ['status' => 'unsafe'];
        }

        clearstatcache(true);
        $base = realpath(WRITEPATH);
        if ($base === false) {
            return ['status' => 'unsafe'];
        }

        $directory = $base . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $folder;
        $candidate = $directory . DIRECTORY_SEPARATOR . $matches[1];
        $resolvedDirectory = realpath($directory);
        if (($resolvedDirectory !== false && $resolvedDirectory !== $directory) || is_link($candidate)) {
            return ['status' => 'unsafe'];
        }

        $file = realpath($candidate);
        if ($file === false && !file_exists($candidate)) {
            return ['status' => 'missing'];
        }
        if ($file !== $candidate || !is_file($file)) {
            return ['status' => 'unsafe'];
        }

        return ['status' => 'valid', 'path' => $file, 'name' => $matches[1]];
    }
}
