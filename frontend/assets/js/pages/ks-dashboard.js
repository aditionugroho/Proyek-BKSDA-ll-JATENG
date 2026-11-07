
/*
 * Dashboard Kepala Seksi — E-Office BKSDA
 * Data live dari backend CodeIgniter 4.
 * Tidak memakai data mock.
 */

import {
  initRunningText,
  listenRunningText
} from "../utils/running-text.js";

const $ = (id) => document.getElementById(id);

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const number = (value) =>
  Number(value ?? 0).toLocaleString("id-ID");

const request = (path) => {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error("API backend belum siap.");
  }

  return EOfficeAPI.request("GET", path);
};

async function getList(path) {
  const response = await request(path);

  if (
    response?.status !== true ||
    !Array.isArray(response.data)
  ) {
    throw new Error(`Format data tidak valid: ${path}`);
  }

  return {
    items: response.data,
    total: Number(
      response.pagination?.total ??
      response.data.length
    )
  };
}

function readSession() {
  try {
    const raw =
      sessionStorage.getItem("eoffice_session") ||
      localStorage.getItem("eoffice_session");

    return JSON.parse(raw || "null");
  } catch {
    return null;
  }
}

function verifyRole() {
  const session = readSession();
  const token = localStorage.getItem("eoffice_token");

  if (!token || session?.role !== "kepala-seksi") {
    location.replace("../../login.html");
    return false;
  }

  return true;
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function makeCard(label, value, note, icon) {
  const icons = {
    surat: "✉",
    proses: "◷",
    selesai: "✓",
    total: "▣"
  };

  return `
    <article class="ksd-stat">
      <span class="ksd-stat-icon">
        ${icons[icon] || "▣"}
      </span>
      <p class="ksd-stat-label">
        ${escapeHTML(label)}
      </p>
      <p class="ksd-stat-value">
        ${number(value)}
      </p>
      <p class="ksd-stat-note">
        ${escapeHTML(note)}
      </p>
    </article>
  `;
}

function renderStats(surat, disposisi) {
  const list = disposisi.items;

  const menunggu = list.filter(
    (item) => item.status === "menunggu"
  ).length;

  const proses = list.filter(
    (item) => item.status === "dalam_proses"
  ).length;

  const selesai = list.filter(
    (item) => item.status === "selesai"
  ).length;

  $("ksd-stats").innerHTML = [
    makeCard(
      "Surat Masuk",
      surat.total,
      "Surat yang dapat diakses",
      "surat"
    ),
    makeCard(
      "Disposisi Tercatat",
      disposisi.total,
      "Disposisi yang diterbitkan",
      "total"
    ),
    makeCard(
      "Menunggu",
      menunggu,
      "Pada halaman data yang dimuat",
      "proses"
    ),
    makeCard(
      "Dalam Proses",
      proses,
      "Pada halaman data yang dimuat",
      "proses"
    ),
    makeCard(
      "Selesai",
      selesai,
      "Pada halaman data yang dimuat",
      "selesai"
    )
  ].join("");
}

function renderActions(disposisi) {
  const list = disposisi.items.filter((item) =>
    ["menunggu", "dalam_proses", "dikembalikan"]
      .includes(item.status)
  );

  setText(
    "ksd-actions-badge",
    `${list.length} Item`
  );

  if (!list.length) {
    setText(
      "ksd-actions",
      "Tidak ada disposisi aktif pada data yang dimuat."
    );
    return;
  }

  $("ksd-actions").innerHTML =
    list.slice(0, 5).map((item) => `
      <div class="ksd-action">
        <span class="ksd-action-icon">✉</span>

        <div class="ksd-action-body">
          <p class="ksd-action-title">
            ${escapeHTML(item.perihal || "Disposisi")}
          </p>

          <p class="ksd-action-desc">
            Kepada:
            ${escapeHTML(item.ke_user_name || "-")}
          </p>

          <div class="ksd-action-meta">
            <span class="ksd-tag ksd-tag--gray">
              ${escapeHTML(item.status)}
            </span>
          </div>
        </div>

        <a
          class="ksd-action-btn"
          href="disposisi.html"
        >
          Lihat
        </a>
      </div>
    `).join("");
}

function renderLetters(surat) {
  if (!surat.items.length) {
    setText(
      "ksd-letters",
      "Belum ada surat masuk."
    );
    return;
  }

  $("ksd-letters").innerHTML =
    surat.items.slice(0, 5).map((item) => `
      <div class="ksd-letter">
        <p class="ksd-letter-title">
          ${escapeHTML(item.perihal || "Tanpa perihal")}
        </p>

        <span class="ksd-letter-meta">
          ${escapeHTML(item.no_surat || "-")}
          •
          ${escapeHTML(item.asal || "-")}
        </span>
      </div>
    `).join("");
}

function hideUnintegrated() {
  // Belum ada endpoint dashboard khusus
  // untuk jadwal dan progress pekerjaan.
  const schedule = $("ksd-schedule");
  const progress = $("ksd-progress");

  if (schedule) {
    schedule.textContent =
      "Jadwal belum terhubung ke API.";
  }

  if (progress) {
    progress.textContent =
      "Progress pekerjaan belum terhubung ke API.";
  }

  // Hindari tombol tambah jadwal
  // yang belum memiliki integrasi.
  document.querySelectorAll(
    ".ksd-add-btn"
  ).forEach((button) => {
    button.disabled = true;
    button.title = "Fitur belum terintegrasi";
  });
}

async function initDashboardKS() {
  if (!verifyRole()) return;

  setText("ksd-stats", "Memuat statistik...");
  setText("ksd-actions", "Memuat disposisi...");
  setText("ksd-letters", "Memuat surat...");

  hideUnintegrated();

  try {
    const [surat, disposisi] =
      await Promise.all([
        getList("/surat-masuk?per_page=50"),
        getList("/disposisi?per_page=50")
      ]);

    renderStats(surat, disposisi);
    renderActions(disposisi);
    renderLetters(surat);

    console.info(
      "Dashboard Kepala Seksi berhasil dimuat."
    );

  } catch (error) {
    console.error(
      "Dashboard Kepala Seksi:",
      error.message
    );

    setText(
      "ksd-stats",
      "Statistik gagal dimuat."
    );

    setText(
      "ksd-actions",
      "Disposisi gagal dimuat."
    );

    setText(
      "ksd-letters",
      "Surat gagal dimuat."
    );
  }
}

function start() {
  initRunningText("kepala-seksi");
  listenRunningText("kepala-seksi");
  initDashboardKS();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    start,
    { once: true }
  );
} else {
  start();
}
