<?= $this->extend('layouts/pegawai') ?>

<?= $this->section('title') ?>
Dokumen Saya - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/pg-dokumen.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- ===== 1. HEADER ===== -->
    <section class="pgdk-head">
      <div>
        <h1 class="pgdk-title">Dokumen Saya</h1>
        <p class="pgdk-desc">Kelola arsip, draf, dan riwayat dokumen personal Anda.</p>
      </div>
      <button type="button" class="pgdk-btn pgdk-btn--primary" id="btn-buat">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Buat Dokumen
      </button>
    </section>

    <!-- ===== 2. BARIS TAB PILL (di atas card) ===== -->
    <nav class="pgdk-pills" id="pgdk-pills" aria-label="Filter status dokumen">
      <button type="button" class="pgdk-pill is-active" data-status="all">Semua</button>
      <button type="button" class="pgdk-pill" data-status="Draft">Draft</button>
      <button type="button" class="pgdk-pill" data-status="Terkirim">Terkirim</button>
      <button type="button" class="pgdk-pill" data-status="Disetujui">Disetujui</button>
      <button type="button" class="pgdk-pill" data-status="Ditolak">Ditolak</button>
      <button type="button" class="pgdk-pill" data-status="Arsip">Arsip</button>
    </nav>

    <!-- ===== 3. CARD TABEL ===== -->
    <section class="pgdk-card">
      <div class="pgdk-table-scroll">
        <table class="pgdk-table">
          <thead>
            <tr>
              <th>Nama Dokumen</th>
              <th>Nomor</th>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Status</th>
              <th class="th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody id="pgdk-tbody"></tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="pgdk-foot">
        <span id="pgdk-showing">Menampilkan 1-4 dari 42 dokumen</span>
        <div class="pgdk-pagination">
          <button type="button" class="pgdk-page-nav" id="pgdk-prev" disabled aria-label="Sebelumnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button type="button" class="pgdk-page-num is-active" data-page="1">1</button>
          <button type="button" class="pgdk-page-num" data-page="2">2</button>
          <button type="button" class="pgdk-page-num" data-page="3">3</button>
          <button type="button" class="pgdk-page-nav" id="pgdk-next" aria-label="Berikutnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/dokumen-saya.js') ?>"></script>
<?= $this->endSection() ?>
