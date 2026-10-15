<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;

class ResetAdminLocal extends BaseCommand
{
    protected $group = 'Development';
    protected $name = 'dev:reset-admin';
    protected $description = 'Reset password admin lokal.';

    public function run(array $params)
    {
        if (ENVIRONMENT !== 'development') {
            CLI::write(
                'Hanya boleh dijalankan di development.',
                'red'
            );
            return;
        }

        $password = trim((string) fgets(STDIN));

        if (strlen($password) < 12) {
            CLI::write(
                'Password minimal 12 karakter.',
                'red'
            );
            return;
        }

        $db = Database::connect();

        $admin = $db->table('users')
            ->select('id')
            ->where('username', 'admin')
            ->where('role', 'admin')
            ->where('status', 1)
            ->get()
            ->getRowArray();

        if (!$admin) {
            CLI::write('Admin aktif tidak ditemukan.', 'red');
            return;
        }

        $db->transStart();

        $db->table('users')
            ->where('id', $admin['id'])
            ->update([
                'password' => password_hash(
                    $password,
                    PASSWORD_BCRYPT
                ),
            ]);

        // Cabut token login admin yang lama.
        $db->table('auth_tokens')
            ->where('user_id', $admin['id'])
            ->where('revoked_at', null)
            ->update([
                'revoked_at' => date('Y-m-d H:i:s'),
            ]);

        $db->transComplete();

        if (!$db->transStatus()) {
            CLI::write('Reset password gagal.', 'red');
            return;
        }

        CLI::write(
            'Password admin berhasil diperbarui!',
            'green'
        );
    }
}
