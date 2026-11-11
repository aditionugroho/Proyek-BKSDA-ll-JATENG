
/*
 * DETAIL TUGAS KEPALA SEKSI
 * Data asli: GET /api/tugas/{id}
 * Review: PATCH /api/tugas/{id}/review
 */

import { showToast } from "../components/toast.js";

const el = (id) => document.getElementById(id);

let tugas = null;
let saving = false;

function setText(id, text) {
  const node = el(id);
  if (node) node.textContent = String(text ?? "");
}

function initials(name) {
  return String(name || "ST")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0] || "")
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "Tidak ditentukan";

  const date = String(value).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));

  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return date;
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "UTC",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(d);
}

function normalize(response) {
  if (
    response?.status !== true ||
    !response.data ||
    Array.isArray(response.data)
  ) {
    throw new Error(
      response?.message || "Format data tugas tidak valid."
    );
  }

  const d = response.data;
  const p = Number(d.progress ?? 0);

  return {
    id: Number(d.id),
    kode: String(d.kode || `TGS-${d.id}`),
    judul: String(d.judul || "Tanpa judul"),
    deskripsi: String(d.deskripsi || ""),
    pic: String(d.pic || "Staf"),
    picRole: String(d.picRole || "Staf"),
    prioritas: String(d.prioritas || "NORMAL"),
    deadline: formatDate(d.deadline),
    progress: Number.isFinite(p)
      ? Math.max(0, Math.min(100, p))
      : 0,
    status: String(d.status || "Belum Mulai")
  };
}

async function fetchDetail(id) {
  const response = await EOfficeAPI.getTugasDetail(id);
  return normalize(response);
}

function addInfoRow(container, label, value) {
  const row = document.createElement("div");
  row.className = "dt-info-row";

  const left = document.createElement("span");
  left.className = "dt-info-label";
  left.textContent = label;

  const right = document.createElement("span");
  right.className = "dt-info-value";
  right.textContent = String(value ?? "");

  row.append(left, right);
  container.appendChild(row);
}

function formatWaktuAktivitas(value) {
  if (!value) return "Waktu tidak tersedia";

  const text = String(value).trim();
  const match = text.match(
    /^(\\d{4})-(\\d{2})-(\\d{2})[ T](\\d{2}):(\\d{2})/
  );

  if (!match) return text;

  const [, year, month, day, hour, minute] = match;

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function renderAktivitasTugas(items) {
  const container = el("dt-aktivitas");
  if (!container) return;

  container.replaceChildren();

  if (!items.length) {
    container.textContent = "Belum ada aktivitas untuk tugas ini.";
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "dt-timeline-item";

    const title = document.createElement("strong");
    title.textContent = String(
      item.nama || "Pengguna"
    ) + " - " + String(item.jenis || "Aktivitas");

    const description = document.createElement("p");
    description.textContent = String(item.keterangan || "");

    const time = document.createElement("small");
    time.textContent = formatWaktuAktivitas(item.created_at);

    row.append(title, description, time);
    container.appendChild(row);
  }
}

async function loadAktivitasTugas(id) {
  setText("dt-aktivitas", "Memuat riwayat aktivitas...");

  try {
    const response = await EOfficeAPI.getAktivitasTugas(id);

    if (response?.status !== true ||
        !Array.isArray(response.data)) {
      throw new Error(
        response?.message || "Format aktivitas tidak valid."
      );
    }

    renderAktivitasTugas(response.data);
  } catch (error) {
    console.error("Gagal memuat aktivitas tugas:", error);
    setText(
      "dt-aktivitas",
      "Riwayat aktivitas gagal dimuat. Silakan muat ulang halaman."
    );
  }
}

function render() {
  if (!tugas) return;

  setText("dt-kode", `Detail Tugas ${tugas.kode}`);
  setText("dt-judul", tugas.judul);
  setText("dt-status", tugas.status);

  // Deskripsi merupakan string, bukan array.
  const description = el("dt-deskripsi");

  if (description) {
    description.replaceChildren();

    const p = document.createElement("p");
    p.className = "dt-desc";
    p.textContent =
      tugas.deskripsi || "Tidak ada deskripsi tugas.";

    description.appendChild(p);
  }

  // Checklist belum mempunyai tabel/API sendiri.
  setText(
    "dt-check-counter",
    `${tugas.progress}% Progress`
  );

  setText(
    "dt-checklist",
    "Checklist pekerjaan belum terintegrasi. " +
    "Progress keseluruhan diambil dari database."
  );

  setText(
    "dt-lampiran",
    "Belum ada lampiran hasil yang tersimpan."
  );

  const info = el("dt-info");

  if (info) {
    info.replaceChildren();

    addInfoRow(
      info,
      "Prioritas",
      tugas.prioritas === "TINGGI" ? "Tinggi" : "Normal"
    );

    addInfoRow(info, "Deadline", tugas.deadline);
    addInfoRow(info, "PIC (Pelaksana)", tugas.pic);
    addInfoRow(info, "Jabatan", tugas.picRole);
    addInfoRow(
      info,
      "Progress Keseluruhan",
      `${tugas.progress}%`
    );
    addInfoRow(info, "Status", tugas.status);
  }

  const dapatReview =
    tugas.status === "Menunggu Review" &&
    tugas.progress === 100;

  const approve = el("btn-review");
  const revise = el("btn-revisi-tugas");

  if (approve) {
    approve.disabled = saving || !dapatReview;
    approve.title = dapatReview
      ? "Setujui pekerjaan staf"
      : "Tugas belum siap direview";

    approve.textContent = saving
      ? "Menyimpan..."
      : "Setujui Hasil Tugas";
  }

  if (revise) {
    revise.disabled = saving || !dapatReview;
  }

  const edit = el("btn-edit");

  if (edit) {
    edit.disabled = true;
    edit.title = "Edit tugas belum terintegrasi";
  }
}

async function prosesReview(action) {
  if (!tugas || saving) return;

  if (
    tugas.status !== "Menunggu Review" ||
    tugas.progress !== 100
  ) {
    showToast("Tugas belum siap untuk review.");
    return;
  }

  const approving = action === "approve";

  const pesan = approving
    ? "Setujui hasil pekerjaan dan tandai tugas selesai?"
    : "Minta staf memperbaiki tugas? " +
      "Status akan kembali Berjalan dengan progress 90%.";

  if (!window.confirm(pesan)) return;

  let reason = "";

  if (!approving) {
    const input = window.prompt(
      "Tulis alasan revisi untuk Staf " +
      "(minimal 5 karakter, maksimal 1000 karakter):",
      ""
    );

    if (input === null) return;

    reason = input.trim();

    if (reason.length < 5 || reason.length > 1000) {
      showToast(
        "Alasan revisi wajib 5 sampai 1000 karakter."
      );
      return;
    }
  }

  saving = true;
  render();

  try {
    const response = await EOfficeAPI.reviewTugas(
      tugas.id,
      action,
      reason
    );

    if (response?.status !== true) {
      throw new Error(
        response?.message || "Review gagal."
      );
    }

    tugas = await fetchDetail(tugas.id);
    render();
    await loadAktivitasTugas(tugas.id);

    showToast(
      approving
        ? "Tugas berhasil disetujui."
        : "Tugas dikembalikan untuk revisi."
    );
  } catch (error) {
    console.error("Review tugas gagal:", error);
    showToast(error.message || "Gagal melakukan review.");
  } finally {
    saving = false;
    render();
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
    setText("dt-judul", "ID tugas tidak valid.");
    return;
  }

  const approve = el("btn-review");

  if (approve) {
    approve.disabled = true;
    approve.addEventListener(
      "click",
      () => prosesReview("approve")
    );

    // Tambah tombol revisi di samping tombol Review.
    const revisi = document.createElement("button");
    revisi.type = "button";
    revisi.id = "btn-revisi-tugas";
    revisi.className = "ktg-btn ktg-btn--outline";
    revisi.textContent = "Minta Revisi";
    revisi.disabled = true;

    revisi.addEventListener(
      "click",
      () => prosesReview("revise")
    );

    approve.parentElement.appendChild(revisi);
  }

  try {
    tugas = await fetchDetail(id);

    if (tugas.id !== id) {
      throw new Error("ID tugas tidak sesuai.");
    }

    render();
    await loadAktivitasTugas(id);
  } catch (error) {
    console.error("Detail tugas gagal dimuat:", error);

    setText("dt-judul", "Gagal memuat detail tugas");

    setText(
      "dt-deskripsi",
      error.message || "Periksa koneksi backend."
    );

    showToast("Gagal memuat detail tugas.");
  }
}

init();
