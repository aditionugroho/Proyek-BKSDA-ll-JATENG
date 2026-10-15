<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class ResortSeeder extends Seeder
{
    public function run()
    {
        $resorts = [
            [
                'nama' => 'Cilacap',
                'kode' => 'CILACAP',
                'status' => 1,
            ],
            [
                'nama' => 'Wonosobo',
                'kode' => 'WONOSOBO',
                'status' => 1,
            ],
            [
                'nama' => 'Pemalang',
                'kode' => 'PEMALANG',
                'status' => 1,
            ],
        ];

        $builder = $this->db->table('resorts');

        foreach ($resorts as $resort) {

            // Periksa apakah resort sudah terdaftar
            $existing = $builder
                ->where('kode', $resort['kode'])
                ->countAllResults();

            // Tambahkan hanya jika belum ada
            if ($existing === 0) {
                $builder->insert($resort);
            }
        }

        echo "Seeder resort berhasil dijalankan!\n";
    }
}
