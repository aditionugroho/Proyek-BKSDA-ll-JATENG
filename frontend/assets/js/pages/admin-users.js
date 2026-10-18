/* ============================================
   DATA PENGGUNA (ADMIN) — E-Office SKSDA
   Mock data + render tabel + search/filter/
   pagination fungsional + modal konfirmasi
   ============================================ */

/* ===== MOCK DATA ===== */

/* Kartu statistik */
const USER_STATS = [
  {
    label: "Total Pengguna Terdaftar",
    value: 148,
    badge: { text: "+4 bln ini", tone: "green" },
    sub: "100% pegawai terdata NIP",
    icon: "users",
    tone: "blue"
  },
  {
    label: "Pengguna Aktif Hari Ini",
    value: 132,
    badge: { text: "89.2%", tone: "blue" },
    sub: "16 akun tidak aktif / cuti",
    icon: "shield",
    tone: "green"
  },
  {
    label: "Unit & Seksi Terhubung",
    value: 18,
    sub: "Resort / Subbag",
    sub2: "Wilayah I & II Jateng",
    icon: "layers",
    tone: "gray"
  },
  {
    label: "Perlu Tinjauan Hak Akses",
    value: 3,
    valueRed: true,
    badge: { text: "PERHATIAN", tone: "red" },
    sub: "Mutasi internal belum update",
    icon: "alert",
    tone: "red"
  }
];

/* Pengguna utama (5 baris spesifik) */
const USERS = [
  {
    id: 1,
    nama: "Alex Rivera, S.Hut., M.Sc.",
    nip: "NIP. 19840312 200801 1 005",
    avatar: "AR",
    avatarTone: "blue",
    username: "alex.rivera",
    email: "alex.rivera@bksda.go.id",
    roleLabel: "KEPALA SEKSI",
    roleType: "blue",
    roleGroup: "Kepala Seksi",
    unit: "Seksi Konservasi Wil. II",
    unitSub: "Wilayah Pemalang - Surakarta",
    unitGroup: "Seksi Konservasi Wilayah II",
    status: "AKTIF",
    lastLogin: "10 menit lalu",
    online: false
  },
  {
    id: 2,
    nama: "Budi Santoso, S.Hut",
    nip: "NIP. 19870420 201001 2 011",
    avatar: "BS",
    avatarTone: "green",
    username: "budi.santoso",
    email: "budi.santoso@bksda.go.id",
    roleLabel: "STAF (POLHUT)",
    roleType: "outline",
    roleGroup: "Staf",
    unit: "Resort Baturaden",
    unitSub: "Seksi Konservasi Wilayah II",
    unitGroup: "Resort",
    status: "AKTIF",
    lastLogin: "1 jam lalu",
    online: false
  },
  {
    id: 3,
    nama: "Siti Aminah, S.Hut",
    nip: "NIP. 19900515 201403 2 003",
    avatar: "SA",
    avatarTone: "blue",
    username: "siti.aminah",
    email: "siti.aminah@bksda.go.id",
    roleLabel: "STAF (PEH)",
    roleType: "outline",
    roleGroup: "Staf",
    unit: "Seksi Wilayah II",
    unitSub: "Pengendali Ekosistem Hutan",
    unitGroup: "Seksi Konservasi Wilayah II",
    status: "AKTIF",
    lastLogin: "Hari ini, 08:15 WIB",
    online: false
  },
  {
    id: 4,
    nama: "Rian Prasetyo, S.Kom",
    nip: "NIP. 19921110 201504 1 002",
    avatar: "RP",
    avatarTone: "gray",
    username: "rian.prasetyo",
    email: "rian.prasetyo@bksda.go.id",
    roleLabel: "ADMIN SISTEM",
    roleType: "solid",
    roleGroup: "Admin Sistem",
    unit: "Subbag TU & Data",
    unitSub: "Balai Pusat Semarang",
    unitGroup: "Subbag TU & Data",
    status: "AKTIF",
    lastLogin: "Sedang Online",
    online: true,
    saya: true
  },
  {
    id: 5,
    nama: "Bambang Wijaya",
    nip: "NIP. 19820207 200812 1 007",
    avatar: "BW",
    avatarTone: "gray",
    username: "bambang.w",
    email: "bambang.w@bksda.go.id",
    roleLabel: "STAF",
    roleType: "outline",
    roleGroup: "Staf",
    unit: "Resort Nusakambangan",
    unitSub: "Seksi Konservasi Wilayah II",
    unitGroup: "Resort",
    status: "NONAKTIF",
    lastLogin: "14 hari lalu",
    online: false
  }
];

/* Pengguna pengisi (agar total 148 & pagination/search nyata) */
const FILLER_NAMES = [
  "Dwi Lestari, S.Ev", "Eko Purnomo, S.Hut", "Fitri Handayani, A.Md", "Gunawan Setiadi",
  "Hesti Nuraini, S.Si", "Irfan Maulana, S.Kom", "Joko Susilo, S.Hut", "Kartika Dewi, A.Md",
  "Lukman Hakim", "Maya Rahmawati, S.Hut"
];

const FILLER_UNITS = [
  { unit: "Resort Gunung Slamet", sub: "Seksi Konservasi Wilayah II", group: "Resort" },
  { unit: "Resort Karangkobar", sub: "Seksi Konservasi Wilayah II", group: "Resort" },
  { unit: "Seksi Konservasi Wilayah I", sub: "Wilayah Surakarta", group: "Seksi Konservasi Wilayah I" },
  { unit: "Subbag Kepegawaian", sub: "Balai Pusat Semarang", group: "Subbag TU & Data" }
];

for (let i = USERS.length; i < 148; i++) {
  const nama = FILLER_NAMES[(i - USERS.length) % FILLER_NAMES.length];
  const unit = FILLER_UNITS[i % FILLER_UNITS.length];
  USERS.push({
    id: i + 1,
    nama,
    nip: `NIP. 19${83000000 + i * 137} 2010${String(i % 12 + 1).padStart(2, "0")} 1 ${String((i % 8) + 1).padStart(3, "0")}`,
    avatar: nama.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    avatarTone: i % 3 === 0 ? "green" : "blue",
    username: `pegawai.${String(i).padStart(3, "0")}`,
    email: `pegawai.${String(i).padStart(3, "0")}@bksda.go.id`,
    roleLabel: "STAF",
    roleType: "outline",
    roleGroup: "Staf",
    unit: unit.unit,
    unitSub: unit.sub,
    unitGroup: unit.group,
    status: i % 9 === 0 ? "NONAKTIF" : "AKTIF",
    lastLogin: `${(i % 14) + 1} hari lalu`,
    online: false
  });
}

/* Panel bawah */
const PANEL_RULES = {
  title: "Aturan Hak Akses & Keamanan",
  icon: "shield",
  text: "Setiap mutasi, promosi, atau pergantian kepala resort wajib diperbarui dalam sistem e-Office maksimal 2\u00d724 jam untuk mencegah disposisi surat terhambat.",
  footLeft: "VERSI SKEMA: RBAC-2024.4",
  footRight: "Terverifikasi"
};

const SESSIONS = {
  title: "Sesi Aktif Saat Ini",
  badge: "24 SESI",
  items: [
    { label: "Browser Desktop (Chrome/Edge)", count: "19 user", percent: 79 },
    { label: "Perangkat Mobile (PWA Android/iOS)", count: "5 user", percent: 21 }
  ]
};

const ACTIVITY = {
  title: "Aktivitas Akun Terakhir",
  link: "Lihat Log",
  items: [
    { tone: "green", text: "Rian Prasetyo mereset kata sandi akun siti.aminah (14:10 WIB)" },
    { tone: "red", text: "Akun bambang.w dinonaktifkan sementara oleh Admin (Kemarin)" }
  ]
};

/* ===== IKON SVG INLINE ===== */
const ICONS = {
  users: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
  layers: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
  alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  chevLeft: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
  chevRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
  chevLeftDouble: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>',
  chevRightDouble: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>'
};

/* ===== STATE FILTER ===== */
const state = { search: "", role: "all", status: "all", unit: "all", page: 1, perPage: 5 };

/* ===== RENDER: stat card ===== */
function renderStats() {
  const grid = document.getElementById("users-stats");
  grid.innerHTML = USER_STATS.map((s) => {
    const badge = s.badge ? `<span class="stat-badge stat-badge--${s.badge.tone}">${s.badge.text}</span>` : "";
    const sub2 = s.sub2 ? `<p class="stat-sub">${s.sub2}</p>` : "";
    return `
      <article class="stat-card">
        <div>
          <p class="stat-label">${s.label}</p>
          <div class="stat-value-row">
            <span class="stat-value${s.valueRed ? " stat-value--red" : ""}">${s.value.toLocaleString("id-ID")}</span>
            ${badge}
          </div>
          <p class="stat-sub">${s.sub}</p>
          ${sub2}
        </div>
        <span class="stat-icon stat-icon--${s.tone}">${ICONS[s.icon]}</span>
      </article>`;
  }).join("");
}

/* ===== FILTER DATA ===== */
function getFilteredUsers() {
  const q = state.search.trim().toLowerCase();
  return USERS.filter((u) => {
    const matchSearch =
      !q ||
      [u.nama, u.nip, u.username, u.email, u.unit, u.unitSub].some((f) => f.toLowerCase().includes(q));
    const matchRole = state.role === "all" || u.roleGroup === state.role;
    const matchStatus = state.status === "all" || u.status === state.status;
    const matchUnit = state.unit === "all" || u.unitGroup === state.unit;
    return matchSearch && matchRole && matchStatus && matchUnit;
  });
}

/* ===== RENDER: baris tabel ===== */
function renderTable(filtered) {
  const tbody = document.getElementById("users-tbody");
  const start = (state.page - 1) * state.perPage;
  const rows = filtered.slice(start, start + state.perPage);

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Tidak ada pengguna yang cocok dengan filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((u) => {
      const meTag = u.saya ? '<span class="tag-me">SAYA</span>' : "";
      const login = u.online
        ? `<span class="cell-login--online"><span class="online-dot"></span>Sedang Online</span>`
        : `<span class="cell-login">${u.lastLogin}</span>`;
      return `
        <tr>
          <td>
            <div class="cell-user">
              <span class="avatar avatar--${u.avatarTone}">${u.avatar}</span>
              <div>
                <span class="cell-user-name">${u.nama}${meTag}</span>
                <span class="cell-user-nip">${u.nip}</span>
              </div>
            </div>
          </td>
          <td class="mono">
            <span class="cell-username">${u.username}</span>
            <span class="cell-email">${u.email}</span>
          </td>
          <td><span class="badge badge-role--${u.roleType}">${u.roleLabel}</span></td>
          <td>
            <span class="cell-unit">${u.unit}</span>
            <span class="cell-unit-sub">${u.unitSub}</span>
          </td>
          <td><span class="badge badge-status--${u.status}">${u.status}</span></td>
          <td>${login}</td>
          <td>
            <div class="cell-actions">
              <button type="button" class="action-btn" data-action="edit" data-id="${u.id}" title="Edit pengguna" aria-label="Edit ${u.nama}">${ICONS.edit}</button>
              <button type="button" class="action-btn" data-action="delete" data-id="${u.id}" title="Hapus pengguna" aria-label="Hapus ${u.nama}">${ICONS.trash}</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");
}

/* ===== DAFTAR HALAMAN (dengan elipsis) ===== */
function pageItems(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

/* ===== RENDER: footer tabel + pagination ===== */
function renderFooter(filtered) {
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.perPage));
  if (state.page > totalPages) state.page = totalPages;

  const start = total === 0 ? 0 : (state.page - 1) * state.perPage + 1;
  const end = Math.min(state.page * state.perPage, total);

  document.getElementById("showing-text").textContent =
    `Menampilkan ${start}-${end} dari ${total} pengguna`;

  const pag = document.getElementById("pagination");
  const btn = (label, page, svg, disabled, active) => `
    <button type="button" class="page-btn${active ? " is-active" : ""}" data-page="${page}" ${disabled ? "disabled" : ""} aria-label="Halaman ${page}">
      ${svg ? ICONS[svg] : label}
    </button>`;

  pag.innerHTML =
    btn("", 1, "chevLeftDouble", state.page === 1, false) +
    btn("", state.page - 1, "chevLeft", state.page === 1, false) +
    pageItems(state.page, totalPages)
      .map((p) => (p === "..." ? `<span class="page-ellipsis">...</span>` : btn(p, p, null, false, p === state.page)))
      .join("") +
    btn("", state.page + 1, "chevRight", state.page === totalPages, false) +
    btn("", totalPages, "chevRightDouble", state.page === totalPages, false);
}

/* ===== RENDER: panel bawah ===== */
function renderPanels() {
  const grid = document.getElementById("panels-grid");

  const sessionsHtml = SESSIONS.items
    .map(
      (s) => `
        <div class="session-item">
          <div class="session-top"><span>${s.label}</span><span class="session-count">${s.count}</span></div>
          <div class="session-bar"><span style="width:${s.percent}%"></span></div>
        </div>`
    )
    .join("");

  const activityHtml = ACTIVITY.items
    .map(
      (a) => `
        <div class="activity-item">
          <span class="activity-dot activity-dot--${a.tone}"></span>
          <p class="activity-text">${a.text}</p>
        </div>`
    )
    .join("");

  grid.innerHTML = `
    <!-- Panel 1: aturan hak akses -->
    <article class="panel">
      <div class="panel-head">
        <div class="panel-head-left">
          <span class="panel-head-icon">${ICONS.shield}</span>
          <h3 class="panel-title">${PANEL_RULES.title}</h3>
        </div>
      </div>
      <div class="panel-body"><p class="panel-text">${PANEL_RULES.text}</p></div>
      <div class="panel-foot">
        <span>${PANEL_RULES.footLeft}</span>
        <span class="panel-foot-verified">${ICONS.check}${PANEL_RULES.footRight}</span>
      </div>
    </article>

    <!-- Panel 2: sesi aktif -->
    <article class="panel">
      <div class="panel-head">
        <div class="panel-head-left">
          <h3 class="panel-title">${SESSIONS.title}</h3>
        </div>
        <span class="panel-badge">${SESSIONS.badge}</span>
      </div>
      <div class="panel-body">${sessionsHtml}</div>
    </article>

    <!-- Panel 3: aktivitas akun -->
    <article class="panel">
      <div class="panel-head">
        <div class="panel-head-left">
          <h3 class="panel-title">${ACTIVITY.title}</h3>
        </div>
        <a href="#" class="panel-link">${ACTIVITY.link}</a>
      </div>
      <div class="panel-body">${activityHtml}</div>
    </article>`;
}

/* ===== MODAL KONFIRMASI ===== */
const backdrop = document.getElementById("modal-backdrop");
const modalIcon = document.getElementById("modal-icon");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalConfirm = document.getElementById("modal-confirm");

let confirmAction = null;

function openModal({ icon, title, desc, confirmLabel, danger, onConfirm }) {
  modalIcon.className = `modal-icon modal-icon--${danger ? "red" : "blue"}`;
  modalIcon.innerHTML = ICONS[icon];
  modalTitle.textContent = title;
  modalDesc.textContent = desc;
  modalConfirm.textContent = confirmLabel;
  modalConfirm.className = `btn ${danger ? "btn--danger" : "btn--primary"}`;
  confirmAction = onConfirm;
  backdrop.classList.add("is-open");
}

function closeModal() {
  backdrop.classList.remove("is-open");
  confirmAction = null;
}

document.getElementById("modal-cancel").addEventListener("click", closeModal);
backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && backdrop.classList.contains("is-open")) closeModal();
});

modalConfirm.addEventListener("click", () => {
  if (typeof confirmAction === "function") confirmAction();
  closeModal();
  refresh();
});

/* ===== REFRESH TABEL + FOOTER ===== */
function refresh() {
  const filtered = getFilteredUsers();
  renderTable(filtered);
  renderFooter(filtered);
}

/* ===== EVENT: aksi tabel (edit / hapus) ===== */
document.getElementById("users-tbody").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const user = USERS.find((u) => String(u.id) === btn.dataset.id);
  if (!user) return;

  if (btn.dataset.action === "edit") {
    openModal({
      icon: "edit",
      title: "Edit Pengguna",
      desc: `Buka form perubahan data untuk akun "${user.nama}" (${user.username})?`,
      confirmLabel: "Buka Form Edit",
      danger: false,
      onConfirm: () => console.log("[demo] edit pengguna:", user.username)
    });
  } else {
    openModal({
      icon: "trash",
      title: "Hapus Akun Pengguna",
      desc: `Akun "${user.nama}" (${user.username}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Ya, Hapus Akun",
      danger: true,
      onConfirm: () => {
        const idx = USERS.indexOf(user);
        if (idx !== -1) USERS.splice(idx, 1);
        console.log("[demo] akun dihapus:", user.username);
      }
    });
  }
});

/* ===== EVENT: filter & pagination ===== */
document.getElementById("filter-search").addEventListener("input", (event) => {
  state.search = event.target.value;
  state.page = 1;
  refresh();
});

document.getElementById("filter-role").addEventListener("change", (event) => {
  state.role = event.target.value;
  state.page = 1;
  refresh();
});

document.getElementById("filter-status").addEventListener("change", (event) => {
  state.status = event.target.value;
  state.page = 1;
  refresh();
});

document.getElementById("filter-unit").addEventListener("change", (event) => {
  state.unit = event.target.value;
  state.page = 1;
  refresh();
});

document.getElementById("filter-reset").addEventListener("click", () => {
  state.search = "";
  state.role = "all";
  state.status = "all";
  state.unit = "all";
  state.page = 1;
  document.getElementById("filter-search").value = "";
  document.getElementById("filter-role").value = "all";
  document.getElementById("filter-status").value = "all";
  document.getElementById("filter-unit").value = "all";
  refresh();
});

document.getElementById("per-page").addEventListener("change", (event) => {
  state.perPage = Number(event.target.value);
  state.page = 1;
  refresh();
});

document.getElementById("pagination").addEventListener("click", (event) => {
  const btn = event.target.closest(".page-btn");
  if (!btn || btn.disabled) return;
  state.page = Number(btn.dataset.page);
  refresh();
});

/* ===== Inisialisasi ===== */
renderStats();
renderPanels();
refresh();
