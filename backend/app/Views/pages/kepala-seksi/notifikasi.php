<?= $this->extend('layouts/kepala-seksi') ?>

<?= $this->section('title') ?>
Notifikasi - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/ks-notifikasi.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- ===== 1. HEADER ===== -->
    <nav class="nt-breadcrumb" aria-label="Breadcrumb">
      <a href="<?= base_url('kepala-seksi/dashboard') ?>">Dashboard</a>
      <span aria-hidden="true">&gt;</span>
      <span class="nt-breadcrumb-current">Notifikasi</span>
    </nav>

    <section class="nt-head">
      <div>
        <h1 class="nt-title">Notifikasi</h1>
        <p class="nt-desc">Lihat pembaruan dan aktivitas terbaru yang berkaitan dengan pekerjaan Anda.</p>
      </div>
      <button type="button" class="nt-btn nt-btn--outline" id="btn-read-all">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L7 17l-4-4"></path><path d="M22 10l-7.5 7.5L12 15"></path></svg>
        Tandai Semua Dibaca
      </button>
    </section>

    <!-- ===== 2. STAT CARD (render via JS) ===== -->
    <section class="nt-stats" id="nt-stats" aria-label="Ringkasan notifikasi"></section>

    <!-- ===== 3. BAR FILTER ===== -->
    <section class="nt-filter-card">
      <nav class="nt-tabs" id="nt-tabs" aria-label="Filter kategori notifikasi">
        <button type="button" class="nt-tab is-active" data-filter="all">Semua <span class="nt-tab-badge" data-count="all"></span></button>
        <button type="button" class="nt-tab" data-filter="unread">Belum Dibaca</button>
        <button type="button" class="nt-tab" data-filter="Surat">Surat</button>
        <button type="button" class="nt-tab" data-filter="Disposisi">Disposisi</button>
        <button type="button" class="nt-tab" data-filter="Tugas">Tugas</button>
        <button type="button" class="nt-tab" data-filter="Jadwal">Jadwal</button>
      </nav>

      <div class="nt-filter-right">
        <div class="nt-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="search" id="nt-search" placeholder="Cari dalam notifikasi..." aria-label="Cari notifikasi" />
        </div>
        <select id="nt-sort" class="nt-select" aria-label="Urutkan">
          <option value="terkini" selected>Urutkan: Terkini</option>
          <option value="terlama">Urutkan: Terlama</option>
        </select>
      </div>
    </section>

    <!-- ===== 4. LIST NOTIFIKASI ===== -->
    <section class="nt-list" id="nt-list" aria-label="Daftar notifikasi"></section>

    <!-- ===== 5. FOOTER PAGINATION ===== -->
    <div class="nt-foot">
      <span class="nt-showing" id="nt-showing">Menampilkan 1-7 dari 12 notifikasi</span>
      <div class="nt-foot-right">
        <div class="nt-pagination">
          <button type="button" class="nt-page-nav" id="nt-prev" disabled>&#8249; Sebelumnya</button>
          <button type="button" class="nt-page-num is-active" data-page="1">1</button>
          <button type="button" class="nt-page-num" data-page="2">2</button>
          <button type="button" class="nt-page-nav" id="nt-next">Selanjutnya &#8250;</button>
        </div>
        <span class="nt-version">v2.4.0-kasi</span>
      </div>
    </div>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/notifikasi.js') ?>"></script>
<?= $this->endSection() ?>
