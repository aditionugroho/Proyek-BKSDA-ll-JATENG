<?= $this->extend('layouts/kepala-seksi') ?>

<?= $this->section('title') ?>
Laporan Patroli - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/patroli.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- ===== 1. HEADER ===== -->
    <section class="pgs-head">
      <div>
        <h1 class="pgs-title">Laporan Patroli</h1>
        <p class="pgs-desc">Tinjauan laporan patroli petugas dari lapangan per wilayah dan petugas.</p>
      </div>
    </section>

    <!-- ===== 2. DAFTAR LAPORAN ===== -->
    <section class="pt-card" aria-label="Daftar laporan patroli">
      <div class="pt-card-head">
        <div>
          <h2 class="pt-card-title">Semua Laporan Patroli</h2>
          <p class="pt-card-sub">Ketuk baris untuk melihat detail dan galeri foto &bull; <span id="pt-hasil-count">0 laporan</span></p>
        </div>
        <div class="pt-filter">
          <select class="pt-select" id="pt-filter-resort" aria-label="Filter resort">
            <option value="all" selected>Semua Resort</option>
            <option value="Cilacap">Cilacap</option>
            <option value="Wonosobo">Wonosobo</option>
            <option value="Pemalang">Pemalang</option>
          </select>
          <select class="pt-select" id="pt-filter-petugas" aria-label="Filter petugas">
            <option value="all" selected>Semua Petugas</option>
          </select>
          <input type="date" class="pt-input" id="pt-filter-dari" title="Periode dari" aria-label="Periode dari" />
          <input type="date" class="pt-input" id="pt-filter-sampai" title="Periode sampai" aria-label="Periode sampai" />
          <button type="button" class="pt-btn pt-btn--outline" id="pt-filter-reset">Reset</button>
          <input type="search" class="pt-input" id="pt-filter-cari" placeholder="Cari temuan..." style="max-width:180px" />
        </div>
      </div>

      <div class="pt-table-wrap">
        <table class="pt-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Petugas</th>
              <th>Wilayah</th>
              <th>Catatan / Temuan</th>
              <th>Foto</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="pt-tbody"></tbody>
        </table>
      </div>
    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/patroli-ks.js') ?>"></script>
<?= $this->endSection() ?>
