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
| Hanya admin
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
| Hanya admin
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

        /*
        | GET ALL DISPOSISI
        */
        $routes->get(
            '',
            'Api\DisposisiController::index'
        );

        /*
        | GET DETAIL DISPOSISI
        */
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
|
| Kepala Seksi dapat:
| - membuat disposisi
| - mengembalikan disposisi untuk revisi
|
*/

$routes->group(
    'api/disposisi',
    [
        'filter' => 'role:kepala_seksi',
    ],
    static function ($routes) {

        /*
        | CREATE DISPOSISI
        */
        $routes->post(
            '',
            'Api\DisposisiController::create'
        );

        /*
        | KEMBALIKAN UNTUK REVISI
        */
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
|
| Staf mengisi tindak lanjut disposisi.
|
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
|
| Kepala Seksi atau Staf dapat menandai disposisi selesai.
| Controller tetap melakukan pengecekan kepemilikan disposisi.
|
*/

$routes->patch(
    'api/disposisi/(:num)/selesai',
    'Api\DisposisiController::selesai/$1',
    [
        'filter' => 'role:kepala_seksi,staf',
    ]
);