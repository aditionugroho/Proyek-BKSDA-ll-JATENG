<?= $this->extend('layouts/pegawai') ?>

<?= $this->section('title') ?>
Surat - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/pg-surat.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- ===== 1. HEADER ===== -->
    <section class="pgs-head">
      <div>
        <h1 class="pgs-title">Surat</h1>
        <p class="pgs-desc">Kelola semua korespondensi resmi BKSDA Jawa Tengah.</p>
      </div>
      <a href="<?= base_url('pegawai/buat-surat') ?>" class="pgs-btn pgs-btn--primary">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Buat Surat Keluar
      </a>
    </section>

    <!-- ===== 2. BARIS TAB (di atas card) ===== -->
    <nav class="pgs-tabs" id="pgs-tabs" aria-label="Filter jenis surat">
      <button type="button" class="pgs-tab is-active" data-jenis="masuk">Surat Masuk</button>
      <button type="button" class="pgs-tab" data-jenis="keluar">Surat Keluar</button>
      <button type="button" class="pgs-tab" data-jenis="draft">Draft</button>
      <button type="button" class="pgs-tab" data-jenis="arsip">Arsip</button>
    </nav>

    <!-- ===== 3. CARD UTAMA ===== -->
    <section class="pgs-card">

      <!-- Baris filter -->
      <div class="pgs-filters">
        <select id="pgs-sifat" class="pgs-select" aria-label="Filter sifat">
          <option value="all">Semua Sifat</option>
          <option value="Penting">Penting</option>
          <option value="Biasa">Biasa</option>
        </select>
        <select id="pgs-status" class="pgs-select" aria-label="Filter status">
          <option value="all">Semua Status</option>
          <option value="Baru">Baru</option>
          <option value="Dibaca">Dibaca</option>
          <option value="Didisposisikan">Didisposisikan</option>
          <option value="Terkirim">Terkirim</option>
          <option value="Draft">Draft</option>
          <option value="Diarsipkan">Diarsipkan</option>
        </select>
        <input type="date" id="pgs-tanggal" class="pgs-date" aria-label="Filter tanggal" />
        <button type="button" class="pgs-advanced" id="btn-filter-lanjutan">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filter Lanjutan
        </button>
      </div>

      <!-- Tabel -->
      <div class="pgs-table-scroll">
        <table class="pgs-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Nomor Surat / Pengirim</th>
              <th>Perihal</th>
              <th>Tanggal</th>
              <th class="th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody id="pgs-tbody"></tbody>
        </table>
      </div>

      <!-- Footer tabel -->
      <div class="pgs-foot">
        <span id="pgs-showing">Menampilkan 1-3 dari 45 surat</span>
        <div class="pgs-page-btns">
          <button type="button" class="pgs-page-btn" id="pgs-prev" disabled aria-label="Sebelumnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button type="button" class="pgs-page-btn" id="pgs-next" aria-label="Berikutnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/surat-pg.js') ?>"></script>
<?= $this->endSection() ?>
