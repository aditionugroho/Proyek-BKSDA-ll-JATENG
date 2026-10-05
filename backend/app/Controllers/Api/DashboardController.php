<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class DashboardController extends BaseController
{
    use ResponseTrait;

    protected $db;

    public function __construct()
    {
        $this->db = db_connect();
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
    | COUNT BERDASARKAN PERIODE
    |--------------------------------------------------------------------------
    */

    private function countByPeriod(
        string $table,
        string $dateField,
        string $tanggalMulai = '',
        string $tanggalAkhir = ''
    ): int {
        $builder = $this->db->table($table);

        if ($tanggalMulai !== '') {
            $builder->where(
                $dateField . ' >=',
                $tanggalMulai
            );
        }

        if ($tanggalAkhir !== '') {
            $builder->where(
                $dateField . ' <=',
                $tanggalAkhir
            );
        }

        return $builder->countAllResults();
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD SUMMARY
    |--------------------------------------------------------------------------
    |
    | GET /api/dashboard/summary
    |
    | Optional:
    | ?tanggal_mulai=2026-01-01
    | &tanggal_akhir=2026-12-31
    |
    */

    public function summary()
    {
        $tanggalMulai = trim(
            (string) $this->request
                ->getGet('tanggal_mulai')
        );

        $tanggalAkhir = trim(
            (string) $this->request
                ->getGet('tanggal_akhir')
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDASI PERIODE
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
        | USERS
        |--------------------------------------------------------------------------
        */

        $totalPengguna =
            $this->db
                ->table('users')
                ->countAllResults();

        $penggunaAktif =
            $this->db
                ->table('users')
                ->where('status', 1)
                ->countAllResults();

        /*
        |--------------------------------------------------------------------------
        | SURAT TOTAL
        |--------------------------------------------------------------------------
        */

        $totalSuratMasuk =
            $this->db
                ->table('surat_masuk')
                ->countAllResults();

        $totalSuratKeluar =
            $this->db
                ->table('surat_keluar')
                ->countAllResults();

        /*
        |--------------------------------------------------------------------------
        | SURAT PER PERIODE
        |--------------------------------------------------------------------------
        */

        $suratMasukPeriode =
            $this->countByPeriod(
                'surat_masuk',
                'tanggal',
                $tanggalMulai,
                $tanggalAkhir
            );

        $suratKeluarPeriode =
            $this->countByPeriod(
                'surat_keluar',
                'tanggal',
                $tanggalMulai,
                $tanggalAkhir
            );

        /*
        |--------------------------------------------------------------------------
        | DISPOSISI
        |--------------------------------------------------------------------------
        */

        $totalDisposisi =
            $this->db
                ->table('disposisi')
                ->countAllResults();

        $disposisiAktif =
            $this->db
                ->table('disposisi')
                ->whereIn(
                    'status',
                    [
                        'menunggu',
                        'dalam_proses',
                        'dikembalikan',
                    ]
                )
                ->countAllResults();

        $disposisiSelesai =
            $this->db
                ->table('disposisi')
                ->where(
                    'status',
                    'selesai'
                )
                ->countAllResults();

        /*
        |--------------------------------------------------------------------------
        | DISPOSISI PER PERIODE
        |--------------------------------------------------------------------------
        */

        $disposisiBuilder =
            $this->db
                ->table('disposisi');

        if ($tanggalMulai !== '') {
            $disposisiBuilder->where(
                'created_at >=',
                $tanggalMulai . ' 00:00:00'
            );
        }

        if ($tanggalAkhir !== '') {
            $disposisiBuilder->where(
                'created_at <=',
                $tanggalAkhir . ' 23:59:59'
            );
        }

        $disposisiPeriode =
            $disposisiBuilder
                ->countAllResults();

        return $this->respond([
            'status' => true,

            'message' =>
                'Ringkasan dashboard berhasil diambil.',

            'data' => [

                'pengguna' => [
                    'total' =>
                        $totalPengguna,

                    'aktif' =>
                        $penggunaAktif,

                    'nonaktif' =>
                        $totalPengguna -
                        $penggunaAktif,
                ],

                'surat_masuk' => [
                    'total' =>
                        $totalSuratMasuk,

                    'periode' =>
                        $suratMasukPeriode,
                ],

                'surat_keluar' => [
                    'total' =>
                        $totalSuratKeluar,

                    'periode' =>
                        $suratKeluarPeriode,
                ],

                'disposisi' => [
                    'total' =>
                        $totalDisposisi,

                    'aktif' =>
                        $disposisiAktif,

                    'selesai' =>
                        $disposisiSelesai,

                    'periode' =>
                        $disposisiPeriode,
                ],

                'periode' => [
                    'tanggal_mulai' =>
                        $tanggalMulai !== ''
                            ? $tanggalMulai
                            : null,

                    'tanggal_akhir' =>
                        $tanggalAkhir !== ''
                            ? $tanggalAkhir
                            : null,
                ],
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TREND SURAT BULANAN
    |--------------------------------------------------------------------------
    |
    | GET /api/dashboard/trend?year=2026
    |
    */

    public function trend()
    {
        $year = (int) (
            $this->request->getGet('year')
            ?? date('Y')
        );

        if (
            $year < 2000 ||
            $year > 2100
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Tahun tidak valid.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | SURAT MASUK PER BULAN
        |--------------------------------------------------------------------------
        */

        $suratMasuk =
            $this->db->query(
                '
                SELECT
                    MONTH(tanggal) AS bulan,
                    COUNT(*) AS total
                FROM surat_masuk
                WHERE YEAR(tanggal) = ?
                GROUP BY MONTH(tanggal)
                ORDER BY MONTH(tanggal)
                ',
                [$year]
            )->getResultArray();

        /*
        |--------------------------------------------------------------------------
        | SURAT KELUAR PER BULAN
        |--------------------------------------------------------------------------
        */

        $suratKeluar =
            $this->db->query(
                '
                SELECT
                    MONTH(tanggal) AS bulan,
                    COUNT(*) AS total
                FROM surat_keluar
                WHERE YEAR(tanggal) = ?
                GROUP BY MONTH(tanggal)
                ORDER BY MONTH(tanggal)
                ',
                [$year]
            )->getResultArray();

        $masukMap = [];
        $keluarMap = [];

        foreach ($suratMasuk as $item) {
            $masukMap[
                (int) $item['bulan']
            ] = (int) $item['total'];
        }

        foreach ($suratKeluar as $item) {
            $keluarMap[
                (int) $item['bulan']
            ] = (int) $item['total'];
        }

        $namaBulan = [
            1  => 'Januari',
            2  => 'Februari',
            3  => 'Maret',
            4  => 'April',
            5  => 'Mei',
            6  => 'Juni',
            7  => 'Juli',
            8  => 'Agustus',
            9  => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember',
        ];

        $trend = [];

        for ($bulan = 1; $bulan <= 12; $bulan++) {
            $trend[] = [
                'bulan' =>
                    $bulan,

                'nama_bulan' =>
                    $namaBulan[$bulan],

                'surat_masuk' =>
                    $masukMap[$bulan] ?? 0,

                'surat_keluar' =>
                    $keluarMap[$bulan] ?? 0,

                'total' =>
                    ($masukMap[$bulan] ?? 0)
                    +
                    ($keluarMap[$bulan] ?? 0),
            ];
        }

        return $this->respond([
            'status' => true,

            'message' =>
                'Data tren surat berhasil diambil.',

            'data' => [
                'year' =>
                    $year,

                'trend' =>
                    $trend,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD KINERJA PEGAWAI
    |--------------------------------------------------------------------------
    |
    | GET /api/dashboard/kinerja
    | GET /api/dashboard/kinerja?year=2026
    |
    */

    public function kinerja()
    {
        $yearParam =
            $this->request->getGet('year');

        $year = null;

        if (
            $yearParam !== null &&
            $yearParam !== ''
        ) {
            $year = (int) $yearParam;

            if (
                $year < 2000 ||
                $year > 2100
            ) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Tahun tidak valid.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SUBQUERY FILTER TAHUN
        |--------------------------------------------------------------------------
        */

        $smWhere = '';
        $skWhere = '';
        $dWhere = '';
        $activityWhere = '';

        $params = [];

        if ($year !== null) {
            $smWhere =
                ' WHERE YEAR(tanggal) = ?';

            $params[] = $year;

            $skWhere =
                ' WHERE YEAR(tanggal) = ?';

            $params[] = $year;

            $dWhere =
                ' WHERE YEAR(created_at) = ?';

            $params[] = $year;

            $activityWhere =
                ' WHERE YEAR(created_at) = ?';

            $params[] = $year;
        }

        $sql = '
            SELECT
                u.id,
                u.name,
                u.username,
                u.role,
                u.jabatan,
                u.status,

                COALESCE(
                    sm.jumlah,
                    0
                ) AS surat_masuk,

                COALESCE(
                    sk.jumlah,
                    0
                ) AS surat_keluar,

                (
                    COALESCE(
                        sm.jumlah,
                        0
                    )
                    +
                    COALESCE(
                        sk.jumlah,
                        0
                    )
                ) AS total_surat,

                COALESCE(
                    d.diterima,
                    0
                ) AS disposisi_diterima,

                COALESCE(
                    d.selesai,
                    0
                ) AS disposisi_selesai,

                ROUND(
                    COALESCE(
                        d.rata_rata_menit,
                        0
                    ),
                    2
                ) AS rata_rata_penyelesaian_menit,

                ROUND(
                    COALESCE(
                        d.rata_rata_menit,
                        0
                    ) / 60,
                    2
                ) AS rata_rata_penyelesaian_jam,

                COALESCE(
                    al.jumlah,
                    0
                ) AS jumlah_aktivitas

            FROM users u

            LEFT JOIN (
                SELECT
                    created_by,
                    COUNT(*) AS jumlah
                FROM surat_masuk
                ' . $smWhere . '
                GROUP BY created_by
            ) sm
                ON sm.created_by = u.id

            LEFT JOIN (
                SELECT
                    created_by,
                    COUNT(*) AS jumlah
                FROM surat_keluar
                ' . $skWhere . '
                GROUP BY created_by
            ) sk
                ON sk.created_by = u.id

            LEFT JOIN (
                SELECT
                    ke_user_id,
                    COUNT(*) AS diterima,

                    SUM(
                        CASE
                            WHEN status = "selesai"
                            THEN 1
                            ELSE 0
                        END
                    ) AS selesai,

                    AVG(
                        CASE
                            WHEN status = "selesai"
                            THEN TIMESTAMPDIFF(
                                MINUTE,
                                created_at,
                                updated_at
                            )
                            ELSE NULL
                        END
                    ) AS rata_rata_menit

                FROM disposisi
                ' . $dWhere . '
                GROUP BY ke_user_id
            ) d
                ON d.ke_user_id = u.id

            LEFT JOIN (
                SELECT
                    user_id,
                    COUNT(*) AS jumlah
                FROM activity_logs
                ' . $activityWhere . '
                GROUP BY user_id
            ) al
                ON al.user_id = u.id

            WHERE u.status = 1

            ORDER BY
                u.name ASC
        ';

        $data =
            $this->db
                ->query(
                    $sql,
                    $params
                )
                ->getResultArray();

        /*
        |--------------------------------------------------------------------------
        | CAST KE INTEGER / FLOAT
        |--------------------------------------------------------------------------
        */

        foreach ($data as &$item) {
            $item['id'] =
                (int) $item['id'];

            $item['status'] =
                (int) $item['status'];

            $item['surat_masuk'] =
                (int) $item['surat_masuk'];

            $item['surat_keluar'] =
                (int) $item['surat_keluar'];

            $item['total_surat'] =
                (int) $item['total_surat'];

            $item['disposisi_diterima'] =
                (int) $item['disposisi_diterima'];

            $item['disposisi_selesai'] =
                (int) $item['disposisi_selesai'];

            $item[
                'rata_rata_penyelesaian_menit'
            ] = (float) $item[
                'rata_rata_penyelesaian_menit'
            ];

            $item[
                'rata_rata_penyelesaian_jam'
            ] = (float) $item[
                'rata_rata_penyelesaian_jam'
            ];

            $item['jumlah_aktivitas'] =
                (int) $item['jumlah_aktivitas'];
        }

        unset($item);

        return $this->respond([
            'status' => true,

            'message' =>
                'Data kinerja pegawai berhasil diambil.',

            'data' => $data,

            'filter' => [
                'year' => $year,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DETAIL KINERJA PEGAWAI
    |--------------------------------------------------------------------------
    |
    | GET /api/dashboard/kinerja/{userId}
    | GET /api/dashboard/kinerja/{userId}?year=2026
    |
    */

    public function kinerjaDetail($userId = null)
    {
        if (
            !$userId ||
            !ctype_digit((string) $userId)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'ID pengguna tidak valid.',
            ], 400);
        }

        $yearParam =
            $this->request->getGet('year');

        $year = null;

        if (
            $yearParam !== null &&
            $yearParam !== ''
        ) {
            $year = (int) $yearParam;

            if (
                $year < 2000 ||
                $year > 2100
            ) {
                return $this->respond([
                    'status' => false,
                    'message' =>
                        'Tahun tidak valid.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | USER
        |--------------------------------------------------------------------------
        */

        $user =
            $this->db
                ->table('users')
                ->select(
                    '
                    id,
                    name,
                    username,
                    email,
                    role,
                    jabatan,
                    status
                    '
                )
                ->where(
                    'id',
                    $userId
                )
                ->get()
                ->getRowArray();

        if (!$user) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Pengguna tidak ditemukan.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | SURAT MASUK
        |--------------------------------------------------------------------------
        */

        $suratMasukBuilder =
            $this->db
                ->table('surat_masuk')
                ->where(
                    'created_by',
                    $userId
                );

        if ($year !== null) {
            $suratMasukBuilder->where(
                'YEAR(tanggal)',
                $year,
                false
            );
        }

        $jumlahSuratMasuk =
            $suratMasukBuilder
                ->countAllResults();

        /*
        |--------------------------------------------------------------------------
        | SURAT KELUAR
        |--------------------------------------------------------------------------
        */

        $suratKeluarBuilder =
            $this->db
                ->table('surat_keluar')
                ->where(
                    'created_by',
                    $userId
                );

        if ($year !== null) {
            $suratKeluarBuilder->where(
                'YEAR(tanggal)',
                $year,
                false
            );
        }

        $jumlahSuratKeluar =
            $suratKeluarBuilder
                ->countAllResults();

        /*
        |--------------------------------------------------------------------------
        | DISPOSISI
        |--------------------------------------------------------------------------
        */

        $disposisiBuilder =
            $this->db
                ->table('disposisi')
                ->where(
                    'ke_user_id',
                    $userId
                );

        if ($year !== null) {
            $disposisiBuilder->where(
                'YEAR(created_at)',
                $year,
                false
            );
        }

        $jumlahDisposisi =
            $disposisiBuilder
                ->countAllResults();

        $disposisiSelesaiBuilder =
            $this->db
                ->table('disposisi')
                ->where(
                    'ke_user_id',
                    $userId
                )
                ->where(
                    'status',
                    'selesai'
                );

        if ($year !== null) {
            $disposisiSelesaiBuilder->where(
                'YEAR(created_at)',
                $year,
                false
            );
        }

        $jumlahDisposisiSelesai =
            $disposisiSelesaiBuilder
                ->countAllResults();

        /*
        |--------------------------------------------------------------------------
        | RATA-RATA WAKTU PENYELESAIAN
        |--------------------------------------------------------------------------
        */

        $avgSql = '
            SELECT
                AVG(
                    TIMESTAMPDIFF(
                        MINUTE,
                        created_at,
                        updated_at
                    )
                ) AS rata_rata_menit

            FROM disposisi

            WHERE
                ke_user_id = ?
                AND status = "selesai"
        ';

        $avgParams = [
            (int) $userId,
        ];

        if ($year !== null) {
            $avgSql .=
                ' AND YEAR(created_at) = ?';

            $avgParams[] =
                $year;
        }

        $avgResult =
            $this->db
                ->query(
                    $avgSql,
                    $avgParams
                )
                ->getRowArray();

        $rataRataMenit =
            round(
                (float) (
                    $avgResult[
                        'rata_rata_menit'
                    ] ?? 0
                ),
                2
            );

        /*
        |--------------------------------------------------------------------------
        | ACTIVITY LOG
        |--------------------------------------------------------------------------
        */

        $activityBuilder =
            $this->db
                ->table('activity_logs')
                ->where(
                    'user_id',
                    $userId
                );

        if ($year !== null) {
            $activityBuilder->where(
                'YEAR(created_at)',
                $year,
                false
            );
        }

        $jumlahAktivitas =
            $activityBuilder
                ->countAllResults();

        /*
        |--------------------------------------------------------------------------
        | 20 AKTIVITAS TERBARU
        |--------------------------------------------------------------------------
        */

        $recentActivityBuilder =
            $this->db
                ->table('activity_logs')
                ->select(
                    '
                    id,
                    aktivitas,
                    modul,
                    referensi_id,
                    deskripsi,
                    ip_address,
                    created_at
                    '
                )
                ->where(
                    'user_id',
                    $userId
                );

        if ($year !== null) {
            $recentActivityBuilder->where(
                'YEAR(created_at)',
                $year,
                false
            );
        }

        $recentActivity =
            $recentActivityBuilder
                ->orderBy(
                    'id',
                    'DESC'
                )
                ->limit(20)
                ->get()
                ->getResultArray();

        return $this->respond([
            'status' => true,

            'message' =>
                'Detail kinerja pegawai berhasil diambil.',

            'data' => [

                'user' => [
                    'id' =>
                        (int) $user['id'],

                    'name' =>
                        $user['name'],

                    'username' =>
                        $user['username'],

                    'email' =>
                        $user['email'],

                    'role' =>
                        $user['role'],

                    'jabatan' =>
                        $user['jabatan'],

                    'status' =>
                        (int) $user['status'],
                ],

                'kinerja' => [
                    'surat_masuk' =>
                        $jumlahSuratMasuk,

                    'surat_keluar' =>
                        $jumlahSuratKeluar,

                    'total_surat' =>
                        $jumlahSuratMasuk +
                        $jumlahSuratKeluar,

                    'disposisi_diterima' =>
                        $jumlahDisposisi,

                    'disposisi_selesai' =>
                        $jumlahDisposisiSelesai,

                    'rata_rata_penyelesaian_menit' =>
                        $rataRataMenit,

                    'rata_rata_penyelesaian_jam' =>
                        round(
                            $rataRataMenit / 60,
                            2
                        ),

                    'jumlah_aktivitas' =>
                        $jumlahAktivitas,
                ],

                'aktivitas_terbaru' =>
                    $recentActivity,

                'filter' => [
                    'year' =>
                        $year,
                ],
            ],
        ]);
    }
}