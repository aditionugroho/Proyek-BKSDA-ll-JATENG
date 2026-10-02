<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run()
    {
        $data = [
            'name'        => 'Administrator',
            'username'    => 'admin',
            'email'       => null,
            'no_whatsapp' => null,
            'password'    => password_hash('admin123', PASSWORD_BCRYPT),
            'role'        => 'admin',
            'jabatan'     => 'Administrator Sistem',
            'status'      => 1,
            'created_at'  => date('Y-m-d H:i:s'),
            'updated_at'  => date('Y-m-d H:i:s'),
        ];

        $this->db->table('users')->insert($data);
    }
}