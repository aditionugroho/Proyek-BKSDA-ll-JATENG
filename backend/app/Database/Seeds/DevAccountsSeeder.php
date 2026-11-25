<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;
use Config\Database;

class DevAccountsSeeder extends Seeder
{
    public function run()
    {
        if (ENVIRONMENT !== 'development') {
            echo 'DevAccountsSeeder hanya boleh dijalankan di environment development.' . PHP_EOL;

            return;
        }

        $db = $this->db;

        // Pastikan minimal ada data resort aktif.
        (new ResortSeeder(config(Database::class), $db))->run();
        $resort = $db->table('resorts')
            ->where('kode', 'PEMALANG')
            ->where('status', 1)
            ->get()
            ->getRowArray();

        if (!$resort) {
            $resort = $db->table('resorts')
                ->where('status', 1)
                ->orderBy('id', 'ASC')
                ->get()
                ->getRowArray();
        }

        $resortId = $resort ? (int) $resort['id'] : null;

        $passwordHash = password_hash('admin123', PASSWORD_BCRYPT);

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
                'jabatan'   => 'Staf',
                'resort_id' => $resortId,
            ],
        ];

        $builder = $db->table('users');
        $now     = date('Y-m-d H:i:s');

        echo 'Akun development siap:' . PHP_EOL;

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
                'ID %d | Username: %-12s | Password: admin123 | Role: %s' . PHP_EOL,
                $id,
                $account['username'],
                $account['role']
            );
        }

        // Bersihkan riwayat login lokal.
        $db->table('login_logs')->truncate();

        echo 'Tabel login_logs dikosongkan. Reset throttler: jalankan "php spark cache:clear".' . PHP_EOL;
    }
}
