<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="manifest" href="<?= base_url('manifest.webmanifest') ?>" />
  <meta name="theme-color" content="#2563EB" />
  <link rel="apple-touch-icon" href="<?= base_url('assets/js/images/apple-touch-icon.png') ?>" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="E-Office SKSDA" />
  <title><?= $this->renderSection('title') ?></title>
  <link rel="stylesheet" href="<?= base_url('assets/css/variables.css') ?>" />
  <link rel="stylesheet" href="<?= base_url('assets/css/base.css') ?>" />
  <link rel="stylesheet" href="<?= base_url('assets/css/layout-admin.css') ?>" />
  <?= $this->renderSection('styles') ?>
</head>
<body>

  <!-- ===== Layout bersama (dirender via JS) ===== -->
  <aside id="admin-sidebar"></aside>
  <header id="admin-navbar"></header>

  <!-- ===== Konten halaman ===== -->
  <main class="main-content">
    <?= $this->renderSection('content') ?>
  </main>

  <!-- ===== Footer ===== -->
  <footer class="admin-footer">
    <?= $footerText ?? '&copy; 2026 Balai Konservasi Sumber Daya Alam Jawa Tengah (BKSDA Jateng) - Sistem Informasi Tata Kelola Surat Elektronik' ?>
  </footer>

  <!-- ===== Skrip ===== -->
  <script src="<?= base_url('assets/js/api.js') ?>"></script>
  <script type="module" src="<?= base_url('assets/js/auth.js') ?>"></script>
  <script type="module" src="<?= base_url('assets/js/components/sidebar-admin.js') ?>"></script>
  <script type="module" src="<?= base_url('assets/js/components/navbar-admin.js') ?>"></script>
  <?= $this->renderSection('scripts') ?>
  <script src="<?= base_url('sw-register.js') ?>"></script>
</body>
</html>
