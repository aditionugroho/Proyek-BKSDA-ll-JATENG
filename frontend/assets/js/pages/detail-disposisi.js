
/* ============================================
   DETAIL DISPOSISI PEGAWAI
   E-OFFICE SKSDA JAWA TENGAH
   LIVE API + MOCK
   ============================================ */

import {
  disposisiPgData as DISPOSISI_PG_MOCK,
  DISPOSISI_DETAIL_PG
} from "../data/disposisi-pegawai.js";

import { showToast } from "../components/toast.js";
import { openModal } from "../components/modal.js";

let disposisi = null;
let STATUS_KEY = "";
let sedangMemproses = false;

const LIVE = () =>
  Boolean(window.EOfficeAPI && EOfficeAPI.config.LIVE);

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ============================================
   LOAD DETAIL
   ============================================ */

async function loadDetail(id) {
  if (LIVE()) {
    const response = await EOfficeAPI.getDisposisiSayaDetail(id);

    if (!response?.status || !response.data) {
      throw new Error(
        response?.message || "Detail disposisi tidak ditemukan."
      );
    }

    const d = response.data;

    return {
      id: Number(d.id),
      suratMasukId: Number(d.surat_masuk_id || 0),
      judul: d.perihal || `Disposisi #${d.id}`,
      pemberi: d.dari_user_name || "Kepala Seksi",
      tenggat: d.deadline || "Tidak ditentukan",
      instruksi: d.catatan || "-",
      status: d.status || "menunggu",

      surat: {
        nomor: d.no_surat || d.no_agenda || "-",
        tanggal: d.tanggal || "-",
        pengirim: d.asal || "-",
        perihal: d.perihal || "-"
      },

      files: [],
      laporan: d.hasil_tindak_lanjut
        ? {
            text: d.hasil_tindak_lanjut,
            waktu: d.updated_at || "-"
          }
        : null
    };
  }

  const found = DISPOSISI_PG_MOCK.find(
    (d) => Number(d.id) === Number(id)
  );

  return {
    ...DISPOSISI_DETAIL_PG,
    ...(found || {}),
    id: Number(id),
    judul: found?.judul || DISPOSISI_DETAIL_PG.judul,
    pemberi: found?.pemberi || DISPOSISI_DETAIL_PG.pemberi,
    tenggat: found?.tenggat || DISPOSISI_DETAIL_PG.tenggat,
    instruksi:
      found?.instruksiFull || DISPOSISI_DETAIL_PG.instruksi,
    surat: found?.surat || DISPOSISI_DETAIL_PG.surat,
    files: found?.files || DISPOSISI_DETAIL_PG.files
  };
}

async function refreshDetail() {
  if (LIVE()) {
    disposisi = await loadDetail(disposisi.id);
  }

  renderHeader();
  renderSurat();
  await renderLampiranLive();
  renderStatus();
  renderLaporan();
  renderActionPanel();
  await renderTimeline();
}

/* ============================================
   HEADER
   ============================================ */

function renderHeader() {
  $("pgdd-judul").textContent = disposisi.judul;
  $("pgdd-pemberi").textContent =
    `Disposisi dari: ${disposisi.pemberi}`;

  $("pgdd-tenggat-text").textContent = disposisi.tenggat;
  $("pgdd-instruksi").textContent = disposisi.instruksi;
}

/* ============================================
   LAPORAN TINDAK LANJUT
   ============================================ */

function renderLaporan() {
  const lama = $("pgdd-laporan");

  if (lama) lama.remove();

  if (!disposisi?.laporan?.text) return;

  const card = document.querySelector(
    ".pgdd-left .pgdd-card--instruksi"
  );

  if (!card) return;

  const box = document.createElement("div");
  box.className = "pgdd-card";
  box.id = "pgdd-laporan";

  box.style.borderLeft = "4px solid #10B981";

  box.innerHTML = `
    <div class="pgdd-card-head">
      <h2 class="pgdd-card-title">Laporan Tindak Lanjut</h2>
    </div>

    <div class="pgdd-instruksi-box"
         style="background:#F0FDF4">
      ${escapeHtml(disposisi.laporan.text)}
    </div>

    <p style="margin-top:8px;font-size:11.5px;color:#9CA3AF">
      Dilaporkan: ${escapeHtml(disposisi.laporan.waktu)}
    </p>
  `;

  card.after(box);
}

/* ============================================
   DETAIL SURAT
   ============================================ */

const ICONS = {
  pdf: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8z"/></svg>',
  img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};

function renderSurat() {
  $("pgdd-surat-nomor").textContent = disposisi.surat.nomor;
  $("pgdd-surat-tanggal").textContent = disposisi.surat.tanggal;
  $("pgdd-surat-pengirim").textContent = disposisi.surat.pengirim;
  $("pgdd-surat-perihal").textContent = disposisi.surat.perihal;

  if (LIVE()) {
    $("pgdd-files").textContent = "Memeriksa lampiran surat...";
    return;
  }

  $("pgdd-files").innerHTML = (disposisi.files || [])
    .map((f, i) => `
      <div class="pgdd-file-card">
        <span class="pgdd-file-icon">
          ${ICONS[f.type] || ICONS.pdf}
        </span>

        <div class="pgdd-file-info">
          <span class="pgdd-file-name">
            ${escapeHtml(f.name)}
          </span>
          <span class="pgdd-file-size">
            ${escapeHtml(f.size)}
          </span>
        </div>

        <button type="button"
          class="pgdd-download"
          data-download="${i}">
          ${ICONS.download}
        </button>
      </div>
    `)
    .join("");
}

/* ============================================
   STATUS
   ============================================ */

function getStatusLabel(status) {
  const labels = {
    menunggu: "Menunggu",
    dalam_proses: "Sedang Dikerjakan",
    dikembalikan: "Perlu Revisi",
    menunggu_klarifikasi: "Menunggu Klarifikasi",
    selesai: "Selesai"
  };

  return labels[status] || status || "Tidak diketahui";
}

function renderStatus() {
  const badge = $("pgdd-status");
  const btn = $("btn-terima");
  const label = $("btn-terima-label");

  const status = disposisi.status || "menunggu";

  badge.textContent = getStatusLabel(status);

  badge.className =
    "pgdd-badge " +
    (status === "selesai"
      ? "pgdd-badge--green"
      : status === "dalam_proses"
      ? "pgdd-badge--blue"
      : "pgdd-badge--gray");

  const bisaTerima = status === "menunggu";

  btn.disabled = !bisaTerima || sedangMemproses;

  label.textContent = bisaTerima
    ? "Terima Disposisi"
    : getStatusLabel(status);

  $("btn-klarifikasi").disabled =
    sedangMemproses ||
    !["menunggu", "dalam_proses"].includes(status);
}

/* ============================================
   ACTION PANEL
   Dibuat dinamis agar HTML lama tetap kompatibel.
   ============================================ */

function renderActionPanel() {
  let panel = $("pgdd-action-extra");

  if (!panel) {
    panel = document.createElement("div");
    panel.id = "pgdd-action-extra";

    panel.style.cssText = `
      display:flex;
      flex-direction:column;
      gap:12px;
      margin-top:14px;
    `;

    document.querySelector(".pgdd-card--action")?.appendChild(panel);
  }

  const status = disposisi.status || "menunggu";


  // Tidak tampilkan tombol tindakan pada disposisi selesai.
  if (status === "selesai") {
    panel.innerHTML = `
      <div style="
        padding:16px;
        border-radius:10px;
        background:#ECFDF5;
        border:1px solid #A7F3D0;
        color:#065F46;
      ">
        <strong>? Disposisi Selesai</strong>
        <p style="margin:8px 0 0;font-size:13px">
          Disposisi ini telah diselesaikan.
          Hasil tindak lanjut dan riwayat aktivitas
          dapat dilihat pada halaman ini.
        </p>
      </div>
    `;
    return;
  }

  const aktif = ["dalam_proses", "dikembalikan"].includes(status);

  panel.innerHTML = `
    <button type="button"
      id="btn-tindak-lanjut"
      class="pgdd-btn pgdd-btn--outline pgdd-btn--block"
      ${!aktif || sedangMemproses ? "disabled" : ""}>
      Kirim Hasil Tindak Lanjut
    </button>

    <button type="button"
      id="btn-selesai"
      class="pgdd-btn pgdd-btn--primary pgdd-btn--block"
      ${!aktif || sedangMemproses || !disposisi.laporan?.text ? "disabled" : ""}>
      Selesaikan Disposisi
    </button>

    <p style="font-size:11px;color:#9CA3AF;margin:0">
      Penyelesaian tersedia setelah hasil tindak lanjut tersimpan.
    </p>
  `;

  $("btn-tindak-lanjut").addEventListener(
    "click",
    bukaFormTindakLanjut
  );

  $("btn-selesai").addEventListener(
    "click",
    konfirmasiSelesai
  );
}

/* ============================================
   LOADING BUTTON
   ============================================ */

function setLoading(loading) {
  sedangMemproses = loading;

  $("btn-terima").disabled = loading;
  $("btn-klarifikasi").disabled = loading;

  renderActionPanel();
}

/* ============================================
   TERIMA DISPOSISI
   ============================================ */

$("btn-terima").addEventListener("click", () => {
  if (!disposisi || disposisi.status !== "menunggu") return;

  openModal({
    title: "Terima Disposisi",
    desc: `Konfirmasi penerimaan disposisi "${disposisi.judul}"?`,
    confirmLabel: "Ya, Terima",
    cancelLabel: "Batal",

    onConfirm: async () => {
      setLoading(true);

      try {
        if (LIVE()) {
          const response =
            await EOfficeAPI.terimaDisposisi(disposisi.id);

          if (!response?.status) {
            throw new Error(
              response?.message || "Gagal menerima disposisi."
            );
          }

          await refreshDetail();
        } else {
          window.sessionStorage.setItem(STATUS_KEY, "diterima");
          disposisi.status = "dalam_proses";
          renderStatus();
          renderActionPanel();
        }

        showToast("Disposisi berhasil diterima.");
      } catch (error) {
        showToast(error.message || "Gagal menerima disposisi.");
      } finally {
        setLoading(false);
      }
    }
  });
});

/* ============================================
   MINTA KLARIFIKASI
   ============================================ */

$("btn-klarifikasi").addEventListener("click", () => {
  if (!disposisi) return;

  openModal({
    title: "Minta Klarifikasi",
    desc: "Tuliskan pertanyaan untuk Kepala Seksi.",

    html: `
      <textarea
        id="klarifikasi-text"
        rows="4"
        maxlength="2000"
        placeholder="Tuliskan alasan klarifikasi..."
        style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px">
      </textarea>
    `,

    confirmLabel: "Kirim Klarifikasi",
    cancelLabel: "Batal",

    onConfirm: async () => {
      const pertanyaan =
        $("klarifikasi-text")?.value.trim();

      if (!pertanyaan) {
        showToast("Pertanyaan klarifikasi wajib diisi.");
        return;
      }

      setLoading(true);

      try {
        if (LIVE()) {
          const response =
            await EOfficeAPI.mintaKlarifikasi(
              disposisi.id,
              pertanyaan
            );

          if (!response?.status) {
            throw new Error(
              response?.message || "Gagal mengirim klarifikasi."
            );
          }
        }

        showToast("Klarifikasi berhasil dikirim.");
      } catch (error) {
        showToast(error.message || "Gagal mengirim klarifikasi.");
      } finally {
        setLoading(false);
      }
    }
  });
});

/* ============================================
   FORM TINDAK LANJUT
   ============================================ */

function bukaFormTindakLanjut() {
  openModal({
    title: "Hasil Tindak Lanjut",
    desc: "Tuliskan hasil pekerjaan atau tindak lanjut disposisi.",

    html: `
      <textarea
        id="hasil-tindak-lanjut"
        rows="5"
        maxlength="10000"
        placeholder="Tuliskan hasil tindak lanjut..."
        style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px">
      </textarea>
    `,

    confirmLabel: "Simpan Hasil",
    cancelLabel: "Batal",

    onConfirm: async () => {
      const hasil = $("hasil-tindak-lanjut")?.value.trim();

      if (!hasil) {
        showToast("Hasil tindak lanjut wajib diisi.");
        return;
      }

      setLoading(true);

      try {
        if (LIVE()) {
          const response =
            await EOfficeAPI.tindakLanjutDisposisi(
              disposisi.id,
              hasil
            );

          if (!response?.status) {
            throw new Error(
              response?.message || "Gagal menyimpan tindak lanjut."
            );
          }

          await refreshDetail();
        } else {
          disposisi.laporan = {
            text: hasil,
            waktu: new Date().toLocaleString("id-ID")
          };

          disposisi.status = "dalam_proses";

          renderLaporan();
          renderStatus();
          renderActionPanel();
        }

        showToast("Hasil tindak lanjut berhasil disimpan.");
      } catch (error) {
        showToast(
          error.message || "Gagal menyimpan hasil tindak lanjut."
        );
      } finally {
        setLoading(false);
      }
    }
  });
}

/* ============================================
   SELESAIKAN DISPOSISI
   ============================================ */

function konfirmasiSelesai() {
  if (!disposisi?.laporan?.text) {
    showToast("Simpan hasil tindak lanjut terlebih dahulu.");
    return;
  }

  openModal({
    title: "Selesaikan Disposisi",
    desc: "Apakah kamu yakin ingin menyelesaikan disposisi ini?",
    confirmLabel: "Ya, Selesaikan",
    cancelLabel: "Batal",

    onConfirm: async () => {
      setLoading(true);

      try {
        if (LIVE()) {
          const response =
            await EOfficeAPI.selesaikanDisposisi(
              disposisi.id
            );

          if (!response?.status) {
            throw new Error(
              response?.message || "Gagal menyelesaikan disposisi."
            );
          }

          await refreshDetail();
        } else {
          disposisi.status = "selesai";
          renderStatus();
          renderActionPanel();
        }

        showToast("Disposisi berhasil diselesaikan.");
      } catch (error) {
        showToast(
          error.message || "Gagal menyelesaikan disposisi."
        );
      } finally {
        setLoading(false);
      }
    }
  });
}

/* ============================================
   DOWNLOAD MOCK
   ============================================ */

$("pgdd-files").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-download]");
  if (!btn) return;

  if (LIVE()) {
    showToast("Unduh lampiran belum tersedia pada API detail.");
    return;
  }

  const file = disposisi.files?.[Number(btn.dataset.download)];

  if (file) {
    showToast(`Mengunduh ${file.name}...`);
  }
});

/* ============================================
   RIWAYAT / TIMELINE DISPOSISI
   ============================================ */

async function renderTimeline() {
  let card = document.getElementById("pgdd-timeline");

  if (!card) {
    card = document.createElement("div");
    card.id = "pgdd-timeline";
    card.className = "pgdd-card";

    const left = document.querySelector(".pgdd-left");
    if (!left) return;

    left.appendChild(card);
  }

  card.innerHTML = `
    <div class="pgdd-card-head">
      <h2 class="pgdd-card-title">Riwayat Disposisi</h2>
    </div>
    <p style="color:#6B7280;font-size:13px">
      Memuat riwayat...
    </p>
  `;

  if (!LIVE()) {
    card.innerHTML = `
      <h2 class="pgdd-card-title">Riwayat Disposisi</h2>
      <p>Riwayat hanya tersedia dalam mode LIVE.</p>
    `;
    return;
  }

  try {
    const response = await EOfficeAPI.request(
      "GET",
      "/disposisi/" +
        encodeURIComponent(disposisi.id) +
        "/timeline"
    );

    if (!response?.status) {
      throw new Error(
        response?.message || "Gagal memuat riwayat."
      );
    }

    const timeline = response.data?.timeline || [];

    card.innerHTML = `
      <div class="pgdd-card-head">
        <h2 class="pgdd-card-title">
          Riwayat Disposisi
        </h2>
      </div>

      ${
        timeline.length === 0
          ? `<p style="color:#6B7280;font-size:13px">
               Belum ada riwayat.
             </p>`
          : timeline.map((item) => `
              <div style="
                padding:12px 0;
                border-bottom:1px solid #E5E7EB;
              ">
                <strong style="font-size:13px">
                  ${escapeHtml(
                    item.aktivitas?.replace(/_/g, " ") || "Aktivitas"
                  )}
                </strong>

                <p style="font-size:12px;color:#6B7280;margin:5px 0">
                  ${escapeHtml(item.user_name || "Pengguna")}
                  ·
                  ${escapeHtml(item.created_at || "-")}
                </p>

                ${
                  item.catatan
                    ? `<p style="font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere">
                         ${escapeHtml(item.catatan)}
                       </p>`
                    : ""
                }
              </div>
            `).join("")
      }
    `;

  } catch (error) {
    card.innerHTML = `
      <h2 class="pgdd-card-title">Riwayat Disposisi</h2>
      <p style="color:#DC2626;font-size:13px">
        ${escapeHtml(error.message)}
      </p>
    `;
  }
}


/* ============================================
   LAMPIRAN SURAT ASAL - MODE LIVE
   ============================================ */

async function renderLampiranLive() {
  if (!LIVE()) return;

  const container = $("pgdd-files");
  const suratId = disposisi?.suratMasukId;

  if (!suratId) {
    container.textContent = "ID surat asal tidak tersedia.";
    return;
  }

  try {
    const response = await EOfficeAPI.getSuratMasukDetail(suratId);

    if (!response?.status || !response?.data) {
      throw new Error(
        response?.message || "Data surat tidak ditemukan."
      );
    }

    const surat = response.data;

    // Gunakan nama field yang benar-benar dikirim API.
    const filePath = surat.file_path || surat.filePath;

    if (surat.tanggal) {
      $("pgdd-surat-tanggal").textContent = surat.tanggal;
    }

    if (!filePath) {
      container.textContent = "Tidak ada lampiran pada surat ini.";
      return;
    }

    container.innerHTML = `
      <div class="pgdd-file-card">
        <div class="pgdd-file-info">
          <span class="pgdd-file-name">Lampiran Surat Masuk</span>
          <span class="pgdd-file-size">
            File tersedia dari backend
          </span>
        </div>

        <button
          type="button"
          class="pgdd-btn pgdd-btn--outline"
          data-download-live="1">
          Unduh Lampiran
        </button>
      </div>
    `;
  } catch (error) {
    console.error("Gagal memeriksa lampiran:", error);
    container.textContent =
      "Lampiran tidak dapat dimuat: " + error.message;
  }
}

$("pgdd-files").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-download-live]");
  if (!button || !disposisi?.suratMasukId) return;

  button.disabled = true;
  button.textContent = "Mengunduh...";

  try {
    const result = await EOfficeAPI.downloadLampiranSuratMasuk(
      disposisi.suratMasukId
    );

    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = result.filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    showToast("Lampiran berhasil diambil.");
  } catch (error) {
    showToast(error.message || "Gagal mengunduh lampiran.");
  } finally {
    button.disabled = false;
    button.textContent = "Unduh Lampiran";
  }
});

/* ============================================
   INITIALIZATION
   ============================================ */

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  if (!Number.isInteger(id) || id < 1) {
    showToast("ID disposisi tidak valid.");
    $("pgdd-judul").textContent = "Disposisi tidak ditemukan";
    return;
  }

  try {
    disposisi = await loadDetail(id);

    STATUS_KEY = `disposisi_status_${disposisi.id}`;

    renderHeader();
    renderSurat();
  await renderLampiranLive();
    renderStatus();
    renderLaporan();
    renderActionPanel();
    await renderTimeline();

    document.title =
      `${disposisi.judul} - Detail Disposisi E-Office`;

  } catch (error) {
    console.error("Gagal memuat detail disposisi:", error);

    $("pgdd-judul").textContent =
      "Gagal memuat detail disposisi";

    showToast(
      error.message || "Periksa koneksi ke server."
    );
  }
}

init();
