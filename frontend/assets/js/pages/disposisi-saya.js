/* ============================================
   DISPOSISI SAYA (PEGAWAI) — E-Office SKSDA
   disposisiPgData + tab status, filter
   prioritas, search, baris klikable
   ============================================ */

import { disposisiPgData as DISPOSISI_PG_MOCK } from "../data/disposisi-pegawai.js";
import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";
import { saveListState, loadListState } from "../utils/state.js";

/* ===== DATA: diisi loadData() — API saat LIVE, mock saat belum ===== */
let disposisiPgData = [];

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const response = await EOfficeAPI.request(
      "GET",
      "/disposisi?per_page=50"
    );

    if (!response.status || !Array.isArray(response.data)) {
      throw new Error(
        response.message || "Format respons disposisi tidak sesuai."
      );
    }

    const statusMap = {
      menunggu: "baru",
      dalam_proses: "berjalan",
      dikembalikan: "diterima",
      selesai: "selesai"
    };

    return response.data.map((d) => {
      const deadline = d.deadline
        ? String(d.deadline).slice(0, 10)
        : "";

      const tanggal = deadline
        ? new Date(deadline + "T00:00:00")
        : null;

      const terlambat =
        tanggal &&
        !Number.isNaN(tanggal.getTime()) &&
        tanggal.getTime() < new Date().setHours(0, 0, 0, 0) &&
        d.status !== "selesai";

      return {
        id: Number(d.id),
        nomor: `DSP-${d.id}`,
        suratNomor:
          d.no_surat ||
          d.no_agenda ||
          `Surat #${d.surat_masuk_id}`,
        suratPerihal: d.perihal || "-",
        instruksi: d.catatan || "-",
        status: statusMap[d.status] || "baru",
        statusBackend: d.status,
        prioritas: {
          text: "Tidak ditetapkan",
          tone: "gray"
        },
        batas: {
          line1: deadline || "Tanpa deadline",
          line2: terlambat ? "Terlambat" : "",
          red: Boolean(terlambat)
        },
        laporan: d.hasil_tindak_lanjut
          ? {
              text: d.hasil_tindak_lanjut,
              waktu: d.updated_at || "-"
            }
          : null
      };
    });
  }

  return DISPOSISI_PG_MOCK;
}

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

/* ===== LAPOR TINDAK LANJUT ===== */
document.getElementById("btn-lapor").addEventListener("click", () => {
  const live = Boolean(window.EOfficeAPI && EOfficeAPI.config.LIVE);

  const aktif = disposisiPgData.filter((d) =>
    live
      ? d.statusBackend !== "selesai"
      : d.status !== "selesai"
  );

  if (aktif.length === 0) {
    showToast("Tidak ada disposisi aktif untuk dilaporkan.");
    return;
  }

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  let sedangKirim = false;

  openModal({
    title: "Lapor Tindak Lanjut",
    desc: "Pilih disposisi dan tuliskan laporan progres Anda.",
    html: `
      <div class="app-modal-list">
        <div class="app-modal-option" style="flex-direction:column;align-items:stretch;gap:6px">
          <strong>Disposisi</strong>
          <select id="lapor-id" style="width:100%;padding:10px;border:1px solid #E5E7EB;border-radius:8px">
            ${aktif.map((d) => `
              <option value="${Number(d.id)}">
                ${escapeHtml(d.nomor)} - ${escapeHtml(d.suratPerihal)}
              </option>
            `).join("")}
          </select>
        </div>
        <div class="app-modal-option" style="flex-direction:column;align-items:stretch;gap:6px">
          <strong>Laporan Tindak Lanjut *</strong>
          <textarea id="lapor-text" rows="4"
            placeholder="Tuliskan progres atau hasil tindak lanjut..."
            style="width:100%;padding:10px;border:1px solid #E5E7EB;border-radius:8px"></textarea>
          <p id="lapor-error" style="display:none;color:#DC2626;font-size:12px"></p>
        </div>
      </div>`,
    confirmLabel: "Kirim Laporan",
    cancelLabel: "Batal",

    onConfirm: () => {
      if (sedangKirim) return false;

      const id = Number(document.getElementById("lapor-id")?.value);
      const hasil = document.getElementById("lapor-text")?.value.trim() || "";
      const errorEl = document.getElementById("lapor-error");

      if (!hasil) {
        errorEl.textContent = "Laporan wajib diisi.";
        errorEl.style.display = "block";
        return false;
      }

      if (!aktif.some((d) => Number(d.id) === id)) {
        errorEl.textContent = "Disposisi tidak valid.";
        errorEl.style.display = "block";
        return false;
      }

      if (!live) {
        const item = disposisiPgData.find((d) => Number(d.id) === id);
        if (item) {
          item.laporan = {
            text: hasil,
            waktu: new Date().toLocaleString("id-ID")
          };
          item.status = "berjalan";
        }

        renderTabCount();
        renderTable();
        showToast("Laporan tindak lanjut disimpan dalam mode demo.");
        return;
      }

      sedangKirim = true;

      const confirmBtn = document.querySelector(
        ".app-modal-backdrop [data-modal-confirm]"
      );

      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Mengirim...";
      }

      errorEl.style.display = "none";

      // Modal tetap terbuka sampai request selesai.
      void (async () => {
        let tersimpan = false;

        try {
          const response = await EOfficeAPI.tindakLanjutDisposisi(
            id,
            hasil
          );

          if (!response.status) {
            throw new Error(
              response.message || "Backend menolak laporan."
            );
          }

          tersimpan = true;

          disposisiPgData = await loadData();

          currentStatus = "berjalan";

          document.querySelectorAll(".pgd-tab").forEach((tab) => {
            tab.classList.toggle(
              "is-active",
              tab.dataset.status === currentStatus
            );
          });

          renderTabCount();
          renderTable();

          document.querySelector(
            ".app-modal-backdrop [data-modal-cancel]"
          )?.click();

          showToast("Laporan tindak lanjut berhasil tersimpan.");
        } catch (error) {
          if (tersimpan) {
            document.querySelector(
              ".app-modal-backdrop [data-modal-cancel]"
            )?.click();

            showToast(
              "Laporan tersimpan, tetapi daftar gagal diperbarui. Muat ulang halaman."
            );
          } else {
            errorEl.textContent =
              error.message || "Gagal mengirim laporan.";
            errorEl.style.display = "block";
          }
        } finally {
          sedangKirim = false;

          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Kirim Laporan";
          }
        }
      })();

      // Wajib false: modal.js tidak mendukung Promise pada onConfirm.
      return false;
    }
  });
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("pgd-tbody");
  tbody.innerHTML = `<tr class="pgd-empty"><td colspan="5">Memuat data disposisi...</td></tr>`;

  try {
    disposisiPgData = await loadData();
  } catch (e) {
    disposisiPgData = [];
    tbody.innerHTML = `<tr class="pgd-empty"><td colspan="5">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    const tabRevisi = document.querySelector(
      '.pgd-tab[data-status="diterima"]'
    );
    if (tabRevisi) {
      tabRevisi.title =
        "Tab ini menampilkan disposisi yang dikembalikan untuk revisi.";
    }
  }

  renderTabCount();
  restoreState();
  renderTable();
}

init();
