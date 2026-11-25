<?= $this->extend('layouts/admin') ?>

<?= $this->section('title') ?>
Detail Surat - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/detail-generic.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<nav class="dg-breadcrumb" aria-label="Breadcrumb">
      <a href="<?= base_url('admin/dashboard') ?>">Dashboard</a>
      <span class="dg-breadcrumb-sep">&gt;</span>
      <a href="<?= base_url('admin/input-surat') ?>">Input Surat</a>
      <span class="dg-breadcrumb-sep">&gt;</span>
      <span class="dg-breadcrumb-current" id="dg-crumb">Detail Surat</span>
    </nav>

    <a href="<?= base_url('admin/input-surat') ?>" class="dg-back">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      Kembali ke Input Surat
    </a>

    <section class="dg-card">
      <div class="dg-title-row">
        <div>
          <h1 class="dg-title" id="dg-title">Memuat...</h1>
          <p class="dg-sub" id="dg-sub"></p>
        </div>
        <span class="dg-badge" id="dg-badge"></span>
      </div>
      <div class="dg-grid" id="dg-info"></div>
    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module">
    import { SURAT_TERAKHIR_MOCK } from "<?= base_url('assets/js/pages/admin-input-surat.js') ?>";

    async function loadDetail(id, jenis) {
      const list =
        window.EOfficeAPI && EOfficeAPI.config.LIVE
          ? await EOfficeAPI.getSuratTerbaru()
          : SURAT_TERAKHIR_MOCK;

      const surat = list.find(
        (x) =>
          Number(x.id) === id &&
          String(x.jenis).toUpperCase() === jenis
      );

      if (!surat) {
        throw new Error("Surat tidak ditemukan.");
      }

      return surat;
    }

    async function init() {
      const params = new URLSearchParams(location.search);
      const id = Number(params.get("id"));
      const jenis = String(params.get("jenis") || "").toUpperCase();

      if (!Number.isSafeInteger(id) || id < 1 ||
          !["MASUK", "KELUAR"].includes(jenis)) {
        document.getElementById("dg-title").textContent =
          "Parameter detail surat tidak valid";
        return;
      }
      let d;
      try {
        d = await loadDetail(id, jenis);
      } catch (e) {
        document.getElementById("dg-title").textContent = "Gagal memuat detail surat";
        return;
      }

      document.getElementById("dg-crumb").textContent = d.nomor;
      document.getElementById("dg-title").textContent = d.perihal;
      document.getElementById("dg-sub").textContent = `${d.pihak} \u2022 ${d.tanggal}`;

      const badge = document.getElementById("dg-badge");
      badge.textContent = d.status;
      badge.className = "dg-badge dg-badge--green";

      const rows = [
        ["Nomor Surat", d.nomor, true],
        ["Jenis", d.jenis],
        ["Pengirim / Penerima", d.pihak],
        ["Tanggal", d.tanggal],
        ["Status", d.status]
      ];

      document.getElementById("dg-info").innerHTML = rows
        .map(([l, v, mono]) => `
          <div class="dg-field">
            <p class="dg-label">${l}</p>
            <p class="dg-value${mono ? " dg-value--mono" : ""}">${v}</p>
          </div>`)
        .join("");

      // Lampiran tersedia untuk Surat Masuk dan Surat Keluar.
      const jenisSurat = String(d.jenis || "").toUpperCase();
      const hasAttachment = Boolean(d.file_path || d.raw?.file_path);

      if (["MASUK", "KELUAR"].includes(jenisSurat) && hasAttachment) {
        const container = document.createElement("div");
        container.id = "dg-attachment-actions";
        container.style.cssText =
          "display:flex;gap:12px;flex-wrap:wrap;margin-top:24px";

        const previewButton = document.createElement("button");
        previewButton.type = "button";
        previewButton.textContent = "Lihat Lampiran";
        previewButton.className = "dg-attachment-btn";
        previewButton.style.cssText =
          "padding:12px 18px;border:0;border-radius:8px;" +
          "background:#2563eb;color:white;cursor:pointer";

        const downloadButton = document.createElement("button");
        downloadButton.type = "button";
        downloadButton.textContent = "Unduh Lampiran";
        downloadButton.className = "dg-attachment-btn";
        downloadButton.style.cssText =
          "padding:12px 18px;border:1px solid #2563eb;" +
          "border-radius:8px;background:white;color:#2563eb;cursor:pointer";

        async function handleAttachment(download) {
          const buttons = [previewButton, downloadButton];

          buttons.forEach(button => button.disabled = true);

          try {
            if (!window.EOfficeAPI ||
                typeof EOfficeAPI.downloadLampiranSuratMasuk !== "function") {
              throw new Error("API lampiran belum tersedia.");
            }

            const token =
              sessionStorage.getItem("eoffice_token") ||
              localStorage.getItem("eoffice_token");

            if (!token) {
              throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
            }

            const baseUrl = EOfficeAPI.config.BASE_URL;

            const response = await fetch(
              `${baseUrl}/${d.jenis === "KELUAR" ? "surat-keluar" : "surat-masuk"}/${encodeURIComponent(d.id)}/file`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (!response.ok) {
              let message = `Gagal mengambil lampiran (HTTP ${response.status}).`;

              try {
                const errorData = await response.json();
                message = errorData.message || message;
              } catch (_) {}

              throw new Error(message);
            }

            const blob = await response.blob();

            if (!blob.size) {
              throw new Error("File lampiran kosong.");
            }

            if (blob.type.includes("application/json")) {
              throw new Error("Server mengembalikan JSON, bukan file lampiran.");
            }

            const url = URL.createObjectURL(blob);

            if (download) {
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download =
                String(d.file_path).split(/[\\/]/).pop() ||
                `lampiran-surat-${d.id}`;
              document.body.appendChild(anchor);
              anchor.click();
              anchor.remove();

              setTimeout(() => URL.revokeObjectURL(url), 60000);
            } else {
              const opened = window.open(url, "_blank");

              if (!opened) {
                URL.revokeObjectURL(url);
                throw new Error("Popup diblokir browser. Izinkan popup.");
              }

              setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
          } catch (error) {
            console.error("Gagal mengakses lampiran:", error);
            alert(error.message || "Gagal mengakses lampiran.");
          } finally {
            buttons.forEach(button => button.disabled = false);
          }
        }

        previewButton.addEventListener("click", () => {
          handleAttachment(false);
        });

        downloadButton.addEventListener("click", () => {
          handleAttachment(true);
        });

        container.append(previewButton, downloadButton);

        document.getElementById("dg-info").after(container);
      }

      document.title = `${d.perihal} - E-Office SKSDA`;
    }

    init();
  </script>
<?= $this->endSection() ?>
