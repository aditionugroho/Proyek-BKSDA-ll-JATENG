<?php

namespace App\Controllers;

class Admin extends BaseController
{
    public function backupData(): string
    {
        return view('pages/admin/backup-data');
    }

    public function dashboard(): string
    {
        return view('pages/admin/dashboard');
    }

    public function dataPengguna(): string
    {
        return view('pages/admin/data-pengguna');
    }

    public function detailSuratAdmin(): string
    {
        return view('pages/admin/detail-surat-admin', [
            'footerText' => '&copy; 2026 Seksi Konservasi Sumber Daya Alam Jawa Tengah (SKSDA Jateng) - Sistem Informasi Tata Kelola Surat Elektronik',
        ]);
    }

    public function editProfilAdmin(): string
    {
        return view('pages/admin/edit-profil-admin');
    }

    public function exportData(): string
    {
        return view('pages/admin/export-data', [
            'footerText' => '&copy; 2026 Seksi Konservasi Sumber Daya Alam Jawa Tengah (SKSDA Jateng) - Sistem Informasi Tata Kelola Surat Elektronik',
        ]);
    }

    public function formSuratKeluar(): string
    {
        return view('pages/admin/form-surat-keluar');
    }

    public function formSuratMasuk(): string
    {
        return view('pages/admin/form-surat-masuk');
    }

    public function inputSurat(): string
    {
        return view('pages/admin/input-surat');
    }

    public function notifikasi(): string
    {
        return view('pages/admin/notifikasi', [
            'footerText' => '&copy; 2026 Seksi Konservasi Sumber Daya Alam Jawa Tengah (SKSDA Jateng) - Sistem Informasi Tata Kelola Surat Elektronik',
        ]);
    }

    public function panduanInputSurat(): string
    {
        return view('pages/admin/panduan-input-surat', [
            'footerText' => '&copy; 2026 Seksi Konservasi Sumber Daya Alam Jawa Tengah (SKSDA Jateng) - Sistem Informasi Tata Kelola Surat Elektronik',
        ]);
    }

    public function pengumuman(): string
    {
        return view('pages/admin/pengumuman', [
            'footerText' => '&copy; 2026 Seksi Konservasi Sumber Daya Alam Jawa Tengah (SKSDA Jateng) - Sistem Informasi Tata Kelola Surat Elektronik',
        ]);
    }

    public function profilAdmin(): string
    {
        return view('pages/admin/profil-admin');
    }

    public function tambahPengguna(): string
    {
        return view('pages/admin/tambah-pengguna', [
            'footerText' => '&copy; 2026 Seksi Konservasi Sumber Daya Alam Jawa Tengah (SKSDA Jateng) - Sistem Informasi Tata Kelola Surat Elektronik',
        ]);
    }
}
