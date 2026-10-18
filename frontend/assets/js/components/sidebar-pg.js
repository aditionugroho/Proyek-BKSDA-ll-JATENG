/* ============================================
   SIDEBAR PEGAWAI — E-Office SKSDA
   Logo → menu utama (7) → gap → menu bawah
   (Notifikasi, Profil) ke #pg-sidebar.
   ============================================ */

import { checkAuth } from "../auth.js";

/* Halaman pegawai wajib sesi role "pegawai" */
checkAuth("pegawai");

/* ===== Konfigurasi menu ===== */

/* Menu utama (7 item) */
export const PG_MENU = [
  { label: "Dashboard", href: "dashboard.html", icon: "grid" },
  { label: "Tugas Saya", href: "tugas-saya.html", icon: "clipboard" },
  { label: "Surat", href: "surat.html", icon: "mail" },
  { label: "Disposisi Saya", href: "disposisi-saya.html", icon: "folderCheck" },
  { label: "Jadwal", href: "jadwal.html", icon: "calendar" },
  { label: "Dokumen Saya", href: "dokumen-saya.html", icon: "fileText" },
  { label: "Arsip", href: "arsip.html", icon: "archive" }
];

/* Menu bawah — terpisah dengan gap besar */
export const PG_MENU_BOTTOM = [
  { label: "Notifikasi", href: "notifikasi.html", icon: "bell" },
  { label: "Profil", href: "profil.html", icon: "userCircle" },
  { label: "Pengaturan", href: "pengaturan.html", icon: "gear" }
];

/* ===== Ikon SVG inline ===== */
const ICONS = {
  grid: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
  folderCheck: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><polyline points="9 14 11 16 15 12"></polyline></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  fileText: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  archive: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
  userCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  gear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
};

/* ===== Render sidebar ===== */
function renderSidebar() {
  const sidebar = document.getElementById("pg-sidebar");

  // Fallback error bila elemen target tidak ada
  if (!sidebar) {
    console.error("[sidebar-pg] Elemen #pg-sidebar tidak ditemukan — sidebar tidak dapat dirender.");
    return;
  }

  sidebar.className = "pg-sidebar";

  // Deteksi menu aktif dari nama file URL
  const currentFile = window.location.pathname.split("/").pop() || "dashboard.html";

  const linkHtml = (item) => {
    const isActive = item.href === currentFile;
    return `
      <a href="${item.href}" class="pg-menu-link${isActive ? " is-active" : ""}"${isActive ? ' aria-current="page"' : ""}>
        ${ICONS[item.icon]}
        <span>${item.label}</span>
      </a>`;
  };

  sidebar.innerHTML = `
    <!-- Logo (pengganti card user) -->
    <div class="pg-logo">
      <img src="../../assets/js/images/logokehutanan.jpeg" alt="Logo SKSDA" />
      <div class="pg-logo-text">
        <span class="pg-logo-title">E-OFFICE</span>
        <span class="pg-logo-sub">SKSDA Wilayah II Pemalang</span>
      </div>
    </div>

    <!-- Menu utama (7 item) — flex:1 memberi gap besar ke bawah -->
    <nav class="pg-menu" aria-label="Menu utama pegawai">
      ${PG_MENU.map(linkHtml).join("")}
    </nav>

    <!-- Menu bawah — terpisah -->
    <nav class="pg-menu-bottom" aria-label="Menu akun">
      ${PG_MENU_BOTTOM.map(linkHtml).join("")}
    </nav>
  `;

  // Backdrop mobile
  if (!document.querySelector(".pg-backdrop")) {
    const backdrop = document.createElement("div");
    backdrop.className = "pg-backdrop";
    document.body.appendChild(backdrop);
  }
}

/* ===== Toggle sidebar (hamburger di navbar) ===== */
document.addEventListener("click", (event) => {
  if (event.target.closest("#sidebar-toggle")) {
    document.body.classList.toggle("pg-sidebar-open");
    return;
  }
  if (event.target.classList.contains("pg-backdrop")) {
    document.body.classList.remove("pg-sidebar-open");
  }
});

renderSidebar();
