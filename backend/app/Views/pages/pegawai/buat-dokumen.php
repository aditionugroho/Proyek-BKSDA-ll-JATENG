<?= $this->extend('layouts/pegawai') ?>

<?= $this->section('title') ?>
Buat Dokumen Baru - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/pg-surat.css') ?>" />
<meta name="csrf-token" content="" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<!-- ===== 1. HEADER ===== -->
    <nav class="pgb-breadcrumb" aria-label="Breadcrumb">
      <a href="<?= base_url('pegawai/dokumen-saya') ?>">Dokumen Saya</a>
      <span aria-hidden="true">&gt;</span>
      <span class="pgb-breadcrumb-current" id="pgbd-crumb">Buat Dokumen Baru</span>
    </nav>

    <section class="pgb-head">
      <div>
        <h1 class="pgb-title" id="pgbd-title">Buat Dokumen Baru</h1>
        <p class="pgb-desc" id="pgbd-desc">Lengkapi form di bawah ini untuk membuat draft dokumen pribadi.</p>
      </div>
      <span class="pgb-draft-badge">DRAFT</span>
    </section>

    <!-- ===== 2. FORM ===== -->
    <section class="pgb-grid">

      <form id="form-dokumen" enctype="multipart/form-data" class="pgb-left" novalidate>
      <input type="hidden" name="csrf_test_name" value="" />

        <!-- ===== KIRI: informasi dokumen ===== -->
        <div class="pgb-card">
          <div class="pgb-card-head">
            <span class="pgb-card-icon pgb-card-icon--circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </span>
            <h2 class="pgb-card-title">Informasi Dokumen</h2>
          </div>

          <div class="pgb-field">
            <label class="pgb-label" for="f-nama">Nama Dokumen <span class="pgb-req">*</span></label>
            <input type="text" id="f-nama" name="nama" placeholder="Contoh: Laporan Survei Flora Fauna..." />
            <p class="pgb-error" id="f-nama-error" hidden>Wajib diisi (minimal 3 karakter)</p>
          </div>

          <div class="pgb-row-2">
            <div class="pgb-field">
              <label class="pgb-label" for="f-kategori">Kategori <span class="pgb-req">*</span></label>
              <select id="f-kategori" name="kategori">
                <option value="">Pilih kategori...</option>
                <option value="Laporan">Laporan</option>
                <option value="Surat Keputusan">Surat Keputusan</option>
                <option value="Pengajuan Dana">Pengajuan Dana</option>
                <option value="Proposal">Proposal</option>
                <option value="Nota Dinas">Nota Dinas</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <p class="pgb-error" id="f-kategori-error" hidden>Wajib dipilih</p>
            </div>
            <div class="pgb-field">
              <label class="pgb-label" for="f-nomor">Nomor Dokumen</label>
              <input type="text" id="f-nomor" name="nomor" placeholder="Kosongkan bila masih draft" />
              <p class="pgb-helper">Contoh: SKSDA-JT/09/23</p>
              <p class="pgb-error" id="f-nomor-error" hidden></p>
            </div>
          </div>

          <div class="pgb-field">
            <label class="pgb-label" for="f-keterangan">Keterangan / Ringkasan Isi</label>
            <textarea id="f-keterangan" name="keterangan" rows="5" placeholder="Ringkas isi dokumen agar Kepala Seksi dapat memahami konteks tanpa mengunduh file..."></textarea>
            <p class="pgb-helper">Maksimal 5000 karakter. Opsional, sangat disarankan.</p>
            <p class="pgb-error" id="f-keterangan-error" hidden></p>
          </div>
        </div>

        <!-- ===== LAMPIRAN ===== -->
        <div class="pgb-card">
          <div class="pgb-card-head">
            <div class="pgb-card-head-left">
              <span class="pgb-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </span>
              <h2 class="pgb-card-title">Lampiran File</h2>
            </div>
          </div>

          <div class="pgb-dropzone" id="pgbd-dropzone" role="button" tabindex="0" aria-label="Unggah lampiran dokumen">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
            <p class="pgb-dropzone-title">Klik atau seret file ke sini</p>
            <p class="pgb-dropzone-sub">PDF, DOC, DOCX, JPG, PNG (Maks. 5MB)</p>
            <input type="file" id="pgbd-file" name="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" hidden />
          </div>
          <p class="pgb-error" id="pgbd-file-error" hidden></p>

          <div class="pgb-file-list" id="pgbd-file-list"></div>
        </div>
      </form>

      <!-- ===== KANAN: aksi ===== -->
      <div class="pgb-right">
        <div class="pgb-card">
          <button type="button" class="pgb-action pgb-action--primary" id="btn-kirim">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Kirim / Ajukan
          </button>
          <button type="button" class="pgb-action" id="btn-simpan">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Simpan Draft
          </button>
          <button type="button" class="pgb-action" id="btn-batal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Batal
          </button>
        </div>
      </div>

    </section>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/buat-dokumen.js') ?>"></script>
<?= $this->endSection() ?>
