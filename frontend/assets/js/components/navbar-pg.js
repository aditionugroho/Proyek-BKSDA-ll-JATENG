/* ============================================
   NAVBAR PEGAWAI — E-Office SKSDA
   Brand "SKSDA e-Office" + search + bell/gear/
   avatar (tanpa nama & badge role).
   ============================================ */

function renderPgNavbar() {
  const navbar = document.getElementById("pg-navbar");
  if (!navbar) {
    console.error("[navbar-pg] Elemen #pg-navbar tidak ditemukan — navbar tidak dapat dirender.");
    return;
  }

  navbar.className = "pg-navbar";
  navbar.innerHTML = `
    <div class="pg-navbar-left">

      <!-- Tombol hamburger (tampil < 1024px) -->
      <button type="button" class="pg-sidebar-toggle" id="sidebar-toggle" aria-label="Buka/tutup menu">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <!-- Brand (WAJIB ada) -->
      <span class="pg-brand">SKSDA e-Office</span>

      <!-- Search pill -->
      <div class="pg-search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="search" placeholder="Cari dokumen, tugas, surat..." aria-label="Pencarian" />
      </div>

    </div>

    <div class="pg-navbar-right">

      <!-- Notifikasi (klik → halaman notifikasi) -->
      <a href="notifikasi.html" class="pg-icon-btn" aria-label="Notifikasi" title="Notifikasi">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <span class="pg-icon-dot" aria-hidden="true"></span>
      </a>

      <!-- Pengaturan (klik → halaman pengaturan) -->
      <a href="pengaturan.html" class="pg-icon-btn" aria-label="Pengaturan" title="Pengaturan">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </a>

      <!-- Avatar 36px abu muda + icon user (klik → profil pegawai) -->
      <a href="profil.html" class="pg-nav-avatar" aria-label="Profil pengguna" title="Profil saya">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </a>

    </div>
  `;
}

renderPgNavbar();

/* Pencarian global: Enter → halaman hasil pencarian */
const pgSearch = document.querySelector("#pg-navbar input[type='search']");
if (pgSearch) {
  pgSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && pgSearch.value.trim()) {
      location.href = "../../pencarian.html?q=" + encodeURIComponent(pgSearch.value.trim());
    }
  });
}
