/* ============================================
   LAPORAN PATROLI (PEGAWAI/PETUGAS) — E-Office
   Form HP: tanggal, resort, catatan, foto.
   Foto dikompres ke dataURL (mock) atau File
   (LIVE multipart). Riwayat + lightbox.
   ============================================ */

import { showToast } from "../components/toast.js";
import { tambahNotif } from "../utils/notif-mock.js";

const MAX_FOTO = 5;

/* ===== STATE FOTO ===== */
/* item: { file: File, url: dataURL/objectURL } */
let fotoList = [];

/* ===== AMBIL & KOMPRES FOTO (canvas -> jpeg dataURL) ===== */
function kompresFoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maks = 900; // sisi terpanjang
        const skala = Math.min(1, maks / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * skala);
        canvas.height = Math.round(img.height * skala);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => resolve(null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function renderFoto() {
  const grid = document.getElementById("pt-foto-grid");
  grid.innerHTML = fotoList
    .map(
      (f, i) => `
      <div class="pt-foto-item">
        <img src="${f.url}" alt="Foto ${i + 1}" />
        <button type="button" class="pt-foto-remove" data-hapus="${i}" title="Hapus foto" aria-label="Hapus foto ${i + 1}">&times;</button>
      </div>`
    )
    .join("");
  document.getElementById("pt-foto-count").textContent =
    fotoList.length ? `${fotoList.length} foto terlampir (maks. ${MAX_FOTO})` : "";
}

async function tambahFoto(fileList) {
  for (const file of Array.from(fileList)) {
    if (fotoList.length >= MAX_FOTO) {
      showToast(`Maksimal ${MAX_FOTO} foto per laporan`);
      break;
    }
    if (!file.type.startsWith("image/")) {
      showToast(`${file.name} bukan berkas gambar`);
      continue;
    }
    const url = await kompresFoto(file);
    if (url) fotoList.push({ file, url });
  }
  renderFoto();
}

document.getElementById("pt-dropzone").addEventListener("click", () => {
  document.getElementById("pt-foto").click();
});
document.getElementById("pt-dropzone").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") document.getElementById("pt-foto").click();
});
document.getElementById("pt-foto").addEventListener("change", async (e) => {
  await tambahFoto(e.target.files);
  e.target.value = "";
});
["dragenter", "dragover"].forEach((ev) =>
  document.getElementById("pt-dropzone").addEventListener(ev, (e) => {
    e.preventDefault();
    document.getElementById("pt-dropzone").classList.add("is-over");
  })
);
["dragleave", "drop"].forEach((ev) =>
  document.getElementById("pt-dropzone").addEventListener(ev, (e) => {
    e.preventDefault();
    document.getElementById("pt-dropzone").classList.remove("is-over");
  })
);
document.getElementById("pt-dropzone").addEventListener("drop", async (e) => {
  await tambahFoto(e.dataTransfer.files);
});
document.getElementById("pt-foto-grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-hapus]");
  if (!btn) return;
  fotoList.splice(Number(btn.dataset.hapus), 1);
  renderFoto();
});

/* ===== LIGHTBOX ===== */
function bukaLightbox(src) {
  document.getElementById("pt-lightbox-img").src = src;
  document.getElementById("pt-lightbox").hidden = false;
}
document.getElementById("pt-lightbox").addEventListener("click", (e) => {
  if (e.target.id !== "pt-lightbox-img") e.currentTarget.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.getElementById("pt-lightbox").hidden = true;
});

/* ===== VALIDASI ===== */
function setError(id, show) {
  document.getElementById("wrap-" + id).classList.toggle("is-error", show);
  document.getElementById(id + "-error").hidden = !show;
}
["tanggal", "resort"].forEach((id) => {
  document.getElementById("pt-" + id).addEventListener("change", () => setError(id, false));
});
document.getElementById("pt-catatan").addEventListener("input", () => setError("catatan", false));

/* ===== RIWAYAT ===== */
let riwayat = [];

async function muatRiwayat() {
  const tbody = document.getElementById("pt-tbody");
  tbody.innerHTML = `<tr><td colspan="5" class="pt-empty">Memuat riwayat...</td></tr>`;

  try {
    const semua = await EOfficeAPI.getLaporanPatroli();
    // LIVE: server sudah memfilter milik sendiri; MOCK: filter petugas sesi
    riwayat = window.EOfficeAPI && EOfficeAPI.config.LIVE
      ? semua
      : semua.filter((l) => l.petugas === petugasSaya());
  } catch (e) {
    riwayat = [];
    tbody.innerHTML = `<tr><td colspan="5" class="pt-empty">Gagal memuat riwayat. Periksa koneksi lalu muat ulang.</td></tr>`;
    return;
  }

  if (!riwayat.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="pt-empty">Belum ada laporan patroli. Kirim laporan pertama Anda.</td></tr>`;
    return;
  }

  tbody.innerHTML = riwayat
    .map((l) => {
      const tgl = new Date(l.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      const fotoBadge = l.foto && l.foto.length
        ? `<span class="pt-foto-mini" data-galeri="${l.id}">&#128247; ${l.foto.length} foto</span>`
        : '<span class="pt-sub">—</span>';
      const statusTone = l.status === "Direview" ? "green" : "blue";
      return `
        <tr>
          <td>${tgl}</td>
          <td><strong>${l.resort}</strong></td>
          <td>${l.catatan.length > 60 ? l.catatan.slice(0, 60) + "…" : l.catatan}</td>
          <td>${fotoBadge}</td>
          <td><span class="pt-badge pt-badge--${statusTone}">${l.status}</span></td>
        </tr>`;
    })
    .join("");
}

/* Klik badge foto -> galeri lightbox sederhana */
document.getElementById("pt-tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-galeri]");
  if (!btn) return;
  const l = riwayat.find((x) => String(x.id) === btn.dataset.galeri);
  if (l && l.foto && l.foto.length) bukaLightbox(l.foto[0]);
});

/* ===== PETUGAS DARI SESI (untuk info & filter mock) ===== */
function petugasSaya() {
  try {
    const s = JSON.parse(sessionStorage.getItem("eoffice_session") || localStorage.getItem("eoffice_session") || "null");
    return (s && s.userId) || "Petugas";
  } catch (e) {
    return "Petugas";
  }
}

/* ===== SUBMIT ===== */
document.getElementById("pt-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const tanggal = document.getElementById("pt-tanggal").value;
  const resort = document.getElementById("pt-resort").value;
  const catatan = document.getElementById("pt-catatan").value.trim();

  let valid = true;
  if (!tanggal) { setError("tanggal", true); valid = false; }
  if (!resort) { setError("resort", true); valid = false; }
  if (!catatan) { setError("catatan", true); valid = false; }
  if (!valid) return;

  const btn = document.getElementById("pt-submit");
  btn.disabled = true;
  btn.textContent = "Mengirim...";

  try {
    const live = window.EOfficeAPI && EOfficeAPI.config.LIVE;
    await EOfficeAPI.createLaporanPatroli({
      tanggal,
      resort,
      catatan,
      foto: live ? fotoList.map((f) => f.file) : fotoList.map((f) => f.url)
    });

    showToast("Laporan patroli terkirim");

    // Pemicu notif: KS diberi tahu ada laporan patroli baru (mock)
    tambahNotif("ks", {
      kategori: "Patroli",
      judul: "Laporan patroli baru",
      teks: `${petugasSaya()} mengirim laporan patroli Resort ${resort} (${fotoList.length} foto).`,
      meta: `Tanggal patroli: ${new Date(tanggal).toLocaleDateString("id-ID")}`,
      badges: [{ text: "PATROLI", tone: "green" }],
      aksi: { label: "Tinjau", href: "../kepala-seksi/patroli.html", style: "green" }
    });

    document.getElementById("pt-form").reset();
    fotoList = [];
    renderFoto();
    ["tanggal", "resort", "catatan"].forEach((id) => setError(id, false));
    muatRiwayat();
  } catch (err) {
    showToast((err && err.message) || "Gagal mengirim laporan. Periksa koneksi lalu coba lagi.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Kirim Laporan Patroli";
  }
});

/* ===== INIT ===== */
document.getElementById("pt-tanggal").value = new Date().toISOString().slice(0, 10);
muatRiwayat();
