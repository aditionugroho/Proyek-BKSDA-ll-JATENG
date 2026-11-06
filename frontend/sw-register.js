/* ============================================
   REGISTRASI SERVICE WORKER — E-Office SKSDA
   Hanya jalan di konteks aman (HTTPS/localhost).
   Di jaringan lokal HTTP dilewati diam-diam —
   "Tambahkan ke layar utama" tetap berfungsi.
   ============================================ */

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* gagal registrasi tidak mengganggu aplikasi */
    });
  });
}
