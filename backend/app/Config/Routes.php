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
|
| Admin, Kepala Seksi, dan Staf
|
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
|
| Admin dan Staf
|
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
|
| Hanya Admin
|
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
|
| Admin, Kepala Seksi, dan Staf
|
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
|
| Admin dan Staf
|
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
|
| Hanya Admin
|
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
|
| Admin:
| - melihat semua disposisi
|
| Kepala Seksi:
| - melihat disposisi yang dibuatnya
|
| Staf:
| - melihat disposisi yang ditujukan kepadanya
|
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