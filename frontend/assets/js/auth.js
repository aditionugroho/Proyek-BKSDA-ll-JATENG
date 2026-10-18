/* ============================================
   AUTH — E-Office SKSDA
   checkAuth(role?): dipanggil di setiap halaman.
   Tanpa sesi, atau role tidak sesuai →
   redirect ke halaman login.
   ============================================ */

const SESSION_KEY = "eoffice_session";
const LOGIN_URL = "../../login.html"; // relatif dari pages/<role>/

function readSession() {
  // "Tetap masuk" menyimpan sesi di localStorage, selain itu sessionStorage
  const raw = window.sessionStorage.getItem(SESSION_KEY) || window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Cek autentikasi.
 * @param {string} [requiredRole] opsional — bila diisi, sesi harus
 *        memiliki role yang sama (mis. "kepala-seksi")
 */
export function checkAuth(requiredRole) {
  const session = readSession();
  if (!session || (requiredRole && session.role !== requiredRole)) {
    window.location.replace(LOGIN_URL);
    return null;
  }
  return session;
}

checkAuth();
