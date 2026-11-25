<?= $this->extend('layouts/kepala-seksi') ?>

<?= $this->section('title') ?>
Surat Masuk - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/ks-surat.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- ===== 1. HEADER ===== -->
    <section class="kss-head">
      <div>
        <h1 class="kss-title">Surat Masuk</h1>
        <p class="kss-desc">Kelola dan tindak lanjuti dokumen surat masuk institusi.</p>
      </div>
      <div class="kss-head-actions">
        <button type="button" class="kss-btn kss-btn--outline">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filter
        </button>
        <a href="<?= base_url('admin/form-surat-masuk') ?>" class="kss-btn kss-btn--primary" id="btn-registrasi">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Registrasi Surat
        </a>
      </div>
    </section>

    <!-- ===== 2. STAT CARD (render via JS) ===== -->
    <section class="kss-stats" id="kss-stats" aria-label="Ringkasan surat masuk"></section>

    <!-- ===== 3. CARD TABEL ===== -->
    <section class="kss-card">

      <!-- Baris tab -->
      <nav class="kss-tabs" id="kss-tabs" aria-label="Filter status surat">
        <button type="button" class="kss-tab is-active" data-filter="all">Semua</button>
        <button type="button" class="kss-tab" data-filter="unread">Belum Dibaca <span class="kss-tab-badge kss-tab-badge--red" data-count="unread"></span></button>
        <button type="button" class="kss-tab" data-filter="perlu">Perlu Ditindaklanjuti <span class="kss-tab-badge kss-tab-badge--amber" data-count="perlu"></span></button>
        <button type="button" class="kss-tab" data-filter="selesai">Selesai</button>
      </nav>

      <!-- Baris tools -->
      <div class="kss-tools">
        <div class="kss-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="search" id="kss-search" placeholder="Cari dalam Semua..." aria-label="Cari surat" />
        </div>
        <div class="kss-tools-right">
          <span class="kss-showing" id="kss-showing">Menampilkan 1-10 dari 1,248</span>
          <button type="button" class="kss-page-btn" id="kss-prev" aria-label="Halaman sebelumnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button type="button" class="kss-page-btn" id="kss-next" aria-label="Halaman berikutnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      <!-- Tabel -->
      <div class="kss-table-scroll">
        <table class="kss-table">
          <thead>
            <tr>
              <th class="th-check"><input type="checkbox" id="kss-check-all" aria-label="Pilih semua" /></th>
              <th>Nomor Surat / Tanggal</th>
              <th>Pengirim</th>
              <th>Perihal</th>
              <th>Prioritas</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="kss-tbody"></tbody>
        </table>
      </div>
    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/surat-masuk.js') ?>"></script>
<?= $this->endSection() ?>
