/* ============================================
   DISPOSISI SAYA (PEGAWAI) — E-Office SKSDA
   disposisiPgData + tab status, filter
   prioritas, search, baris klikable
   ============================================ */

import { disposisiPgData } from "../data/disposisi-pegawai.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { saveListState, loadListState } from "../utils/state.js";

const STATE_KEY = "disposisi-saya-pg";

/* ===== STATE ===== */
let currentStatus = "baru";
let prioritasFilter = "all";
let query = "";

/* ===== PERSIST STATE LIST ===== */
function persistState() {
  saveListState(STATE_KEY, { currentStatus, prioritasFilter, query });
}

function restoreState() {
  const s = loadListState(STATE_KEY);
  if (!s) return;
  currentStatus = s.currentStatus ?? "baru";
  prioritasFilter = s.prioritasFilter ?? "all";
  query = s.query ?? "";
  document.getElementById("pgd-prioritas").value = prioritasFilter;
  document.getElementById("pgd-search").value = query;
  document.querySelectorAll(".pgd-tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.status === currentStatus)
  );
}

/* ===== BADGE COUNT TAB "Baru" (dihitung dari data) ===== */
function renderTabCount() {
  const count = disposisiPgData.filter((d) => d.status === "baru").length;
  const el = document.querySelector("[data-count='baru']");
  if (el) el.textContent = count;
}

/* ===== FILTER ===== */
function getFiltered() {
  const q = query.trim().toLowerCase();
  return disposisiPgData.filter((d) => {
    const byStatus = d.status === currentStatus;
    const byPrioritas = prioritasFilter === "all" || d.prioritas.text === prioritasFilter;
    const bySearch =
      !q ||
      [d.nomor, d.suratNomor, d.suratPerihal, d.instruksi].some((f) => f.toLowerCase().includes(q));
    return byStatus && byPrioritas && bySearch;
  });
}

/* ===== RENDER TABEL ===== */
const STATUS_LABEL = { baru: "baru", diterima: "diterima", berjalan: "berjalan", selesai: "selesai" };

function renderTable() {
  const tbody = document.getElementById("pgd-tbody");
  const rows = getFiltered();

  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="pgd-empty"><td colspan="5">Tidak ada disposisi yang cocok dengan filter.</td></tr>`;
  } else {
    tbody.innerHTML = rows
      .map(
        (d) => `
        <tr data-id="${d.id}" title="Klik untuk membuka detail disposisi">
          <td><span class="pgd-nomor">${d.nomor}</span></td>
          <td>
            <span class="pgd-surat-nomor">${d.suratNomor}</span>
            <span class="pgd-surat-perihal">${d.suratPerihal}</span>
          </td>
          <td><span class="pgd-instruksi">${d.instruksi}</span></td>
          <td><span class="pgd-prio pgd-prio--${d.prioritas.tone}">&bull; ${d.prioritas.text}</span></td>
          <td${d.batas.red ? ' class="pgd-batas-red"' : ""}>
            <span class="pgd-batas-1">${d.batas.line1}</span>
            <span class="pgd-batas-2">${d.batas.line2}</span>
          </td>
        </tr>`
      )
      .join("");
  }

  /* Footer */
  document.getElementById("pgd-showing").textContent =
    `Menampilkan 1-${rows.length} dari ${rows.length} data ${STATUS_LABEL[currentStatus]}`;
}

/* ===== EVENT: tab status ===== */
document.getElementById("pgd-tabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".pgd-tab");
  if (!tab) return;
  document.querySelectorAll(".pgd-tab").forEach((t) => t.classList.remove("is-active"));
  tab.classList.add("is-active");
  currentStatus = tab.dataset.status;
  renderTable();
});

/* ===== EVENT: filter prioritas ===== */
document.getElementById("pgd-prioritas").addEventListener("change", (event) => {
  prioritasFilter = event.target.value;
  renderTable();
});

/* ===== EVENT: search ===== */
document.getElementById("pgd-search").addEventListener("input", (event) => {
  query = event.target.value;
  renderTable();
});

/* ===== EVENT: klik baris → detail disposisi ===== */
document.getElementById("pgd-tbody").addEventListener("click", (event) => {
  const row = event.target.closest("tr[data-id]");
  if (!row) return;
  window.location.href = `detail-disposisi.html?id=${row.dataset.id}`;
});

/* ===== EVENT: + Lapor Tindak Lanjut → modal form ===== */
document.getElementById("btn-lapor").addEventListener("click", () => {
  const belumSelesai = disposisiPgData.filter((d) => d.status === "baru" || d.status === "diterima");
  if (belumSelesai.length === 0) {
    showToast("Tidak ada disposisi aktif untuk dilaporkan");
    return;
  }

  openModal({
    title: "Lapor Tindak Lanjut",
    desc: "Pilih disposisi dan tuliskan laporan progres Anda:",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Disposisi</strong>
          <select id="lapor-id" style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none">
            ${belumSelesai.map((d) => `<option value="${d.id}">${d.nomor} — ${d.suratPerihal}</option>`).join("")}
          </select>
        </div>
        <div class="app-modal-option" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px">
          <strong style="font-size:12.5px;color:#374151">Laporan Tindak Lanjut *</strong>
          <textarea id="lapor-text" rows="4" placeholder="Tuliskan progres atau hasil tindak lanjut..." style="width:100%;padding:10px 12px;font:inherit;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;outline:none;resize:vertical"></textarea>
          <p id="lapor-error" style="display:none;margin:0;font-size:12px;color:#DC2626"></p>
        </div>
      </div>`,
    confirmLabel: "Kirim Laporan",
    cancelLabel: "Batal",
    onConfirm: () => {
      const id = Number(document.getElementById("lapor-id").value);
      const text = document.getElementById("lapor-text").value.trim();
      const errorEl = document.getElementById("lapor-error");

      if (text === "") {
        errorEl.textContent = "Laporan wajib diisi";
        errorEl.style.display = "block";
        return false;
      }

      const now = new Date();
      const waktu = `Hari ini, ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
      const item = disposisiPgData.find((d) => d.id === id);
      if (item) {
        item.laporan = { text, waktu };
        item.status = "berjalan";
      }

      renderTable();
      showToast("Laporan tindak lanjut dikirim");
    }
  });
});

/* ===== Inisialisasi ===== */
renderTabCount();
restoreState();
renderTable();
