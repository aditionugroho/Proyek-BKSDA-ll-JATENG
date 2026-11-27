<?= $this->extend('layouts/pegawai') ?>

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
        <p class="pgs-desc">Isi laporan patroli lapangan langsung dari HP  tanggal, wilayah, temuan, dan foto.</p>
      </div>
    </section>

    <!-- ===== 2. FORM LAPORAN ===== -->
    <section class="pt-card" aria-label="Form laporan patroli">
      <div class="pt-card-head">
        <div>
          <h2 class="pt-card-title">Buat Laporan Patroli</h2>
          <p class="pt-card-sub">Nama petugas tercatat otomatis dari akun yang login.</p>
        </div>
      </div>

      <form id="pt-form" novalidate>
        <div class="pt-field" id="wrap-tanggal">
          <label class="pt-label" for="pt-tanggal">Tanggal Patroli <span class="req">*</span></label>
          <input type="date" class="pt-input" id="pt-tanggal" />
          <p class="pt-error" id="pt-tanggal-error" hidden>Wajib diisi</p>
        </div>

        <div class="pt-field" id="wrap-resort">
          <label class="pt-label" for="pt-resort">Wilayah / Resort <span class="req">*</span></label>
          <select class="pt-select" id="pt-resort">
            <option value="" selected disabled>Pilih wilayah patroli...</option>
            <option value="Cilacap">Resort Cilacap</option>
            <option value="Wonosobo">Resort Wonosobo</option>
            <option value="Pemalang">Resort Pemalang</option>
          </select>
          <p class="pt-error" id="pt-resort-error" hidden>Wajib dipilih</p>
        </div>

        <div class="pt-field" id="wrap-catatan">
          <label class="pt-label" for="pt-catatan">Catatan / Temuan <span class="req">*</span></label>
          <textarea class="pt-textarea" id="pt-catatan" rows="4" placeholder="Tuliskan hasil pengamatan, temuan, atau kejadian selama patroli..."></textarea>
          <p class="pt-error" id="pt-catatan-error" hidden>Wajib diisi</p>
        </div>

        <div class="pt-field">
          <label class="pt-label">Foto Dokumentasi</label>
          <div class="pt-dropzone" id="pt-dropzone" role="button" tabindex="0" aria-label="Tambah foto">
            <svg width="26" height="26" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            <span><strong>Ketuk untuk ambil / pilih foto</strong><br />Bisa lebih dari satu (maks. 5 foto)</span>
          </div>
          <input type="file" id="pt-foto" accept="image/*" multiple hidden />
          <div class="pt-foto-grid" id="pt-foto-grid"></div>
          <p class="pt-foto-count" id="pt-foto-count"></p>
        </div>

        <button type="submit" class="pt-btn pt-btn--primary pt-btn--block" id="pt-submit">
          Kirim Laporan Patroli
        </button>
      </form>
    </section>

    <!-- ===== 3. RIWAYAT LAPORAN SAYA ===== -->
    <section class="pt-card" aria-label="Riwayat laporan patroli">
      <div class="pt-card-head">
        <div>
          <h2 class="pt-card-title">Riwayat Laporan Saya</h2>
          <p class="pt-card-sub">Laporan tersimpan dan terkait wilayah serta petugas.</p>
        </div>
      </div>
      <div class="pt-table-wrap">
        <table class="pt-table">
          <thead>
            <tr>
              <th>Tanggal</th>
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
<script type="module" src="<?= base_url('assets/js/pages/laporan-patroli-pg.js') ?>"></script>
<?= $this->endSection() ?>
