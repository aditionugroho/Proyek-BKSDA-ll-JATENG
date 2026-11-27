<?php

namespace App\Controllers;

use App\Models\AuthTokenModel;
use App\Models\UserModel;
use CodeIgniter\Controller;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Psr\Log\LoggerInterface;

/**
 * BaseController provides a convenient place for loading components
 * and performing functions that are needed by all your controllers.
 *
 * Extend this class in any new controllers:
 * ```
 *     class Home extends BaseController
 * ```
 *
 * For security, be sure to declare any new methods as protected or private.
 */
abstract class BaseController extends Controller
{
    /**
     * Be sure to declare properties for any property fetch you initialized.
     * The creation of dynamic property is deprecated in PHP 8.2.
     */

    // protected $session;

    /**
     * Cache identitas user pada request berjalan
     * agar token/user tidak di-query berulang.
     *
     * null = belum di-resolve, false = anonim/token tidak valid.
     */
    protected array|false|null $currentUserIdentity = null;

    /**
     * @return void
     */
    public function initController(RequestInterface $request, ResponseInterface $response, LoggerInterface $logger)
    {
        // Load here all helpers you want to be available in your controllers that extend BaseController.
        // Caution: Do not put the this below the parent::initController() call below.
        // $this->helpers = ['form', 'url'];

        // Caution: Do not edit this line.
        parent::initController($request, $response, $logger);

        // Preload any models, libraries, etc, here.
        // $this->session = service('session');
    }

    /**
     * User aktif dari bearer token pada request berjalan.
     * Token sudah divalidasi penuh oleh auth/role filter;
     * di sini cukup dipetakan ke baris user aktif.
     */
    protected function getCurrentUser(): ?array
    {
        if ($this->currentUserIdentity !== null) {
            return $this->currentUserIdentity === false
                ? null
                : $this->currentUserIdentity;
        }

        $authHeader = $this->request->getHeaderLine('Authorization');

        if (
            !$authHeader ||
            !preg_match('/^Bearer\s+(\S+)$/i', $authHeader, $matches)
        ) {
            $this->currentUserIdentity = false;

            return null;
        }

        $token = (new AuthTokenModel())
            ->where('token_hash', hash('sha256', $matches[1]))
            ->where('revoked_at', null)
            ->first();

        if (!$token) {
            $this->currentUserIdentity = false;

            return null;
        }

        $user = (new UserModel())
            ->where('id', $token['user_id'])
            ->where('status', 1)
            ->first();

        $this->currentUserIdentity = $user ?: false;

        return $user ?: null;
    }

    protected function getCurrentUserId(): ?int
    {
        $user = $this->getCurrentUser();

        return $user !== null ? (int) $user['id'] : null;
    }
}
