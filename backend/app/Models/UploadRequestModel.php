<?php

namespace App\Models;

use CodeIgniter\Model;

class UploadRequestModel extends Model
{
    protected $table = 'upload_requests';

    protected $primaryKey = 'id';

    protected $useAutoIncrement = true;

    protected $returnType = 'array';

    protected $allowedFields = [
        'user_id',
        'resource_type',
        'resource_id',
        'idempotency_key',
        'file_hash',
        'file_path',
        'status',
    ];

    protected $useTimestamps = true;

    protected $dateFormat = 'datetime';

    protected $createdField = 'created_at';

    protected $updatedField = 'updated_at';

    protected $useSoftDeletes = false;
}
