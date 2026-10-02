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

        /*
        | GET ALL USERS
        */
        $routes->get(
            '',
            'Api\UserController::index'
        );

        /*
        | GET DETAIL USER
        */
        $routes->get(
            '(:num)',
            'Api\UserController::show/$1'
        );

        /*
        | CREATE USER
        */
        $routes->post(
            '',
            'Api\UserController::create'
        );

        /*
        | UPDATE USER
        */
        $routes->put(
            '(:num)',
            'Api\UserController::update/$1'
        );

        $routes->patch(
            '(:num)',
            'Api\UserController::update/$1'
        );

        /*
        | NONAKTIFKAN USER
        */
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
| Admin, Kepala Seksi, dan Staf boleh melihat surat masuk.
|
*/

$routes->group(
    'api/surat-masuk',
    [
        'filter' => 'role:admin,kepala_seksi,staf',
    ],
    static function ($routes) {

        /*
        | GET SEMUA SURAT MASUK
        */
        $routes->get(
            '',
            'Api\SuratMasukController::index'
        );

        /*
        | GET DETAIL SURAT MASUK
        */
        $routes->get(
            '(:num)',
            'Api\SuratMasukController::show/$1'
        );

        /*
        | DOWNLOAD FILE SURAT
        */
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
| Admin dan Staf boleh:
| - tambah surat
| - edit surat
| - upload file
|
*/

$routes->group(
    'api/surat-masuk',
    [
        'filter' => 'role:admin,staf',
    ],
    static function ($routes) {

        /*
        | CREATE SURAT MASUK
        */
        $routes->post(
            '',
            'Api\SuratMasukController::create'
        );

        /*
        | UPDATE SURAT MASUK
        */
        $routes->put(
            '(:num)',
            'Api\SuratMasukController::update/$1'
        );

        $routes->patch(
            '(:num)',
            'Api\SuratMasukController::update/$1'
        );

        /*
        | UPLOAD FILE SURAT
        */
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
| Hanya admin yang boleh menghapus surat masuk.
|
*/

$routes->delete(
    'api/surat-masuk/(:num)',
    'Api\SuratMasukController::delete/$1',
    [
        'filter' => 'role:admin',
    ]
);