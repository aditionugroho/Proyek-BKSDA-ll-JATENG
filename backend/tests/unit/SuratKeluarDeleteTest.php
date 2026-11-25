<?php

use App\Controllers\Api\SuratKeluarController;
use App\Models\ActivityLogModel;
use App\Models\AuthTokenModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Services;

final class SuratKeluarDeleteTest extends CIUnitTestCase
{
    private string $file;
    private string $relativePath;

    protected function setUp(): void
    {
        parent::setUp();
        $folder = WRITEPATH . 'uploads/surat_keluar';
        if (!is_dir($folder)) {
            mkdir($folder, 0775, true);
        }
        $name = 'delete-test-' . bin2hex(random_bytes(8)) . '.pdf';
        $this->file = $folder . DIRECTORY_SEPARATOR . $name;
        $this->relativePath = 'surat_keluar/' . $name;
    }

    protected function tearDown(): void
    {
        if (is_file($this->file)) {
            unlink($this->file);
        }
        parent::tearDown();
    }

    private function controller(?string $role = 'admin'): SuratKeluarController
    {
        $controller = $this->getMockBuilder(SuratKeluarController::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['deleteSuratRecord', 'unlinkAttachment'])
            ->getMock();
        $token = $this->createMock(AuthTokenModel::class);
        $token->method('__call')->willReturnSelf();
        $token->method('first')->willReturn($role === null ? null : ['user_id' => 17]);
        $user = $this->createMock(UserModel::class);
        $user->method('__call')->willReturnSelf();
        $user->method('first')->willReturn(['id' => 17, 'role' => $role]);
        $activity = $this->createMock(ActivityLogModel::class);
        foreach (['tokenModel' => $token, 'userModel' => $user, 'activityLogModel' => $activity] as $property => $value) {
            (new ReflectionProperty(SuratKeluarController::class, $property))->setValue($controller, $value);
        }
        $request = $this->createMock(IncomingRequest::class);
        $request->method('getHeaderLine')->with('Authorization')->willReturn('Bearer fixture');
        $request->method('negotiate')->willReturn('application/json');
        $request->method('getIPAddress')->willReturn('127.0.0.1');
        $controller->initController($request, Services::response(null, false), Services::logger());
        return $controller;
    }

    public function testDraftDeletionRemovesAttachmentAfterDatabaseConfirmation(): void
    {
        file_put_contents($this->file, 'fixture');
        $controller = $this->controller();
        $confirmed = false;
        $controller->expects($this->once())->method('deleteSuratRecord')->with(1)
            ->willReturnCallback(function () use (&$confirmed) {
                $this->assertFileExists($this->file);
                $confirmed = true;
                return ['no_agenda' => 'TEST', 'file_path' => $this->relativePath];
            });
        $controller->expects($this->once())->method('unlinkAttachment')
            ->willReturnCallback(function (string $file) use (&$confirmed) {
                $this->assertTrue($confirmed);
                return unlink($file);
            });

        $response = $controller->delete(1);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('removed', json_decode($response->getBody(), true)['data']['attachment_cleanup']);
        $this->assertFileDoesNotExist($this->file);
    }

    public function testDatabaseFailureLeavesAttachmentIntact(): void
    {
        file_put_contents($this->file, 'fixture');
        $controller = $this->controller();
        $controller->expects($this->once())->method('deleteSuratRecord')
            ->willThrowException(new RuntimeException('Database failure'));
        $controller->expects($this->never())->method('unlinkAttachment');

        $response = $controller->delete(1);
        $this->assertSame(500, $response->getStatusCode());
        $this->assertFalse(json_decode($response->getBody(), true)['status']);
        $this->assertFileExists($this->file);
    }

    public function testArchivedLetterReturnsConflictWithoutRemovingAttachment(): void
    {
        file_put_contents($this->file, 'fixture');
        $controller = $this->controller();
        $controller->expects($this->once())->method('deleteSuratRecord')
            ->willThrowException(new DomainException('Surat keluar masih digunakan oleh arsip.'));
        $controller->expects($this->never())->method('unlinkAttachment');

        $response = $controller->delete(1);
        $this->assertSame(409, $response->getStatusCode());
        $this->assertFalse(json_decode($response->getBody(), true)['status']);
        $this->assertFileExists($this->file);
    }

    public function testFileDeletionFailureReportsPendingCleanup(): void
    {
        file_put_contents($this->file, 'fixture');
        $controller = $this->controller();
        $controller->expects($this->once())->method('deleteSuratRecord')
            ->willReturn(['no_agenda' => 'TEST', 'file_path' => $this->relativePath]);
        $controller->expects($this->once())->method('unlinkAttachment')->willReturn(false);

        $response = $controller->delete(1);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('pending', json_decode($response->getBody(), true)['data']['attachment_cleanup']);
        $this->assertFileExists($this->file);
    }

    public function testMissingAttachmentDoesNotBlockRecordDeletion(): void
    {
        $controller = $this->controller();
        $controller->expects($this->once())->method('deleteSuratRecord')
            ->willReturn(['no_agenda' => 'TEST', 'file_path' => $this->relativePath]);
        $controller->expects($this->never())->method('unlinkAttachment');

        $response = $controller->delete(1);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('missing', json_decode($response->getBody(), true)['data']['attachment_cleanup']);
    }

    public function testUnsafeAttachmentPathIsNeverUnlinked(): void
    {
        file_put_contents($this->file, 'fixture');
        $controller = $this->controller();
        $controller->expects($this->once())->method('deleteSuratRecord')
            ->willReturn(['no_agenda' => 'TEST', 'file_path' => 'surat_keluar/../surat_keluar/' . basename($this->file)]);
        $controller->expects($this->never())->method('unlinkAttachment');

        $response = $controller->delete(1);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame('unsafe', json_decode($response->getBody(), true)['data']['attachment_cleanup']);
        $this->assertFileExists($this->file);
    }

    public function testNonAdminsAndUnauthenticatedUsersCannotDelete(): void
    {
        foreach (['staf', 'kepala_seksi', null] as $role) {
            $controller = $this->controller($role);
            $controller->expects($this->never())->method('deleteSuratRecord');
            $controller->expects($this->never())->method('unlinkAttachment');

            $this->assertSame($role === null ? 401 : 403, $controller->delete(1)->getStatusCode());
        }
    }
}
