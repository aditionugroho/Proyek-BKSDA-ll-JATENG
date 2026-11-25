<?php

use App\Controllers\Api\SuratKeluarController;
use App\Libraries\SuratAttachmentPath;
use CodeIgniter\Test\CIUnitTestCase;

final class SuratKeluarAttachmentPathTest extends CIUnitTestCase
{
    private function resolve(?string $metadata): array
    {
        $controller = (new ReflectionClass(SuratKeluarController::class))->newInstanceWithoutConstructor();
        $method = new ReflectionMethod(SuratKeluarController::class, 'resolveAttachment');
        return $method->invoke($controller, $metadata);
    }

    public function testUnsafeMetadataIsRejected(): void
    {
        foreach ([
            'surat_keluar/../external.pdf',
            'surat_keluar/..\\external.pdf',
            'surat_keluar/..',
            'surat_masuk/external.pdf',
            'C:/fixture/external.pdf',
            '/fixture/external.pdf',
            "surat_keluar/file.pdf\0",
            'surat_keluar/file.pdf:stream',
        ] as $metadata) {
            $this->assertSame(['status' => 'unsafe'], $this->resolve($metadata));
        }
    }

    public function testMissingFileIsReportedWithoutAPath(): void
    {
        $name = 'missing-' . bin2hex(random_bytes(8)) . '.pdf';
        $this->assertSame(['status' => 'missing'], $this->resolve('surat_keluar/' . $name));
    }

    public function testNormalFileResolvesWithoutChangingItsContents(): void
    {
        $root = WRITEPATH . 'uploads/surat_keluar';
        if (!is_dir($root)) {
            mkdir($root, 0775, true);
        }
        $name = 'resolve-' . bin2hex(random_bytes(8)) . '.pdf';
        $file = $root . DIRECTORY_SEPARATOR . $name;
        file_put_contents($file, 'fixture');
        try {
            $this->assertSame(
                ['status' => 'valid', 'path' => realpath($file), 'name' => $name],
                $this->resolve('surat_keluar/' . $name)
            );
            $this->assertSame('fixture', file_get_contents($file));
        } finally {
            unlink($file);
        }
    }

    public function testSymbolicLinkToFileOutsideStorageIsRejected(): void
    {
        $root = WRITEPATH . 'uploads/surat_keluar';
        if (!is_dir($root)) {
            mkdir($root, 0775, true);
        }
        $name = 'external-' . bin2hex(random_bytes(8)) . '.pdf';
        $target = WRITEPATH . $name;
        $link = $root . DIRECTORY_SEPARATOR . $name;
        file_put_contents($target, 'outside fixture');

        try {
            if (!@symlink($target, $link)) {
                $this->markTestSkipped('The test account cannot create symbolic links.');
            }
            $this->assertSame(['status' => 'unsafe'], $this->resolve('surat_keluar/' . $name));
            $this->assertSame('outside fixture', file_get_contents($target));
        } finally {
            if (is_link($link)) {
                unlink($link);
            }
            unlink($target);
        }
    }

    public function testIncomingLetterAcceptsOnlyItsOwnCanonicalStorage(): void
    {
        $folder = WRITEPATH . 'uploads/surat_masuk';
        if (!is_dir($folder)) {
            mkdir($folder, 0775, true);
        }
        $name = 'incoming-' . bin2hex(random_bytes(8)) . '.pdf';
        $path = $folder . DIRECTORY_SEPARATOR . $name;
        file_put_contents($path, 'incoming fixture');
        try {
            $this->assertSame(
                ['status' => 'valid', 'path' => realpath($path), 'name' => $name],
                SuratAttachmentPath::resolve('surat_masuk', 'surat_masuk/' . $name)
            );
            foreach ([
                'surat_keluar/' . $name,
                'surat_masuk/../surat_masuk/' . $name,
                $path,
                'surat_masuk/' . $name . ':stream',
            ] as $metadata) {
                $this->assertSame(['status' => 'unsafe'], SuratAttachmentPath::resolve('surat_masuk', $metadata));
            }
            $this->assertSame('incoming fixture', file_get_contents($path));
            $this->assertSame(['status' => 'missing'], SuratAttachmentPath::resolve('surat_masuk', 'surat_masuk/missing-' . $name));
        } finally {
            unlink($path);
        }
    }
}
