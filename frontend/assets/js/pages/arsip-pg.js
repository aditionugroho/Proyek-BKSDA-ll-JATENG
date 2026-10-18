/* ============================================
   ARSIP (PEGAWAI) — E-Office SKSDA
   arsipPgData + tab/filter/search, radio
   pilih baris, dropdown aksi, pagination
   ============================================ */

import { arsipPgData, TOTAL_ARSIP_MOCK } from "../data/arsip-pegawai.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== IKON ===== */
const ICONS = {
  radio: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"></circle></svg>',
  radioOff: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle></svg>',
  dots: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

/* ===== STATE ===== */
let tabJenis = "all";
let query = "";
let jenisFilter = "all";
let tahunFilter = "all";
let statusFilter = "all";
let selectedId = null;

/* ===== FILTER ===== */
function getFiltered() {
  const q = query.trim().toLowerCase();
  return arsipPgData.filter((d) => {
    const byTab =
      tabJenis === "all" ? true :
      tabJenis === "Lainnya" ? !["Surat Tugas", "Surat Masuk", "Surat Keluar", "Laporan"].includes(d.jenis) :
      d.jenis === tabJenis;
    const byJenis = jenisFilter === "all" || d.jenis === jenisFilter;
    const byTahun = tahunFilter === "all" || d.tahun === tahunFilter;
    const byStatus = statusFilter === "all" || d.status === statusFilter;
    const bySearch =
      !q || [d.nama, d.sub, d.nomor].some((f) => f.toLowerCase().includes(q));
    return byTab && byJenis && byTahun && byStatus && bySearch;
  });
}

/* ===== RENDER TABEL ===== */
function renderTable() {
  const tbody = document.getElementById("pga-tbody");
  const rows = getFiltered();

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="pga-empty"><td colspan="10">Tidak ada dokumen arsip yang cocok dengan filter.</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map(
        (d) => `
        <tr data-id="${d.id}"${selectedId === d.id ? ' class="is-selected"' : ""}>
          <td><span class="pga-no">${String(d.id).padStart(2, "0")}</span></td>
          <td>
            <span class="pga-nama">${d.nama}</span>
            ${d.sub ? `<span class="pga-sub">${d.sub}</span>` : ""}
          </td>
          <td>${d.jenis}</td>
          <td><span class="pga-nomor">${d.nomor}</span></td>
          <td>${d.tanggal}</td>
          <td>${d.tahun}</td>
          <td><span class="pga-badge pga-badge--green">${d.status}</span></td>
          <td>${d.oleh}</td>
          <td>${d.diarsipkan}</td>
          <td>
            <div class="pga-actions">
              <button type="button" class="pga-radio${selectedId === d.id ? " is-selected" : ""}" data-select="${d.id}" title="Pilih baris" aria-label="Pilih ${d.nama}">
                ${selectedId === d.id ? ICONS.radio : ICONS.radioOff}
              </button>
              <button type="button" class="pga-menu-btn" data-menu="${d.id}" title="Menu" aria-label="Menu ${d.nama}">${ICONS.dots}</button>
              <div class="pga-dropdown" id="menu-${d.id}">
                <button type="button" data-detail="${d.id}">${ICONS.eye}Lihat Detail</button>
                <button type="button" data-unduh="${d.nama}">${ICONS.download}Unduh</button>
                <button type="button" class="pga-dd--danger" data-hapus="${d.nama}">${ICONS.trash}Hapus dari Arsip</button>
              </div>
            </div>
          </td>
        </tr>`
      )
      .join("");
  }

  /* Footer */
  document.getElementById("pga-showing").textContent =
    `Menampilkan 1-${rows.length} dari ${TOTAL_ARSIP_MOCK} data`;
}

/* ===== EVENT: tab ===== */
document.getElementById("pga-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".pga-tab");
  if (!tab) return;
  document.querySelectorAll(".pga-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  tabJenis = tab.dataset.jenis;
  renderTable();
});

/* ===== EVENT: filter & search ===== */
document.getElementById("pga-search").addEventListener("input", (event) => {
  query = event.target.value;
  renderTable();
});

document.getElementById("pga-jenis").addEventListener("change", (event) => {
  jenisFilter = event.target.value;
  renderTable();
});

document.getElementById("pga-tahun").addEventListener("change", (event) => {
  tahunFilter = event.target.value;
  renderTable();
});

document.getElementById("pga-status").addEventListener("change", (event) => {
  statusFilter = event.target.value;
  renderTable();
});

/* ===== EVENT: reset filter (kosongkan semua) ===== */
document.getElementById("pga-reset").addEventListener("click", () => {
  query = "";
  jenisFilter = "all";
  tahunFilter = "all";
  statusFilter = "all";
  tabJenis = "all";
  selectedId = null;

  document.getElementById("pga-search").value = "";
  document.getElementById("pga-jenis").value = "all";
  document.getElementById("pga-tahun").value = "all";
  document.getElementById("pga-status").value = "all";
  document.querySelectorAll(".pga-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.jenis === "all")
  );

  renderTable();
  showToast("Filter direset");
});

/* ===== EVENT: aksi tabel (radio, menu, dropdown) ===== */
document.getElementById("pga-tbody").addEventListener("click", (event) => {
  /* Radio: pilih baris (satu aktif) */
  const radio = event.target.closest("[data-select]");
  if (radio) {
    const id = Number(radio.dataset.select);
    selectedId = selectedId === id ? null : id;
    renderTable();
    return;
  }

  /* Toggle dropdown */
  const menuBtn = event.target.closest("[data-menu]");
  if (menuBtn) {
    const dropdown = document.getElementById(`menu-${menuBtn.dataset.menu}`);
    const wasOpen = dropdown.classList.contains("is-open");
    document.querySelectorAll(".pga-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
    dropdown.classList.toggle("is-open", !wasOpen);
    return;
  }

  /* Lihat detail → navigasi halaman detail */
  const detail = event.target.closest("[data-detail]");
  if (detail) {
    closeAllDropdowns();
    window.location.href = `detail-arsip.html?id=${detail.dataset.detail}`;
    return;
  }

  /* Unduh / Hapus → toast */
  const unduh = event.target.closest("[data-unduh]");
  if (unduh) {
    showToast(`Mengunduh ${unduh.dataset.unduh}`);
    closeAllDropdowns();
    return;
  }

  const hapus = event.target.closest("[data-hapus]");
  if (hapus) {
    showToast(`Menghapus ${hapus.dataset.hapus} dari arsip`);
    closeAllDropdowns();
  }
});

function closeAllDropdowns() {
  document.querySelectorAll(".pga-dropdown.is-open").forEach((d) => d.classList.remove("is-open"));
}

/* Tutup dropdown klik di luar */
document.addEventListener("click", (event) => {
  if (!event.target.closest(".pga-actions")) closeAllDropdowns();
});

/* ===== EVENT: pagination dummy ===== */
document.querySelectorAll(".pga-page-num").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".pga-page-num").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  });
});

/* ===== Inisialisasi ===== */
renderTable();
