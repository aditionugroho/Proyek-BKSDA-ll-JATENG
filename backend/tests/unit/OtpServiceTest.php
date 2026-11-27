<?php

use App\Services\OtpService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * @internal
 */
final class OtpServiceTest extends CIUnitTestCase
{
    private OtpService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new OtpService();
    }

    public function testOtpTerdiriDariEnamKarakter(): void
    {
        $this->assertSame(6, strlen($this->service->generateOtp()));
    }

    public function testOtpHanyaBerisiAngka(): void
    {
        $this->assertMatchesRegularExpression('/^[0-9]{6}$/', $this->service->generateOtp());
    }

    public function testOtpBeradaPadaRentangValid(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $otp = (int) $this->service->generateOtp();

            $this->assertGreaterThanOrEqual(100000, $otp);
            $this->assertLessThanOrEqual(999999, $otp);
        }
    }

    public function testOtpBerubahPadaSetiapPanggilan(): void
    {
        $otp = [];

        for ($i = 0; $i < 5; $i++) {
            $otp[] = $this->service->generateOtp();
        }

        $this->assertCount(5, array_unique($otp), 'OTP tidak boleh identik pada lima panggilan beruntun.');
    }
}
