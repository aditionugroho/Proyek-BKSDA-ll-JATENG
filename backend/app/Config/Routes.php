<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

/*
|--------------------------------------------------------------------------
| DEFAULT
|--------------------------------------------------------------------------
*/

$routes->get('/', 'Home::index');


/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

$routes->group(
    'api/auth',
    static function ($routes) {

        $routes->post(
            'login',
            'Api\AuthController::login'
        );

        $routes->post(
            'forgot-password',
            'Api\AuthController::forgotPassword'
        );

        $routes->post(
            'verify-otp',
            'Api\AuthController::verifyOtp'
        );

        $routes->post(
            'reset-password',
            'Api\AuthController::resetPassword'
        );

        $routes->post(
            'logout',
            'Api\AuthController::logout',
            [
                'filter' => 'auth',
            ]
        );
    }
);


/*
|--------------------------------------------------------------------------
| USER MANAGEMENT
|--------------------------------------------------------------------------
|
| Hanya Admin
|
*/

$routes->group(
    'api/users',
    [
        'filter' => 'role:admin',
    ],
    static function ($routes) {

        $routes->get(
            '',
            'Api\UserController::index'
        );

        $routes->get(
            '(:num)',
            'Api\UserController::show/$1'
        );

        $routes->post(
            '',
            'Api\UserController::create'
        );

        $routes->put(
            '(:num)',
            'Api\UserController::update/$1'
        );

        $routes->patch(
            '(:num)',
            'Api\UserController::update/$1'
        );

        $routes->delete(
            '(:num)',
            'Api\UserController::delete/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| SURAT MASUK - READ
|--------------------------------------------------------------------------
*/

$routes->group(
    'api/surat-masuk',
    [
        'filter' => 'role:admin,kepala_seksi,staf',
    ],
    static function ($routes) {

        $routes->get(
            '',
            'Api\SuratMasukController::index'
        );

        $routes->get(
            '(:num)',
            'Api\SuratMasukController::show/$1'
        );

        $routes->get(
            '(:num)/file',
            'Api\SuratMasukController::downloadFile/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| SURAT MASUK - CREATE / UPDATE / UPLOAD
|--------------------------------------------------------------------------
*/

$routes->group(
    'api/surat-masuk',
    [
        'filter' => 'role:admin,staf',
    ],
    static function ($routes) {

        $routes->post(
            '',
            'Api\SuratMasukController::create'
        );

        $routes->put(
            '(:num)',
            'Api\SuratMasukController::update/$1'
        );

        $routes->patch(
            '(:num)',
            'Api\SuratMasukController::update/$1'
        );

        $routes->post(
            '(:num)/file',
            'Api\SuratMasukController::uploadFile/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| SURAT MASUK - DELETE
|--------------------------------------------------------------------------
*/

$routes->delete(
    'api/surat-masuk/(:num)',
    'Api\SuratMasukController::delete/$1',
    [
        'filter' => 'role:admin',
    ]
);


/*
|--------------------------------------------------------------------------
| SURAT KELUAR - READ
|--------------------------------------------------------------------------
*/

$routes->group(
    'api/surat-keluar',
    [
        'filter' => 'role:admin,kepala_seksi,staf',
    ],
    static function ($routes) {

        $routes->get(
            '',
            'Api\SuratKeluarController::index'
        );

        $routes->get(
            '(:num)',
            'Api\SuratKeluarController::show/$1'
        );

        $routes->get(
            '(:num)/file',
            'Api\SuratKeluarController::downloadFile/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| SURAT KELUAR - CREATE / UPDATE / UPLOAD
|--------------------------------------------------------------------------
*/

$routes->group(
    'api/surat-keluar',
    [
        'filter' => 'role:admin,staf',
    ],
    static function ($routes) {

        $routes->post(
            '',
            'Api\SuratKeluarController::create'
        );

        $routes->put(
            '(:num)',
            'Api\SuratKeluarController::update/$1'
        );

        $routes->patch(
            '(:num)',
            'Api\SuratKeluarController::update/$1'
        );

        $routes->post(
            '(:num)/file',
            'Api\SuratKeluarController::uploadFile/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| SURAT KELUAR - DELETE
|--------------------------------------------------------------------------
*/

$routes->delete(
    'api/surat-keluar/(:num)',
    'Api\SuratKeluarController::delete/$1',
    [
        'filter' => 'role:admin',
    ]
);


/*
|--------------------------------------------------------------------------
| DISPOSISI - READ
|--------------------------------------------------------------------------
*/

$routes->group(
    'api/disposisi',
    [
        'filter' => 'role:admin,kepala_seksi,staf',
    ],
    static function ($routes) {

        $routes->get(
            '',
            'Api\DisposisiController::index'
        );

        $routes->get(
            '(:num)',
            'Api\DisposisiController::show/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| DISPOSISI - KEPALA SEKSI
|--------------------------------------------------------------------------
*/

$routes->group(
    'api/disposisi',
    [
        'filter' => 'role:kepala_seksi',
    ],
    static function ($routes) {

        $routes->post(
            '',
            'Api\DisposisiController::create'
        );

        $routes->patch(
            '(:num)/kembalikan',
            'Api\DisposisiController::kembalikan/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| DISPOSISI - STAF
|--------------------------------------------------------------------------
*/

$routes->patch(
    'api/disposisi/(:num)/tindak-lanjut',
    'Api\DisposisiController::tindakLanjut/$1',
    [
        'filter' => 'role:staf',
    ]
);


/*
|--------------------------------------------------------------------------
| DISPOSISI - SELESAI
|--------------------------------------------------------------------------
*/

$routes->patch(
    'api/disposisi/(:num)/selesai',
    'Api\DisposisiController::selesai/$1',
    [
        'filter' => 'role:kepala_seksi,staf',
    ]
);


/*
|--------------------------------------------------------------------------
| ARSIP - READ
|--------------------------------------------------------------------------
|
| Admin, Kepala Seksi, dan Staf
|
*/

$routes->group(
    'api/arsip',
    [
        'filter' => 'role:admin,kepala_seksi,staf',
    ],
    static function ($routes) {

        $routes->get(
            '',
            'Api\ArsipController::index'
        );

        $routes->get(
            '(:num)',
            'Api\ArsipController::show/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| ARSIP - CREATE / UPDATE
|--------------------------------------------------------------------------
|
| Admin dan Staf
|
*/

$routes->group(
    'api/arsip',
    [
        'filter' => 'role:admin,staf',
    ],
    static function ($routes) {

        $routes->post(
            '',
            'Api\ArsipController::create'
        );

        $routes->put(
            '(:num)',
            'Api\ArsipController::update/$1'
        );

        $routes->patch(
            '(:num)',
            'Api\ArsipController::update/$1'
        );
    }
);


/*
|--------------------------------------------------------------------------
| ARSIP - DELETE
|--------------------------------------------------------------------------
|
| Hanya Admin
|
*/

$routes->delete(
    'api/arsip/(:num)',
    'Api\ArsipController::delete/$1',
    [
        'filter' => 'role:admin',
    ]
);

/*
|--------------------------------------------------------------------------
| NOTIFIKASI
|--------------------------------------------------------------------------
|
| Semua user yang sudah login dapat mengakses notifikasi miliknya sendiri.
|
*/

$routes->group(
    'api/notifikasi',
    [
        'filter' => 'role:admin,kepala_seksi,staf',
    ],
    static function ($routes) {

        // Daftar notifikasi milik user
        $routes->get(
            '',
            'Api\NotifikasiController::index'
        );

        // Jumlah notifikasi belum dibaca
        $routes->get(
            'unread-count',
            'Api\NotifikasiController::unreadCount'
        );

        // Tandai semua sebagai sudah dibaca
        $routes->patch(
            'read-all',
            'Api\NotifikasiController::markAllAsRead'
        );

        // Tandai satu notifikasi sebagai sudah dibaca
        $routes->patch(
            '(:num)/read',
            'Api\NotifikasiController::markAsRead/$1'
        );

        // Hapus notifikasi milik user
        $routes->delete(
            '(:num)',
            'Api\NotifikasiController::delete/$1'
        );
    }
);

/*
|--------------------------------------------------------------------------
| RIWAYAT LOGIN
|--------------------------------------------------------------------------
|
| Hanya Admin yang dapat melihat riwayat login pengguna.
|
*/

$routes->group(
    'api/login-history',
    [
        'filter' => 'role:admin',
    ],
    static function ($routes) {

        // Daftar riwayat login
        $routes->get(
            '',
            'Api\LoginHistoryController::index'
        );

        // Detail riwayat login
        $routes->get(
            '(:num)',
            'Api\LoginHistoryController::show/$1'
        );
    }
);