<?php
require __DIR__ . '/../includes/db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $stmt = $pdo->prepare('SELECT * FROM admins WHERE login = ?');
    $stmt->execute([trim($_POST['login'] ?? '')]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($_POST['password'] ?? '', $admin['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin_id'] = $admin['id'];
        header('Location: index.php');
        exit;
    }
    $error = 'Неверный логин или пароль';
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход — админка Family Dance</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="../assets/style.css">
  <link rel="stylesheet" href="../assets/admin.css">
</head>
<body class="admin admin--login">
  <form class="form login" method="post">
    <a class="logo" href="../"><img class="logo__img" src="../assets/img/logo-dark.webp" alt="Family Dance" width="67" height="56"></a>
    <h1>Вход для администратора</h1>
    <?php if ($error): ?><div class="form__errors"><?= e($error) ?></div><?php endif; ?>
    <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
    <label>Логин<input name="login" required autofocus value="<?= e($_POST['login'] ?? '') ?>"></label>
    <label>Пароль<input name="password" type="password" required></label>
    <button class="btn btn--block">Войти</button>
  </form>
</body>
</html>
