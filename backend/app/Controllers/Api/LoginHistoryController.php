<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\LoginLogModel;
use CodeIgniter\API\ResponseTrait;

class LoginHistoryController extends BaseController
{
    use ResponseTrait;

    protected LoginLogModel $loginLogModel;

    public function __construct()
    {
        $this->loginLogModel = new LoginLogModel();
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDASI TANGGAL
    |--------------------------------------------------------------------------
    */

    private function isValidDate(string $date): bool
    {
        $dateObject = \DateTime::createFromFormat(
            'Y-m-d',
            $date
        );

        return $dateObject &&
            $dateObject->format('Y-m-d') === $date;
    }

    /*
    |--------------------------------------------------------------------------
    | LIST RIWAYAT LOGIN
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $search = trim(
            (string) $this->request->getGet('search')
        );

        $tanggalMulai = trim(
            (string) $this->request->getGet('tanggal_mulai')
        );

        $tanggalAkhir = trim(
            (string) $this->request->getGet('tanggal_akhir')
        );

        $perPage = (int) (
            $this->request->getGet('per_page') ?? 20
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDASI PAGINATION
        |--------------------------------------------------------------------------
        */

        if ($perPage < 1) {
            $perPage = 20;
        }

        if ($perPage > 50) {
            $perPage = 50;
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDASI TANGGAL
        |--------------------------------------------------------------------------
        */

        if (
            $tanggalMulai !== '' &&
            !$this->isValidDate($tanggalMulai)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Format tanggal_mulai harus YYYY-MM-DD.',
            ], 422);
        }

        if (
            $tanggalAkhir !== '' &&
            !$this->isValidDate($tanggalAkhir)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Format tanggal_akhir harus YYYY-MM-DD.',
            ], 422);
        }

        if (
            $tanggalMulai !== '' &&
            $tanggalAkhir !== '' &&
            strtotime($tanggalMulai) >
            strtotime($tanggalAkhir)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Tanggal mulai tidak boleh melebihi tanggal akhir.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | QUERY
        |--------------------------------------------------------------------------
        */

        $this->loginLogModel
            ->select(
                '
                login_logs.id,
                login_logs.user_id,
                login_logs.ip_address,
                login_logs.login_at,
                login_logs.logout_at,
                users.name,
                users.username,
                users.role,
                users.jabatan
                '
            )
            ->join(
                'users',
                'users.id = login_logs.user_id',
                'left'
            );

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {
            $this->loginLogModel
                ->groupStart()
                ->like(
                    'users.name',
                    $search
                )
                ->orLike(
                    'users.username',
                    $search
                )
                ->orLike(
                    'users.jabatan',
                    $search
                )
                ->orLike(
                    'login_logs.ip_address',
                    $search
                )
                ->groupEnd();
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER TANGGAL MULAI
        |--------------------------------------------------------------------------
        */

        if ($tanggalMulai !== '') {
            $this->loginLogModel
                ->where(
                    'login_logs.login_at >=',
                    $tanggalMulai . ' 00:00:00'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER TANGGAL AKHIR
        |--------------------------------------------------------------------------
        */

        if ($tanggalAkhir !== '') {
            $this->loginLogModel
                ->where(
                    'login_logs.login_at <=',
                    $tanggalAkhir . ' 23:59:59'
                );
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $data = $this->loginLogModel
            ->orderBy(
                'login_logs.id',
                'DESC'
            )
            ->paginate($perPage);

        return $this->respond([
            'status' => true,

            'message' =>
                'Riwayat login berhasil diambil.',

            'data' => $data,

            'pagination' => [
                'current_page' =>
                    $this->loginLogModel
                        ->pager
                        ->getCurrentPage(),

                'per_page' =>
                    $perPage,

                'total' =>
                    $this->loginLogModel
                        ->pager
                        ->getTotal(),

                'last_page' =>
                    $this->loginLogModel
                        ->pager
                        ->getPageCount(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL RIWAYAT LOGIN
    |--------------------------------------------------------------------------
    */

    public function show($id = null)
    {
        if (
            !$id ||
            !ctype_digit((string) $id)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID riwayat login tidak valid.',
            ], 400);
        }

        $data = $this->loginLogModel
            ->select(
                '
                login_logs.id,
                login_logs.user_id,
                login_logs.ip_address,
                login_logs.login_at,
                login_logs.logout_at,
                users.name,
                users.username,
                users.email,
                users.role,
                users.jabatan,
                users.status
                '
            )
            ->join(
                'users',
                'users.id = login_logs.user_id',
                'left'
            )
            ->where(
                'login_logs.id',
                $id
            )
            ->first();

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Riwayat login tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,

            'message' =>
                'Detail riwayat login berhasil diambil.',

            'data' => $data,
        ]);
    }
}