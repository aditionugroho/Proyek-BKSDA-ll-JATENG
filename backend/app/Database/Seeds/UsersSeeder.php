<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use Config\Database;

/**
 * Membuat satu akun untuk setiap role:
 * admin, kepala_seksi, dan staf.
 *
 * Password dapat diatur melalui variabel lingkungan
 * SEED_USER_PASSWORD (default: admin123).
 */
class UsersSeeder extends Seeder
{
    public function run()
    {
        $db = $this->db;

        // Pastikan minimal ada satu resort aktif untuk penempatan.
        (new ResortSeeder(config(Database::class), $db))->run();

        $resort = $db->table('resorts')
            ->where('status', 1)
            ->orderBy('id', 'ASC')
            ->get()
            ->getRowArray();

        $resortId = $resort ? (int) $resort['id'] : null;

        $password = (string) (env('SEED_USER_PASSWORD') ?: 'admin123');

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $accounts = [
            [
                'name'      => 'Administrator',
                'username'  => 'admin',
                'email'     => 'admin@sksda.test',
                'role'      => 'admin',
                'jabatan'   => 'Administrator Sistem',
                'resort_id' => null,
            ],
            [
                'name'      => 'Kepala Seksi',
                'username'  => 'kepala_seksi',
                'email'     => 'kepala.seksi@sksda.test',
                'role'      => 'kepala_seksi',
                'jabatan'   => 'Kepala Seksi Konservasi',
                'resort_id' => $resortId,
            ],
            [
                'name'      => 'Staf',
                'username'  => 'staf',
                'email'     => 'staf@sksda.test',
                'role'      => 'staf',
                'jabatan'   => 'Staf Konservasi',
                'resort_id' => $resortId,
            ],
        ];

        $builder = $db->table('users');
        $now     = date('Y-m-d H:i:s');

        echo 'Akun siap digunakan:' . PHP_EOL;

        foreach ($accounts as $account) {
            $payload = array_merge($account, [
                'no_whatsapp' => null,
                'password'    => $passwordHash,
                'status'      => 1,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);

            $existing = $builder
                ->where('username', $account['username'])
                ->get()
                ->getRowArray();

            if ($existing) {
                $builder->where('id', $existing['id'])->update($payload);
                $id = (int) $existing['id'];
            } else {
                $builder->insert($payload);
                $id = (int) $db->insertID();
            }

            // Cabut token lama supaya akun mulai dari sesi bersih.
            $db->table('auth_tokens')
                ->where('user_id', $id)
                ->where('revoked_at', null)
                ->update(['revoked_at' => $now]);

            echo sprintf(
                'ID %d | Username: %-12s | Role: %s' . PHP_EOL,
                $id,
                $account['username'],
                $account['role']
            );
        }

        if ($password === 'admin123') {
            echo 'PERINGATAN: password masih default "admin123". '
                . 'Atur SEED_USER_PASSWORD atau segera ubah password setelah login.' . PHP_EOL;
        }
    }
}
