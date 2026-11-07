
/*
 * Dashboard Staf — E-Office BKSDA
 * Mengambil disposisi sesuai akun staf login.
 * Tidak memakai statistik global Admin.
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

function getSession() {
  try {
    return JSON.parse(
      sessionStorage.getItem("eoffice_session") ||
      localStorage.getItem("eoffice_session") ||
      "null"
    );
  } catch {
    return null;
  }
}

function verifyRole() {
  const session = getSession();
  const token = localStorage.getItem("eoffice_token");

  if (!token || session?.role !== "pegawai") {
    location.replace("../../login.html");
    return false;
  }

  return true;
}

async function loadDisposisi() {
  if (
    typeof EOfficeAPI === "undefined" ||
    !EOfficeAPI.config?.LIVE ||
    typeof EOfficeAPI.request !== "function"
  ) {
    throw new Error("API backend belum siap.");
  }

  const response = await EOfficeAPI.request(
    "GET",
    "/disposisi?per_page=50"
  );

  if (
    response?.status !== true ||
    !Array.isArray(response.data)
  ) {
    throw new Error("Format data disposisi tidak valid.");
  }

  return {
    items: response.data,
    total: Number(
      response.pagination?.total ??
      response.data.length
    )
  };
}

function statCard(label, value, note, icon) {
  return `
    <article
      class="pgd-stat"
      style="--stat-accent:#DBEAFE"
    >
      <div class="pgd-stat-body">
        <p class="pgd-stat-label">
          ${escapeHTML(label)}
        </p>

        <p class="pgd-stat-value">
          ${number(value)}
        </p>

        <p class="pgd-stat-note">
          ${escapeHTML(note)}
        </p>
      </div>

      <span class="pgd-stat-icon pgd-stat-icon--blue">
        ${icon}
      </span>
    </article>
  `;
}

function renderStats(data) {
  const items = data.items;

  const menunggu = items.filter(
    (item) => item.status === "menunggu"
  ).length;

  const proses = items.filter(
    (item) => item.status === "dalam_proses"
  ).length;

  const selesai = items.filter(
    (item) => item.status === "selesai"
  ).length;

  $("pgd-stats").innerHTML = [
    statCard(
      "Disposisi Saya",
      data.total,
      "Total disposisi diterima",
      "✉"
    ),
    statCard(
      "Menunggu",
      menunggu,
      "Pada data yang dimuat",
      "◷"
    ),
    statCard(
      "Dalam Proses",
      proses,
      "Pada data yang dimuat",
      "▣"
    ),
    statCard(
      "Selesai",
      selesai,
      "Pada data yang dimuat",
      "✓"
    )
  ].join("");
}

function renderPrioritas(data) {
  const pending = data.items.filter(
    (item) => [
      "menunggu",
      "dalam_proses",
      "dikembalikan"
    ].includes(item.status)
  );

  const target = $("pgd-priority");
  if (!target) return;

  if (!pending.length) {
    target.textContent =
      "Belum ada disposisi aktif pada data yang dimuat.";
    return;
  }

  target.innerHTML =
    pending.slice(0, 5).map((item) => `
      <article class="pgd-priority-item">
        <div class="pgd-priority-body">
          <div class="pgd-priority-top">
            <span class="pgd-badge pgd-badge--amber">
              ${escapeHTML(item.status)}
            </span>

            <h3 class="pgd-priority-title">
              ${escapeHTML(
                item.perihal || "Tindak Lanjut Disposisi"
              )}
            </h3>
          </div>

          <p class="pgd-priority-desc">
            ${escapeHTML(
              item.no_surat ||
              "Disposisi memerlukan tindak lanjut"
            )}
          </p>

          <div class="pgd-priority-bottom">
            <a
              href="disposisi-saya.html"
              class="pgd-work-btn"
            >
              Lihat Disposisi
            </a>
          </div>
        </div>
      </article>
    `).join("");
}

function renderDisposisi(data) {
  const target = $("pgd-disposisi");
  if (!target) return;

  if (!data.items.length) {
    target.textContent =
      "Belum ada disposisi untuk akun ini.";
    return;
  }

  target.innerHTML =
    data.items.slice(0, 5).map((item) => `
      <div class="pgd-disposisi-item">
        <span class="pgd-disposisi-icon">
          ✉
        </span>

        <div class="pgd-disposisi-body">
          <p class="pgd-disposisi-title">
            ${escapeHTML(
              item.perihal || "Disposisi"
            )}
          </p>

          <p class="pgd-disposisi-from">
            Dari:
            ${escapeHTML(
              item.dari_user_name || "-"
            )}
          </p>

          <span class="pgd-badge pgd-badge--blue">
            ${escapeHTML(item.status || "-")}
          </span>
        </div>
      </div>
    `).join("");
}

async function initDashboardPegawai() {
  if (!verifyRole()) return;

  $("pgd-stats").textContent =
    "Memuat statistik...";

  $("pgd-priority").textContent =
    "Memuat pekerjaan...";

  $("pgd-disposisi").textContent =
    "Memuat disposisi...";

  try {
    const data = await loadDisposisi();

    renderStats(data);
    renderPrioritas(data);
    renderDisposisi(data);

    console.info(
      "Dashboard Staf berhasil dimuat."
    );

  } catch (error) {
    console.error(
      "Dashboard Staf:",
      error.message
    );

    $("pgd-stats").textContent =
      "Statistik gagal dimuat.";

    $("pgd-priority").textContent =
      "Data pekerjaan gagal dimuat.";

    $("pgd-disposisi").textContent =
      "Disposisi gagal dimuat.";
  }
}

function start() {
  initRunningText("pegawai");
  listenRunningText("pegawai");
  initDashboardPegawai();
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
