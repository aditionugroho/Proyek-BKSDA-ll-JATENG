<?= $this->extend('layouts/kepala-seksi') ?>

<?= $this->section('title') ?>
Tugas Seksi - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/ks-tugas.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- ===== 1. HEADER ===== -->
    <section class="ktg-head">
      <div>
        <h1 class="ktg-title">Tugas Seksi</h1>
        <p class="ktg-desc">Kelola dan pantau seluruh tugas dalam seksi Anda.</p>
      </div>
      <div class="ktg-head-actions">
        <button type="button" class="ktg-btn ktg-btn--outline" id="btn-filter">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          Filter
        </button>
        <a href="<?= base_url('kepala-seksi/buat-tugas') ?>" class="ktg-btn ktg-btn--primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Buat Tugas
        </a>
      </div>
    </section>

    <!-- ===== 2. STAT CARD (render via JS) ===== -->
    <section class="ktg-stats" id="ktg-stats" aria-label="Ringkasan tugas"></section>

    <!-- ===== 3. CARD TABEL ===== -->
    <section class="ktg-card">

      <!-- Baris tab -->
      <nav class="ktg-tabs" id="ktg-tabs" aria-label="Filter status tugas">
        <button type="button" class="ktg-tab is-active" data-filter="all">Semua</button>
        <button type="button" class="ktg-tab" data-filter="Belum Mulai">Belum Mulai</button>
        <button type="button" class="ktg-tab" data-filter="Berjalan">Berjalan</button>
        <button type="button" class="ktg-tab" data-filter="Menunggu Review">Menunggu Review</button>
        <button type="button" class="ktg-tab" data-filter="Selesai">Selesai</button>
      </nav>

      <!-- Tabel -->
      <div class="ktg-table-scroll">
        <table class="ktg-table">
          <thead>
            <tr>
              <th>Tugas</th>
              <th>PIC</th>
              <th>Prioritas</th>
              <th>Deadline</th>
              <th>Progress</th>
              <th>Status</th>
              <th class="th-actions">Aksi</th>
            </tr>
          </thead>
          <tbody id="ktg-tbody"></tbody>
        </table>
      </div>

      <!-- Footer tabel -->
      <div class="ktg-table-foot">
        <span class="ktg-showing" id="ktg-showing"></span>
        <div class="ktg-page-btns">
          <button type="button" class="ktg-page-btn" id="ktg-prev" aria-label="Sebelumnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <button type="button" class="ktg-page-btn" id="ktg-next" aria-label="Berikutnya">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/tugas-seksi.js') ?>"></script>
<?= $this->endSection() ?>
