/* ============================================
   SIDEBAR KEPALA SEKSI — E-Office SKSDA
   Merender sidebar flat + card user + status
   + settings/logout ke #ks-sidebar.
   ============================================ */

import { checkAuth } from "../auth.js";

/* Halaman kepala-seksi wajib sesi role "kepala-seksi".
   Halaman tertentu bisa memasang window.KS_SKIP_AUTH = true
   (mis. Pengaturan) agar guard dilewati untuk demo. */
if (window.KS_SKIP_AUTH) {
  // lewati guard
} else {
  checkAuth("kepala-seksi");
}

/* ===== Konfigurasi menu (flat, tanpa grouping) ===== */
export const KS_MENU = [
  { label: "Dashboard", href: "dashboard.html", icon: "grid" },
  { label: "Surat Masuk", href: "surat-masuk.html", icon: "inbox" },
  { label: "Surat Keluar", href: "surat-keluar.html", icon: "send" },
  { label: "Disposisi", href: "disposisi.html", icon: "checkSquare" },
  { label: "Tugas Seksi", href: "tugas-seksi.html", icon: "clipboard" },
  { label: "Jadwal", href: "jadwal.html", icon: "calendar" },
  { label: "Direktori Staf", href: "direktori-staf.html", icon: "users" },
  { label: "Arsip", href: "arsip.html", icon: "archive" },
  { label: "Laporan", href: "laporan.html", icon: "fileText" },
  { label: "Notifikasi", href: "notifikasi.html", icon: "bell" },
  { label: "Pengaturan", href: "pengaturan.html", icon: "settings" },
  { label: "Profil", href: "profil.html", icon: "userCircle" }
];

/* Data user sidebar */
const KS_USER = {
  nama: "Alex Rivera",
  role: "Kepala Seksi",
  inisial: "AR"
};

/* ===== Ikon SVG inline ===== */
const ICONS = {
  grid: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  inbox: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
  send: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
  checkSquare: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>',
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  archive: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>',
  fileText: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
  userCircle: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
  logout: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
};

/* ===== Render sidebar ===== */
function renderSidebar() {
  const sidebar = document.getElementById("ks-sidebar");

  // Fallback error bila elemen target tidak ada di HTML
  if (!sidebar) {
    console.error("[sidebar-ks] Elemen #ks-sidebar tidak ditemukan — sidebar tidak dapat dirender.");
    const warn = document.createElement("div");
    warn.textContent = "Error: elemen #ks-sidebar tidak ditemukan.";
    warn.style.cssText = "position:fixed;top:70px;left:16px;z-index:99;padding:10px 14px;background:#FEE2E2;color:#DC2626;border-radius:8px;font:600 13px sans-serif;";
    document.body.appendChild(warn);
    return;
  }

  sidebar.className = "ks-sidebar";

  // Deteksi menu aktif dari nama file URL
  const currentFile = window.location.pathname.split("/").pop() || "dashboard.html";

  const menuHtml = KS_MENU.map((item) => {
    const isActive = item.href === currentFile;
    return `
      <a href="${item.href}" class="ks-menu-link${isActive ? " is-active" : ""}"${isActive ? ' aria-current="page"' : ""}>
        ${ICONS[item.icon]}
        <span>${item.label}</span>
      </a>`;
  }).join("");

  sidebar.innerHTML = `
    <!-- Brand + logo -->
    <div class="ks-brand">
      <img src="../../assets/js/images/logokehutanan.jpeg" alt="Logo SKSDA" />
      <div class="ks-brand-text">
        <strong>E-Office SKSDA</strong>
        <span>Wilayah II Pemalang</span>
      </div>
    </div>

    <!-- Card user -->
    <div class="ks-user-card">
      <span class="ks-avatar">${KS_USER.inisial}</span>
      <div>
        <span class="ks-user-name">${KS_USER.nama}</span>
        <span class="ks-user-role">${KS_USER.role}</span>
      </div>
    </div>

    <!-- Menu flat -->
    <nav class="ks-menu" aria-label="Menu kepala seksi">
      ${menuHtml}
    </nav>

    <!-- Status sistem -->
    <div class="ks-status">
      <span class="dot"></span>
      Status Sistem: OK
    </div>

    <!-- Settings & logout -->
    <div class="ks-bottom">
      <a href="#" class="ks-bottom-link">${ICONS.settings}<span>Settings</span></a>
      <a href="#" class="ks-bottom-link ks-bottom-link--logout" id="ks-logout">${ICONS.logout}<span>Logout</span></a>
    </div>
  `;

  // Backdrop mobile
  if (!document.querySelector(".ks-backdrop")) {
    const backdrop = document.createElement("div");
    backdrop.className = "ks-backdrop";
    document.body.appendChild(backdrop);
  }
}

/* ===== Toggle sidebar (hamburger di navbar) ===== */
document.addEventListener("click", (event) => {
  if (event.target.closest("#sidebar-toggle")) {
    document.body.classList.toggle("ks-sidebar-open");
    return;
  }
  if (event.target.classList.contains("ks-backdrop")) {
    document.body.classList.remove("ks-sidebar-open");
  }
});

/* ===== Logout: bersihkan sesi → redirect login ===== */
document.addEventListener("click", (event) => {
  if (!event.target.closest("#ks-logout")) return;
  event.preventDefault();
  window.sessionStorage.clear();
  window.localStorage.removeItem("eoffice_session"); // hapus juga sesi "tetap masuk"
  window.location.href = "../../login.html";
});

renderSidebar();
