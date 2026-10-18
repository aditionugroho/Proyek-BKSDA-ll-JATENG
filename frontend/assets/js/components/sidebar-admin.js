/* ============================================
   SIDEBAR ADMIN — E-Office SKSDA
   Merender sidebar + menu ke #admin-sidebar.
   Item aktif terdeteksi otomatis dari nama
   file URL saat ini.
   ============================================ */

/* ===== Konfigurasi menu (diekspor agar bisa dipakai ulang) ===== */
export const ADMIN_MENU = [
  {
    section: "MENU UTAMA ADMIN",
    items: [
      { label: "Dashboard", href: "dashboard.html", icon: "grid" },
      { label: "Data Pengguna", href: "data-pengguna.html", icon: "users" },
      { label: "Input Surat", href: "input-surat.html", icon: "mail" },
      { label: "Export Data & Laporan", href: "export-data.html", icon: "file" },
    { label: "Backup Data", href: "backup-data.html", icon: "refresh" },
    { label: "Pengumuman", href: "pengumuman.html", icon: "megaphone" }
  ]
},
  {
    section: "AKUN & KEAMANAN",
    items: [
      { label: "Profil Admin", href: "profil-admin.html", icon: "user" }
    ]
  }
];

/* ===== Kumpulan ikon SVG inline ===== */
const ICONS = {
  grid:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  users:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  mail:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  file:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  refresh:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>',
  megaphone:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8v18L3 13v-2z"></path><line x1="11.6" y1="16.8" x2="15" y2="18.4"></line><line x1="11.6" y1="16.8" x2="11.6" y2="11.2"></line></svg>',
  user:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  logout:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
};

/* ===== Render sidebar ===== */
function renderSidebar() {
  const sidebar = document.getElementById("admin-sidebar");
  if (!sidebar) return;

  // Nama file URL saat ini (untuk deteksi menu aktif)
  const currentFile = window.location.pathname.split("/").pop() || "dashboard.html";

  const sectionsHtml = ADMIN_MENU.map((group) => {
    const items = group.items
      .map((item) => {
        const isActive = item.href === currentFile;
        return `
          <a href="${item.href}" class="sidebar-link${isActive ? " is-active" : ""}"${isActive ? ' aria-current="page"' : ""}>
            ${ICONS[item.icon] || ""}
            <span>${item.label}</span>
          </a>`;
      })
      .join("");

    return `
      <div class="sidebar-section">
        <p class="sidebar-section-label">${group.section}</p>
        ${items}
      </div>`;
  }).join("");

  sidebar.className = "admin-sidebar";
  sidebar.innerHTML = `
    <!-- Brand -->
    <div class="sidebar-brand">
      <img src="../../assets/js/images/logokehutanan.jpeg" alt="Logo SKSDA" />
      <div class="sidebar-brand-name">
        <strong>E-Office SKSDA</strong>
        <span>Wilayah II Pemalang</span>
      </div>
    </div>

    <!-- Badge status sistem -->
    <div class="sidebar-status">
      <span class="status-dot" aria-hidden="true"></span>
      <span class="status-text">Sistem Online</span>
      <span class="status-badge">AKTIF</span>
    </div>

    <!-- Menu -->
    <nav class="sidebar-menu" aria-label="Menu admin">
      ${sectionsHtml}
    </nav>

    <!-- Keluar sesi -->
    <a href="#" class="sidebar-logout" id="sidebar-logout">
      ${ICONS.logout}
      <span>Keluar Sesi</span>
    </a>
  `;

  // Backdrop untuk mobile
  if (!document.querySelector(".sidebar-backdrop")) {
    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);
  }
}

/* ===== Toggle sidebar (tombol hamburger di navbar) ===== */
document.addEventListener("click", (event) => {
  if (event.target.closest("#sidebar-toggle")) {
    document.body.classList.toggle("sidebar-open");
    return;
  }
  // Klik backdrop menutup sidebar
  if (event.target.classList.contains("sidebar-backdrop")) {
    document.body.classList.remove("sidebar-open");
  }
});

/* ===== Keluar sesi: bersihkan sesi → redirect login ===== */
document.addEventListener("click", (event) => {
  if (!event.target.closest("#sidebar-logout")) return;
  event.preventDefault();
  window.sessionStorage.clear();
  window.localStorage.removeItem("eoffice_session"); // hapus juga sesi "tetap masuk"
  window.location.href = "../../login.html";
});

renderSidebar();
