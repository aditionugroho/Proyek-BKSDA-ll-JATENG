/* ============================================
   DETAIL TUGAS (KEPALA SEKSI) — E-Office SKSDA
   Baca ?id= dari data bersama (fallback
   TGS-2023-11-042), render semua kartu dari
   data, checklist toggle + counter
   ============================================ */

import { TUGAS_SEKSI as TUGAS_MOCK, TUGAS_DETAIL } from "../data/tugas-seksi.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== DATA: diisi loadDetail() — API saat LIVE, mock saat belum ===== */
let data = null;

async function loadDetail(id) {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getTugasDetail(id);
  }
  /* Mock: fallback TUGAS_DETAIL bila ?id= tidak ditemukan */
  const tugas = TUGAS_MOCK.find((t) => t.id === id) || TUGAS_DETAIL;
  return {
    ...TUGAS_DETAIL,
    ...tugas,
    checklist: tugas.checklist || TUGAS_DETAIL.checklist,
    lampiran: tugas.lampiran || TUGAS_DETAIL.lampiran,
    aktivitas: tugas.aktivitas || TUGAS_DETAIL.aktivitas,
    deskripsi: tugas.deskripsi || TUGAS_DETAIL.deskripsi,
    picRole: tugas.picRole || "Staf Polhut"
  };
}

/* ===== IKON ===== */
const ICONS = {
  calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  pdf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  xlsx: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  upload: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
  comment: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
};

/* ===== RENDER: header ===== */
function renderHeader() {
  document.getElementById("dt-kode").textContent = `Detail Tugas ${data.kode}`;
  document.getElementById("dt-judul").textContent = data.judul;
  document.getElementById("dt-status").textContent = data.status;
}

/* ===== RENDER: deskripsi ===== */
function renderDeskripsi() {
  document.getElementById("dt-deskripsi").innerHTML = data.deskripsi
    .map((p) => `<p class="dt-desc">${p}</p>`)
    .join("");
}

/* ===== RENDER: checklist (toggle + counter) ===== */
function renderChecklist() {
  const wrap = document.getElementById("dt-checklist");
  wrap.innerHTML = data.checklist
    .map((item, i) => {
      const isLast = i === data.checklist.length - 1;
      return `
        <label class="dt-check-item${item.done ? " is-done" : ""}${isLast && item.done ? " dt-check-item--highlight" : ""}">
          <input type="checkbox" data-check="${i}" ${item.done ? "checked" : ""} />
          <span>${item.text}</span>
        </label>`;
    })
    .join("");

  updateCounter();
}

function updateCounter() {
  const done = data.checklist.filter((c) => c.done).length;
  document.getElementById("dt-check-counter").textContent = `${done}/${data.checklist.length} Selesai`;
  renderProgress(done);
}

document.getElementById("dt-checklist").addEventListener("change", (event) => {
  const input = event.target.closest("[data-check]");
  if (!input) return;
  data.checklist[Number(input.dataset.check)].done = input.checked;

  // Perbarui tampilan item (strikethrough + highlight)
  const label = input.closest(".dt-check-item");
  label.classList.toggle("is-done", input.checked);
  const isLast = Number(input.dataset.check) === data.checklist.length - 1;
  label.classList.toggle("dt-check-item--highlight", isLast && input.checked);

  updateCounter();
});

/* ===== RENDER: lampiran ===== */
function renderLampiran() {
  document.getElementById("dt-lampiran").innerHTML = data.lampiran
    .map(
      (f) => `
      <div class="dt-file-card">
        <span class="dt-file-icon dt-file-icon--${f.type}">${f.type === "pdf" ? ICONS.pdf : ICONS.xlsx}</span>
        <div class="dt-file-info">
          <span class="dt-file-name">${f.name}</span>
          <span class="dt-file-meta">${f.meta}</span>
        </div>
        <button type="button" class="dt-download-btn" data-download="${f.name}" title="Unduh berkas" aria-label="Unduh ${f.name}">${ICONS.download}</button>
      </div>`
    )
    .join("");
}

document.getElementById("dt-lampiran").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-download]");
  if (!btn) return;
  showToast(`Mengunduh ${btn.dataset.download}`);
});

/* ===== RENDER: informasi tugas + progress ===== */
function renderProgress(doneCount) {
  const total = data.checklist.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  const bar = document.getElementById("dt-progress-bar");
  if (bar) {
    bar.style.width = `${percent}%`;
    document.getElementById("dt-progress-label").textContent = `${percent}% Selesai`;
  }
}

function renderInfo() {
  document.getElementById("dt-info").innerHTML = `
    <div class="dt-info-row">
      <span class="dt-info-label">Prioritas</span>
      <span class="ktg-badge ktg-badge--red">&uarr; ${data.prioritas}</span>
    </div>
    <div class="dt-info-row">
      <span class="dt-info-label">Deadline</span>
      <span class="dt-info-value">${ICONS.calendar}${data.deadline}</span>
    </div>
    <div class="dt-info-row">
      <span class="dt-info-label">PIC (Pelaksana)</span>
      <span class="dt-info-pic">
        <span class="dt-info-avatar">${data.avatar}</span>
        <span>
          <span class="dt-info-pic-name">${data.pic}</span>
          <span class="dt-info-pic-role">${data.picRole}</span>
        </span>
      </span>
    </div>
    <div class="dt-info-row">
      <span class="dt-info-label">Progress Keseluruhan</span>
      <div class="dt-progress-wrap">
        <span class="dt-progress-label" id="dt-progress-label">0% Selesai</span>
        <div class="dt-progress-bar"><span id="dt-progress-bar" style="width:0%"></span></div>
      </div>
    </div>`;
}

/* ===== RENDER: timeline aktivitas ===== */
function renderAktivitas() {
  document.getElementById("dt-aktivitas").innerHTML = data.aktivitas
    .map(
      (a) => `
      <div class="dt-timeline-item">
        <span class="dt-timeline-dot dt-timeline-dot--${a.tone}">${ICONS[a.icon]}</span>
        <p class="dt-timeline-text">${a.text}</p>
        <span class="dt-timeline-time">${a.time}</span>
      </div>`
    )
    .join("");
}

/* ===== TOMBOL HEADER ===== */
document.getElementById("btn-edit").addEventListener("click", () => {
  showToast("Fitur edit tugas menyusul");
});

document.getElementById("btn-review").addEventListener("click", () => {
  openModal({
    title: "Review Hasil Tugas",
    desc: `Tandai tugas "${data.judul}" (${data.kode}) sebagai selesai dan telah direview?`,
    confirmLabel: "Ya, Tandai Selesai",
    onConfirm: () => {
      data.status = "Selesai";
      document.getElementById("dt-status").textContent = data.status;
      showToast("Tugas ditandai selesai & direview");
    }
  });
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const params = new URLSearchParams(window.location.search);
  try {
    data = await loadDetail(Number(params.get("id")));
  } catch (e) {
    showToast("Gagal memuat detail tugas. Periksa koneksi lalu muat ulang halaman.");
    return;
  }
  renderHeader();
  renderDeskripsi();
  renderChecklist();
  renderLampiran();
  renderInfo();
  renderAktivitas();
  updateCounter();
}
init();
