<?php

use App\Database\Seeds\UsersSeeder;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\DatabaseTestTrait;
use Config\Database;

/**
 * @internal
 */
final class UsersSeederTest extends CIUnitTestCase
{
    use DatabaseTestTrait;

    protected $namespace = 'App';

    private function jalankanSeeder(): void
    {
        // Seeder mengeluarkan output progres; buffer agar
        // test tidak dianggap risky karena mencetak output.
        ob_start();

        (new UsersSeeder(config(Database::class), db_connect()))->run();

        ob_end_clean();
    }

    public function testSeederMembuatSatuAkunPerRole(): void
    {
        $this->jalankanSeeder();

        $roles = db_connect()->table('users')
            ->select('username, role')
            ->whereIn('username', ['admin', 'kepala_seksi', 'staf'])
            ->get()
            ->getResultArray();

        $this->assertCount(3, $roles);

        $byUsername = [];

        foreach ($roles as $row) {
            $byUsername[$row['username']] = $row['role'];
        }

        $this->assertSame('admin', $byUsername['admin']);
        $this->assertSame('kepala_seksi', $byUsername['kepala_seksi']);
        $this->assertSame('staf', $byUsername['staf']);
    }

    public function testSeederIdempotentTidakMenduplikasi(): void
    {
        $this->jalankanSeeder();
        $this->jalankanSeeder();

        $count = db_connect()->table('users')
            ->whereIn('username', ['admin', 'kepala_seksi', 'staf'])
            ->countAllResults();

        $this->assertSame(3, $count);
    }

    public function testSeederMenyimpanPasswordTerhash(): void
    {
        $this->jalankanSeeder();

        $admin = db_connect()->table('users')
            ->where('username', 'admin')
            ->get()
            ->getRowArray();

        $this->assertNotSame('admin123', $admin['password']);
        $this->assertTrue(password_verify('admin123', $admin['password']));
    }
}
