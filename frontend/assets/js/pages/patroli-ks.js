/* ============================================
   LAPORAN PATROLI (KEPALA SEKSI) — E-Office
   Tinjauan semua laporan petugas: filter
   resort + pencarian, detail modal, galeri
   foto dengan lightbox
   ============================================ */

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { tambahNotif } from "../utils/notif-mock.js";

/* ===== DATA ===== */
let daftar = [];
let filterResort = "all";
let filterPetugas = "all";
let periodeDari = "";
let periodeSampai = "";
let cari = "";

async function loadData() {
  return EOfficeAPI.getLaporanPatroli();
}

/* Opsi petugas diisi dinamis dari data */
function isiOpsiPetugas() {
  const sel = document.getElementById("pt-filter-petugas");
  const namaPetugas = [...new Set(daftar.map((l) => l.petugas))].sort();
  sel.innerHTML = `<option value="all" selected>Semua Petugas</option>` +
    namaPetugas.map((p) => `<option value="${p}">${p}</option>`).join("");
  sel.value = filterPetugas; // pertahankan pilihan bila masih ada
}

/* ===== FORMAT ===== */
function fmtTanggal(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function fmtWaktu(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ===== RENDER ===== */
function render() {
  const tbody = document.getElementById("pt-tbody");
  const q = cari.trim().toLowerCase();

  const rows = daftar.filter((l) => {
    const byResort = filterResort === "all" || l.resort === filterResort;
    const byPetugas = filterPetugas === "all" || l.petugas === filterPetugas;
    const tgl = String(l.tanggal || "").slice(0, 10); // YYYY-MM-DD
    const byDari = !periodeDari || tgl >= periodeDari;
    const bySampai = !periodeSampai || tgl <= periodeSampai;
    const byCari = !q || String(l.catatan).toLowerCase().includes(q);
    return byResort && byPetugas && byDari && bySampai && byCari;
  });

  /* Info jumlah hasil */
  const info = document.getElementById("pt-hasil-count");
  if (info) info.textContent = `${rows.length} dari ${daftar.length} laporan`;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="pt-empty">Tidak ada laporan patroli yang cocok dengan filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((l) => {
      const fotoBadge = l.foto && l.foto.length
        ? `<span class="pt-foto-mini">&#128247; ${l.foto.length} foto</span>`
        : '<span class="pt-sub">—</span>';
      const statusTone = l.status === "Direview" ? "green" : "blue";
      return `
        <tr data-id="${l.id}" style="cursor:pointer" title="Klik untuk detail">
          <td>${fmtTanggal(l.tanggal)}</td>
          <td><span class="pt-judul">${l.petugas}</span><span class="pt-sub">dibuat ${fmtWaktu(l.dibuatPada)}</span></td>
          <td><strong>${l.resort}</strong></td>
          <td>${l.catatan.length > 60 ? l.catatan.slice(0, 60) + "…" : l.catatan}</td>
          <td>${fotoBadge}</td>
          <td><span class="pt-badge pt-badge--${statusTone}">${l.status}</span></td>
        </tr>`;
    })
    .join("");
}

/* Kelola URL foto privat agar tidak tertinggal di memori. */
let galeriAktif = 0;
let fotoUrls = [];

function bersihkanFoto() {
  galeriAktif++;
  for (const url of fotoUrls) URL.revokeObjectURL(url);
  fotoUrls = [];
  const lightbox = document.getElementById("pt-lightbox");
  if (lightbox) lightbox.hidden = true;
}

async function muatFotoPatroli(generasi) {
  const images = document.querySelectorAll(
    ".app-modal-backdrop.is-open .pt-galeri-item img"
  );

  const live = Boolean(window.EOfficeAPI && EOfficeAPI.config.LIVE);

  for (const img of images) {
    if (generasi !== galeriAktif) return;

    const fotoId = img.dataset.fotoId;

    if (!live) {
      if (fotoId) img.src = fotoId;
      continue;
    }

    try {
      const blob = await EOfficeAPI.getFotoPatroli(fotoId);

      if (generasi !== galeriAktif || !img.isConnected) return;

      const url = URL.createObjectURL(blob);
      fotoUrls.push(url);
      img.src = url;
    } catch (error) {
      console.error("Gagal memuat foto patroli:", error);
      if (generasi === galeriAktif && img.isConnected) {
        img.alt = "Foto gagal dimuat";
      }
    }
  }
}
/* ===== DETAIL (modal + galeri) ===== */
function bukaDetail(id) {
  const l = daftar.find((x) => String(x.id) === String(id));
  if (!l) return;

  // Hentikan pemuatan lama dan lepaskan URL foto sebelumnya.
  bersihkanFoto();

  const galeri = l.foto && l.foto.length
    ? `<p class="pt-label" style="margin-top:14px">Foto Dokumentasi (${l.foto.length})</p>
       <div class="pt-galeri">
         ${l.foto.map((fotoId, i) => `
           <button type="button" class="pt-galeri-item" data-foto="${i}" title="Perbesar foto ${i + 1}">
             <img data-foto-id="${fotoId}" alt="Foto patroli ${i + 1}" />
           </button>`).join("")}
       </div>`
    : `<p class="pt-sub" style="margin-top:12px">Tidak ada foto dilampirkan.</p>`;

  openModal({
    title: `Laporan Patroli — ${l.resort}`,
    desc: `${fmtTanggal(l.tanggal)} oleh ${l.petugas}`,
    html: `
      <div class="pt-detail-list">
        <div class="pt-detail-row">
          <span class="pt-detail-label">Petugas</span>
          <span class="pt-detail-value">${l.petugas}</span>
        </div>
        <div class="pt-detail-row">
          <span class="pt-detail-label">Wilayah</span>
          <span class="pt-detail-value">Resort ${l.resort}</span>
        </div>
        <div class="pt-detail-row">
          <span class="pt-detail-label">Tanggal Patroli</span>
          <span class="pt-detail-value">${fmtTanggal(l.tanggal)}</span>
        </div>
        <div class="pt-detail-row">
          <span class="pt-detail-label">Status</span>
          <span class="pt-detail-value">${l.status}</span>
        </div>
        <div class="pt-detail-row" style="flex-direction:column;align-items:stretch">
          <span class="pt-detail-label">Catatan / Temuan</span>
          <span class="pt-detail-value" style="text-align:left;font-weight:500">${l.catatan}</span>
        </div>
      </div>
      ${galeri}`,
    cancelLabel: "Tutup",
    confirmLabel: "Tandai Direview",
    onConfirm: () => {
      if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
        return EOfficeAPI.request(
          "PUT",
          "/laporan-patroli/" + encodeURIComponent(l.id) + "/status",
          { status: "Direview" }
        ).then((response) => {
          if (response && response.status === false) {
            throw new Error(response.message || "Review gagal.");
          }

          l.status = "Direview";
          render();
          showToast("Laporan berhasil direview");
          return true;
        }).catch((error) => {
          console.error("Review laporan patroli gagal:", error);
          showToast("Gagal memperbarui status laporan");
          return false;
        });
      }
      // MOCK: persist ke localStorage agar bertahan antar-refresh
      try {
        const KEY = "eoffice_laporan_patroli";
        const all = JSON.parse(localStorage.getItem(KEY) || "[]");
        const t = all.find((x) => String(x.id) === String(l.id));
        if (t) {
          t.status = "Direview";
          localStorage.setItem(KEY, JSON.stringify(all));
        }
      } catch (e) { /* abaikan */ }
      l.status = "Direview";
      render();

      // Pemicu notif: petugas diberi tahu status berubah (mock)
      tambahNotif("pegawai", {
        judul: "Laporan patroli direview",
        teks: `Laporan patroli Resort ${l.resort} tanggal ${fmtTanggal(l.tanggal)} telah direview oleh Kepala Seksi.`,
        kategori: "patroli",
        icon: "check",
        tone: "green"
      });

      showToast("Laporan ditandai direview (demo)");
    }
  });

  pantauPenutupanModal();
  const generasi = ++galeriAktif;
  muatFotoPatroli(generasi);

  setTimeout(() => {
    if (generasi !== galeriAktif) return;

    document.querySelectorAll(
      ".app-modal-backdrop.is-open .pt-galeri-item"
    ).forEach((btn) => {
      btn.addEventListener("click", () => {
        const img = btn.querySelector("img");
        if (!img || !img.src) return;

        const lightbox = document.getElementById("pt-lightbox");
        document.getElementById("pt-lightbox-img").src = img.src;
        lightbox.hidden = false;
      });
    });
  }, 50);
}

document.getElementById("pt-tbody").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-id]");
  if (row) bukaDetail(row.dataset.id);
});

/* Bersihkan Blob URL ketika modal ditutup. */
let observerModalTerpasang = false;

function pantauPenutupanModal() {
  if (observerModalTerpasang) return;

  const modal = document.querySelector(".app-modal-backdrop");
  if (!modal) return;

  const observer = new MutationObserver(() => {
    if (!modal.classList.contains("is-open")) {
      bersihkanFoto();
    }
  });

  observer.observe(modal, {
    attributes: true,
    attributeFilter: ["class"]
  });

  observerModalTerpasang = true;
}
/* ===== LIGHTBOX ===== */
document.getElementById("pt-lightbox").addEventListener("click", (e) => {
  if (e.target.id !== "pt-lightbox-img") e.currentTarget.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.getElementById("pt-lightbox").hidden = true;
});

/* ===== FILTER ===== */
document.getElementById("pt-filter-resort").addEventListener("change", (e) => {
  filterResort = e.target.value;
  render();
});
document.getElementById("pt-filter-petugas").addEventListener("change", (e) => {
  filterPetugas = e.target.value;
  render();
});
document.getElementById("pt-filter-dari").addEventListener("change", (e) => {
  periodeDari = e.target.value;
  render();
});
document.getElementById("pt-filter-sampai").addEventListener("change", (e) => {
  periodeSampai = e.target.value;
  render();
});
document.getElementById("pt-filter-cari").addEventListener("input", (e) => {
  cari = e.target.value;
  render();
});
document.getElementById("pt-filter-reset").addEventListener("click", () => {
  filterResort = "all";
  filterPetugas = "all";
  periodeDari = "";
  periodeSampai = "";
  cari = "";
  document.getElementById("pt-filter-resort").value = "all";
  document.getElementById("pt-filter-petugas").value = "all";
  document.getElementById("pt-filter-dari").value = "";
  document.getElementById("pt-filter-sampai").value = "";
  document.getElementById("pt-filter-cari").value = "";
  render();
});

/* ===== INIT ===== */
async function init() {
  const tbody = document.getElementById("pt-tbody");
  tbody.innerHTML = `<tr><td colspan="6" class="pt-empty">Memuat laporan patroli...</td></tr>`;

  try {
    daftar = await loadData();
  } catch (e) {
    daftar = [];
    tbody.innerHTML = `<tr><td colspan="6" class="pt-empty">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  isiOpsiPetugas();
  render();
}

init();
