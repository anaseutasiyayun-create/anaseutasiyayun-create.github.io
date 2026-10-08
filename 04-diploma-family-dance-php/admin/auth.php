<?php
require __DIR__ . '/../includes/db.php';

if (empty($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}

function admin_header(string $title, string $active): void
{
    $links = ['index.php' => 'Заявки', 'schedule.php' => 'Расписание'];
    ?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($title) ?> — админка Family Dance</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="../assets/style.css">
  <link rel="stylesheet" href="../assets/admin.css">
</head>
<body class="admin">
  <header class="admin__bar">
    <div class="container admin__bar-row">
      <a class="logo" href="../"><img class="logo__img" src="../assets/img/logo.webp" alt="Family Dance" width="53" height="44"></a>
      <nav class="admin__nav">
        <?php foreach ($links as $href => $label): ?>
          <a href="<?= $href ?>" class="<?= $active === $href ? 'is-active' : '' ?>"><?= $label ?></a>
        <?php endforeach; ?>
      </nav>
      <a href="logout.php" class="admin__logout">Выйти</a>
    </div>
  </header>
  <main class="container admin__main">
    <h1><?= e($title) ?></h1>
    <?php if ($msg = flash()): ?><div class="alert"><?= e($msg) ?></div><?php endif; ?>
    <?php
}

function admin_footer(): void
{
    echo "  </main>\n</body>\n</html>";
}
