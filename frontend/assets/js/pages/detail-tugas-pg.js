/*
 * DETAIL TUGAS PEGAWAI
 * Menggunakan data asli API /api/tugas/{id}.
 *
 * Hanya progress yang bisa diedit pada versi ini.
 * Progress 100% otomatis menjadi Menunggu Review.
 */

import { showToast } from "../components/toast.js";

let tugas = null;
let sedangMenyimpan = false;

const $ = (id) => document.getElementById(id);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = String(value ?? "");
}

function namaInisial(nama) {
  return String(nama || "KS")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((bagian) => bagian[0] || "")
    .join("")
    .toUpperCase();
}

function tanggalIndonesia(value) {
  if (!value) return "Tidak ditentukan";

  const bagian = String(value).slice(0, 10).split("-");

  if (bagian.length !== 3) return String(value);

  const [tahun, bulan, hari] = bagian.map(Number);

  const tanggal = new Date(Date.UTC(
    tahun,
    bulan - 1,
    hari
  ));

  if (
    Number.isNaN(tanggal.getTime()) ||
    tanggal.getUTCFullYear() !== tahun ||
    tanggal.getUTCMonth() !== bulan - 1 ||
    tanggal.getUTCDate() !== hari
  ) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(tanggal);
}

function normalisasiTugas(response) {
  if (
    !response ||
    response.status !== true ||
    !response.data ||
    typeof response.data !== "object" ||
    Array.isArray(response.data)
  ) {
    throw new Error(
      response?.message || "Format detail tugas tidak valid."
    );
  }

  const data = response.data;
  const nama = String(
    data.pemberi_nama || "Kepala Seksi"
  );

  const prioritas = String(
    data.prioritas || "NORMAL"
  ).toUpperCase();

  const status = String(
    data.status || "Belum Mulai"
  );

  const progress = Number(data.progress ?? 0);

  return {
    id: Number(data.id),
    kode: String(data.kode || `TGS-${data.id}`),
    judul: String(data.judul || "Tanpa judul"),
    deskripsi: String(data.deskripsi || ""),
    pemberi: {
      nama,
      inisial: namaInisial(nama)
    },
    prioritas: {
      text: prioritas === "TINGGI" ? "Tinggi" : "Normal",
      tone: prioritas === "TINGGI" ? "red" : "gray"
    },
    deadline: tanggalIndonesia(data.deadline),
    status: {
      text: status
    },
    progress: Number.isFinite(progress)
      ? Math.max(0, Math.min(100, progress))
      : 0
  };
}

async function loadDetail(id) {
  if (!window.EOfficeAPI?.config?.LIVE) {
    throw new Error(
      "Detail tugas membutuhkan koneksi API LIVE."
    );
  }

  const response = await EOfficeAPI.getTugasSayaDetail(id);

  return normalisasiTugas(response);
}

function renderInfo() {
  if (!tugas) return;

  setText("pgdt-crumb-judul", tugas.judul);
  setText("pgdt-judul", tugas.judul);
  setText("pgdt-deskripsi", tugas.deskripsi);
  setText("pgdt-prioritas", tugas.prioritas.text);

  setText(
    "pgdt-pemberi-inisial",
    tugas.pemberi.inisial
  );

  setText(
    "pgdt-pemberi-nama",
    tugas.pemberi.nama
  );

  setText("pgdt-deadline", tugas.deadline);
  setText("pgdt-kode", tugas.kode);

  const prioritasEl = $("pgdt-prioritas");

  if (prioritasEl) {
    prioritasEl.className =
      "pgdt-judul-badge pgdt-judul-badge--" +
      tugas.prioritas.tone;
  }

  renderStatus();
  renderProgress();
}

function renderStatus() {
  const el = $("pgdt-status");
  if (!el || !tugas) return;

  const status = tugas.status.text;

  const warna =
    status === "Selesai"
      ? "green"
      : status === "Menunggu Review"
        ? "blue"
        : "amber";

  el.textContent = status;
  el.className =
    "pgdt-status-badge pgdt-status-badge--" + warna;
}

function renderProgress() {
  if (!tugas) return;

  const nilai = tugas.progress;

  // Area subtugas dipakai untuk menampilkan
  // progress keseluruhan dari database.
  setText(
    "pgdt-subtask-percent",
    `${nilai}% Selesai`
  );

  const bar = $("pgdt-subtask-bar");
  if (bar) bar.style.width = `${nilai}%`;

  const container = $("pgdt-subtasks");

  if (container) {
    container.replaceChildren();

    const info = document.createElement("p");

    info.textContent =
      "Progress pekerjaan: " + nilai +
      "%. Checklist pekerjaan dikelola melalui panel checklist.";

    info.style.fontSize = "13px";
    info.style.color = "#64748B";

    container.appendChild(info);
  }

  const updateButton = $("btn-update-progress");

  if (updateButton) {
    const terkunci = [
      "Menunggu Review",
      "Selesai"
    ].includes(tugas.status.text);

    updateButton.disabled =
      sedangMenyimpan || terkunci;

    updateButton.textContent = terkunci
      ? "Progress terkunci"
      : sedangMenyimpan
        ? "Menyimpan..."
        : "Update Progress Keseluruhan";
  }
}

function tampilkanFiturBelumTersedia() {
  // Upload, komentar, aktivitas, dan checklist
  // dikelola oleh komponen LIVE masing-masing.
  // Jangan menonaktifkan kontrol milik komponen tersebut.

  const edit = $("btn-edit");

  if (edit) {
    edit.disabled = true;
    edit.title = "Edit tugas belum tersedia";
  }

  const review = $("btn-review");

  if (review) {
    review.disabled = true;
    review.title =
      "Progress 100% otomatis dikirim untuk review.";
    review.textContent = "Review Otomatis pada 100%";
  }
}
async function simpanProgress() {
  if (!tugas || sedangMenyimpan) return;

  if (
    tugas.status.text === "Menunggu Review" ||
    tugas.status.text === "Selesai"
  ) {
    showToast("Tugas tidak dapat diperbarui pada status ini.");
    return;
  }

  const input = window.prompt(
    "Masukkan progress tugas (0 sampai 100):",
    String(tugas.progress)
  );

  if (input === null) return;

  const angka = Number(input.trim());

  if (
    input.trim() === "" ||
    !Number.isInteger(angka) ||
    angka < 0 ||
    angka > 100
  ) {
    showToast("Progress harus angka bulat 0 sampai 100.");
    return;
  }

  if (angka === 100) {
    const setuju = window.confirm(
      "Progress 100% akan mengubah status menjadi " +
      "'Menunggu Review'. Lanjutkan?"
    );

    if (!setuju) return;
  }

  sedangMenyimpan = true;
  renderProgress();

  try {
    const response = await EOfficeAPI.updateTugasProgress(
      tugas.id,
      angka
    );

    if (response?.status !== true) {
      throw new Error(
        response?.message || "Gagal menyimpan progress."
      );
    }

    // Ambil ulang dari backend untuk memastikan
    // tampilan sesuai data yang benar-benar tersimpan.
    tugas = await loadDetail(tugas.id);

    showToast("Progress berhasil disimpan.");
  } catch (error) {
    console.error("Update progress gagal:", error);

    showToast(
      error.message || "Gagal memperbarui progress."
    );
  } finally {
    sedangMenyimpan = false;
    renderInfo();
  }
}

async function init() {
  const idText = new URLSearchParams(
    window.location.search
  ).get("id");

  const id = Number(idText);

  if (
    !idText ||
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    setText("pgdt-judul", "ID tugas tidak valid.");
    return;
  }

  tampilkanFiturBelumTersedia();

  const updateButton = $("btn-update-progress");

  if (updateButton) {
    updateButton.addEventListener(
      "click",
      simpanProgress
    );
  }

  try {
    tugas = await loadDetail(id);

    if (
      !Number.isSafeInteger(tugas.id) ||
      tugas.id !== id
    ) {
      throw new Error(
        "ID tugas pada respons API tidak sesuai."
      );
    }

    renderInfo();
  } catch (error) {
    console.error("Detail tugas gagal dimuat:", error);

    setText(
      "pgdt-judul",
      "Gagal memuat detail tugas"
    );

    setText(
      "pgdt-deskripsi",
      error.message || "Periksa koneksi server."
    );

    if (updateButton) {
      updateButton.disabled = true;
    }

    showToast("Gagal memuat detail tugas.");
  }
}

init();
