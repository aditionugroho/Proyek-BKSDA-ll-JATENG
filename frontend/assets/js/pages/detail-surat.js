/*
 * DETAIL SURAT MASUK — KEPALA SEKSI
 * E-Office BKSDA
 *
 * Integrasi CodeIgniter 4:
 * GET /api/surat-masuk/{id}
 * GET /api/surat-masuk/{id}/preview
 * GET /api/surat-masuk/{id}/file
 *
 * Tidak memakai mock document.
 * Akses dokumen diperiksa oleh backend.
 */

"use strict";

const $ = (id) => document.getElementById(id);

const API_BASE = EOfficeAPI.config.BASE_URL;

let surat = null;
let suratId = null;
let previewURL = null;
let zoom = 1;

/* ========== HELPERS ========== */

function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = String(value ?? "-");
  }
}

function getToken() {
  return localStorage.getItem("eoffice_token");
}

function getSession() {
  try {
    const raw =
      sessionStorage.getItem("eoffice_session") ||
      localStorage.getItem("eoffice_session");

    return JSON.parse(raw || "null");
  } catch {
    return null;
  }
}

function notify(message, isError = false) {
  let banner = $("dsm-api-message");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "dsm-api-message";
    banner.setAttribute("role", "status");

    banner.style.padding = "12px 16px";
    banner.style.margin = "12px 0";
    banner.style.borderRadius = "8px";

    document.querySelector(".dsm-head")?.after(banner);
  }

  banner.textContent = message;

  banner.style.background = isError ? "#fee2e2" : "#dbeafe";

  banner.style.color = isError ? "#991b1b" : "#1d4ed8";
}

function clearNotice() {
  $("dsm-api-message")?.remove();
}

function getFilename(path) {
  const raw = String(path || "");

  if (!raw) return "Tidak ada lampiran";

  return raw.replace(/\\/g, "/").split("/").pop();
}

function formatDate(value) {
  if (!value) return "-";

  const raw = String(value);

  const date = new Date(raw.includes("T") ? raw : raw.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function checkAccess() {
  const session = getSession();

  if (!getToken() || session?.role !== "kepala-seksi") {
    location.replace("../../login.html");
    return false;
  }

  return true;
}

function readSuratId() {
  const id = new URLSearchParams(location.search).get("id");

  if (!id || !/^[1-9]\d*$/.test(id)) {
    throw new Error(
      "ID Surat Masuk tidak valid. Buka surat dari halaman daftar.",
    );
  }

  return Number(id);
}

/* ========== API JSON ========== */

async function getDetail(id) {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error("Koneksi API backend belum aktif.");
  }

  const response = await EOfficeAPI.request("GET", `/surat-masuk/${id}`);

  if (
    response?.status !== true ||
    !response.data ||
    typeof response.data !== "object"
  ) {
    throw new Error("Format detail surat tidak sesuai.");
  }

  return response.data;
}

/* ========== API FILE ========== */

async function fetchFile(path) {
  const token = getToken();

  if (!token) {
    throw new Error("Sesi telah berakhir. Login ulang.");
  }

  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf,image/png,image/jpeg,application/octet-stream",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      let message = `Gagal mengambil lampiran (HTTP ${response.status}).`;

      const type = response.headers.get("content-type") || "";

      if (type.includes("application/json")) {
        const json = await response.json();

        message = json?.message || message;
      }

      throw new Error(message);
    }

    const contentType = response.headers.get("content-type") || "";

    if (
      contentType.includes("application/json") ||
      contentType.includes("text/html")
    ) {
      throw new Error("Server tidak mengembalikan file yang valid.");
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("Lampiran kosong.");
    }

    return blob;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Waktu pengambilan file habis.");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/* ========== RENDER INFORMASI ========== */

function renderDetail(data) {
  setText("dsm-nomor", data.no_surat || data.no_agenda || "-");

  const status = $("dsm-status");

  if (status) {
    status.textContent = String(data.status || "Tidak diketahui").replace(
      /_/g,
      " ",
    );
  }

  // Backend belum menyediakan prioritas
  // dalam kontrak detail yang kita gunakan.
  const prioritas = $("dsm-prioritas");

  if (prioritas) {
    prioritas.textContent = "Tidak tersedia";
    prioritas.classList.remove("dsm-row-value--red");
  }

  setText("dsm-sifat", data.sifat || "Tidak tersedia");

  setText(
    "dsm-terima",
    formatDate(data.tanggal_diterima || data.created_at || data.tanggal),
  );

  setText("dsm-pengirim", data.asal || "-");

  setText("dsm-nomor-asli", data.no_surat || "-");

  setText("dsm-tanggal-surat", formatDate(data.tanggal));

  setText("dsm-perihal", data.perihal || "-");

  const classification = $("dsm-klasifikasi");

  if (classification) {
    classification.replaceChildren();

    const badge = document.createElement("span");

    badge.className = "kss-badge kss-badge--gray";

    badge.textContent = data.klasifikasi || "Belum diklasifikasikan";

    classification.appendChild(badge);
  }

  setText("dsm-file-name", getFilename(data.file_path));

  setText("dsm-file-size", data.file_path ? "" : "Tidak ada file");
}

/* ========== PREVIEW LAMPIRAN ========== */

function clearPreview() {
  const paper = $("dsm-paper");

  if (paper) {
    paper.replaceChildren();
  }

  if (previewURL) {
    URL.revokeObjectURL(previewURL);
    previewURL = null;
  }
}

function displayPreview(blob) {
  clearPreview();

  const paper = $("dsm-paper");

  if (!paper) return;

  const type = blob.type.toLowerCase();

  previewURL = URL.createObjectURL(blob);

  if (type.includes("application/pdf")) {
    const frame = document.createElement("iframe");

    frame.src = previewURL;
    frame.title = "Preview lampiran Surat Masuk";
    frame.style.width = "100%";
    frame.style.height = "650px";
    frame.style.border = "0";
    frame.style.background = "#fff";

    paper.appendChild(frame);
  } else if (type.startsWith("image/")) {
    const image = document.createElement("img");

    image.src = previewURL;
    image.alt = "Lampiran Surat Masuk";
    image.style.width = "100%";
    image.style.height = "auto";
    image.style.display = "block";

    paper.appendChild(image);
  } else {
    clearPreview();

    paper.textContent =
      "Format ini tidak mendukung preview. " + "Gunakan tombol Unduh Berkas.";
  }
}

async function loadPreview() {
  const paper = $("dsm-paper");

  if (!surat?.file_path) {
    if (paper) {
      paper.textContent = "Surat ini belum memiliki lampiran.";
    }

    return;
  }

  if (paper) {
    paper.textContent = "Memuat lampiran...";
  }

  try {
    const blob = await fetchFile(`/surat-masuk/${suratId}/preview`);

    displayPreview(blob);
  } catch (error) {
    console.warn("Preview lampiran:", error.message);

    if (paper) {
      paper.textContent = "Preview tidak tersedia: " + error.message;
    }
  }
}

/* ========== DOWNLOAD ========== */

async function downloadAttachment() {
  if (!surat?.file_path) {
    notify("Surat belum memiliki lampiran.", true);
    return;
  }

  const button = $("btn-download");

  if (button) button.disabled = true;

  try {
    const blob = await fetchFile(`/surat-masuk/${suratId}/file`);

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = getFilename(surat.file_path);

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 30000);

    notify("Lampiran berhasil diminta untuk diunduh.");
  } catch (error) {
    notify(error.message, true);
  } finally {
    if (button) button.disabled = false;
  }
}

/* ========== ZOOM & FULLSCREEN ========== */

function applyZoom() {
  const paper = $("dsm-paper");

  if (!paper) return;

  paper.style.transformOrigin = "top center";
  paper.style.transform = `scale(${zoom})`;

  setText("zoom-level", `${Math.round(zoom * 100)}%`);
}

function setupViewer() {
  $("zoom-in")?.addEventListener("click", () => {
    zoom = Math.min(1.5, zoom + 0.1);
    applyZoom();
  });

  $("zoom-out")?.addEventListener("click", () => {
    zoom = Math.max(0.7, zoom - 0.1);
    applyZoom();
  });

  $("btn-fullscreen")?.addEventListener("click", () => {
    $("dsm-viewer")?.classList.toggle("fullscreen");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      $("dsm-viewer")?.classList.remove("fullscreen");
    }
  });

  $("btn-download")?.addEventListener("click", downloadAttachment);
}

/* ========== NONAKTIFKAN AKSI MOCK ========== */

function disableMockActions() {
  // Kedua aksi ini sebelumnya hanya
  // menampilkan toast tanpa menyimpan data.
  for (const id of ["btn-forward", "btn-archive", "btn-print"]) {
    const button = $(id);

    if (button) {
      button.disabled = true;
      button.title = "Fitur sedang dalam tahap integrasi";
    }
  }

  // Navigasi disposisi dari detail surat
  // belum meneruskan ID surat secara benar.
  const links = document.querySelectorAll('a[href="disposisi.html"]');

  links.forEach((link) => {
    link.setAttribute("aria-disabled", "true");

    link.style.pointerEvents = "none";
    link.style.opacity = "0.5";

    link.title = "Integrasi disposisi akan dilakukan berikutnya";
  });
}

/* ========== ERROR ========== */

function showError(error) {
  console.error("Detail Surat Masuk gagal:", error.message);

  notify(error.message, true);

  setText("dsm-nomor", "Tidak tersedia");
  setText("dsm-file-name", "-");

  const paper = $("dsm-paper");

  if (paper) {
    paper.textContent = "Detail surat tidak dapat dimuat.";
  }

  if ($("btn-download")) {
    $("btn-download").disabled = true;
  }
}

/* ========== INIT ========== */

async function init() {
  if (!checkAccess()) return;

  setupViewer();
  disableMockActions();

  setText("dsm-nomor", "Memuat...");
  setText("dsm-file-name", "Memuat...");

  try {
    suratId = readSuratId();

    const data = await getDetail(suratId);

    surat = data;

    renderDetail(data);

    if (!data.file_path && $("btn-download")) {
      $("btn-download").disabled = true;
    }

    clearNotice();

    await loadPreview();

    console.info("Detail Surat Masuk berhasil dimuat.", { id: suratId });
  } catch (error) {
    showError(error);
  }
}

window.addEventListener("pagehide", clearPreview);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
