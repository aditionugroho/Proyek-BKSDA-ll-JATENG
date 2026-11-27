<?php

use App\Database\Seeds\UsersSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use CodeIgniter\Test\FeatureTestTrait;
use CodeIgniter\Test\TestResponse;
use Config\Database;

/**
 * Menguji pembaruan user oleh admin: revokasi token setelah
 * pergantian password dan penolakan nilai non-teks.
 *
 * @internal
 */
final class UserAdminTest extends CIUnitTestCase
{
    use DatabaseTestTrait;
    use FeatureTestTrait;

    protected $namespace = 'App';

    private string $usernamePrefix = 'logintest_';

    protected function setUp(): void
    {
        parent::setUp();

        $this->hapusFixture();

        // Kelas ini berjalan sebelum UsersSeederTest secara
        // alfabetis; seed admin sendiri agar independen.
        ob_start();

        (new UsersSeeder(config(Database::class), db_connect()))->run();

        ob_end_clean();
        service('cache')->clean();
    }

    protected function tearDown(): void
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
            $db->table('auth_tokens')->whereIn('user_id', $userIds)->delete();
            $db->table('users')->whereIn('id', $userIds)->delete();
        }

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
            $db->table('auth_tokens')->whereIn('user_id', $userIds)->delete();
            $db->table('users')->whereIn('id', $userIds)->delete();
        }
    }

    private function buatStaf(string $password = 'rahasia123'): array
    {
        $username = $this->usernamePrefix . bin2hex(random_bytes(4));

        $db = db_connect();

        $db->table('users')->insert([
            'name'        => 'Staf Test',
            'username'    => $username,
            'email'       => $username . '@sksda.test',
            'no_whatsapp' => null,
            'password'    => password_hash($password, PASSWORD_BCRYPT),
            'role'        => 'staf',
            'jabatan'     => 'Staf',
            'status'      => 1,
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ]);

        return [
            'id'       => (int) $db->insertID(),
            'username' => $username,
        ];
    }

    private function login(string $username, string $password): string
    {
        $response = $this->withHeaders(['Content-Type' => 'application/json'])
            ->withBody(json_encode([
                'username' => $username,
                'password' => $password,
            ]))
            ->post('/api/auth/login');

        $response->assertStatus(200);

        $data = json_decode($response->getJSON(), true);

        return (string) $data['data']['token'];
    }

    private function adminToken(): string
    {
        return $this->login('admin', 'admin123');
    }

    private function profilDenganToken(string $token): TestResponse
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->get('/api/profil');
    }

    public function testGantiPasswordOlehAdminMencabutTokenLama(): void
    {
        $this->adminToken();

        $staf = $this->buatStaf();
        $stafTokenLama = $this->login($staf['username'], 'rahasia123');

        // Token lama masih valid sebelum pergantian password.
        $this->profilDenganToken($stafTokenLama)->assertStatus(200);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken(),
            'Content-Type'  => 'application/json',
        ])
            ->withBody(json_encode(['password' => 'PasswordBaru123']))
            ->put('/api/users/' . $staf['id']);

        $response->assertStatus(200);

        // Token lama harus sudah dicabut.
        $this->profilDenganToken($stafTokenLama)->assertStatus(401);

        // Token baru tetap tidak diperbarui otomatis; login
        // kembali dengan password baru harus berhasil.
        $tokenBaru = $this->login($staf['username'], 'PasswordBaru123');

        $this->profilDenganToken($tokenBaru)->assertStatus(200);
    }

    public function testUpdateFieldNonTeksDitolak(): void
    {
        $staf = $this->buatStaf();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->adminToken(),
            'Content-Type'  => 'application/json',
        ])
            ->withBody(json_encode(['name' => ['bukan', 'teks']]))
            ->put('/api/users/' . $staf['id']);

        $response->assertStatus(422);
    }
}
