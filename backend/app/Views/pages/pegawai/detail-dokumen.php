<?= $this->extend('layouts/pegawai') ?>

<?= $this->section('title') ?>
Detail Dokumen - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/detail-generic.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<nav class="dg-breadcrumb" aria-label="Breadcrumb">
      <a href="<?= base_url('pegawai/dashboard') ?>">Dashboard</a>
      <span class="dg-breadcrumb-sep">&gt;</span>
      <a href="<?= base_url('pegawai/dokumen-saya') ?>">Dokumen Saya</a>
      <span class="dg-breadcrumb-sep">&gt;</span>
      <span class="dg-breadcrumb-current" id="dg-crumb">Detail Dokumen</span>
    </nav>

    <a href="<?= base_url('pegawai/dokumen-saya') ?>" class="dg-back">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      Kembali ke Dokumen Saya
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
    import { dokumenPgData as MOCK } from "<?= base_url('assets/js/data/dokumen-pegawai.js') ?>";

    async function loadDetail(id) {
      if (window.EOfficeAPI && EOfficeAPI.config.LIVE) {
        const response = await EOfficeAPI.getDokumenSayaDetail(id);

        if (response?.status !== true || !response.data) {
          throw new Error("Format respons API dokumen tidak valid.");
        }

        return response.data;
      }
      return MOCK.find((x) => x.id === id) || MOCK[0];
    }

    async function init() {
      const id = Number(new URLSearchParams(location.search).get("id"));
      let d;
      try {
        d = await loadDetail(id);
      } catch (e) {
        document.getElementById("dg-title").textContent = "Gagal memuat detail dokumen";
        return;
      }

      document.getElementById("dg-crumb").textContent = d.nama;
      document.getElementById("dg-title").textContent = d.nama;
      document.getElementById("dg-sub").textContent = `${d.kategori} \u2022 ${d.tanggal}`;

      const TONE = { green: "green", gray: "gray", blue: "blue", red: "red" };
      const badge = document.getElementById("dg-badge");
      badge.textContent = d.status.text;
      badge.className = `dg-badge dg-badge--${TONE[d.status.tone] || "gray"}`;

      const rows = [
        ["Nomor", d.nomor === "-" ? "Belum ada nomor (draft)" : d.nomor, d.nomor !== "-"],
        ["Kategori", d.kategori],
        ["Tanggal", d.tanggal],
        ["Status", d.status.text]
      ];

      if (d.keterangan) {
        rows.push(["Keterangan", d.keterangan]);
      }

      document.getElementById("dg-info").innerHTML = rows
        .map(([l, v, mono]) => `
          <div class="dg-field">
            <p class="dg-label">${l}</p>
            <p class="dg-value${mono ? " dg-value--mono" : ""}">${v}</p>
          </div>`)
        .join("");

      document.title = `${d.nama} - E-Office SKSDA`;
    }

    init();
  </script>
<?= $this->endSection() ?>
