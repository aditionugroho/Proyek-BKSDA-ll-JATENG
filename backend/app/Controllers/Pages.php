<?php

namespace App\Controllers;

class Pages extends BaseController
{
    public function index(): string
    {
        return view('pages/index');
    }

    public function login(): string
    {
        return view('pages/login');
    }

    public function registrasi(): string
    {
        return view('pages/halaman_registrasi_sksda');
    }

    public function lupaPassword(): string
    {
        return view('pages/lupa-password');
    }

    public function pencarian(): string
    {
        return view('pages/pencarian');
    }
}
