/* ============================================
   MANAJEMEN DISPOSISI (KS) — E-Office SKSDA
   disposisiData + renderTable, validasi form,
   tambah disposisi baru, modal detail
   ============================================ */

import { SURAT_MASUK as SURAT_MASUK_MOCK } from "../data/surat-masuk.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { tambahNotif } from "../utils/notif-mock.js";

/* ===== MOCK DATA (fallback selama backend belum siap) ===== */
const DISPOSISI_MOCK = [
  {
    id: 1,
    nomor: "DSP-10/23-001",
    surat: "SM-2023/10/001 - Laporan Patroli K",
    pic: "Budi Santoso",
    tanggal: "24 Okt 2023",
    deadline: "26 Okt 2023",
    instruksi: "Segera ditindaklanjuti",
    catatan: "Koordinasikan dengan resort setempat."
  },
  {
    id: 2,
    nomor: "DSP-10/23-002",
    surat: "SM-2023/10/045 - Undangan Rapa",
    pic: "Siti Rahma",
    tanggal: "23 Okt 2023",
    deadline: "28 Okt 2023",
    instruksi: "Untuk dilaporkan",
    catatan: ""
  },
  {
    id: 3,
    nomor: "DSP-10/23-003",
    surat: "SM-2023/09/112 - Permohonan Izin",
    pic: "Andi Wijaya",
    tanggal: "20 Okt 2023",
    deadline: "25 Okt 2023",
    instruksi: "Untuk ditelaah",
    catatan: "Periksa kelengkapan berkas."
  }
];

const TOTAL_MOCK = 24; // total sistem (untuk teks "dari N disposisi")

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let disposisiData = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTanggalAPI(value) {
  if (!value) return "—";

  const tanggal = new Date(
    String(value).replace(" ", "T")
  );

  if (Number.isNaN(tanggal.getTime())) {
    return "—";
  }

  return tanggal.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

let totalDisposisi = 0;

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const response = await EOfficeAPI.request(
      "GET",
      "/disposisi?per_page=50"
    );

    if (!response.status || !Array.isArray(response.data)) {
      throw new Error(
        response.message || "Format data disposisi tidak valid."
      );
    }

    totalDisposisi =
      Number(response.pagination?.total) || response.data.length;

    return response.data.map((item) => ({
      id: item.id,
      nomor: `DSP-${item.id}`,
      surat: [
        item.no_surat || item.no_agenda || `Surat #${item.surat_masuk_id}`,
        item.perihal
      ].filter(Boolean).join(" - "),
      pic: item.ke_user_name || "Tidak diketahui",
      tanggal: formatTanggalAPI(item.created_at),
      deadline: item.deadline
        ? formatTanggalAPI(item.deadline)
        : "",
      instruksi: item.catatan || "",
      catatan: item.catatan || "",
      status: item.status
    }));
  }

  totalDisposisi = DISPOSISI_MOCK.length;
  return DISPOSISI_MOCK;
}


/* ===== PILIHAN SURAT DAN STAF DARI BACKEND ===== */
let suratOptions = [];
let stafOptions = [];

async function isiDaftarSurat() {
  const datalist = document.getElementById("daftar-surat");
  if (!datalist) return;

  if (!window.EOfficeAPI || !EOfficeAPI.config.LIVE) {
    datalist.replaceChildren();
    SURAT_MASUK_MOCK.forEach((s) => {
      const option = document.createElement("option");
      option.value = `${s.nomor} - ${s.perihal}`;
      datalist.appendChild(option);
    });
    return;
  }

  try {
    const response = await EOfficeAPI.request(
      "GET",
      "/surat-masuk?per_page=50"
    );

    if (!response.status || !Array.isArray(response.data)) {
      throw new Error("Format daftar surat masuk tidak sesuai.");
    }

    suratOptions = response.data.filter(
      (s) => Number(s.id) > 0 && s.status !== "selesai"
    );

    datalist.replaceChildren();

    suratOptions.forEach((s) => {
      const option = document.createElement("option");
      option.value = `${s.no_surat || s.no_agenda || "Surat #" + s.id} - ${s.perihal || ""}`;
      datalist.appendChild(option);
    });
  } catch (error) {
    suratOptions = [];
    datalist.replaceChildren();
    showToast(error.message || "Gagal memuat surat masuk.");
  }
}

async function isiDaftarStaf() {
  if (!window.EOfficeAPI || !EOfficeAPI.config.LIVE) {
    return;
  }

  const select = document.getElementById("f-staf");
  select.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Pilih staf tujuan...";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.appendChild(placeholder);

  select.disabled = true;

  try {
    const response = await EOfficeAPI.getStafTujuan();

    if (!response.status || !Array.isArray(response.data)) {
      throw new Error("Format daftar staf tidak sesuai.");
    }

    stafOptions = response.data.filter(
      (u) => Number.isInteger(Number(u.id)) && Number(u.id) > 0
    );

    stafOptions.forEach((u) => {
      const option = document.createElement("option");
      option.value = String(u.id);
      option.textContent = u.name;
      select.appendChild(option);
    });

    if (stafOptions.length === 0) {
      throw new Error("Tidak ada staf aktif yang dapat dipilih.");
    }

    select.disabled = false;
  } catch (error) {
    stafOptions = [];
    showToast(error.message || "Gagal memuat staf.");
  }
}

/* ===== IKON ===== */
const CLOCK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';

/* ===== UTIL ===== */
function inisial(nama) {
  return nama
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTanggal(date) {
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

/* ===== RENDER TABEL ===== */
function renderTable() {
  const tbody = document.getElementById("dsp-tbody");

  tbody.innerHTML = disposisiData
    .map(
      (d) => `
      <tr data-id="${d.id}" title="Klik untuk detail disposisi">
        <td>
          <span class="kdp-nomor">${escapeHtml(d.nomor)}</span>
          <span class="kdp-surat">${escapeHtml(d.surat)}</span>
        </td>
        <td>
          <div class="kdp-pic">
            <span class="kdp-avatar">${inisial(escapeHtml(d.pic))}</span>
            <span class="kdp-pic-name">${escapeHtml(d.pic)}</span>
          </div>
        </td>
        <td>
          <span class="kdp-tanggal">${escapeHtml(d.tanggal)}</span>
          <span class="kdp-deadline">${CLOCK_ICON}${escapeHtml(d.deadline) || "\u2014"}</span>
        </td>
      </tr>`
    )
    .join("");

  document.getElementById("dsp-showing").textContent =
  `Menampilkan ${disposisiData.length} dari ${totalDisposisi} disposisi`;

  document.getElementById("dsp-prev").disabled = true;
  document.getElementById("dsp-next").disabled = disposisiData.length <= 3;
}

/* ===== VALIDASI ===== */
const REQUIRED = ["f-surat", "f-staf", "f-instruksi"];

function setFieldError(id, show) {
  const field = document.getElementById(id).closest(".kdp-field");
  field.classList.toggle("is-error", show);
  document.getElementById(id + "-error").hidden = !show;
}

REQUIRED.forEach((id) => {
  document.getElementById(id).addEventListener("change", () => setFieldError(id, false));
  document.getElementById(id).addEventListener("input", () => setFieldError(id, false));
});

/* ===== SUBMIT: tambah disposisi baru ===== */
document.getElementById("dsp-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  let valid = true;
  REQUIRED.forEach((id) => {
    const isEmpty = document.getElementById(id).value === "";
    setFieldError(id, isEmpty);
    if (isEmpty) valid = false;
  });
  if (!valid) return;

  const suratLabel = document.getElementById("f-surat").value;
  const deadlineRaw = document.getElementById("f-deadline").value;

  const afterSuccess = () => {
    renderTable();
    document.getElementById("dsp-form").reset();
    REQUIRED.forEach((id) => setFieldError(id, false));
    showToast("Disposisi berhasil dikirim");
  };


  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const surat = suratOptions.find(
      (s) =>
        `${s.no_surat || s.no_agenda || "Surat #" + s.id} - ${s.perihal || ""}` === suratLabel
    );

    const keUserId = Number(
      document.getElementById("f-staf").value
    );

    if (!surat) {
      showToast("Pilih nomor surat dari daftar yang tersedia.");
      return;
    }

    if (
      !Number.isInteger(keUserId) ||
      !stafOptions.some((u) => Number(u.id) === keUserId)
    ) {
      showToast("Pilih staf tujuan yang tersedia.");
      return;
    }

    const instruksi = document.getElementById("f-instruksi").value.trim();
    const catatanTambahan = document.getElementById("f-catatan").value.trim();

    const payload = {
      surat_masuk_id: Number(surat.id),
      ke_user_id: keUserId,
      catatan: [instruksi, catatanTambahan].filter(Boolean).join("\n"),
      deadline: deadlineRaw || ""
    };

    const submitButton = document.querySelector(
      '#dsp-form button[type="submit"]'
    );

    if (submitButton) submitButton.disabled = true;

    try {
      const response = await EOfficeAPI.createDisposisi(payload);

      if (!response.status) {
        throw new Error(
          response.message || "Gagal membuat disposisi."
        );
      }

      disposisiData = await loadData();
      afterSuccess();

      // Perbarui pilihan surat setelah perubahan status
      await isiDaftarSurat();
    } catch (error) {
      showToast(
        error.message || "Gagal mengirim disposisi."
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }

    return;
  }

    // MOCK: nomor urut & tanggal dibuat lokal
  const urut = disposisiData.length + 1;

  // Pemicu notif: pegawai tujuan diberi tahu (mock)
  tambahNotif("pegawai", {
    judul: "Disposisi baru dari Kepala Seksi",
    teks: `${suratLabel} — instruksi: ${document.getElementById("f-instruksi").value}.`,
    kategori: "disposisi",
    icon: "plus",
    tone: "blue",
    aksi: { label: "Lihat Disposisi", href: "disposisi-saya.html" }
  });

  disposisiData.unshift({
    id: Date.now(),
    nomor: `DSP-10/23-${String(urut).padStart(3, "0")}`,
    surat: suratLabel,
    pic: document.getElementById("f-staf").value,
    tanggal: formatTanggal(new Date()),
    deadline: deadlineRaw ? formatTanggal(new Date(deadlineRaw)) : "",
    instruksi: document.getElementById("f-instruksi").value,
    catatan: document.getElementById("f-catatan").value
  });

  afterSuccess();
});

/* ===== KLIK BARIS → MODAL DETAIL ===== */
document.getElementById("dsp-tbody").addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-id]");
  if (!row) return;

  const d = disposisiData.find((x) => String(x.id) === row.dataset.id);
  if (!d) return;

  openModal({
    title: `Detail Disposisi ${d.nomor}`,
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default">
          <span><strong>Surat</strong><span>${d.surat}</span></span>
        </div>
        <div class="app-modal-option" style="cursor:default">
          <span><strong>PIC</strong><span>${d.pic} \u2022 ${d.instruksi}</span></span>
        </div>
        <div class="app-modal-option" style="cursor:default">
          <span><strong>Tanggal &amp; Deadline</strong><span>${d.tanggal} \u2192 ${d.deadline || "\u2014"}</span></span>
        </div>
        <div class="app-modal-option" style="cursor:default">
          <span><strong>Catatan</strong><span>${d.catatan || "Tidak ada catatan."}</span></span>
        </div>
      </div>`,
    cancelLabel: null,
    confirmLabel: "Tutup"
  });
});

/* ===== HEADER: scroll halus ke form ===== */
document.getElementById("btn-buat").addEventListener("click", () => {
  const formCard = document.getElementById("dsp-form");
  formCard.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("f-surat").focus();
});

/* ===== TOMBOL FILTER: toggle state aktif saja ===== */
document.querySelectorAll(".kdp-filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => btn.classList.toggle("is-active"));
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("dsp-tbody");
  tbody.innerHTML = `<tr><td colspan="3">Memuat data disposisi...</td></tr>`;

  await Promise.allSettled([isiDaftarSurat(), isiDaftarStaf()]);

  try {
    disposisiData = await loadData();
  } catch (e) {
    disposisiData = [];
    tbody.innerHTML = `<tr><td colspan="3">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  renderTable();
}

init();
