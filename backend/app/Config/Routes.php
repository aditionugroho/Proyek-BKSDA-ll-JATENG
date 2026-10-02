<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

/*
|--------------------------------------------------------------------------
| DEFAULT ROUTE
|--------------------------------------------------------------------------
*/

$routes->get('/', 'Home::index');


/*
|--------------------------------------------------------------------------
| AUTHENTICATION API
|--------------------------------------------------------------------------
|
| Endpoint:
|
| POST /api/auth/login
| POST /api/auth/forgot-password
| POST /api/auth/verify-otp
| POST /api/auth/reset-password
| POST /api/auth/logout
|
*/

$routes->group(
    'api/auth',
    static function ($routes) {

        /*
        |--------------------------------------------------------------------------
        | LOGIN
        |--------------------------------------------------------------------------
        |
        | Tidak membutuhkan token.
        |
        */

        $routes->post(
            'login',
            'Api\AuthController::login'
        );


        /*
        |--------------------------------------------------------------------------
        | FORGOT PASSWORD
        |--------------------------------------------------------------------------
        |
        | Request OTP melalui email.
        |
        */

        $routes->post(
            'forgot-password',
            'Api\AuthController::forgotPassword'
        );


        /*
        |--------------------------------------------------------------------------
        | VERIFY OTP
        |--------------------------------------------------------------------------
        |
        | Verifikasi OTP yang diterima user.
        |
        */

        $routes->post(
            'verify-otp',
            'Api\AuthController::verifyOtp'
        );


        /*
        |--------------------------------------------------------------------------
        | RESET PASSWORD
        |--------------------------------------------------------------------------
        |
        | Mengubah password setelah OTP berhasil diverifikasi.
        |
        */

        $routes->post(
            'reset-password',
            'Api\AuthController::resetPassword'
        );


        /*
        |--------------------------------------------------------------------------
        | LOGOUT
        |--------------------------------------------------------------------------
        |
        | Membutuhkan Bearer Token.
        |
        */

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
| USER MANAGEMENT API
|--------------------------------------------------------------------------
|
| Hanya ADMIN yang boleh mengakses seluruh endpoint di bawah ini.
|
| GET    /api/users
| GET    /api/users/{id}
| POST   /api/users
| PUT    /api/users/{id}
| PATCH  /api/users/{id}
| DELETE /api/users/{id}
|
*/

$routes->group(
    'api/users',
    [
        'filter' => 'role:admin',
    ],
    static function ($routes) {

        /*
        |--------------------------------------------------------------------------
        | GET ALL USERS
        |--------------------------------------------------------------------------
        |
        | Contoh:
        |
        | GET /api/users
        | GET /api/users?search=andi
        | GET /api/users?role=staf
        | GET /api/users?page=1&per_page=20
        |
        */

        $routes->get(
            '',
            'Api\UserController::index'
        );


        /*
        |--------------------------------------------------------------------------
        | GET USER DETAIL
        |--------------------------------------------------------------------------
        |
        | Contoh:
        |
        | GET /api/users/1
        |
        */

        $routes->get(
            '(:num)',
            'Api\UserController::show/$1'
        );


        /*
        |--------------------------------------------------------------------------
        | CREATE USER
        |--------------------------------------------------------------------------
        |
        | POST /api/users
        |
        */

        $routes->post(
            '',
            'Api\UserController::create'
        );


        /*
        |--------------------------------------------------------------------------
        | UPDATE USER - PUT
        |--------------------------------------------------------------------------
        |
        | PUT /api/users/1
        |
        */

        $routes->put(
            '(:num)',
            'Api\UserController::update/$1'
        );


        /*
        |--------------------------------------------------------------------------
        | UPDATE USER - PATCH
        |--------------------------------------------------------------------------
        |
        | PATCH /api/users/1
        |
        */

        $routes->patch(
            '(:num)',
            'Api\UserController::update/$1'
        );


        /*
        |--------------------------------------------------------------------------
        | DELETE / NONAKTIFKAN USER
        |--------------------------------------------------------------------------
        |
        | DELETE /api/users/1
        |
        | Controller kita tidak benar-benar menghapus data.
        | User hanya diubah status menjadi nonaktif.
        |
        */

        $routes->delete(
            '(:num)',
            'Api\UserController::delete/$1'
        );
    }
);