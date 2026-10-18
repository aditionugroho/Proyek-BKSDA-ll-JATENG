/* ============================================
   JADWAL (PEGAWAI) — E-Office SKSDA
   Kalender JS + agenda per tanggal (pola KS,
   adaptasi + chip sumber + agenda pribadi)
   ============================================ */

import { jadwalPegawaiData } from "../data/jadwal-pegawai.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== UTIL ===== */
const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function iso(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const today = new Date();
const todayIso = iso(today);

/* ===== STATE ===== */
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedIso = todayIso; // default: hari ini (nyata)

const agendaDates = new Set(jadwalPegawaiData.map((a) => a.tanggal));

/* ===== IKON ===== */
const ICONS = {
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  grid: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
  calendarPlus: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="20"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>',
  pin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  dots: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 0 1 3 3L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

/* ===== STAT CARD (dihitung dari data) ===== */
function renderStats() {
  /* Senin sebagai awal minggu */
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const hariIni = jadwalPegawaiData.filter((a) => a.tanggal === todayIso).length;
  const mingguIni = jadwalPegawaiData.filter((a) => {
    const d = new Date(a.tanggal);
    return d >= monday && d <= sunday;
  }).length;
  const mendatang = jadwalPegawaiData.filter((a) => a.tanggal > todayIso).length;

  const stats = [
    { label: "Hari Ini", value: hariIni, sub: "Agenda hari ini", icon: "calendar", tone: "blue" },
    { label: "Minggu Ini", value: mingguIni, sub: "Agenda minggu ini", icon: "grid", tone: "green" },
    { label: "Mendatang", value: mendatang, sub: "Kegiatan mendatang", icon: "calendarPlus", tone: "orange" }
  ];

  document.getElementById("pgj-stats").innerHTML = stats
    .map(
      (s) => `
      <article class="pgj-stat">
        <span class="pgj-stat-icon pgj-stat-icon--${s.tone}">${ICONS[s.icon]}</span>
        <div>
          <p class="pgj-stat-label">${s.label}</p>
          <p class="pgj-stat-value">${s.value}</p>
          <p class="pgj-stat-sub">${s.sub}</p>
        </div>
      </article>`
    )
    .join("");
}

/* ===== KALENDER (generate via JS) ===== */
function renderCalendar() {
  document.getElementById("pgj-month-label").textContent = `${NAMA_BULAN[viewMonth]} ${viewYear}`;

  const grid = document.getElementById("pgj-days");
  const firstDay = new Date(viewYear, viewMonth, 1);
  const offset = (firstDay.getDay() + 6) % 7; // Senin pertama
  const start = new Date(viewYear, viewMonth, 1 - offset);

  let html = "";
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = iso(d);

    const classes = ["pgj-day"];
    if (d.getMonth() !== viewMonth) classes.push("is-muted");
    if (key === todayIso) classes.push("is-today");
    if (key === selectedIso) classes.push("is-selected");
    if (agendaDates.has(key)) classes.push("has-agenda");

    html += `<button type="button" class="${classes.join(" ")}" data-date="${key}">${d.getDate()}</button>`;
  }

  grid.innerHTML = html;
}

/* ===== AGENDA TANGGAL TERPILIH ===== */
const STATUS_TONE = {
  Berlangsung: "blue",
  Terjadwal: "green",
  Mendatang: "orange",
  Selesai: "green",
  Dibatalkan: "gray"
};

function renderAgenda() {
  const d = new Date(selectedIso);
  document.getElementById("pgj-agenda-date").textContent =
    `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;

  const listEl = document.getElementById("pgj-agenda-list");
  const items = jadwalPegawaiData
    .filter((a) => a.tanggal === selectedIso)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  if (items.length === 0) {
    listEl.innerHTML = `<p class="pgj-agenda-empty">Tidak ada agenda untuk tanggal ini.</p>`;
    return;
  }

  listEl.innerHTML = items
    .map((a) => {
      const menuItems =
        a.sumber === "pribadi"
          ? `
            <button type="button" data-edit="${a.id}">${ICONS.edit}Edit</button>
            <button type="button" class="pgj-dd--danger" data-hapus="${a.id}">${ICONS.trash}Hapus</button>`
          : `<button type="button" data-readonly="${a.id}">${ICONS.eye}Lihat Detail</button>`;

      return `
      <div class="pgj-agenda-item">
        <div class="pgj-agenda-time">
          <span>${a.jamMulai}</span>
          <span>${a.jamSelesai}</span>
        </div>
        <div class="pgj-agenda-line"></div>
        <div class="pgj-agenda-body">
          <div class="pgj-agenda-top">
            <p class="pgj-agenda-title">${a.judul}</p>
            <span class="pgj-badge pgj-badge--${STATUS_TONE[a.status] || "gray"}">${a.status}</span>
          </div>
          <span class="pgj-agenda-place">${ICONS.pin}${a.lokasi}</span>
          <p class="pgj-agenda-desc">${a.deskripsi}</p>
          <span class="pgj-chip${a.sumber === "pribadi" ? " pgj-chip--personal" : ""}">${
            a.sumber === "pribadi" ? "Agenda Pribadi" : "Dari Jadwal Seksi"
          }</span>
        </div>
        <div class="pgj-menu-wrap">
          <button type="button" class="pgj-menu-btn" data-menu="${a.id}" title="Menu agenda" aria-label="Menu ${a.judul}">${ICONS.dots}</button>
          <div class="pgj-dropdown" id="menu-${a.id}">${menuItems}</div>
        </div>
      </div>`;
    })
    .join("");
}

/* ===== REFRESH ===== */
function refreshAll() {
  agendaDates.clear();
  jadwalPegawaiData.forEach((a) => agendaDates.add(a.tanggal));
  renderStats();
  renderCalendar();
  renderAgenda();
}

/* ===== EVENT: klik tanggal ===== */
document.getElementById("pgj-days").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-date]");
  if (!btn) return;
  selectedIso = btn.dataset.date;
  renderCalendar();
  renderAgenda();
});

/* ===== EVENT: navigasi bulan ===== */
document.getElementById("pgj-prev-month").addEventListener("click", () => {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  renderCalendar();
});

document.getElementById("pgj-next-month").addEventListener("click", () => {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderCalendar();
});

/* ===== EVENT: tab tampilan ===== */
document.querySelectorAll(".pgj-view-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".pgj-view-pill").forEach((p) => p.classList.remove("is-active"));
    pill.classList.add("is-active");
    if (pill.dataset.view !== "bulan") showToast("Tampilan menyusul");
  });
});

/* ===== EVENT: filter (toggle state) ===== */
document.getElementById("btn-filter").addEventListener("click", (event) => {
  event.currentTarget.classList.toggle("is-active");
});

/* ===== EVENT: menu agenda (⋮) ===== */
document.getElementById("pgj-agenda-list").addEventListener("click", (event) => {
  const menuBtn = event.target.closest("[data-menu]");
  if (menuBtn) {
    const dropdown = document.getElementById(`menu-${menuBtn.dataset.menu}`);
    const wasOpen = dropdown.classList.contains("is-open");
    document.querySelectorAll(".pgj-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
    dropdown.classList.toggle("is-open", !wasOpen);
    return;
  }

  /* Lihat Detail (seksi, readonly) */
  const readonlyBtn = event.target.closest("[data-readonly]");
  if (readonlyBtn) {
    closeMenus();
    showToast("Agenda seksi bersifat readonly");
    return;
  }

  /* Edit (pribadi) */
  const editBtn = event.target.closest("[data-edit]");
  if (editBtn) {
    closeMenus();
    showToast("Fitur edit agenda menyusul");
    return;
  }

  /* Hapus (pribadi, modal konfirmasi) */
  const hapusBtn = event.target.closest("[data-hapus]");
  if (hapusBtn) {
    const id = Number(hapusBtn.dataset.hapus);
    const agenda = jadwalPegawaiData.find((a) => a.id === id);
    closeMenus();
    openModal({
      title: "Hapus Agenda Pribadi",
      desc: `Agenda "${agenda.judul}" akan dihapus dari jadwal Anda. Lanjutkan?`,
      confirmLabel: "Ya, Hapus",
      danger: true,
      onConfirm: () => {
        const idx = jadwalPegawaiData.indexOf(agenda);
        if (idx !== -1) jadwalPegawaiData.splice(idx, 1);
        refreshAll();
        showToast("Agenda pribadi dihapus");
      }
    });
  }
});

function closeMenus() {
  document.querySelectorAll(".pgj-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
}

/* Tutup dropdown klik di luar */
document.addEventListener("click", (event) => {
  if (!event.target.closest(".pgj-menu-wrap")) closeMenus();
});

/* ===== TAMBAH AGENDA PRIBADI (modal form + validasi) ===== */
document.getElementById("btn-tambah").addEventListener("click", () => {
  openModal({
    title: "Tambah Agenda Pribadi",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Judul Agenda *</strong>
          <input type="text" id="ag-judul" placeholder="Contoh: Persiapan laporan mingguan" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Tanggal *</strong>
          <input type="date" id="ag-tanggal" value="${todayIso}" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
            <strong style="font-size:12.5px;color:#374151">Jam Mulai</strong>
            <input type="time" id="ag-mulai" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
          </div>
          <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
            <strong style="font-size:12.5px;color:#374151">Jam Selesai</strong>
            <input type="time" id="ag-selesai" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
          </div>
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Lokasi</strong>
          <input type="text" id="ag-lokasi" placeholder="Contoh: Meja Kerja" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Deskripsi</strong>
          <textarea id="ag-deskripsi" rows="2" placeholder="Deskripsi singkat..." style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none;resize:vertical"></textarea>
        </div>
        <p id="ag-error" style="display:none;margin:0;font-size:12px;color:#DC2626"></p>
      </div>`,
    confirmLabel: "Simpan Agenda",
    cancelLabel: "Batal",
    onConfirm: () => {
      const judul = document.getElementById("ag-judul").value.trim();
      const tanggal = document.getElementById("ag-tanggal").value;
      const errorEl = document.getElementById("ag-error");

      const showError = (msg) => {
        errorEl.textContent = msg;
        errorEl.style.display = "block";
      };

      if (judul === "") {
        showError("Judul agenda wajib diisi.");
        return false;
      }
      if (tanggal === "") {
        showError("Tanggal wajib diisi.");
        return false;
      }

      const fmt = (v) => (v ? v.replace(":", ".") : "");
      jadwalPegawaiData.push({
        id: Date.now(),
        tanggal,
        jamMulai: fmt(document.getElementById("ag-mulai").value) || "08.00",
        jamSelesai: fmt(document.getElementById("ag-selesai").value) || "09.00",
        judul,
        lokasi: document.getElementById("ag-lokasi").value.trim() || "-",
        deskripsi: document.getElementById("ag-deskripsi").value.trim() || "-",
        status: "Terjadwal",
        sumber: "pribadi"
      });

      selectedIso = tanggal; // langsung tampilkan tanggal baru
      refreshAll();
      showToast("Agenda pribadi ditambahkan");
    }
  });
});

/* ===== Inisialisasi ===== */
refreshAll();
