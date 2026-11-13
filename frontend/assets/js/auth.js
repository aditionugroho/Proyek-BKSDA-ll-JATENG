/* ============================================
   AUTH — E-Office BKSDA

   Menjaga akses halaman berdasarkan:
   - Session
   - Token login
   - Role pengguna

   Catatan:
   Backend tetap menjadi penentu izin akses.
   ============================================ */

const SESSION_KEY = "eoffice_session";

const LOGIN_URL = "../../login.html";

function readSession() {
  const raw =
    window.sessionStorage.getItem(SESSION_KEY) ||
    window.localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Memeriksa sesi dan role pengguna.
 *
 * @param {string} [requiredRole]
 * Contoh:
 * - "admin"
 * - "kepala-seksi"
 * - "pegawai"
 */
export function checkAuth(requiredRole) {
  const session = readSession();

  const isLive =
  typeof EOfficeAPI !== "undefined"
    ? EOfficeAPI.config.LIVE
    : true;

  const hasToken = Boolean(
    (window.sessionStorage.getItem("eoffice_token") || window.localStorage.getItem("eoffice_token"))
  );

  if (
    !session ||
    (isLive && !hasToken) ||
    (requiredRole && session.role !== requiredRole)
  ) {
    window.location.replace(LOGIN_URL);
    return null;
  }

  return session;
}

checkAuth();