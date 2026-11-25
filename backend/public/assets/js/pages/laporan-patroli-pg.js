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
  const input = document.getElementById("pt-" + id);
  const error = document.getElementById("pt-" + id + "-error");

  if (input) {
    input.classList.toggle("pt-invalid", show);
    input.setAttribute("aria-invalid", String(show));
  }

  if (error) {
    error.hidden = !show;
  }
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

/* Klik badge foto -> ambil foto privat dan tampilkan lightbox */
let urlFotoRiwayat = null;
let sedangMemuatFoto = false;

function bersihkanUrlFotoRiwayat() {
  if (urlFotoRiwayat) {
    URL.revokeObjectURL(urlFotoRiwayat);
    urlFotoRiwayat = null;
  }
}

document.getElementById("pt-tbody").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-galeri]");
  if (!btn || sedangMemuatFoto) return;

  const laporan = riwayat.find(
    (item) => String(item.id) === btn.dataset.galeri
  );

  if (!laporan || !laporan.foto || !laporan.foto.length) return;

  const live = window.EOfficeAPI && EOfficeAPI.config.LIVE;

  if (!live) {
    bukaLightbox(laporan.foto[0]);
    return;
  }

  sedangMemuatFoto = true;

  try {
    const blob = await EOfficeAPI.getFotoPatroli(laporan.foto[0]);
    const urlBaru = URL.createObjectURL(blob);

    bersihkanUrlFotoRiwayat();
    urlFotoRiwayat = urlBaru;

    bukaLightbox(urlFotoRiwayat);
  } catch (error) {
    console.error("Gagal menampilkan foto patroli:", error);
    showToast(error.message || "Gagal membuka foto patroli.");
  } finally {
    sedangMemuatFoto = false;
  }
});

function tutupFotoRiwayat() {
  const lightbox = document.getElementById("pt-lightbox");

  if (lightbox.hidden) {
    document.getElementById("pt-lightbox-img").removeAttribute("src");
    bersihkanUrlFotoRiwayat();
  }
}

document.getElementById("pt-lightbox")
  .addEventListener("click", () => {
    setTimeout(tutupFotoRiwayat, 0);
  });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    setTimeout(tutupFotoRiwayat, 0);
  }
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
let laporanPending = null;

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
  const live = window.EOfficeAPI && EOfficeAPI.config.LIVE;

  btn.disabled = true;
  btn.textContent = "Mengirim...";

  try {
    if (!live) {
      await EOfficeAPI.createLaporanPatroli({
        tanggal,
        resort,
        catatan,
        foto: fotoList.map(f => f.url)
      });
    } else {
      if (!laporanPending) {
        const hasil = await EOfficeAPI.createLaporanPatroli({
          tanggal,
          resort,
          catatan,
          lokasi: resort
        });

        const laporanId = Number(hasil?.data?.id);

        if (!Number.isInteger(laporanId) || laporanId < 1) {
          throw new Error("Laporan tersimpan tetapi ID tidak ditemukan. Periksa riwayat sebelum mencoba lagi.");
        }

        laporanPending = {
          id: laporanId,
          tanggal,
          resort,
          catatan,
          sisaFoto: fotoList.map(f => f.file)
        };
      } else if (
        laporanPending.tanggal !== tanggal ||
        laporanPending.resort !== resort ||
        laporanPending.catatan !== catatan
      ) {
        throw new Error("Selesaikan upload laporan sebelumnya sebelum mengubah formulir.");
      }

      while (laporanPending.sisaFoto.length > 0) {
        const file = laporanPending.sisaFoto[0];
        await EOfficeAPI.uploadFotoPatroli(laporanPending.id, file);
        laporanPending.sisaFoto.shift();
      }

      laporanPending = null;
    }

    showToast("Laporan patroli berhasil dikirim.");

    document.getElementById("pt-form").reset();
    fotoList = [];
    renderFoto();
    ["tanggal", "resort", "catatan"].forEach(id => setError(id, false));

    if (live) {
      await muatResortPatroli();
    }

    await muatRiwayat();
  } catch (err) {
    if (laporanPending) {
      showToast(
        "Laporan sudah tersimpan (ID " + laporanPending.id +
        "). Upload foto belum selesai. Klik Kirim lagi untuk melanjutkan."
      );
    } else {
      showToast(
        (err && err.message) || "Gagal mengirim laporan."
      );
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "Kirim Laporan Patroli";
  }
});

/* ===== RESORT DARI BACKEND ===== */
async function muatResortPatroli() {
  const select = document.getElementById("pt-resort");

  if (!window.EOfficeAPI || !EOfficeAPI.config.LIVE) {
    return;
  }

  select.disabled = true;
  select.replaceChildren(new Option("Memuat resort...", ""));

  try {
    const response = await EOfficeAPI.getResortsPublic();
    const resorts = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    const profil = await EOfficeAPI.getProfil();
    const user = profil?.data ?? profil;
    const role = user?.role;
    const resortId = Number(user?.resort_id);

    select.replaceChildren(
      new Option("Pilih wilayah patroli...", "")
    );

    const pilihan = role === "staf"
      ? resorts.filter(r => Number(r.id) === resortId)
      : resorts;

    for (const resort of pilihan) {
      select.add(
        new Option(resort.nama, String(resort.id))
      );
    }

    if (role === "staf" && pilihan.length === 1) {
      select.value = String(resortId);
    }

    if (!pilihan.length) {
      showToast("Tidak ada resort yang tersedia untuk akun ini.");
    }
  } catch (error) {
    select.replaceChildren(
      new Option("Gagal memuat resort", "")
    );
    showToast("Gagal memuat daftar resort. Muat ulang halaman.");
  } finally {
    select.disabled = false;
  }
}

/* ===== INIT ===== */
muatResortPatroli();
document.getElementById("pt-tanggal").value = new Date().toISOString().slice(0, 10);
muatRiwayat();
