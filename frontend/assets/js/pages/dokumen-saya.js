import { saveListState, loadListState } from "../utils/state.js";

const stateKey = "dokumen-saya-pg";
const tbody = document.getElementById("pgdk-tbody");
const searchInput = document.getElementById("pgdk-search");
const previousButton = document.getElementById("pgdk-prev");
const nextButton = document.getElementById("pgdk-next");
const pageLabel = document.getElementById("pgdk-page");
const showing = document.getElementById("pgdk-showing");
const filters = [...document.querySelectorAll(".pgdk-pill")];
const saved = loadListState(stateKey);
let status = filters.some((filter) => filter.dataset.status === saved?.currentStatus)
  ? saved.currentStatus : "all";
let page = Number.isSafeInteger(saved?.page) && saved.page > 0 ? saved.page : 1;
let lastPage = 1;
let requestVersion = 0;
let searchTimer;
searchInput.value = typeof saved?.search === "string" ? saved.search : "";

function tableMessage(message) {
  const row = document.createElement("tr");
  row.className = "pgdk-empty";
  const cell = row.insertCell();
  cell.colSpan = 6;
  cell.textContent = message;
  tbody.replaceChildren(row);
}

function renderRows(rows) {
  if (!rows.length) {
    tableMessage("Tidak ada dokumen yang cocok dengan filter.");
    return;
  }
  tbody.replaceChildren(...rows.map((documentRow) => {
    const row = document.createElement("tr");
    const title = document.createElement("a");
    title.className = "pgdk-nama";
    title.href = `detail-dokumen.html?id=${encodeURIComponent(documentRow.id)}`;
    title.textContent = documentRow.perihal || "Tanpa perihal";
    row.insertCell().append(title);
    row.insertCell().textContent = documentRow.no_surat || documentRow.no_agenda || "?";
    row.insertCell().textContent = documentRow.tanggal || "?";
    row.insertCell().textContent = documentRow.klasifikasi || "Surat Keluar";
    const badge = document.createElement("span");
    badge.className = `pgdk-badge pgdk-badge--${documentRow.status === "Diajukan" ? "blue" : "gray"}`;
    badge.textContent = documentRow.status;
    row.insertCell().append(badge);
    row.insertCell().textContent = "?";
    return row;
  }));
}

async function load() {
  const version = ++requestVersion;
  const search = searchInput.value.trim();
  previousButton.disabled = true;
  nextButton.disabled = true;
  pageLabel.textContent = "";
  showing.textContent = "";
  tableMessage("Memuat dokumen...");
  for (const filter of filters) {
    filter.classList.toggle("is-active", filter.dataset.status === status);
  }
  try {
    const result = await window.EOfficeAPI.getDokumenSaya({ page, status, search });
    if (version !== requestVersion) return;
    if (result?.status !== true || !Array.isArray(result.data) || !result.pagination) {
      throw new Error(result?.message || "Format daftar dokumen tidak valid.");
    }
    const pagination = result.pagination;
    lastPage = Math.max(1, Number(pagination.last_page) || 1);
    page = Number(pagination.current_page) || 1;
    renderRows(result.data);
    previousButton.disabled = page <= 1;
    nextButton.disabled = page >= lastPage;
    pageLabel.textContent = `Halaman ${page} dari ${lastPage}`;
    showing.textContent = `${pagination.total} dokumen`;
    saveListState(stateKey, { currentStatus: status, page, search });
  } catch (error) {
    if (version === requestVersion) tableMessage(error.message || "Gagal memuat dokumen.");
  }
}

for (const filter of filters) {
  filter.addEventListener("click", () => {
    clearTimeout(searchTimer);
    status = filter.dataset.status;
    page = 1;
    load();
  });
}
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  requestVersion++;
  page = 1;
  searchTimer = setTimeout(load, 250);
});
previousButton.addEventListener("click", () => {
  if (page > 1) { page--; load(); }
});
nextButton.addEventListener("click", () => {
  if (page < lastPage) { page++; load(); }
});
document.getElementById("btn-buat").addEventListener("click", () => {
  location.href = "buat-surat.html";
});
load();
