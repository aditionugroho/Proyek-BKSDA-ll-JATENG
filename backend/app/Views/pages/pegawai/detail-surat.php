<?= $this->extend('layouts/pegawai') ?>

<?= $this->section('title') ?>
Detail Surat - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<!-- Stylesheet -->
  <link rel="stylesheet" href="<?= base_url('assets/css/pages/detail-generic.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- Breadcrumb -->
    <nav class="dg-breadcrumb" aria-label="Breadcrumb">
      <a href="<?= base_url('pegawai/dashboard') ?>">Dashboard</a>
      <span class="dg-breadcrumb-sep">&gt;</span>
      <a href="<?= base_url('pegawai/surat') ?>">Surat</a>
      <span class="dg-breadcrumb-sep">&gt;</span>
      <span class="dg-breadcrumb-current" id="dg-crumb">
        Detail Surat
      </span>
    </nav>

    <!-- Tombol kembali -->
    <a href="<?= base_url('pegawai/surat') ?>" class="dg-back">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Kembali ke Daftar Surat
    </a>

    <!-- Kartu detail surat -->
    <section class="dg-card">

      <div class="dg-title-row">
        <div>
          <h1 class="dg-title" id="dg-title">
            Memuat detail surat...
          </h1>

          <p class="dg-sub" id="dg-sub"></p>
        </div>

        <span class="dg-badge" id="dg-badge"></span>
      </div>

      <div class="dg-grid" id="dg-info"></div>

    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module">

    import {
      suratPgData as MOCK
    } from "<?= base_url('assets/js/data/surat-pegawai.js') ?>";

    const params = new URLSearchParams(window.location.search);

    const id = Number(params.get("id"));
    const jenis = params.get("jenis") || "masuk";

    const TONE = {
      red: "red",
      gray: "gray",
      blue: "blue",
      green: "green",
      amber: "gray"
    };

    // ==========================================
    // FORMAT TANGGAL
    // ==========================================

    function formatTanggal(value) {
      if (!value) return "-";

      const raw = String(value);
      const iso = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

      if (!iso) return raw;

      const date = new Date(`${iso}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return raw;
      }

      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }

    // ==========================================
    // FORMAT WAKTU
    // ==========================================

    function formatWaktu(value) {
      if (!value) return "-";

      const match = String(value).match(/\b\d{2}:\d{2}\b/);

      return match ? `${match[0]} WIB` : "-";
    }

    // ==========================================
    // MAPPING DATA BACKEND
    // ==========================================

    function mapDetail(raw) {
      const status = String(raw.status || "Belum tersedia");

      const sifat = raw.sifat
        ? String(raw.sifat)
        : "Tidak tercantum";

      let warna = "gray";

      if (/penting|segera|rahasia/i.test(sifat)) {
        warna = "red";
      } else if (/selesai|terkirim/i.test(status)) {
        warna = "green";
      } else if (/baru|proses|disposisi/i.test(status)) {
        warna = "blue";
      }

      return {
        id: raw.id,

        jenis,

        nomor:
          raw.no_surat ||
          raw.no_agenda ||
          "-",

        pengirim:
          jenis === "masuk"
            ? (raw.asal || "-")
            : (raw.tujuan || "-"),

        perihal:
          raw.perihal ||
          "Tanpa perihal",

        tanggal:
          formatTanggal(raw.tanggal),

        waktu:
          formatWaktu(raw.created_at),

        sifat,

        status,

        klasifikasi:
          raw.klasifikasi || "-",

        dibuatOleh:
          raw.created_by_name || "-",

        label: {
          text: status,
          tone: warna
        }
      };
    }

    // ==========================================
    // MENGAMBIL DETAIL SURAT
    // ==========================================

    async function loadDetail() {
      if (window.EOfficeAPI?.config?.LIVE) {

        if (typeof EOfficeAPI.getSuratSayaDetail !== "function") {
          throw new Error(
            "Fungsi getSuratSayaDetail belum tersedia di api.js."
          );
        }

        const response = await EOfficeAPI.getSuratSayaDetail(
          id,
          jenis
        );

        if (response?.status !== true || !response.data) {
          throw new Error(
            response?.message || "Gagal mengambil detail surat."
          );
        }

        return mapDetail(response.data);
      }

      const mockItem = MOCK.find(
        (item) =>
          Number(item.id) === id &&
          item.jenis === jenis
      );

      return mockItem || null;
    }

    // ==========================================
    // MEMBUAT FIELD DETAIL
    // ==========================================

    function createField(label, value, mono = false) {
      const field = document.createElement("div");
      field.className = "dg-field";

      const labelElement = document.createElement("p");
      labelElement.className = "dg-label";
      labelElement.textContent = label;

      const valueElement = document.createElement("p");

      valueElement.className = mono
        ? "dg-value dg-value--mono"
        : "dg-value";

      valueElement.textContent = String(value ?? "-");

      field.appendChild(labelElement);
      field.appendChild(valueElement);

      return field;
    }

    // ==========================================
    // RENDER DETAIL SURAT
    // ==========================================

    function renderDetail(d) {
      const title = document.getElementById("dg-title");
      const subtitle = document.getElementById("dg-sub");
      const breadcrumb = document.getElementById("dg-crumb");
      const badge = document.getElementById("dg-badge");
      const container = document.getElementById("dg-info");

      breadcrumb.textContent = d.nomor || "-";
      title.textContent = d.perihal || "Tanpa perihal";

      subtitle.textContent =
        `${d.pengirim || "-"} • ${d.tanggal || "-"}, ${d.waktu || "-"}`;

      const label = d.label || {
        text: d.status || "Belum tersedia",
        tone: "gray"
      };

      badge.textContent = label.text;

      badge.className =
        `dg-badge dg-badge--${TONE[label.tone] || "gray"}`;

      const rows = [
        ["Nomor Surat", d.nomor, true],
        [
          jenis === "masuk" ? "Pengirim" : "Tujuan",
          d.pengirim
        ],
        ["Tanggal Surat", `${d.tanggal} • ${d.waktu}`],
        ["Sifat", d.sifat],
        ["Status", d.status],
        ["Jenis", jenis === "masuk" ? "Surat Masuk" : "Surat Keluar"]
      ];

      if (window.EOfficeAPI?.config?.LIVE) {
        rows.push(
          ["Klasifikasi", d.klasifikasi],
          ["Dibuat Oleh", d.dibuatOleh]
        );
      }

      container.replaceChildren();

      rows.forEach(([labelText, value, mono]) => {
        container.appendChild(
          createField(labelText, value, mono)
        );
      });

      document.title =
        `${d.perihal || "Detail Surat"} - E-Office SKSDA`;
    }

    // ==========================================
    // MENAMPILKAN ERROR
    // ==========================================

    function renderError(message) {
      const title = document.getElementById("dg-title");
      const subtitle = document.getElementById("dg-sub");
      const badge = document.getElementById("dg-badge");
      const container = document.getElementById("dg-info");

      title.textContent = "Gagal memuat detail surat";
      subtitle.textContent = message || "Terjadi kesalahan.";

      badge.textContent = "";
      badge.className = "dg-badge";

      container.replaceChildren();
    }

    // ==========================================
    // INISIALISASI HALAMAN
    // ==========================================

    async function init() {
      if (
        !Number.isInteger(id) ||
        id <= 0 ||
        !["masuk", "keluar"].includes(jenis)
      ) {
        renderError("ID atau jenis surat tidak valid.");
        return;
      }

      try {
        const detail = await loadDetail();

        if (!detail) {
          throw new Error("Surat tidak ditemukan.");
        }

        renderDetail(detail);

      } catch (error) {
        console.error(
          "Gagal memuat detail surat:",
          error
        );

        renderError(
          error?.message || "Tidak dapat mengambil data dari server."
        );
      }
    }

    init();

  </script>
<?= $this->endSection() ?>
