<?php
require __DIR__ . '/includes/db.php';

header('Content-Type: application/json; charset=utf-8');

function respond(int $code, array $data): never
{
    http_response_code($code);
    exit(json_encode($data, JSON_UNESCAPED_UNICODE));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'errors' => ['Метод не поддерживается']]);
}
if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
    respond(419, ['ok' => false, 'errors' => ['Сессия устарела, обновите страницу']]);
}

$name        = trim($_POST['name'] ?? '');
$phone       = preg_replace('/\D/', '', $_POST['phone'] ?? '');
$age         = filter_var($_POST['student_age'] ?? '', FILTER_VALIDATE_INT);
$directionId = (int)($_POST['direction_id'] ?? 0) ?: null;
$scheduleId  = (int)($_POST['schedule_id'] ?? 0) ?: null;
$comment     = trim($_POST['comment'] ?? '');

$errors = [];

if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    $errors[] = 'Укажите имя (от 2 до 100 символов)';
}
if (!preg_match('/^[78]\d{10}$/', $phone)) {
    $errors[] = 'Телефон должен содержать 11 цифр';
}
if ($age === false || $age < $config['min_age'] || $age > $config['max_age']) {
    $errors[] = "Принимаем учеников от {$config['min_age']} лет";
}
if (empty($_POST['agree'])) {
    $errors[] = 'Нужно согласие на обработку персональных данных';
}
if (mb_strlen($comment) > 500) {
    $errors[] = 'Комментарий — не длиннее 500 символов';
}

if ($scheduleId) {
    $stmt = $pdo->prepare('SELECT direction_id, min_age, max_age FROM schedule WHERE id = ? AND is_active = 1');
    $stmt->execute([$scheduleId]);
    $slot = $stmt->fetch();
    if (!$slot) {
        $errors[] = 'Выбранное занятие больше не проводится, выберите другое';
    } else {
        $directionId = (int)$slot['direction_id'];
        $max = $slot['max_age'] !== null ? (int)$slot['max_age'] : null;
        if ($age !== false && ($age < (int)$slot['min_age'] || ($max !== null && $age > $max))) {
            $errors[] = 'Это занятие для возраста ' . age_label((int)$slot['min_age'], $max) . ' — администратор подберёт подходящую группу';
        }
    }
} elseif ($directionId) {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM directions WHERE id = ?');
    $stmt->execute([$directionId]);
    if (!$stmt->fetchColumn()) $directionId = null;
}

if ($errors) {
    respond(422, ['ok' => false, 'errors' => $errors]);
}

$stmt = $pdo->prepare('SELECT COUNT(*) FROM applications WHERE phone = ? AND created_at > NOW() - INTERVAL 1 DAY');
$stmt->execute([$phone]);
if ((int)$stmt->fetchColumn() >= $config['apps_per_phone_per_day']) {
    respond(429, ['ok' => false, 'errors' => ['Мы уже получили ваши заявки и скоро перезвоним']]);
}

$stmt = $pdo->prepare(
    'INSERT INTO applications (name, phone, student_age, direction_id, schedule_id, comment) VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$name, $phone, $age, $directionId, $scheduleId, $comment ?: null]);

respond(200, [
    'ok'      => true,
    'id'      => (int)$pdo->lastInsertId(),
    'message' => "{$name}, спасибо! Заявка №{$pdo->lastInsertId()} принята — администратор свяжется с вами и забронирует место на пробном уроке.",
]);
