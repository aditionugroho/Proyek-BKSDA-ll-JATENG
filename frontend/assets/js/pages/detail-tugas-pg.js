/* ============================================
   DETAIL TUGAS (PEGAWAI) — E-Office SKSDA
   Baca ?id= dari tugasSayaData (data pegawai,
   BUKAN data KS), fallback TUGAS_DETAIL_PG.
   Sub-tugas toggle, file, chat, timeline.
   ============================================ */

import { tugasSayaData, TUGAS_DETAIL_PG } from "../data/tugas-saya.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

/* ===== Ambil tugas dari URL (?id=), fallback TGS-23-089 ===== */
const params = new URLSearchParams(window.location.search);
const idParam = Number(params.get("id"));
const found = tugasSayaData.find((t) => t.id === idParam);

const tugas = {
  ...TUGAS_DETAIL_PG,
  ...(found || {}),
  /* Prioritaskan data per-item (cocok dengan baris diklik) */
  subtasks: found?.subtasks || TUGAS_DETAIL_PG.subtasks,
  files: found?.files?.length ? [...found.files] : [...TUGAS_DETAIL_PG.files],
  diskusi: found?.diskusi?.length ? [...found.diskusi] : [...TUGAS_DETAIL_PG.diskusi],
  timeline: found?.timeline?.length ? [...found.timeline] : [...TUGAS_DETAIL_PG.timeline]
};

/* Status badge tone */
const STATUS_TONE = {
  "Sedang Dikerjakan": "amber",
  "Menunggu Review": "blue",
  "Selesai": "green",
  "Berjalan": "blue",
  "Belum Mulai": "amber"
};

/* ===== IKON ===== */
const ICONS = {
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  doc: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  xlsx: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>'
};

/* ===== RENDER: header & info ===== */
function renderInfo() {
  document.getElementById("pgdt-crumb-judul").textContent = tugas.judul;
  document.getElementById("pgdt-judul").textContent = tugas.judul;
  document.getElementById("pgdt-prioritas").textContent = tugas.prioritas?.text || "Tinggi";
  document.getElementById("pgdt-deskripsi").textContent = tugas.deskripsi;
  document.getElementById("pgdt-pemberi-inisial").textContent = tugas.pemberi.inisial;
  document.getElementById("pgdt-pemberi-nama").textContent = tugas.pemberi.nama;
  document.getElementById("pgdt-deadline").textContent = tugas.deadline;
  document.getElementById("pgdt-kode").textContent = tugas.kode;
  renderStatusBadge();
}

function renderStatusBadge() {
  const el = document.getElementById("pgdt-status");
  el.textContent = tugas.status.text;
  el.className = `pgdt-status-badge pgdt-status-badge--${STATUS_TONE[tugas.status.text] || "amber"}`;
}

/* ===== RENDER: sub-tugas (toggle → progress) ===== */
function renderSubtasks() {
  document.getElementById("pgdt-subtasks").innerHTML = tugas.subtasks
    .map(
      (s, i) => `
      <label class="pgdt-subtask${s.done ? " is-done" : ""}">
        <input type="checkbox" data-subtask="${i}" ${s.done ? "checked" : ""} />
        <span class="pgdt-subtask-text">${s.text}</span>
      </label>`
    )
    .join("");

  const done = tugas.subtasks.filter((s) => s.done).length;
  const percent = Math.round((done / tugas.subtasks.length) * 100);
  document.getElementById("pgdt-subtask-bar").style.width = `${percent}%`;
  document.getElementById("pgdt-subtask-percent").textContent = `${percent}% Selesai`;
}

document.getElementById("pgdt-subtasks").addEventListener("change", (event) => {
  const input = event.target.closest("[data-subtask]");
  if (!input) return;
  tugas.subtasks[Number(input.dataset.subtask)].done = input.checked;
  renderSubtasks();
});

/* ===== RENDER: file ===== */
function renderFiles() {
  document.getElementById("pgdt-files").innerHTML = tugas.files
    .map(
      (f, i) => `
      <div class="pgdt-file-card">
        <span class="pgdt-file-icon pgdt-file-icon--${f.type}">${f.type === "xlsx" ? ICONS.xlsx : ICONS.doc}</span>
        <div class="pgdt-file-info">
          <span class="pgdt-file-name">${f.name}</span>
          <span class="pgdt-file-meta">${f.meta}</span>
        </div>
        ${
          f.meta.includes("Diupload Anda")
            ? `<button type="button" class="pgdt-file-btn pgdt-file-btn--danger" data-remove-file="${i}" title="Hapus file" aria-label="Hapus ${f.name}">${ICONS.trash}</button>`
            : `<button type="button" class="pgdt-file-btn" data-download-file="${f.name}" title="Unduh file" aria-label="Unduh ${f.name}">${ICONS.download}</button>`
        }
      </div>`
    )
    .join("");
}

/* Upload file */
document.getElementById("pgdt-upload-link").addEventListener("click", () => {
  document.getElementById("pgdt-file-input").click();
});

document.getElementById("pgdt-file-input").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  tugas.files.push({
    name: file.name,
    meta: `${(file.size / (1024 * 1024)).toFixed(1)} MB \u2022 Diupload Anda`,
    type: ext === "xlsx" || ext === "xls" ? "xlsx" : "doc"
  });
  renderFiles();
  showToast(`File ${file.name} diunggah`);
  event.target.value = "";
});

/* Aksi file (delegasi) */
document.getElementById("pgdt-files").addEventListener("click", (event) => {
  const dl = event.target.closest("[data-download-file]");
  if (dl) {
    showToast(`Mengunduh ${dl.dataset.downloadFile}`);
    return;
  }

  const rm = event.target.closest("[data-remove-file]");
  if (!rm) return;
  const idx = Number(rm.dataset.removeFile);
  openModal({
    title: "Hapus File",
    desc: `File "${tugas.files[idx].name}" akan dihapus dari daftar. Lanjutkan?`,
    confirmLabel: "Ya, Hapus",
    danger: true,
    onConfirm: () => {
      tugas.files.splice(idx, 1);
      renderFiles();
      showToast("File dihapus");
    }
  });
});

/* ===== RENDER: diskusi (chat) ===== */
function renderChat() {
  document.getElementById("pgdt-chat").innerHTML = tugas.diskusi
    .map(
      (m) => `
      <div class="pgdt-msg pgdt-msg--${m.role}">
        <span class="pgdt-msg-avatar ${m.role === "me" ? "pgdt-msg-avatar--solid" : "pgdt-msg-avatar--soft"}">${m.avatar}</span>
        <div class="pgdt-msg-col">
          <div class="pgdt-msg-head">
            <span class="pgdt-msg-nama">${m.nama}</span>
            <span class="pgdt-msg-waktu">${m.waktu}</span>
          </div>
          <div class="pgdt-bubble pgdt-bubble--${m.role}">${m.teks}</div>
        </div>
      </div>`
    )
    .join("");
}

function kirimKomentar() {
  const textarea = document.getElementById("pgdt-chat-text");
  const teks = textarea.value.trim();
  if (teks === "") return;

  const now = new Date();
  const waktu = `Hari ini, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  tugas.diskusi.push({ role: "me", nama: "Anda", avatar: "ST", waktu, teks });
  renderChat();
  textarea.value = "";
}

document.getElementById("pgdt-chat-send").addEventListener("click", kirimKomentar);
document.getElementById("pgdt-chat-text").addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    kirimKomentar();
  }
});

/* ===== RENDER: timeline ===== */
function renderTimeline() {
  document.getElementById("pgdt-timeline").innerHTML = tugas.timeline
    .map(
      (t) => `
      <div class="pgdt-timeline-item">
        <div class="pgdt-timeline-top">
          <p class="pgdt-timeline-judul">${t.judul}</p>
          <span class="pgdt-timeline-waktu">${t.waktu}</span>
        </div>
        <p class="pgdt-timeline-detail">${t.detail}</p>
      </div>`
    )
    .join("");
}

function waktuSekarang() {
  const now = new Date();
  return `Hari ini, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/* ===== UPDATE PROGRESS KESELURUHAN (modal + validasi) ===== */
document.getElementById("btn-update-progress").addEventListener("click", () => {
  openModal({
    title: "Update Progress Keseluruhan",
    desc: "Masukkan persentase kemajuan tugas (0-100).",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Persentase Progress</strong>
          <input type="number" id="up-progress" min="0" max="100" placeholder="0 - 100" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none" />
          <p id="up-error" style="display:none;margin:0;font-size:12px;color:#DC2626"></p>
        </div>
      </div>`,
    confirmLabel: "Simpan Progress",
    cancelLabel: "Batal",
    onConfirm: () => {
      const value = Number(document.getElementById("up-progress").value);
      const errorEl = document.getElementById("up-error");

      if (!Number.isInteger(value) || value < 0 || value > 100) {
        errorEl.textContent = "Masukkan angka bulat 0-100.";
        errorEl.style.display = "block";
        return false; // modal tetap terbuka
      }

      tugas.status.text = value >= 100 ? "Selesai" : "Sedang Dikerjakan";
      renderStatusBadge();

      tugas.timeline.unshift({
        judul: "Progress diperbarui",
        waktu: waktuSekarang(),
        detail: `Anda memperbarui progress keseluruhan menjadi ${value}%`
      });
      renderTimeline();
      showToast(`Progress diperbarui menjadi ${value}%`);
    }
  });
});

/* ===== TOMBOL HEADER ===== */
document.getElementById("btn-edit").addEventListener("click", () => {
  showToast("Fitur edit tugas menyusul");
});

document.getElementById("btn-review").addEventListener("click", () => {
  openModal({
    title: "Kirim untuk Review",
    desc: `Tugas "${tugas.judul}" akan dikirim kepada ${tugas.pemberi.nama} untuk direview. Lanjutkan?`,
    confirmLabel: "Ya, Kirim",
    onConfirm: () => {
      tugas.status.text = "Menunggu Review";
      renderStatusBadge();
      tugas.timeline.unshift({
        judul: "Tugas dikirim",
        waktu: waktuSekarang(),
        detail: "Anda mengirim tugas untuk direview"
      });
      renderTimeline();
      showToast("Tugas dikirim untuk review");
    }
  });
});

/* ===== Inisialisasi ===== */
renderInfo();
renderSubtasks();
renderFiles();
renderChat();
renderTimeline();
