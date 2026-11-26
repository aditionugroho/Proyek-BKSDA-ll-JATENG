<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\JadwalModel;
use CodeIgniter\API\ResponseTrait;

class JadwalController extends BaseController
{
    use ResponseTrait;

    private function formatAgenda(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'tanggal' => $row['tanggal'],
            'jamMulai' => substr($row['jam_mulai'], 0, 5),
            'jamSelesai' => substr($row['jam_selesai'], 0, 5),
            'judul' => $row['judul'],
            'lokasi' => $row['lokasi'] ?? '',
            'deskripsi' => $row['deskripsi'] ?? '',
            'status' => $row['status'],
            'sumber' => $row['jenis'],
        ];
    }

    private function unauthorized()
    {
        return $this->respond([
            'status' => false,
            'message' => 'Tidak terautentikasi.',
        ], 401);
    }

    private function validateAgenda(array $data): ?string
    {
        if (trim((string) ($data['judul'] ?? '')) === '') {
            return 'Judul agenda wajib diisi.';
        }

        if (mb_strlen((string) $data['judul']) > 255) {
            return 'Judul maksimal 255 karakter.';
        }

        $tanggal = (string) ($data['tanggal'] ?? '');

        $date = \DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $tanggal
        );

        if (!$date || $date->format('Y-m-d') !== $tanggal) {
            return 'Format tanggal tidak valid.';
        }

        $mulai = (string) ($data['jamMulai'] ?? '');
        $selesai = (string) ($data['jamSelesai'] ?? '');

        foreach ([$mulai, $selesai] as $jam) {
            if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $jam)) {
                return 'Format jam harus HH:MM.';
            }
        }

        if ($selesai <= $mulai) {
            return 'Jam selesai harus lebih besar dari jam mulai.';
        }

        if (mb_strlen((string) ($data['lokasi'] ?? '')) > 255) {
            return 'Lokasi maksimal 255 karakter.';
        }

        return null;
    }

    private function payload(array $data): array
    {
        return [
            'judul' => trim((string) $data['judul']),
            'tanggal' => $data['tanggal'],
            'jam_mulai' => $data['jamMulai'] . ':00',
            'jam_selesai' => $data['jamSelesai'] . ':00',
            'lokasi' => trim((string) ($data['lokasi'] ?? '')),
            'deskripsi' => trim((string) ($data['deskripsi'] ?? '')),
        ];
    }

    public function index()
    {
        if (!$this->getCurrentUser()) {
            return $this->unauthorized();
        }

        $rows = (new JadwalModel())->getAgendaSeksi();

        return $this->respond([
            'status' => true,
            'hariIni' => date('Y-m-d'),
            'agenda' => array_map(
                fn ($row) => $this->formatAgenda($row),
                $rows
            ),
        ]);
    }

    public function saya()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $model = new JadwalModel();

        $rows = array_merge(
            $model->getAgendaSeksi(),
            (new JadwalModel())->getAgendaPribadi((int) $user['id'])
        );

        usort($rows, static function ($a, $b) {
            return strcmp(
                $a['tanggal'] . ' ' . $a['jam_mulai'],
                $b['tanggal'] . ' ' . $b['jam_mulai']
            );
        });

        return $this->respond([
            'status' => true,
            'agenda' => array_map(
                fn ($row) => $this->formatAgenda($row),
                $rows
            ),
        ]);
    }

    public function create()
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid.',
            ], 400);
        }

        $error = $this->validateAgenda($data);

        if ($error !== null) {
            return $this->respond([
                'status' => false,
                'message' => $error,
            ], 422);
        }

        /*
         * Agenda seksi hanya untuk Admin dan Kepala Seksi;
         * pegawai lain hanya dapat membuat agenda pribadi.
         */

        $jenis = $data['jenis'] ?? 'pribadi';

        if ($jenis === 'seksi') {
            if (
                !in_array(
                    $user['role'],
                    ['admin', 'kepala_seksi'],
                    true
                )
            ) {
                return $this->respond([
                    'status' => false,
                    'message' => 'Hanya Admin dan Kepala Seksi yang dapat menambahkan agenda seksi.',
                ], 403);
            }
        } elseif ($jenis !== 'pribadi') {
            return $this->respond([
                'status' => false,
                'message' => 'Jenis agenda hanya boleh pribadi atau seksi.',
            ], 422);
        }

        $model = new JadwalModel();

        $payload = $this->payload($data);
        $payload['user_id'] = (int) $user['id'];
        $payload['jenis'] = $jenis;
        $payload['status'] = 'Terjadwal';

        $id = $model->insert($payload);

        if ($id === false) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menyimpan agenda.',
                'errors' => $model->errors(),
            ], 422);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Agenda berhasil ditambahkan.',
            'agenda' => $this->formatAgenda($model->find($id)),
        ], 201);
    }

    public function update($id)
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $model = new JadwalModel();

        /*
         * Agenda seksi hanya dapat dikelola oleh
         * Admin dan Kepala Seksi; selain itu hanya
         * agenda pribadi milik sendiri.
         */

        $agendaQuery = $model
            ->where('id', $id)
            ->where('user_id', $user['id']);

        if (
            !in_array(
                $user['role'],
                ['admin', 'kepala_seksi'],
                true
            )
        ) {
            $agendaQuery->where('jenis', 'pribadi');
        }

        $agenda = $agendaQuery->first();

        if (!$agenda) {
            return $this->respond([
                'status' => false,
                'message' => 'Agenda tidak ditemukan.',
            ], 404);
        }

        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->respond([
                'status' => false,
                'message' => 'Body JSON tidak valid.',
            ], 400);
        }

        $error = $this->validateAgenda($data);

        if ($error !== null) {
            return $this->respond([
                'status' => false,
                'message' => $error,
            ], 422);
        }

        if (!$model->update($agenda['id'], $this->payload($data))) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal memperbarui agenda.',
                'errors' => $model->errors(),
            ], 422);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Agenda berhasil diperbarui.',
            'agenda' => $this->formatAgenda($model->find($agenda['id'])),
        ]);
    }

    public function delete($id)
    {
        $user = $this->getCurrentUser();

        if (!$user) {
            return $this->unauthorized();
        }

        $model = new JadwalModel();

        /*
         * Agenda seksi hanya dapat dikelola oleh
         * Admin dan Kepala Seksi; selain itu hanya
         * agenda pribadi milik sendiri.
         */

        $agendaQuery = $model
            ->where('id', $id)
            ->where('user_id', $user['id']);

        if (
            !in_array(
                $user['role'],
                ['admin', 'kepala_seksi'],
                true
            )
        ) {
            $agendaQuery->where('jenis', 'pribadi');
        }

        $agenda = $agendaQuery->first();

        if (!$agenda) {
            return $this->respond([
                'status' => false,
                'message' => 'Agenda tidak ditemukan.',
            ], 404);
        }

        if (!$model->delete($agenda['id'])) {
            return $this->respond([
                'status' => false,
                'message' => 'Gagal menghapus agenda.',
            ], 500);
        }

        return $this->respond([
            'status' => true,
            'message' => 'Agenda berhasil dihapus.',
        ]);
    }
}