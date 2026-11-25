<?= $this->extend('layouts/admin') ?>

<?= $this->section('title') ?>
Form Surat Keluar - E-Office SKSDA
<?= $this->endSection() ?>

<?= $this->section('styles') ?>
<link rel="stylesheet" href="<?= base_url('assets/css/pages/admin-form-surat.css') ?>" />
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<form id="form-surat" novalidate>

      <!-- ===== 1. HEADER ===== -->
      <section class="page-head">
        <div class="page-head-text">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <a href="<?= base_url('admin/dashboard') ?>" class="breadcrumb-link">Dashboard</a>
            <span class="breadcrumb-sep" aria-hidden="true">&gt;</span>
            <a href="<?= base_url('admin/input-surat') ?>" class="breadcrumb-link">Surat</a>
            <span class="breadcrumb-sep" aria-hidden="true">&gt;</span>
            <a href="<?= base_url('admin/input-surat') ?>" class="breadcrumb-link">Pilih Jenis Surat</a>
            <span class="breadcrumb-sep" aria-hidden="true">&gt;</span>
            <span class="breadcrumb-current">Surat Keluar</span>
          </nav>
          <h1 class="page-title">Form Surat Keluar</h1>
          <p class="page-desc">Buat dan registrasikan naskah dinas surat keluar resmi BKSDA Jawa Tengah.</p>
        </div>
        <span class="ssl-badge"><span class="badge-dot"></span>MODE PEMBUATAN DOKUMEN</span>
      </section>

      <!-- ===== 2. SECTION A: INFORMASI SURAT ===== -->
      <section class="form-card form-card--blue">
        <div class="form-card-head">
          <div class="form-card-head-left">
            <span class="form-card-letter">A</span>
            <div>
              <h2 class="form-card-title">Informasi Surat</h2>
              <p class="form-card-sub">Atribut dasar, klasifikasi, dan nomor registrasi naskah.</p>
            </div>
          </div>
          <span class="form-badge form-badge--blue">Wajib Diisi</span>
        </div>

        <div class="form-grid form-grid--3">
          <!-- Nomor Surat (otomatis oleh sistem) -->
          <div class="form-field">
            <label class="form-label" for="nomor-surat">Nomor Surat</label>
            <div class="input-wrap has-icon">
              <span class="input-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>
              <input type="text" id="nomor-surat" placeholder="Nomor surat akan dibuat oleh sistem / otomatis" disabled />
            </div>
            <p class="form-hint">Dibuat otomatis saat surat disetujui/dikirim.</p>
          </div>

          <!-- Nomor Agenda -->
          <div class="form-field">
            <label class="form-label" for="nomor-agenda">Nomor Agenda <span class="req">*</span></label>
            <div class="input-wrap">
              <input type="text" id="nomor-agenda" placeholder="Masukkan nomor agenda" />
            </div>
            <p class="form-error" id="nomor-agenda-error" hidden>Wajib diisi</p>
          </div>

          <!-- Tanggal Surat -->
          <div class="form-field">
            <label class="form-label" for="tanggal-surat">Tanggal Surat <span class="req">*</span></label>
            <div class="input-wrap">
              <input type="date" id="tanggal-surat" value="2026-07-09" />
            </div>
            <p class="form-error" id="tanggal-surat-error" hidden>Wajib diisi</p>
          </div>

          <!-- Tujuan Surat (icon gedung di kanan) -->
          <div class="form-field span-2">
            <label class="form-label" for="tujuan-surat">Tujuan Surat / Instansi Penerima <span class="req">*</span></label>
            <div class="input-wrap has-icon-right">
              <input type="text" id="tujuan-surat" placeholder="Masukkan instansi atau penerima surat (Contoh: Direktorat Jenderal KSDAE)" />
              <span class="input-icon input-icon--right" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="9" y1="22" x2="9" y2="18"></line><line x1="15" y1="22" x2="15" y2="18"></line><line x1="9" y1="6" x2="9" y2="10"></line><line x1="15" y1="6" x2="15" y2="10"></line></svg></span>
            </div>
            <p class="form-error" id="tujuan-surat-error" hidden>Wajib diisi</p>
          </div>

          <!-- Sifat Surat -->
          <div class="form-field">
            <label class="form-label" for="sifat-surat">Sifat Surat <span class="req">*</span></label>
            <div class="input-wrap">
              <select id="sifat-surat">
                <option value="" selected disabled>Pilih Sifat Surat</option>
                <option value="biasa">Biasa</option>
                <option value="penting">Penting</option>
                <option value="segera">Segera</option>
                <option value="rahasia">Rahasia</option>
              </select>
            </div>
            <p class="form-error" id="sifat-surat-error" hidden>Wajib dipilih</p>
          </div>

          <!-- Klasifikasi Arsip -->
          <div class="form-field">
            <label class="form-label" for="klasifikasi">Klasifikasi Arsip <span class="req">*</span></label>
            <div class="input-wrap">
              <select id="klasifikasi">
                <option value="" selected disabled>Pilih Klasifikasi</option>
                <option value="000">000 - Umum</option>
                <option value="ksa-konservasi">KSA - Konservasi</option>
                <option value="ksa-perlindungan">KSA - Perlindungan</option>
                <option value="peh">PEH - Pengendali Ekosistem Hutan</option>
                <option value="polhut">POLHUT - Polisi Kehutanan</option>
              </select>
            </div>
            <p class="form-error" id="klasifikasi-error" hidden>Wajib dipilih</p>
          </div>

          <!-- Perihal Surat -->
          <div class="form-field span-2">
            <label class="form-label" for="perihal">Perihal Surat <span class="req">*</span></label>
            <div class="input-wrap">
              <input type="text" id="perihal" placeholder="Masukkan perihal surat secara ringkas dan jelas..." />
            </div>
            <p class="form-error" id="perihal-error" hidden>Wajib diisi</p>
          </div>
        </div>
      </section>

      <!-- ===== 3. SECTION B: ISI SURAT & PENANDATANGANAN ===== -->
      <section class="form-card form-card--blue">
        <div class="form-card-head">
          <div class="form-card-head-left">
            <span class="form-card-letter">B</span>
            <div>
              <h2 class="form-card-title">Isi Surat &amp; Penandatanganan</h2>
              <p class="form-card-sub">Penyusunan substansi naskah dinas dan pejabat penanggung jawab.</p>
            </div>
          </div>
        </div>

        <div class="form-grid form-grid--2b">
          <!-- KIRI: editor isi surat -->
          <div class="form-field">
            <label class="form-label" for="editor-body">Ringkasan / Isi Surat <span class="req">*</span></label>
            <div class="editor" id="editor">
              <div class="editor-toolbar" role="toolbar" aria-label="Format teks">
                <button type="button" class="editor-btn" data-cmd="bold" title="Tebal"><span class="tb-bold">B</span></button>
                <button type="button" class="editor-btn" data-cmd="italic" title="Miring"><span class="tb-italic">I</span></button>
                <button type="button" class="editor-btn" data-cmd="underline" title="Garis bawah"><span class="tb-underline">U</span></button>
                <button type="button" class="editor-btn" data-cmd="insertUnorderedList" title="Daftar poin">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                </button>
                <button type="button" class="editor-btn" data-cmd="insertOrderedList" title="Daftar bernomor"><span class="tb-bold">1.</span></button>
                <button type="button" class="editor-btn" data-cmd="justifyLeft" title="Rata kiri">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="15" y2="12"></line><line x1="3" y1="18" x2="18" y2="18"></line></svg>
                </button>
                <button type="button" class="editor-btn" data-cmd="justifyFull" title="Rata kanan-kiri">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
              </div>
              <div class="editor-body" id="editor-body" contenteditable="true" data-placeholder="Tuliskan ringkasan atau isi surat secara lengkap di sini..." role="textbox" aria-multiline="true" aria-label="Isi surat"></div>
            </div>
            <p class="form-hint">Gunakan format penulisan naskah dinas resmi sesuai tata naskah BKSDA.</p>
            <p class="form-error" id="editor-body-error" hidden>Wajib diisi</p>
          </div>

          <!-- KANAN: penandatanganan -->
          <div class="form-field">
            <label class="form-label" for="penandatangan">Penandatanganan <span class="req">*</span></label>
            <div class="input-wrap">
              <select id="penandatangan">
                <option value="" selected disabled>Pilih Pejabat Penandatangan</option>
                <option value="darmanto">Ir. Darmanto, M.Si. - Kepala Balai</option>
                <option value="sari">Dra. Sari Wulandari - Sekretaris Balai</option>
              </select>
            </div>
            <p class="form-error" id="penandatangan-error" hidden>Wajib dipilih</p>

            <label class="form-label" style="margin-top:14px">Jabatan Penandatangan</label>
            <div class="readonly-box">
              <span id="jabatan-text">Otomatis mengikuti pejabat terpilih</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>

            <!-- Info box TTE -->
            <div class="info-box" style="margin-top:14px">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <div>
                <p class="info-box-title">Informasi TTE</p>
                <p class="info-box-text">Surat yang dikirim akan otomatis masuk ke antrean Tanda Tangan Elektronik (TTE) pejabat terkait melalui integrasi BSRE.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== 4. SECTION C: LAMPIRAN DOKUMEN PENDUKUNG ===== -->
      <section class="form-card form-card--blue">
        <div class="form-card-head">
          <div class="form-card-head-left">
            <span class="form-card-letter">C</span>
            <div>
              <h2 class="form-card-title">Lampiran Dokumen Pendukung</h2>
              <p class="form-card-sub">Unggah berkas pendukung naskah dinas (PDF, JPG, PNG, DOCX).</p>
            </div>
          </div>
        </div>

        <!-- Area drag & drop -->
        <div class="dropzone" id="dropzone">
          <span class="dropzone-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
          </span>
          <p class="dropzone-title">Seret berkas ke sini atau klik untuk mengunggah</p>
          <p class="dropzone-sub">PDF, JPG, PNG, DOCX - Maksimal 15MB per berkas</p>
          <button type="button" class="btn btn--outline" id="browse-btn">Pilih Berkas</button>
          <input type="file" id="file-input" accept=".pdf,.jpg,.jpeg,.png,.docx" hidden />
        </div>

        <!-- Daftar berkas terlampir -->
        <div class="attachment-section">
          <h3 class="attachment-title">Berkas Terlampir (<span id="attachment-count">2</span>)</h3>
          <div id="attachment-list"></div>
        </div>
      </section>

      <!-- ===== 5. TOMBOL BAWAH ===== -->
      <div class="form-actions form-actions--split">
        <div class="form-actions-group">
          <button type="button" class="btn btn--outline" id="btn-cancel">Batal</button>
          <button type="button" class="btn btn--muted-outline" id="btn-draft">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Simpan Draft
          </button>
        </div>
        <div class="form-actions-group">
          <button type="submit" class="btn btn--primary" id="btn-send">Simpan &amp; Kirim &#9656;</button>
        </div>
      </div>

    </form>
<?= $this->endSection() ?>

<?= $this->section('scripts') ?>
<script type="module" src="<?= base_url('assets/js/pages/form-surat-keluar.js') ?>"></script>
<?= $this->endSection() ?>
