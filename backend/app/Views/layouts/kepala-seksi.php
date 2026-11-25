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
  <link rel="stylesheet" href="<?= base_url('assets/css/layout-ks.css') ?>" />
  <?= $this->renderSection('styles') ?>
</head>
<body>

  <!-- ===== Layout bersama (dirender via JS) ===== -->
  <aside id="ks-sidebar"></aside>
  <header id="ks-navbar"></header>

  <!-- ===== Konten halaman ===== -->
  <main class="main-content">
    <?= $this->renderSection('content') ?>
  </main>

  <!-- ===== Footer ===== -->
  <footer class="ks-footer">
    <?= $footerText ?? '&copy; 2026 e-Office SKSDA Jawa Tengah. All rights reserved.' ?>
  </footer>

  <!-- ===== Skrip ===== -->
  <script src="<?= base_url('assets/js/api.js') ?>"></script>
  <script type="module" src="<?= base_url('assets/js/auth.js') ?>"></script>
  <script type="module" src="<?= base_url('assets/js/components/sidebar-ks.js') ?>"></script>
  <script type="module" src="<?= base_url('assets/js/components/navbar-ks.js') ?>"></script>
  <?= $this->renderSection('scripts') ?>
  <script src="<?= base_url('sw-register.js') ?>"></script>
</body>
</html>
