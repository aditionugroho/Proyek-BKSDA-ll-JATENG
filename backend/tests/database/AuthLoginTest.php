<?php

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;
use CodeIgniter\Test\TestResponse;

/**
 * Menguji logika login satu query: pencocokan username, email,
 * dan nama beserta urutan prioritasnya.
 *
 * @internal
 */
final class AuthLoginTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $namespace = 'App';

    private string $usernamePrefix = 'logintest_';

    protected function setUp(): void
    {
        parent::setUp();

        // Bersihkan sisa fixture dari run sebelumnya.
        $this->hapusFixture();
        service('cache')->clean();
    }

    protected function tearDown(): void
    {
        $this->hapusFixture();
        service('cache')->clean();

        parent::tearDown();
    }

    private function hapusFixture(): void
    {
        $db = db_connect();

        $userIds = array_column(
            $db->table('users')
                ->select('id')
                ->like('username', $this->usernamePrefix, 'after')
                ->get()
                ->getResultArray(),
            'id'
        );

        if ($userIds !== []) {
            $db->table('login_logs')->whereIn('user_id', $userIds)->delete();
            $db->table('users')->whereIn('id', $userIds)->delete();
        }
    }

    private function buatUser(
        string $name,
        ?string $email = null,
        int $status = 1,
        string $password = 'rahasia123'
    ): array {
        $username = $this->usernamePrefix . bin2hex(random_bytes(4));

        $db = db_connect();

        $db->table('users')->insert([
            'name'        => $name,
            'username'    => $username,
            'email'       => $email,
            'no_whatsapp' => null,
            'password'    => password_hash($password, PASSWORD_BCRYPT),
            'role'        => 'staf',
            'jabatan'     => 'Staf',
            'status'      => $status,
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ]);

        return [
            'id'       => (int) $db->insertID(),
            'username' => $username,
            'email'    => $email,
            'name'     => $name,
        ];
    }

    private function login(string $username, string $password): TestResponse
    {
        return $this->withHeaders(['Content-Type' => 'application/json'])
            ->withBody(json_encode([
                'username' => $username,
                'password' => $password,
            ]))
            ->post('/api/auth/login');
    }

    public function testLoginBerhasilDenganUsername(): void
    {
        $user = $this->buatUser('Tester Username', 'testerusername@sksda.test');

        $response = $this->login($user['username'], 'rahasia123');

        $response->assertStatus(200);

        $data = json_decode($response->getJSON(), true);

        $this->assertTrue($data['status']);
        $this->assertNotEmpty($data['data']['token']);
    }

    public function testLoginBerhasilDenganEmail(): void
    {
        $this->buatUser('Tester Email', 'testeremail@sksda.test');

        $response = $this->login('testeremail@sksda.test', 'rahasia123');

        $response->assertStatus(200);

        $data = json_decode($response->getJSON(), true);

        $this->assertTrue($data['status']);
    }

    public function testLoginEmailTidakCaseSensitive(): void
    {
        $this->buatUser('Tester Email Kapital', 'testerkapital@sksda.test');

        $response = $this->login('TESTERKAPITAL@SKSDA.TEST', 'rahasia123');

        $response->assertStatus(200);
    }

    public function testLoginBerhasilDenganNama(): void
    {
        $name = 'Nama Unik ' . bin2hex(random_bytes(3));

        $this->buatUser($name);

        $response = $this->login($name, 'rahasia123');

        $response->assertStatus(200);
    }

    public function testLoginPasswordSalahDitolak(): void
    {
        $user = $this->buatUser('Tester Password Salah');

        $response = $this->login($user['username'], 'passwordsalah');

        $response->assertStatus(401);

        $data = json_decode($response->getJSON(), true);

        $this->assertFalse($data['status']);
    }

    public function testLoginUserTidakDikenalDitolak(): void
    {
        $response = $this->login($this->usernamePrefix . 'takada', 'apaaja');

        $response->assertStatus(401);
    }

    public function testLoginUserNonaktifDitolak(): void
    {
        $user = $this->buatUser('Tester Nonaktif', null, 0);

        $response = $this->login($user['username'], 'rahasia123');

        $response->assertStatus(401);
    }

    public function testLoginNamaAmbiguDitolak(): void
    {
        $name = 'Nama Ambigu ' . bin2hex(random_bytes(3));

        $this->buatUser($name);
        $this->buatUser($name);

        $response = $this->login($name, 'rahasia123');

        $response->assertStatus(409);

        $data = json_decode($response->getJSON(), true);

        $this->assertStringContainsString('username', $data['message']);
    }
}
