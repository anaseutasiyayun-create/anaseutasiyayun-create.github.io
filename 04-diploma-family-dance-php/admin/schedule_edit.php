<?php
require __DIR__ . '/auth.php';

$id = (int)($_GET['id'] ?? 0);
$directions = $pdo->query('SELECT id, name FROM directions ORDER BY sort')->fetchAll();

$slot = [
    'direction_id' => $directions[0]['id'] ?? 0, 'weekday' => 1, 'start_time' => '18:00', 'duration' => 60,
    'min_age' => 12, 'max_age' => null, 'level' => 'beginner', 'hall' => HALLS[0], 'is_active' => 1,
];

if ($id) {
    $stmt = $pdo->prepare('SELECT * FROM schedule WHERE id = ?');
    $stmt->execute([$id]);
    $slot = $stmt->fetch() ?: exit('Занятие не найдено');
    $slot['start_time'] = substr($slot['start_time'], 0, 5);
}

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $slot = [
        'direction_id' => (int)($_POST['direction_id'] ?? 0),
        'weekday'      => (int)($_POST['weekday'] ?? 0),
        'start_time'   => $_POST['start_time'] ?? '',
        'duration'     => (int)($_POST['duration'] ?? 0),
        'min_age'      => (int)($_POST['min_age'] ?? 0),
        'max_age'      => ($_POST['max_age'] ?? '') === '' ? null : (int)$_POST['max_age'],
        'level'        => $_POST['level'] ?? '',
        'hall'         => $_POST['hall'] ?? '',
        'is_active'    => isset($_POST['is_active']) ? 1 : 0,
    ];

    if (!in_array($slot['direction_id'], array_column($directions, 'id'))) $errors[] = 'Выберите направление';
    if (!isset(WEEKDAYS[$slot['weekday']])) $errors[] = 'Выберите день недели';
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $slot['start_time'])) $errors[] = 'Укажите время начала';
    if ($slot['duration'] < 30 || $slot['duration'] > 180) $errors[] = 'Длительность — от 30 до 180 минут';
    if ($slot['min_age'] < $config['min_age'] || $slot['min_age'] > $config['max_age']) $errors[] = "Минимальный возраст — от {$config['min_age']} лет";
    if ($slot['max_age'] !== null && $slot['max_age'] < $slot['min_age']) $errors[] = 'Максимальный возраст меньше минимального';
    if (!isset(LEVELS[$slot['level']])) $errors[] = 'Выберите тип группы';
    if (!in_array($slot['hall'], HALLS, true)) $errors[] = 'Выберите зал';

    if (!$errors) {
        $stmt = $pdo->prepare(
            "SELECT d.name, s.start_time FROM schedule s JOIN directions d ON d.id = s.direction_id
             WHERE s.weekday = ? AND s.id <> ? AND s.is_active = 1 AND s.hall = ?
               AND s.start_time < ADDTIME(?, SEC_TO_TIME(? * 60))
               AND ADDTIME(s.start_time, SEC_TO_TIME(s.duration * 60)) > ?"
        );
        $stmt->execute([$slot['weekday'], $id, $slot['hall'], $slot['start_time'], $slot['duration'], $slot['start_time']]);
        foreach ($stmt->fetchAll() as $c) {
            $errors[] = "Пересечение: «{$slot['hall']}» занят — {$c['name']} в " . substr($c['start_time'], 0, 5);
        }
    }

    if (!$errors) {
        $data = [$slot['direction_id'], $slot['weekday'], $slot['start_time'], $slot['duration'], $slot['min_age'], $slot['max_age'], $slot['level'], $slot['hall'], $slot['is_active']];
        if ($id) {
            $pdo->prepare('UPDATE schedule SET direction_id=?, weekday=?, start_time=?, duration=?, min_age=?, max_age=?, level=?, hall=?, is_active=? WHERE id=?')
                ->execute([...$data, $id]);
            flash('Изменения сохранены');
        } else {
            $pdo->prepare('INSERT INTO schedule (direction_id, weekday, start_time, duration, min_age, max_age, level, hall, is_active) VALUES (?,?,?,?,?,?,?,?,?)')
                ->execute($data);
            flash('Занятие добавлено в расписание');
        }
        header('Location: schedule.php');
        exit;
    }
}

function options(array $items, $selected): string
{
    $html = '';
    foreach ($items as $value => $label) {
        $sel = (string)$value === (string)$selected ? ' selected' : '';
        $html .= '<option value="' . e((string)$value) . '"' . $sel . '>' . e($label) . '</option>';
    }
    return $html;
}

admin_header($id ? 'Редактирование занятия' : 'Новое занятие', 'schedule.php');
?>
<form class="form form--admin" method="post">
  <?php if ($errors): ?>
    <ul class="form__errors"><?php foreach ($errors as $err): ?><li><?= e($err) ?></li><?php endforeach; ?></ul>
  <?php endif; ?>
  <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
  <div class="form__row">
    <label>Направление<select name="direction_id"><?= options(array_column($directions, 'name', 'id'), $slot['direction_id']) ?></select></label>
    <label>Тип группы<select name="level"><?= options(LEVELS, $slot['level']) ?></select></label>
  </div>
  <div class="form__row form__row--3">
    <label>День недели<select name="weekday"><?= options(WEEKDAYS, $slot['weekday']) ?></select></label>
    <label>Начало<input type="time" name="start_time" value="<?= e($slot['start_time']) ?>" required></label>
    <label>Длительность, мин<input type="number" name="duration" min="30" max="180" step="15" value="<?= (int)$slot['duration'] ?>"></label>
  </div>
  <div class="form__row form__row--3">
    <label>Возраст от<input type="number" name="min_age" min="<?= $config['min_age'] ?>" max="<?= $config['max_age'] ?>" value="<?= (int)$slot['min_age'] ?>"></label>
    <label>Возраст до <small>(пусто — без ограничения)</small><input type="number" name="max_age" min="<?= $config['min_age'] ?>" max="<?= $config['max_age'] ?>" value="<?= $slot['max_age'] !== null ? (int)$slot['max_age'] : '' ?>"></label>
    <label>Зал<select name="hall"><?= options(array_combine(HALLS, HALLS), $slot['hall']) ?></select></label>
  </div>
  <label class="form__check"><input type="checkbox" name="is_active" <?= $slot['is_active'] ? 'checked' : '' ?>> Показывать на сайте</label>
  <div class="form__actions">
    <button class="btn">Сохранить</button>
    <a href="schedule.php" class="btn btn--light">Отмена</a>
  </div>
</form>
<?php admin_footer();
