<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use Dompdf\Dompdf;
use Dompdf\Options;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\DataType;

class ExportController extends BaseController
{
    private const SOURCES = [
        'masuk' => [
            'table' => 'surat_masuk',
            'columns' => ['id','no_agenda','no_surat','tanggal','asal','perihal','klasifikasi','status','resort_id','created_at'],
            'title' => 'Surat Masuk',
            'icon' => 'mail'
        ],
        'keluar' => [
            'table' => 'surat_keluar',
            'columns' => ['id','no_agenda','no_surat','tanggal','tujuan','perihal','klasifikasi','resort_id','created_at'],
            'title' => 'Surat Keluar',
            'icon' => 'send'
        ],
        'pengguna' => [
            'table' => 'users',
            'columns' => ['id','name','username','email','role','jabatan','resort_id','status','created_at'],
            'title' => 'Data Pengguna',
            'icon' => 'idCard'
        ],
        'aktivitas' => [
            'table' => 'activity_logs',
            'columns' => ['id','user_id','aktivitas','modul','referensi_id','deskripsi','created_at'],
            'title' => 'Aktivitas Sistem',
            'icon' => 'history'
        ]
    ];

    private function historyTable(): void
    {
        $db = db_connect();

        if ($db->tableExists('export_history')) {
            return;
        }

        $forge = \Config\Database::forge();

        $forge->addField([
            'id' => [
                'type' => 'BIGINT',
                'unsigned' => true,
                'auto_increment' => true
            ],
            'jenis' => [
                'type' => 'VARCHAR',
                'constraint' => 24
            ],
            'format' => [
                'type' => 'VARCHAR',
                'constraint' => 8
            ],
            'filename' => [
                'type' => 'VARCHAR',
                'constraint' => 180
            ],
            'created_at' => [
                'type' => 'DATETIME'
            ]
        ]);

        $forge->addKey('id', true);
        $forge->createTable('export_history', true);
    }

    public function index()
    {
        $this->historyTable();

        $db = db_connect();
        $stats = [];
        $exports = [];

        foreach (self::SOURCES as $key => $source) {
            $count = $db->table($source['table'])->countAllResults();

            $stats[] = [
                'label' => $source['title'],
                'value' => number_format($count, 0, ',', '.'),
                'sub' => 'data',
                'foot' => 'Data dari database'
            ];

            $exports[] = [
                'id' => $key,
                'icon' => $source['icon'],
                'badgeTop' => $count . ' DATA TERSEDIA',
                'title' => $source['title'],
                'desc' => 'Unduh data asli dari database.',
                'footIcon' => 'shield',
                'footText' => 'Akses Admin',
                'link' => 'Export ' . $source['title']
            ];
        }

        $reports = [];

        $history = $db->table('export_history')
            ->orderBy('id', 'DESC')
            ->limit(50)
            ->get()
            ->getResultArray();

        foreach ($history as $row) {
            $reports[] = [
                'id' => (int) $row['id'],
                'nama' => $row['filename'],
                'jenis' => self::SOURCES[$row['jenis']]['title'] ?? $row['jenis'],
                'periode' => 'Semua data',
                'format' => $row['format'],
                'oleh' => 'Administrator',
                'tanggal' => $row['created_at'],
                'status' => 'Selesai'
            ];
        }

        return $this->response->setJSON([
            'stats' => $stats,
            'exports' => $exports,
            'reports' => $reports
        ]);
    }

    private function build(string $jenis, string $format): array
    {
        if (
            !isset(self::SOURCES[$jenis]) ||
            !in_array($format, ['CSV','PDF','XLSX'], true)
        ) {
            throw new \InvalidArgumentException('Format tidak valid.');
        }

        $source = self::SOURCES[$jenis];
        $db = db_connect();

        $columns = $source['columns'];
        $rows = [];
        $lastId = 0;

        do {
            $batch = $db->table($source['table'])
                ->select(implode(', ', $columns))
                ->where('id >', $lastId)
                ->orderBy('id', 'ASC')
                ->limit(500)
                ->get()
                ->getResultArray();

            foreach ($batch as $row) {
                $lastId = (int) $row['id'];
                $rows[] = $row;
            }
        } while (count($batch) === 500);

        $filename = 'export_' . $jenis . '_'
            . date('Ymd_His') . '_'
            . bin2hex(random_bytes(3)) . '.'
            . strtolower($format);

        if ($format === 'CSV') {
            $stream = fopen('php://temp', 'w+');

            if (!$stream) {
                throw new \RuntimeException('Gagal membuat CSV.');
            }

            fwrite($stream, "\xEF\xBB\xBF");
            fputcsv($stream, $columns);

            foreach ($rows as $row) {
                $values = [];

                foreach ($columns as $column) {
                    $value = (string) ($row[$column] ?? '');

                    if (preg_match('/^\s*[=+@\-]/u', $value)) {
                        $value = "'" . $value;
                    }

                    $values[] = $value;
                }

                fputcsv($stream, $values);
            }

            rewind($stream);
            $content = stream_get_contents($stream);
            fclose($stream);

            return [$content, $filename, 'text/csv; charset=UTF-8'];
        }

        if ($format === 'XLSX') {
            $book = new Spreadsheet();
            $sheet = $book->getActiveSheet();
            $sheet->setTitle(substr($source['title'], 0, 31));

            foreach ($columns as $j => $column) {
                $sheet->setCellValueExplicit(
                    [$j + 1, 1],
                    $column,
                    DataType::TYPE_STRING
                );
            }

            foreach ($rows as $i => $row) {
                foreach ($columns as $j => $column) {
                    $sheet->setCellValueExplicit(
                        [$j + 1, $i + 2],
                        (string) ($row[$column] ?? ''),
                        DataType::TYPE_STRING
                    );
                }
            }

            $sheet->getStyle('1:1')->getFont()->setBold(true);
            $sheet->freezePane('A2');

            $temp = tempnam(sys_get_temp_dir(), 'eox_');

            try {
                (new Xlsx($book))->save($temp);
                $content = file_get_contents($temp);
            } finally {
                @unlink($temp);
                $book->disconnectWorksheets();
            }

            return [
                $content,
                $filename,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
        }

        $escape = static fn($v) =>
            htmlspecialchars((string) ($v ?? ''), ENT_QUOTES, 'UTF-8');

        $html = '<html><head><meta charset="UTF-8">';
        $html .= '<style>
            body{font-family:DejaVu Sans,sans-serif;font-size:8px}
            h2{font-size:15px}
            table{width:100%;border-collapse:collapse;table-layout:fixed}
            th,td{border:1px solid #999;padding:4px;word-wrap:break-word}
            th{background:#eee}
        </style></head><body>';

        $html .= '<h2>Rekap ' . $escape($source['title']) . '</h2>';
        $html .= '<p>Dicetak: ' . date('Y-m-d H:i:s')
            . ' | Jumlah: ' . count($rows) . '</p>';

        $html .= '<table><thead><tr>';

        foreach ($columns as $column) {
            $html .= '<th>' . $escape($column) . '</th>';
        }

        $html .= '</tr></thead><tbody>';

        foreach ($rows as $row) {
            $html .= '<tr>';

            foreach ($columns as $column) {
                $html .= '<td>' . $escape($row[$column] ?? '') . '</td>';
            }

            $html .= '</tr>';
        }

        $html .= '</tbody></table></body></html>';

        $options = new Options();
        $options->set('isRemoteEnabled', false);
        $options->set('isPhpEnabled', false);

        $pdf = new Dompdf($options);
        $pdf->loadHtml($html, 'UTF-8');
        $pdf->setPaper('A4', 'landscape');
        $pdf->render();

        return [$pdf->output(), $filename, 'application/pdf'];
    }

    private function sendFile(array $file)
    {
        [$content, $filename, $mime] = $file;

        return $this->response
            ->setHeader('Content-Type', $mime)
            ->setHeader(
                'Content-Disposition',
                'attachment; filename="' . $filename . '"'
            )
            ->setHeader('Cache-Control', 'no-store')
            ->setBody($content);
    }

    public function create()
    {
        $body = $this->request->getJSON(true) ?? [];
        $jenis = (string) ($body['jenis'] ?? '');
        $format = strtoupper((string) ($body['format'] ?? ''));

        if (
            !isset(self::SOURCES[$jenis]) ||
            !in_array($format, ['CSV','PDF','XLSX'], true)
        ) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON(['message' => 'Jenis data atau format tidak valid.']);
        }

        try {
            $file = $this->build($jenis, $format);

            $this->historyTable();

            db_connect()->table('export_history')->insert([
                'jenis' => $jenis,
                'format' => $format,
                'filename' => $file[1],
                'created_at' => date('Y-m-d H:i:s')
            ]);

            return $this->sendFile($file);
        } catch (\Throwable $e) {
            log_message('error', 'Export failed: ' . $e->getMessage());

            return $this->response
                ->setStatusCode(500)
                ->setJSON(['message' => 'Gagal membuat export. Periksa log backend.']);
        }
    }

    public function download($id = null)
    {
        if (!ctype_digit((string) $id)) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['message' => 'Riwayat tidak ditemukan.']);
        }

        $this->historyTable();

        $row = db_connect()
            ->table('export_history')
            ->where('id', (int) $id)
            ->get()
            ->getRowArray();

        if (!$row) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['message' => 'Riwayat tidak ditemukan.']);
        }

        try {
            $file = $this->build($row['jenis'], $row['format']);
            $file[1] = $row['filename'];

            return $this->sendFile($file);
        } catch (\Throwable $e) {
            log_message('error', 'Export download failed: ' . $e->getMessage());

            return $this->response
                ->setStatusCode(500)
                ->setJSON(['message' => 'Gagal mengunduh laporan.']);
        }
    }
}