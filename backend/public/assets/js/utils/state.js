/* ============================================
   UTILITIES: LIST STATE — E-Office SKSDA
   Persist tab/filter/search/pagination list
   ke sessionStorage agar tidak hilang saat
   pergi ke halaman detail lalu kembali.
   ============================================ */

const PREFIX = "list-state-";

export function saveListState(pageKey, state) {
  try {
    sessionStorage.setItem(PREFIX + pageKey, JSON.stringify(state));
  } catch {
    /* storage penuh / disabled — abaikan */
  }
}

export function loadListState(pageKey) {
  try {
    return JSON.parse(sessionStorage.getItem(PREFIX + pageKey) || "null");
  } catch {
    return null;
  }
}

export function clearListState(pageKey) {
  try {
    sessionStorage.removeItem(PREFIX + pageKey);
  } catch {
    /* abaikan */
  }
}
