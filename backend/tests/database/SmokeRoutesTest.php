<?php

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;

/**
 * Smoke test jalur publik dan proteksi API.
 *
 * @internal
 */
final class SmokeRoutesTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $namespace = 'App';

    public function testHalamanUtamaTersedia(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function testApiResortPublikMengembalikanJson(): void
    {
        $response = $this->get('/api/public/resorts');

        $response->assertStatus(200);

        $data = json_decode($response->getJSON(), true);

        $this->assertTrue($data['status']);
        $this->assertArrayHasKey('data', $data);
    }

    public function testApiTerproteksiMenolakTanpaToken(): void
    {
        $response = $this->get('/api/users');

        $response->assertStatus(401);
    }
}
