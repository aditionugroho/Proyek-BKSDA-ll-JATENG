/* ============================================
   NAVBAR ADMIN — E-Office SKSDA
   Merender navbar (search, notifikasi, user
   chip, tombol hamburger) ke #admin-navbar.
   ============================================ */

function renderAdminNavbar() {
  const navbar = document.getElementById("admin-navbar");
  if (!navbar) return;

  navbar.className = "admin-navbar";
  navbar.innerHTML = `
    <div class="navbar-left">

      <!-- Tombol hamburger (tampil < 1024px) -->
      <button type="button" class="sidebar-toggle" id="sidebar-toggle" aria-label="Buka/tutup menu">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <!-- Search pill -->
      <div class="navbar-search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="search" placeholder="Cari pengguna, nomor surat, atau log audit..." aria-label="Pencarian" />
      </div>

    </div>

    <div class="navbar-right">

      <!-- Notifikasi -->
      <button type="button" class="navbar-bell" aria-label="Notifikasi">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <span class="bell-dot" aria-hidden="true"></span>
      </button>

      <!-- User chip -->
      <div class="navbar-user" role="button" tabindex="0" aria-label="Profil pengguna">
        <span class="user-avatar" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </span>
        <span class="user-info">
          <span class="user-name">Rian Prasetyo, S.Kom</span>
          <span class="user-role">Admin Sistem Jawa Tengah</span>
        </span>
        <span class="user-badge">ADMIN</span>
      </div>

    </div>
  `;
}

renderAdminNavbar();
