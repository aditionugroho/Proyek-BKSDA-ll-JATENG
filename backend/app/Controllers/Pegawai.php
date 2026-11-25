<?php

namespace App\Controllers;

class Pegawai extends BaseController
{
    public function arsip(): string
    {
        return view('pages/pegawai/arsip');
    }

    public function buatSurat(): string
    {
        return view('pages/pegawai/buat-surat');
    }

    public function buatDokumen(): string
    {
        return view('pages/pegawai/buat-dokumen');
    }

    public function dashboard(): string
    {
        return view('pages/pegawai/dashboard');
    }

    public function detailArsip(): string
    {
        return view('pages/pegawai/detail-arsip', [
            'footerText' => '&copy; 2026 E-Office SKSDA Jawa Tengah.',
        ]);
    }

    public function detailDisposisi(): string
    {
        return view('pages/pegawai/detail-disposisi');
    }

    public function detailDokumen(): string
    {
        return view('pages/pegawai/detail-dokumen');
    }

    public function detailSurat(): string
    {
        return view('pages/pegawai/detail-surat');
    }

    public function detailTugas(): string
    {
        return view('pages/pegawai/detail-tugas');
    }

    public function disposisiSaya(): string
    {
        return view('pages/pegawai/disposisi-saya');
    }

    public function dokumenSaya(): string
    {
        return view('pages/pegawai/dokumen-saya');
    }

    public function jadwal(): string
    {
        return view('pages/pegawai/jadwal');
    }

    public function laporanPatroli(): string
    {
        return view('pages/pegawai/laporan-patroli');
    }

    public function notifikasi(): string
    {
        return view('pages/pegawai/notifikasi');
    }

    public function pengaturan(): string
    {
        return view('pages/pegawai/pengaturan');
    }

    public function previewSurat(): string
    {
        return view('pages/pegawai/preview-surat');
    }

    public function profil(): string
    {
        return view('pages/pegawai/profil');
    }

    public function surat(): string
    {
        return view('pages/pegawai/surat');
    }

    public function tugasSaya(): string
    {
        return view('pages/pegawai/tugas-saya');
    }
}
