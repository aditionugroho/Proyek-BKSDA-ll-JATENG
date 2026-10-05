<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use Dompdf\Dompdf;
use Dompdf\Options;

class LaporanController extends BaseController
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
    | VALIDASI PERIODE
    |--------------------------------------------------------------------------
    */

    private function validatePeriod(
        string $tanggalMulai,
        string $tanggalAkhir
    ) {
        if (
            $tanggalMulai !== '' &&
            !$this->isValidDate($tanggalMulai)
        ) {
            return [
                'status' => false,
                'message' =>
                    'Format tanggal_mulai harus YYYY-MM-DD.',
            ];
        }

        if (
            $tanggalAkhir !== '' &&
            !$this->isValidDate($tanggalAkhir)
        ) {
            return [
                'status' => false,
                'message' =>
                    'Format tanggal_akhir harus YYYY-MM-DD.',
            ];
        }

        if (
            $tanggalMulai !== '' &&
            $tanggalAkhir !== '' &&
            strtotime($tanggalMulai) >
            strtotime($tanggalAkhir)
        ) {
            return [
                'status' => false,
                'message' =>
                    'Tanggal mulai tidak boleh melebihi tanggal akhir.',
            ];
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | ESCAPE HTML
    |--------------------------------------------------------------------------
    */

    private function e($value): string
    {
        return htmlspecialchars(
            (string) ($value ?? '-'),
            ENT_QUOTES,
            'UTF-8'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT TANGGAL
    |--------------------------------------------------------------------------
    */

    private function formatDate(?string $date): string
    {
        if (
            $date === null ||
            $date === ''
        ) {
            return '-';
        }

        $timestamp = strtotime($date);

        if (!$timestamp) {
            return $date;
        }

        return date(
            'd-m-Y',
            $timestamp
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT DATETIME
    |--------------------------------------------------------------------------
    */

    private function formatDateTime(?string $date): string
    {
        if (
            $date === null ||
            $date === ''
        ) {
            return '-';
        }

        $timestamp = strtotime($date);

        if (!$timestamp) {
            return $date;
        }

        return date(
            'd-m-Y H:i',
            $timestamp
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PERIODE TEXT
    |--------------------------------------------------------------------------
    */

    private function getPeriodText(
        string $tanggalMulai,
        string $tanggalAkhir
    ): string {
        if (
            $tanggalMulai === '' &&
            $tanggalAkhir === ''
        ) {
            return 'Semua Periode';
        }

        if (
            $tanggalMulai !== '' &&
            $tanggalAkhir !== ''
        ) {
            return
                $this->formatDate($tanggalMulai)
                . ' s/d '
                . $this->formatDate($tanggalAkhir);
        }

        if ($tanggalMulai !== '') {
            return
                'Mulai '
                . $this->formatDate($tanggalMulai);
        }

        return
            'Sampai '
            . $this->formatDate($tanggalAkhir);
    }

    /*
    |--------------------------------------------------------------------------
    | CSS PDF
    |--------------------------------------------------------------------------
    */

    private function pdfStyle(): string
    {
        return '
            <style>
                @page {
                    margin: 28px 32px;
                }

                body {
                    font-family: DejaVu Sans, sans-serif;
                    font-size: 10px;
                    color: #222;
                }

                h1 {
                    text-align: center;
                    font-size: 18px;
                    margin: 0;
                }

                h2 {
                    text-align: center;
                    font-size: 13px;
                    margin: 5px 0;
                }

                .subtitle {
                    text-align: center;
                    font-size: 10px;
                    margin-bottom: 18px;
                }

                .info {
                    margin-bottom: 12px;
                }

                .info td {
                    padding: 2px 6px 2px 0;
                    vertical-align: top;
                }

                table.data {
                    width: 100%;
                    border-collapse: collapse;
                }

                table.data th,
                table.data td {
                    border: 1px solid #555;
                    padding: 5px;
                    vertical-align: top;
                }

                table.data th {
                    background: #eeeeee;
                    text-align: center;
                    font-weight: bold;
                }

                .center {
                    text-align: center;
                }

                .right {
                    text-align: right;
                }

                .footer {
                    margin-top: 20px;
                    font-size: 9px;
                    text-align: right;
                }

                .empty {
                    text-align: center;
                    padding: 15px;
                }
            </style>
        ';
    }

    /*
    |--------------------------------------------------------------------------
    | HEADER LAPORAN
    |--------------------------------------------------------------------------
    */

    private function reportHeader(
        string $title,
        string $periode
    ): string {
        return '
            <h1>E-OFFICE BKSDA</h1>
            <h2>'
            . $this->e($title)
            . '</h2>

            <div class="subtitle">
                SKSDA Wilayah II Pemalang
            </div>

            <table class="info">
                <tr>
                    <td><strong>Periode</strong></td>
                    <td>:</td>
                    <td>'
                    . $this->e($periode)
                    . '</td>
                </tr>

                <tr>
                    <td><strong>Tanggal Cetak</strong></td>
                    <td>:</td>
                    <td>'
                    . date('d-m-Y H:i')
                    . ' WIB</td>
                </tr>
            </table>
        ';
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE PDF
    |--------------------------------------------------------------------------
    */

    private function generatePdf(
        string $html,
        string $filename,
        string $orientation = 'landscape'
    ) {
        $options = new Options();

        $options->set(
            'defaultFont',
            'DejaVu Sans'
        );

        $options->set(
            'isRemoteEnabled',
            false
        );

        $dompdf =
            new Dompdf($options);

        $dompdf->loadHtml(
            $html,
            'UTF-8'
        );

        $dompdf->setPaper(
            'A4',
            $orientation
        );

        $dompdf->render();

        return $this->response
            ->setStatusCode(200)
            ->setHeader(
                'Content-Type',
                'application/pdf'
            )
            ->setHeader(
                'Content-Disposition',
                'attachment; filename="' .
                $filename .
                '"'
            )
            ->setHeader(
                'Cache-Control',
                'no-store, no-cache, must-revalidate'
            )
            ->setBody(
                $dompdf->output()
            );
    }

    /*
    |--------------------------------------------------------------------------
    | LAPORAN SURAT MASUK
    |--------------------------------------------------------------------------
    |
    | GET /api/laporan/surat-masuk
    |
    | Query:
    | tanggal_mulai
    | tanggal_akhir
    | klasifikasi
    | status
    | search
    |
    */

    public function suratMasuk()
    {
        $tanggalMulai = trim(
            (string) $this->request
                ->getGet('tanggal_mulai')
        );

        $tanggalAkhir = trim(
            (string) $this->request
                ->getGet('tanggal_akhir')
        );

        $klasifikasi = trim(
            (string) $this->request
                ->getGet('klasifikasi')
        );

        $status = trim(
            (string) $this->request
                ->getGet('status')
        );

        $search = trim(
            (string) $this->request
                ->getGet('search')
        );

        $periodError =
            $this->validatePeriod(
                $tanggalMulai,
                $tanggalAkhir
            );

        if ($periodError) {
            return $this->respond(
                $periodError,
                422
            );
        }

        $builder =
            $this->db
                ->table('surat_masuk sm')
                ->select(
                    '
                    sm.id,
                    sm.no_agenda,
                    sm.no_surat,
                    sm.tanggal,
                    sm.asal,
                    sm.perihal,
                    sm.klasifikasi,
                    sm.status,
                    sm.created_at,
                    u.name AS created_by_name
                    '
                )
                ->join(
                    'users u',
                    'u.id = sm.created_by',
                    'left'
                );

        if ($tanggalMulai !== '') {
            $builder->where(
                'sm.tanggal >=',
                $tanggalMulai
            );
        }

        if ($tanggalAkhir !== '') {
            $builder->where(
                'sm.tanggal <=',
                $tanggalAkhir
            );
        }

        if ($klasifikasi !== '') {
            $builder->where(
                'sm.klasifikasi',
                $klasifikasi
            );
        }

        if ($status !== '') {
            $builder->where(
                'sm.status',
                $status
            );
        }

        if ($search !== '') {
            $builder
                ->groupStart()
                ->like(
                    'sm.no_agenda',
                    $search
                )
                ->orLike(
                    'sm.no_surat',
                    $search
                )
                ->orLike(
                    'sm.asal',
                    $search
                )
                ->orLike(
                    'sm.perihal',
                    $search
                )
                ->groupEnd();
        }

        $data =
            $builder
                ->orderBy(
                    'sm.tanggal',
                    'ASC'
                )
                ->orderBy(
                    'sm.id',
                    'ASC'
                )
                ->get()
                ->getResultArray();

        $periode =
            $this->getPeriodText(
                $tanggalMulai,
                $tanggalAkhir
            );

        $html =
            '<html><head>'
            . $this->pdfStyle()
            . '</head><body>';

        $html .=
            $this->reportHeader(
                'LAPORAN SURAT MASUK',
                $periode
            );

        $html .= '
            <table class="data">
                <thead>
                    <tr>
                        <th width="4%">No</th>
                        <th width="9%">No Agenda</th>
                        <th width="13%">No Surat</th>
                        <th width="9%">Tanggal</th>
                        <th width="15%">Asal</th>
                        <th width="22%">Perihal</th>
                        <th width="10%">Klasifikasi</th>
                        <th width="8%">Status</th>
                        <th width="10%">Input Oleh</th>
                    </tr>
                </thead>
                <tbody>
        ';

        if (!$data) {
            $html .= '
                <tr>
                    <td colspan="9" class="empty">
                        Data surat masuk tidak tersedia.
                    </td>
                </tr>
            ';
        } else {
            $no = 1;

            foreach ($data as $item) {
                $html .= '
                    <tr>
                        <td class="center">'
                        . $no++
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['no_agenda']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['no_surat']
                        )
                        . '</td>

                        <td class="center">'
                        . $this->formatDate(
                            $item['tanggal']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['asal']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['perihal']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['klasifikasi']
                        )
                        . '</td>

                        <td class="center">'
                        . $this->e(
                            $item['status']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['created_by_name']
                        )
                        . '</td>
                    </tr>
                ';
            }
        }

        $html .= '
                </tbody>
            </table>

            <div class="footer">
                Total Data:
                '
                . count($data)
                . '
            </div>
        ';

        $html .=
            '</body></html>';

        return $this->generatePdf(
            $html,
            'laporan-surat-masuk-'
            . date('Ymd-His')
            . '.pdf'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LAPORAN SURAT KELUAR
    |--------------------------------------------------------------------------
    */

    public function suratKeluar()
    {
        $tanggalMulai = trim(
            (string) $this->request
                ->getGet('tanggal_mulai')
        );

        $tanggalAkhir = trim(
            (string) $this->request
                ->getGet('tanggal_akhir')
        );

        $klasifikasi = trim(
            (string) $this->request
                ->getGet('klasifikasi')
        );

        $search = trim(
            (string) $this->request
                ->getGet('search')
        );

        $periodError =
            $this->validatePeriod(
                $tanggalMulai,
                $tanggalAkhir
            );

        if ($periodError) {
            return $this->respond(
                $periodError,
                422
            );
        }

        $builder =
            $this->db
                ->table('surat_keluar sk')
                ->select(
                    '
                    sk.id,
                    sk.no_agenda,
                    sk.no_surat,
                    sk.tanggal,
                    sk.tujuan,
                    sk.perihal,
                    sk.klasifikasi,
                    sk.created_at,
                    u.name AS created_by_name
                    '
                )
                ->join(
                    'users u',
                    'u.id = sk.created_by',
                    'left'
                );

        if ($tanggalMulai !== '') {
            $builder->where(
                'sk.tanggal >=',
                $tanggalMulai
            );
        }

        if ($tanggalAkhir !== '') {
            $builder->where(
                'sk.tanggal <=',
                $tanggalAkhir
            );
        }

        if ($klasifikasi !== '') {
            $builder->where(
                'sk.klasifikasi',
                $klasifikasi
            );
        }

        if ($search !== '') {
            $builder
                ->groupStart()
                ->like(
                    'sk.no_agenda',
                    $search
                )
                ->orLike(
                    'sk.no_surat',
                    $search
                )
                ->orLike(
                    'sk.tujuan',
                    $search
                )
                ->orLike(
                    'sk.perihal',
                    $search
                )
                ->groupEnd();
        }

        $data =
            $builder
                ->orderBy(
                    'sk.tanggal',
                    'ASC'
                )
                ->orderBy(
                    'sk.id',
                    'ASC'
                )
                ->get()
                ->getResultArray();

        $periode =
            $this->getPeriodText(
                $tanggalMulai,
                $tanggalAkhir
            );

        $html =
            '<html><head>'
            . $this->pdfStyle()
            . '</head><body>';

        $html .=
            $this->reportHeader(
                'LAPORAN SURAT KELUAR',
                $periode
            );

        $html .= '
            <table class="data">
                <thead>
                    <tr>
                        <th width="4%">No</th>
                        <th width="10%">No Agenda</th>
                        <th width="14%">No Surat</th>
                        <th width="10%">Tanggal</th>
                        <th width="18%">Tujuan</th>
                        <th width="24%">Perihal</th>
                        <th width="10%">Klasifikasi</th>
                        <th width="10%">Input Oleh</th>
                    </tr>
                </thead>
                <tbody>
        ';

        if (!$data) {
            $html .= '
                <tr>
                    <td colspan="8" class="empty">
                        Data surat keluar tidak tersedia.
                    </td>
                </tr>
            ';
        } else {
            $no = 1;

            foreach ($data as $item) {
                $html .= '
                    <tr>
                        <td class="center">'
                        . $no++
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['no_agenda']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['no_surat']
                        )
                        . '</td>

                        <td class="center">'
                        . $this->formatDate(
                            $item['tanggal']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['tujuan']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['perihal']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['klasifikasi']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['created_by_name']
                        )
                        . '</td>
                    </tr>
                ';
            }
        }

        $html .= '
                </tbody>
            </table>

            <div class="footer">
                Total Data:
                '
                . count($data)
                . '
            </div>

            </body>
            </html>
        ';

        return $this->generatePdf(
            $html,
            'laporan-surat-keluar-'
            . date('Ymd-His')
            . '.pdf'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LAPORAN DISPOSISI
    |--------------------------------------------------------------------------
    */

    public function disposisi()
    {
        $tanggalMulai = trim(
            (string) $this->request
                ->getGet('tanggal_mulai')
        );

        $tanggalAkhir = trim(
            (string) $this->request
                ->getGet('tanggal_akhir')
        );

        $status = trim(
            (string) $this->request
                ->getGet('status')
        );

        $userId = trim(
            (string) $this->request
                ->getGet('user_id')
        );

        $periodError =
            $this->validatePeriod(
                $tanggalMulai,
                $tanggalAkhir
            );

        if ($periodError) {
            return $this->respond(
                $periodError,
                422
            );
        }

        if (
            $userId !== '' &&
            !ctype_digit($userId)
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'user_id harus berupa angka.',
            ], 422);
        }

        $allowedStatus = [
            'menunggu',
            'dalam_proses',
            'selesai',
            'dikembalikan',
        ];

        if (
            $status !== '' &&
            !in_array(
                $status,
                $allowedStatus,
                true
            )
        ) {
            return $this->respond([
                'status' => false,
                'message' =>
                    'Status disposisi tidak valid.',
            ], 422);
        }

        $builder =
            $this->db
                ->table('disposisi d')
                ->select(
                    '
                    d.id,
                    d.catatan,
                    d.hasil_tindak_lanjut,
                    d.status,
                    d.deadline,
                    d.created_at,
                    d.updated_at,

                    sm.no_agenda,
                    sm.no_surat,
                    sm.perihal,

                    pengirim.name AS dari_user,
                    penerima.name AS ke_user
                    '
                )
                ->join(
                    'surat_masuk sm',
                    'sm.id = d.surat_masuk_id',
                    'left'
                )
                ->join(
                    'users pengirim',
                    'pengirim.id = d.dari_user_id',
                    'left'
                )
                ->join(
                    'users penerima',
                    'penerima.id = d.ke_user_id',
                    'left'
                );

        if ($tanggalMulai !== '') {
            $builder->where(
                'd.created_at >=',
                $tanggalMulai . ' 00:00:00'
            );
        }

        if ($tanggalAkhir !== '') {
            $builder->where(
                'd.created_at <=',
                $tanggalAkhir . ' 23:59:59'
            );
        }

        if ($status !== '') {
            $builder->where(
                'd.status',
                $status
            );
        }

        if ($userId !== '') {
            $builder
                ->groupStart()
                ->where(
                    'd.dari_user_id',
                    (int) $userId
                )
                ->orWhere(
                    'd.ke_user_id',
                    (int) $userId
                )
                ->groupEnd();
        }

        $data =
            $builder
                ->orderBy(
                    'd.created_at',
                    'ASC'
                )
                ->get()
                ->getResultArray();

        $periode =
            $this->getPeriodText(
                $tanggalMulai,
                $tanggalAkhir
            );

        $html =
            '<html><head>'
            . $this->pdfStyle()
            . '</head><body>';

        $html .=
            $this->reportHeader(
                'LAPORAN DISPOSISI',
                $periode
            );

        $html .= '
            <table class="data">
                <thead>
                    <tr>
                        <th width="4%">No</th>
                        <th width="9%">No Agenda</th>
                        <th width="11%">No Surat</th>
                        <th width="17%">Perihal</th>
                        <th width="11%">Dari</th>
                        <th width="11%">Kepada</th>
                        <th width="13%">Instruksi</th>
                        <th width="8%">Status</th>
                        <th width="8%">Deadline</th>
                        <th width="8%">Dibuat</th>
                    </tr>
                </thead>
                <tbody>
        ';

        if (!$data) {
            $html .= '
                <tr>
                    <td colspan="10" class="empty">
                        Data disposisi tidak tersedia.
                    </td>
                </tr>
            ';
        } else {
            $no = 1;

            foreach ($data as $item) {
                $html .= '
                    <tr>
                        <td class="center">'
                        . $no++
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['no_agenda']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['no_surat']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['perihal']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['dari_user']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['ke_user']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['catatan']
                        )
                        . '</td>

                        <td class="center">'
                        . $this->e(
                            $item['status']
                        )
                        . '</td>

                        <td class="center">'
                        . $this->formatDate(
                            $item['deadline']
                        )
                        . '</td>

                        <td class="center">'
                        . $this->formatDate(
                            $item['created_at']
                        )
                        . '</td>
                    </tr>
                ';
            }
        }

        $html .= '
                </tbody>
            </table>

            <div class="footer">
                Total Data:
                '
                . count($data)
                . '
            </div>

            </body>
            </html>
        ';

        return $this->generatePdf(
            $html,
            'laporan-disposisi-'
            . date('Ymd-His')
            . '.pdf'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LAPORAN KINERJA PEGAWAI
    |--------------------------------------------------------------------------
    |
    | GET /api/laporan/kinerja?year=2026
    |
    */

    public function kinerja()
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

        $sql = '
            SELECT
                u.id,
                u.name,
                u.username,
                u.role,
                u.jabatan,

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
                ) AS rata_rata_menit,

                ROUND(
                    COALESCE(
                        d.rata_rata_menit,
                        0
                    ) / 60,
                    2
                ) AS rata_rata_jam,

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

                WHERE
                    YEAR(tanggal) = ?

                GROUP BY created_by
            ) sm
                ON sm.created_by = u.id

            LEFT JOIN (
                SELECT
                    created_by,
                    COUNT(*) AS jumlah

                FROM surat_keluar

                WHERE
                    YEAR(tanggal) = ?

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

                WHERE
                    YEAR(created_at) = ?

                GROUP BY ke_user_id
            ) d
                ON d.ke_user_id = u.id

            LEFT JOIN (
                SELECT
                    user_id,
                    COUNT(*) AS jumlah

                FROM activity_logs

                WHERE
                    YEAR(created_at) = ?

                GROUP BY user_id
            ) al
                ON al.user_id = u.id

            WHERE
                u.status = 1

            ORDER BY
                u.name ASC
        ';

        $data =
            $this->db
                ->query(
                    $sql,
                    [
                        $year,
                        $year,
                        $year,
                        $year,
                    ]
                )
                ->getResultArray();

        $html =
            '<html><head>'
            . $this->pdfStyle()
            . '</head><body>';

        $html .=
            $this->reportHeader(
                'LAPORAN KINERJA PEGAWAI',
                'Tahun ' . $year
            );

        $html .= '
            <table class="data">
                <thead>
                    <tr>
                        <th width="4%">No</th>
                        <th width="16%">Nama</th>
                        <th width="13%">Jabatan</th>
                        <th width="8%">Surat Masuk</th>
                        <th width="8%">Surat Keluar</th>
                        <th width="8%">Total Surat</th>
                        <th width="9%">Disposisi Diterima</th>
                        <th width="9%">Disposisi Selesai</th>
                        <th width="12%">Rata-rata Penyelesaian</th>
                        <th width="8%">Aktivitas</th>
                    </tr>
                </thead>
                <tbody>
        ';

        if (!$data) {
            $html .= '
                <tr>
                    <td colspan="10" class="empty">
                        Data kinerja pegawai tidak tersedia.
                    </td>
                </tr>
            ';
        } else {
            $no = 1;

            foreach ($data as $item) {
                $html .= '
                    <tr>
                        <td class="center">'
                        . $no++
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['name']
                        )
                        . '</td>

                        <td>'
                        . $this->e(
                            $item['jabatan']
                        )
                        . '</td>

                        <td class="center">'
                        . (int) $item['surat_masuk']
                        . '</td>

                        <td class="center">'
                        . (int) $item['surat_keluar']
                        . '</td>

                        <td class="center">'
                        . (int) $item['total_surat']
                        . '</td>

                        <td class="center">'
                        . (int) $item['disposisi_diterima']
                        . '</td>

                        <td class="center">'
                        . (int) $item['disposisi_selesai']
                        . '</td>

                        <td class="center">'
                        . $this->e(
                            $item['rata_rata_jam']
                        )
                        . ' jam</td>

                        <td class="center">'
                        . (int) $item['jumlah_aktivitas']
                        . '</td>
                    </tr>
                ';
            }
        }

        $html .= '
                </tbody>
            </table>

            <div class="footer">
                Total Pegawai:
                '
                . count($data)
                . '
            </div>

            </body>
            </html>
        ';

        return $this->generatePdf(
            $html,
            'laporan-kinerja-'
            . $year
            . '-'
            . date('Ymd-His')
            . '.pdf'
        );
    }
}