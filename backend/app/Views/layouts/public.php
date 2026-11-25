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
  <?= $this->renderSection('styles') ?>
</head>
<body>
  <?= $this->renderSection('content') ?>

  <?= $this->renderSection('scripts') ?>
  <script src="<?= base_url('sw-register.js') ?>"></script>
</body>
</html>
