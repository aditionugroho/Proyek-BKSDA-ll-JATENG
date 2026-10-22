/* ============================================
   NAVBAR KEPALA SEKSI — E-Office SKSDA
   Search, bell, gear, help, avatar.
   Merender ke #ks-navbar.
   ============================================ */

const KS_NAV_USER = { inisial: "AR" };

function renderKsNavbar() {
  const navbar = document.getElementById("ks-navbar");
  if (!navbar) return;

  navbar.className = "ks-navbar";
  navbar.innerHTML = `
    <div class="ks-navbar-left">

      <!-- Hamburger (tampil < 1024px) -->
      <button type="button" class="ks-sidebar-toggle" id="sidebar-toggle" aria-label="Buka/tutup menu">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>

      <!-- Search -->
      <div class="ks-search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="search" placeholder="Cari surat, tugas, atau staf..." aria-label="Pencarian" />
      </div>

    </div>

    <div class="ks-navbar-right">

      <!-- Notifikasi (klik → halaman notifikasi) -->
      <a href="notifikasi.html" class="ks-icon-btn" aria-label="Notifikasi" title="Notifikasi">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        <span class="ks-icon-dot" aria-hidden="true"></span>
      </a>

      <!-- Pengaturan (klik → halaman pengaturan) -->
      <a href="pengaturan.html" class="ks-icon-btn" aria-label="Pengaturan" title="Pengaturan">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </a>

      <!-- Bantuan -->
      <button type="button" class="ks-icon-btn ks-help-btn" aria-label="Bantuan">?</button>

      <!-- Avatar (klik → profil kepala seksi) -->
      <a href="profil.html" class="ks-nav-avatar" aria-label="Profil pengguna" title="Profil saya">${KS_NAV_USER.inisial}</a>

    </div>
  `;
}

renderKsNavbar();

/* Pencarian global: Enter → halaman hasil pencarian */
const ksSearch = document.querySelector("#ks-navbar input[type='search']");
if (ksSearch) {
  ksSearch.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && ksSearch.value.trim()) {
      location.href = "../../pencarian.html?q=" + encodeURIComponent(ksSearch.value.trim());
    }
  });
}
