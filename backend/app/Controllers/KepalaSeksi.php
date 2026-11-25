<?php

namespace App\Controllers;

class KepalaSeksi extends BaseController
{
    public function arsip(): string
    {
        return view('pages/kepala-seksi/arsip');
    }

    public function buatTugas(): string
    {
        return view('pages/kepala-seksi/buat-tugas');
    }

    public function dashboard(): string
    {
        return view('pages/kepala-seksi/dashboard');
    }

    public function detailArsip(): string
    {
        return view('pages/kepala-seksi/detail-arsip', [
            'footerText' => '&copy; 2026 E-Office SKSDA Jawa Tengah.',
        ]);
    }

    public function detailSuratKeluar(): string
    {
        return view('pages/kepala-seksi/detail-surat-keluar');
    }

    public function detailSuratMasuk(): string
    {
        return view('pages/kepala-seksi/detail-surat-masuk');
    }

    public function detailTugas(): string
    {
        return view('pages/kepala-seksi/detail-tugas');
    }

    public function direktoriStaf(): string
    {
        return view('pages/kepala-seksi/direktori-staf');
    }

    public function disposisi(): string
    {
        return view('pages/kepala-seksi/disposisi');
    }

    public function jadwal(): string
    {
        return view('pages/kepala-seksi/jadwal');
    }

    public function laporan(): string
    {
        return view('pages/kepala-seksi/laporan');
    }

    public function notifikasi(): string
    {
        return view('pages/kepala-seksi/notifikasi');
    }

    public function patroli(): string
    {
        return view('pages/kepala-seksi/patroli');
    }

    public function pengaturan(): string
    {
        return view('pages/kepala-seksi/pengaturan');
    }

    public function profil(): string
    {
        return view('pages/kepala-seksi/profil');
    }

    public function suratKeluar(): string
    {
        return view('pages/kepala-seksi/surat-keluar');
    }

    public function suratMasuk(): string
    {
        return view('pages/kepala-seksi/surat-masuk');
    }

    public function tugasSeksi(): string
    {
        return view('pages/kepala-seksi/tugas-seksi');
    }
}
