const DETAIL_URL = "detail-surat-admin.html";

let suratTerakhir = [];

async function loadData() {
  if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
    return EOfficeAPI.getSuratTerbaru();
  }
  throw new Error("Koneksi API belum aktif.");
}

/* ===== RENDER: baris tabel ===== */
function renderTable(data) {
  const tbody = document.getElementById("surat-tbody");

  if (data.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Tidak ada surat yang cocok dengan pencarian.</td></tr>`;
  } else {
    tbody.replaceChildren(...data.map((surat) => {
      const row = document.createElement("tr");
      const columns = [
        [surat.nomor, "cell-nomor"],
        [surat.jenis, `badge badge-jenis--${surat.jenis}`],
        [surat.pihak, "cell-pihak"],
        [surat.perihal, "cell-perihal"],
        [surat.tanggal, "cell-tanggal"],
        [surat.status, "badge badge-status--registered"],
      ];
      for (const [value, className] of columns) {
        const span = document.createElement("span");
        span.className = className;
        span.textContent = value;
        row.insertCell().append(span);
      }
      const action = row.insertCell();
      action.className = "th-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "detail-btn";
      button.dataset.id = surat.id;
      button.dataset.jenis = surat.jenis;
      button.textContent = "Lihat Detail";
      action.append(button);
      return row;
    }));
  }

  document.getElementById("table-count").textContent = `Menampilkan ${data.length} surat terbaru`;
}

/* ===== SEARCH: filter client-side (nomor / pengirim / perihal) ===== */
document.getElementById("table-search")?.addEventListener("input", (event) => {
  const q = event.target.value.trim().toLowerCase();
  const filtered = suratTerakhir.filter((s) =>
    [s.nomor, s.pihak, s.perihal].some((f) => String(f ?? "").toLowerCase().includes(q))
  );
  renderTable(filtered);
});

/* ===== AKSI: Lihat Detail → halaman detail (placeholder) ===== */
document.getElementById("surat-tbody")?.addEventListener("click", (event) => {
  const btn = event.target.closest(".detail-btn");
  if (!btn) return;
  const surat = suratTerakhir.find(
  (s) =>
    String(s.id) === btn.dataset.id &&
    String(s.jenis).toUpperCase() === btn.dataset.jenis
);

if (!surat) return;
  const params = new URLSearchParams({
  id: String(surat.id),
  jenis: String(surat.jenis)
});

window.location.href = `${DETAIL_URL}?${params.toString()}`;
});

/* ===== Inisialisasi: muat data dulu, baru render ===== */
async function init() {
  const tbody = document.getElementById("surat-tbody");

  // Halaman detail tidak memiliki tabel surat.
  if (!tbody) return;

  tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Memuat data surat...</td></tr>`;

  try {
    suratTerakhir = await loadData();
  } catch (e) {
    suratTerakhir = [];
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Gagal memuat data. Periksa koneksi ke server, lalu muat ulang halaman.</td></tr>`;
    return;
  }

  renderTable(suratTerakhir);
}

init();
