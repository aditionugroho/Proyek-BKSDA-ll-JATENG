<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ActivityLogModel;
use CodeIgniter\API\ResponseTrait;

class ActivityLogController extends BaseController
{
    use ResponseTrait;

    private ActivityLogModel $activityLogModel;

    public function __construct()
    {
        $this->activityLogModel = new ActivityLogModel();
    }

    private function isValidDate(string $date): bool
    {
        $dateObject = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $date
        );

        return $dateObject !== false
            && $dateObject->format('Y-m-d') === $date;
    }

    private function getTextFilter(string $name): ?string
    {
        $value = $this->request->getGet($name);

        if ($value === null) {
            return '';
        }

        if (!is_string($value)) {
            return null;
        }

        return trim($value);
    }

    public function index()
    {
        $search = $this->getTextFilter('search');
        $modul = $this->getTextFilter('modul');
        $aktivitas = $this->getTextFilter('aktivitas');
        $tanggalMulai = $this->getTextFilter('tanggal_mulai');
        $tanggalAkhir = $this->getTextFilter('tanggal_akhir');

        $filters = [
            $search,
            $modul,
            $aktivitas,
            $tanggalMulai,
            $tanggalAkhir,
        ];

        if (in_array(null, $filters, true)) {
            return $this->respond([
                'status' => false,
                'message' => 'Parameter filter tidak valid.',
            ], 422);
        }

        if (
            mb_strlen($search) > 100 ||
            mb_strlen($modul) > 100 ||
            mb_strlen($aktivitas) > 100
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Filter maksimal 100 karakter.',
            ], 422);
        }

        $perPageInput = $this->request->getGet('per_page');

        if ($perPageInput === null) {
            $perPage = 20;
        } elseif (
            !is_string($perPageInput) ||
            !ctype_digit($perPageInput) ||
            (int) $perPageInput < 1
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'per_page harus angka positif.',
            ], 422);
        } else {
            $perPage = min((int) $perPageInput, 50);
        }

        $pageInput = $this->request->getGet('page');

        if (
            $pageInput !== null &&
            (
                !is_string($pageInput) ||
                !ctype_digit($pageInput) ||
                (int) $pageInput < 1
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'page harus angka positif.',
            ], 422);
        }

        if (
            ($tanggalMulai !== '' &&
                !$this->isValidDate($tanggalMulai)) ||
            ($tanggalAkhir !== '' &&
                !$this->isValidDate($tanggalAkhir))
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Format tanggal harus YYYY-MM-DD.',
            ], 422);
        }

        if (
            $tanggalMulai !== '' &&
            $tanggalAkhir !== '' &&
            $tanggalMulai > $tanggalAkhir
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'Tanggal mulai tidak boleh melebihi tanggal akhir.',
            ], 422);
        }

        $query = $this->activityLogModel
            ->select([
                'activity_logs.id',
                'activity_logs.user_id',
                'activity_logs.aktivitas',
                'activity_logs.modul',
                'activity_logs.referensi_id',
                'activity_logs.deskripsi',
                'activity_logs.ip_address',
                'activity_logs.created_at',
                'users.name',
                'users.username',
                'users.role',
            ])
            ->join(
                'users',
                'users.id = activity_logs.user_id',
                'left'
            );

        if ($search !== '') {
            $query->groupStart()
                ->like('users.name', $search)
                ->orLike('users.username', $search)
                ->orLike('activity_logs.aktivitas', $search)
                ->orLike('activity_logs.deskripsi', $search)
                ->groupEnd();
        }

        if ($modul !== '') {
            $query->where('activity_logs.modul', $modul);
        }

        if ($aktivitas !== '') {
            $query->where('activity_logs.aktivitas', $aktivitas);
        }

        if ($tanggalMulai !== '') {
            $query->where(
                'activity_logs.created_at >=',
                $tanggalMulai . ' 00:00:00'
            );
        }

        if ($tanggalAkhir !== '') {
            $query->where(
                'activity_logs.created_at <=',
                $tanggalAkhir . ' 23:59:59'
            );
        }

        $data = $query
            ->orderBy('activity_logs.id', 'DESC')
            ->paginate($perPage);

        $pager = $this->activityLogModel->pager;

        return $this->respond([
            'status' => true,
            'message' => 'Riwayat aktivitas berhasil diambil.',
            'data' => $data,
            'pagination' => [
                'current_page' => $pager->getCurrentPage(),
                'per_page' => $perPage,
                'total' => $pager->getTotal(),
                'last_page' => $pager->getPageCount(),
            ],
        ]);
    }

    public function show($id = null)
    {
        if (
            !is_string($id) ||
            !ctype_digit($id) ||
            (int) $id < 1
        ) {
            return $this->respond([
                'status' => false,
                'message' => 'ID aktivitas tidak valid.',
            ], 400);
        }

        $data = $this->activityLogModel
            ->select([
                'activity_logs.id',
                'activity_logs.user_id',
                'activity_logs.aktivitas',
                'activity_logs.modul',
                'activity_logs.referensi_id',
                'activity_logs.deskripsi',
                'activity_logs.ip_address',
                'activity_logs.created_at',
                'users.name',
                'users.username',
                'users.role',
            ])
            ->join(
                'users',
                'users.id = activity_logs.user_id',
                'left'
            )
            ->where('activity_logs.id', (int) $id)
            ->first();

        if (!$data) {
            return $this->respond([
                'status' => false,
                'message' => 'Riwayat aktivitas tidak ditemukan.',
            ], 404);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Detail aktivitas berhasil diambil.',
            'data' => $data,
        ]);
    }
}
