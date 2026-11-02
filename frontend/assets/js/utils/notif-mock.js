/* ============================================
   NOTIFIKASI MOCK (localStorage) — E-Office
   Penyimpanan notifikasi dinamis selama backend
   belum siap. Saat LIVE, semua ini digantikan
   server (GET /api/notifikasi) — file ini tetap
   aman dipanggil karena fungsinya hanya aktif
   untuk mode mock.
   ============================================ */

const KEY_KS = "eoffice_notif_ks";
const KEY_PG = "eoffice_notif_pg";

function keyRole(role) {
  return role === "ks" ? KEY_KS : KEY_PG;
}

/* Ambil daftar notifikasi dinamis (terbaru duluan) */
export function ambilNotif(role) {
  try {
    return JSON.parse(localStorage.getItem(keyRole(role)) || "[]");
  } catch (e) {
    return [];
  }
}

/* Tambah notifikasi baru (pemicu aksi pengguna di mode mock) */
export function tambahNotif(role, item) {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) return; // LIVE: server yang memicu
  const daftar = ambilNotif(role);
  daftar.unshift(
    Object.assign(
      { id: "N-" + Date.now(), waktu: "Baru saja", unread: true },
      item
    )
  );
  localStorage.setItem(keyRole(role), JSON.stringify(daftar.slice(0, 30)));
}

/* Tandai satu dibaca (dipanggil halaman notifikasi) */
export function tandaiDibaca(role, id) {
  const daftar = ambilNotif(role);
  const t = daftar.find((n) => String(n.id) === String(id));
  if (t) {
    t.unread = false;
    localStorage.setItem(keyRole(role), JSON.stringify(daftar));
  }
}

/* Tandai semua dibaca */
export function tandaiSemuaDibaca(role) {
  const daftar = ambilNotif(role).map((n) => Object.assign({}, n, { unread: false }));
  localStorage.setItem(keyRole(role), JSON.stringify(daftar));
}

/* Jumlah belum dibaca — untuk badge navbar (mock) */
export function hitungBelumDibaca(role) {
  return ambilNotif(role).filter((n) => n.unread).length;
}

/* ============================================================
   BADGE NAVBAR — dipasang komponen navbar-ks/navbar-pg.
   Mock: hitung dari localStorage dinamis.
   LIVE: ambil dari GET /api/notifikasi (hanya butuh jumlah).
   ============================================================ */
export async function pasangBadgeNotif(role, badgeEl) {
  if (!badgeEl) return;
  let count = 0;
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    try {
      const list = role === "ks" ? await EOfficeAPI.getNotifikasi() : await EOfficeAPI.getNotifikasiSaya();
      count = list.filter((n) => n.unread).length;
    } catch (e) {
      count = 0;
    }
  } else {
    count = hitungBelumDibaca(role);
  }
  badgeEl.textContent = count > 9 ? "9+" : String(count);
  badgeEl.style.display = count > 0 ? "" : "none";
}
