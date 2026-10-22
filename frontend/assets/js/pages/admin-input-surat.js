/* ============================================
   INPUT SURAT (ADMIN) — E-Office SKSDA
   Mock data tabel + search client-side +
   navigasi halaman detail (placeholder)
   ============================================ */

/* ===== MOCK DATA: surat terakhir diinput (diekspor untuk halaman detail) ===== */
export const SURAT_TERAKHIR = [
  {
    id: 1,
    nomor: "S.123/SKSDA-JT/TU/09/2026",
    jenis: "MASUK",
    pihak: "Kementerian Lingkungan Hidup",
    perihal: "Undangan Rapat Koordinasi",
    tanggal: "04 Sep 2026",
    status: "Terdaftar"
  },
  {
    id: 2,
    nomor: "B.045/SKSDA-JT/09/2026",
    jenis: "KELUAR",
    pihak: "Dinas Lingkungan Hidup Jawa Tengah",
    perihal: "Permohonan Koordinasi",
    tanggal: "03 Sep 2026",
    status: "Terdaftar"
  },
  {
    id: 3,
    nomor: "S.098/SKSDA-JT/TU/09/2026",
    jenis: "MASUK",
    pihak: "Balai Taman Nasional",
    perihal: "Laporan Kegiatan",
    tanggal: "02 Sep 2026",
    status: "Terdaftar"
  }
];

/* Halaman detail (dibuat khusus untuk admin) */
const DETAIL_URL = "detail-surat-admin.html";

/* ===== RENDER: baris tabel ===== */
function renderTable(data) {
  const tbody = document.getElementById("surat-tbody");

  if (data.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Tidak ada surat yang cocok dengan pencarian.</td></tr>`;
  } else {
    tbody.innerHTML = data
      .map(
        (s) => `
        <tr>
          <td><span class="cell-nomor">${s.nomor}</span></td>
          <td><span class="badge badge-jenis--${s.jenis}">${s.jenis}</span></td>
          <td><span class="cell-pihak">${s.pihak}</span></td>
          <td><span class="cell-perihal">${s.perihal}</span></td>
          <td><span class="cell-tanggal">${s.tanggal}</span></td>
          <td><span class="badge badge-status--registered">${s.status}</span></td>
          <td class="th-actions">
            <button type="button" class="detail-btn" data-id="${s.id}">Lihat Detail</button>
          </td>
        </tr>`
      )
      .join("");
  }

  document.getElementById("table-count").textContent = `Menampilkan ${data.length} surat terbaru`;
}

/* ===== SEARCH: filter client-side (nomor / pengirim / perihal) ===== */
document.getElementById("table-search").addEventListener("input", (event) => {
  const q = event.target.value.trim().toLowerCase();
  const filtered = SURAT_TERAKHIR.filter((s) =>
    [s.nomor, s.pihak, s.perihal].some((f) => f.toLowerCase().includes(q))
  );
  renderTable(filtered);
});

/* ===== AKSI: Lihat Detail → halaman detail (placeholder) ===== */
document.getElementById("surat-tbody").addEventListener("click", (event) => {
  const btn = event.target.closest(".detail-btn");
  if (!btn) return;
  const surat = SURAT_TERAKHIR.find((s) => String(s.id) === btn.dataset.id);
  window.location.href = `${DETAIL_URL}?id=${surat.id}`;
});

/* ===== Inisialisasi ===== */
renderTable(SURAT_TERAKHIR);
