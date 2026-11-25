
/* ============================================
   NOTIFIKASI PEGAWAI - E-Office SKSDA
   Integrasi API CodeIgniter 4
   ============================================ */

import { notifPgData as NOTIF_PG_MOCK } from "../data/notifikasi-pegawai.js";
import { showToast } from "../components/toast.js";
import { saveListState, loadListState } from "../utils/state.js";
import {
  ambilNotif,
  tandaiDibaca,
  tandaiSemuaDibaca
} from "../utils/notif-mock.js";

const STATE_KEY = "notifikasi-pg";

const isLive = () =>
  Boolean(window.EOfficeAPI?.config?.LIVE);

let notifPgData = [];
let currentFilter = "all";
let isSaving = false;

/* ============================================
   IKON
   ============================================ */

const ICONS = {
  plus: `
    <svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`,

  check: `
    <svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`,

  minus: `
    <svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`
};

/* ============================================
   KEAMANAN TAMPILAN
   ============================================ */

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]
  );
}

/* ============================================
   FORMAT WAKTU
   ============================================ */

function formatWaktu(value) {
  if (!value) return "-";

  const date = new Date(
    String(value).replace(" ", "T")
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/* ============================================
   KATEGORI NOTIFIKASI
   ============================================ */

function getKategori(tipe) {
  const value = String(tipe || "").toLowerCase();

  if (
    value.includes("surat") ||
    value.includes("disposisi")
  ) {
    return "surat";
  }

  if (
    value.includes("tugas") ||
    value.includes("patroli")
  ) {
    return "tugas";
  }

  return "sistem";
}

/* ============================================
   MAPPING DATA BACKEND
   ============================================ */

function mapNotifikasi(raw) {
  const tipe = String(raw.tipe || "");
  const kategori = getKategori(tipe);

  const pesan = String(
    raw.pesan ||
    raw.teks ||
    raw.message ||
    "Ada notifikasi baru."
  );

  let judul = "Notifikasi Sistem";
  let icon = "plus";
  let tone = "blue";

  if (kategori === "surat") {
    judul = tipe.toLowerCase().includes("disposisi")
      ? "Notifikasi Disposisi"
      : "Notifikasi Surat";
    icon = "plus";
    tone = "blue";
  } else if (kategori === "tugas") {
    judul = "Notifikasi Tugas";
    icon = "check";
    tone = "green";
  }

  return {
    id: raw.id,
    tipe,
    kategori,
    judul: String(raw.judul || judul),
    teks: pesan,
    waktu: formatWaktu(
      raw.created_at || raw.waktu
    ),
    unread:
      raw.is_read !== undefined
        ? Number(raw.is_read) === 0
        : Boolean(raw.unread),
    icon,
    tone
  };
}

/* ============================================
   AMBIL DATA NOTIFIKASI
   ============================================ */

async function loadData() {
  if (isLive()) {
    const response =
      await EOfficeAPI.getNotifikasiSaya();

    if (
      response?.status !== true ||
      !Array.isArray(response.data)
    ) {
      throw new Error(
        response?.message ||
        "Format data notifikasi tidak valid."
      );
    }

    return response.data.map(mapNotifikasi);
  }

  return [
    ...ambilNotif("pegawai"),
    ...NOTIF_PG_MOCK
  ];
}

/* ============================================
   SIMPAN STATE FILTER
   ============================================ */

function persistState() {
  saveListState(STATE_KEY, {
    currentFilter
  });
}

function restoreState() {
  const saved = loadListState(STATE_KEY);

  if (saved?.currentFilter) {
    currentFilter = saved.currentFilter;
  }

  document.querySelectorAll(".pgn-tab").forEach(
    (tab) => {
      tab.classList.toggle(
        "is-active",
        tab.dataset.filter === currentFilter
      );
    }
  );
}

/* ============================================
   FILTER DATA
   ============================================ */

function getFiltered() {
  return notifPgData.filter((notif) => {
    if (currentFilter === "all") {
      return true;
    }

    if (currentFilter === "unread") {
      return notif.unread;
    }

    return notif.kategori === currentFilter;
  });
}

/* ============================================
   RENDER DAFTAR NOTIFIKASI
   ============================================ */

function renderList() {
  const list = document.getElementById("pgn-list");
  const rows = getFiltered();

  if (!rows.length) {
    list.innerHTML = `
      <p class="pgn-empty">
        Tidak ada notifikasi yang cocok dengan filter.
      </p>
    `;
    return;
  }

  list.innerHTML = rows.map((notif) => `
    <div class="pgn-item"
      data-item="${escapeHtml(notif.id)}">

      <span class="pgn-icon pgn-icon--${escapeHtml(notif.tone)}">
        ${ICONS[notif.icon] || ICONS.plus}
      </span>

      <div class="pgn-body">

        <p class="pgn-judul">
          ${escapeHtml(notif.judul)}
        </p>

        <p class="pgn-teks">
          ${escapeHtml(notif.teks)}
        </p>

        <span class="pgn-waktu">
          ${escapeHtml(notif.waktu)}
        </span>

      </div>

      ${
        notif.unread
          ? `<span class="pgn-dot"
              title="Belum dibaca"></span>`
          : ""
      }

    </div>
  `).join("");
}

/* ============================================
   RINGKASAN NOTIFIKASI
   ============================================ */

function renderSummary() {
  const unread = notifPgData.filter(
    (notif) => notif.unread
  ).length;

  const surat = notifPgData.filter(
    (notif) => notif.kategori === "surat"
  ).length;

  const tugas = notifPgData.filter(
    (notif) => notif.kategori === "tugas"
  ).length;

  document.getElementById(
    "pgn-unread-count"
  ).textContent = unread;

  document.getElementById(
    "pgn-surat-count"
  ).textContent = surat;

  document.getElementById(
    "pgn-tugas-count"
  ).textContent = tugas;

  document.getElementById(
    "pgn-unread-sub"
  ).textContent =
    `${unread} notifikasi belum dibaca`;

  const button = document.getElementById("btn-mark-all");

  button.classList.toggle(
    "is-done",
    unread === 0
  );

  button.disabled = isSaving || unread === 0;
}

/* ============================================
   REFRESH TAMPILAN
   ============================================ */

function refresh() {
  renderList();
  renderSummary();
  persistState();
}

/* ============================================
   EVENT FILTER TAB
   ============================================ */

document.getElementById("pgn-tabs")
  .addEventListener("click", (event) => {

    const tab = event.target.closest(".pgn-tab");

    if (!tab) return;

    currentFilter = tab.dataset.filter;

    document.querySelectorAll(".pgn-tab").forEach(
      (item) => {
        item.classList.toggle(
          "is-active",
          item === tab
        );
      }
    );

    refresh();
  });

/* ============================================
   TANDAI SATU NOTIFIKASI DIBACA
   ============================================ */

document.getElementById("pgn-list")
  .addEventListener("click", async (event) => {

    const item = event.target.closest("[data-item]");

    if (!item || isSaving) return;

    const notif = notifPgData.find(
      (n) => String(n.id) === item.dataset.item
    );

    if (!notif || !notif.unread) return;

    isSaving = true;

    try {
      if (isLive()) {
        const response =
          await EOfficeAPI.markNotifikasiRead(notif.id);

        if (response?.status !== true) {
          throw new Error(
            response?.message ||
            "Gagal menyimpan status notifikasi."
          );
        }
      } else {
        tandaiDibaca("pegawai", notif.id);
      }

      notif.unread = false;
      showToast("Notifikasi ditandai dibaca");

    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan status dibaca");

    } finally {
      isSaving = false;
      refresh();
    }
  });

/* ============================================
   TANDAI SEMUA NOTIFIKASI DIBACA
   ============================================ */

document.getElementById("btn-mark-all")
  .addEventListener("click", async () => {

    if (isSaving) return;

    const belumDibaca = notifPgData.some(
      (notif) => notif.unread
    );

    if (!belumDibaca) return;

    isSaving = true;

    try {
      if (isLive()) {
        const response =
          await EOfficeAPI.markAllNotifikasiRead();

        if (response?.status !== true) {
          throw new Error(
            response?.message ||
            "Gagal menandai semua notifikasi."
          );
        }
      } else {
        tandaiSemuaDibaca("pegawai");
      }

      notifPgData.forEach(
        (notif) => {
          notif.unread = false;
        }
      );

      showToast(
        "Semua notifikasi berhasil ditandai dibaca"
      );

    } catch (error) {
      console.error(error);
      showToast(
        "Gagal menyimpan status notifikasi"
      );

    } finally {
      isSaving = false;
      refresh();
    }
  });

/* ============================================
   PENGATURAN
   ============================================ */

document.getElementById("btn-pengaturan")
  .addEventListener("click", () => {
    showToast(
      "Fitur pengaturan notifikasi menyusul"
    );
  });

/* ============================================
   INISIALISASI
   ============================================ */

async function init() {
  const list = document.getElementById("pgn-list");

  list.innerHTML = `
    <p class="pgn-empty">
      Memuat notifikasi...
    </p>
  `;

  try {
    notifPgData = await loadData();

    restoreState();
    refresh();

  } catch (error) {
    console.error(
      "Gagal memuat notifikasi:",
      error
    );

    notifPgData = [];

    list.innerHTML = `
      <p class="pgn-empty">
        Gagal memuat notifikasi dari server.
      </p>
    `;

    renderSummary();
  }
}

init();
