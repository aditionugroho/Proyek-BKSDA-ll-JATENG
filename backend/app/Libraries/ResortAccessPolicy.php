<?php

namespace App\Libraries;

use CodeIgniter\Model;

class ResortAccessPolicy
{
    public static function canAccess(
        array $user,
        ?int $documentResortId
    ): bool {
        if ((int) ($user['status'] ?? 0) !== 1) {
            return false;
        }

        $role = $user['role'] ?? '';

        if (in_array($role, ['admin', 'kepala_seksi'], true)) {
            return true;
        }

        if ($role !== 'staf') {
            return false;
        }

        $userResortId = (int) ($user['resort_id'] ?? 0);

        return $userResortId > 0
            && $documentResortId !== null
            && $documentResortId > 0
            && $userResortId === $documentResortId;
    }

    public static function scopeQuery(
        Model $model,
        string $table,
        array $user
    ): void {
        $role = $user['role'] ?? '';

        if (
            (int) ($user['status'] ?? 0) !== 1 ||
            !in_array($role, ['admin', 'kepala_seksi', 'staf'], true)
        ) {
            $model->where('1 = 0', null, false);
            return;
        }

        if (in_array($role, ['admin', 'kepala_seksi'], true)) {
            return;
        }

        $resortId = (int) ($user['resort_id'] ?? 0);

        if ($resortId < 1) {
            $model->where('1 = 0', null, false);
            return;
        }

        $model->where($table . '.resort_id', $resortId);
    }
}