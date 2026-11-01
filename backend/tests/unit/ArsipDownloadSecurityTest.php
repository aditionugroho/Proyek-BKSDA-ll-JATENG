<?php

use App\Controllers\Api\ArsipController;
use CodeIgniter\Test\CIUnitTestCase;

final class ArsipDownloadSecurityTest extends CIUnitTestCase
{
    private function resolvePath(string $path): ?string
    {
        $controller = (new ReflectionClass(ArsipController::class))
            ->newInstanceWithoutConstructor();

        $method = new ReflectionMethod(
            ArsipController::class,
            'resolveFilePath'
        );

        return $method->invoke($controller, $path);
    }

    public function testMenolakPathTraversal(): void
    {
        $this->assertNull(
            $this->resolvePath('surat_masuk/../../.env')
        );

        $this->assertNull(
            $this->resolvePath('surat_keluar/../../../config.php')
        );
    }

    public function testMenolakPathAbsolut(): void
    {
        $this->assertNull(
            $this->resolvePath('C:/Windows/win.ini')
        );

        $this->assertNull(
            $this->resolvePath('/etc/passwd')
        );
    }

    public function testMenolakFolderTidakDiizinkan(): void
    {
        $this->assertNull(
            $this->resolvePath('dokumen/arsip.pdf')
        );

        $this->assertNull(
            $this->resolvePath('uploads/arsip.pdf')
        );
    }

    public function testMenolakFileTidakDitemukan(): void
    {
        $this->assertNull(
            $this->resolvePath(
                'surat_masuk/e06_file_tidak_ada_999999.pdf'
            )
        );
    }

    public function testMenerimaFileValid(): void
    {
        $fileName = 'e06-security-fixture-' . bin2hex(random_bytes(8)) . '.pdf';
        $folder = WRITEPATH . 'uploads/surat_masuk';
        $filePath = $folder . DIRECTORY_SEPARATOR . $fileName;

        if (!is_dir($folder)) {
            mkdir($folder, 0775, true);
        }

        file_put_contents($filePath, '%PDF-1.4 test fixture');

        try {
            $resolvedPath = $this->resolvePath(
                'surat_masuk/' . $fileName
            );

            $this->assertNotNull($resolvedPath);
            $this->assertSame(realpath($filePath), $resolvedPath);
        } finally {
            if (is_file($filePath)) {
                unlink($filePath);
            }
        }
    }
}
