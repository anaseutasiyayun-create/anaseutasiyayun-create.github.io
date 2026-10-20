<?php
require __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $id = (int)($_POST['id'] ?? 0);
    switch ($_POST['action'] ?? '') {
        case 'toggle':
            $pdo->prepare('UPDATE schedule SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
            flash('Видимость занятия изменена');
            break;
        case 'delete':
            $pdo->prepare('DELETE FROM schedule WHERE id = ?')->execute([$id]);
            flash('Занятие удалено из расписания');
            break;
    }
    header('Location: schedule.php');
    exit;
}

$slots = $pdo->query(
    'SELECT s.*, d.name AS direction,
            (SELECT COUNT(*) FROM applications a WHERE a.schedule_id = s.id) AS apps
     FROM schedule s
     JOIN directions d ON d.id = s.direction_id
     ORDER BY s.weekday, s.start_time, s.hall'
)->fetchAll();

$byDay = [];
foreach ($slots as $s) {
    $byDay[$s['weekday']][] = $s;
}

admin_header('Расписание', 'schedule.php');
?>
<p><a href="schedule_edit.php" class="btn">+ Добавить занятие</a></p>

<?php foreach (WEEKDAYS as $n => $dayName): ?>
  <h2 class="day-title"><?= $dayName ?></h2>
  <?php if (empty($byDay[$n])): ?>
    <p class="muted">Занятий нет</p>
  <?php else: ?>
  <div class="table-wrap">
    <table class="table">
      <thead><tr><th>Время</th><th>Направление</th><th>Возраст</th><th>Группа</th><th>Зал</th><th>Заявок</th><th>На сайте</th><th></th></tr></thead>
      <tbody>
      <?php foreach ($byDay[$n] as $s): ?>
        <tr class="<?= $s['is_active'] ? '' : 'is-muted' ?>">
          <td class="nowrap"><b><?= time_range($s['start_time'], (int)$s['duration']) ?></b></td>
          <td><?= e($s['direction']) ?></td>
          <td><?= age_label((int)$s['min_age'], $s['max_age'] !== null ? (int)$s['max_age'] : null) ?></td>
          <td><?= LEVELS[$s['level']] ?></td>
          <td><?= e($s['hall']) ?></td>
          <td><?= (int)$s['apps'] ?></td>
          <td>
            <form method="post" class="inline">
              <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
              <input type="hidden" name="id" value="<?= $s['id'] ?>">
              <input type="hidden" name="action" value="toggle">
              <button class="switch <?= $s['is_active'] ? 'is-on' : '' ?>" aria-label="Показывать на сайте"></button>
            </form>
          </td>
          <td class="actions">
            <a class="icon-btn" href="schedule_edit.php?id=<?= $s['id'] ?>" title="Редактировать">✏️</a>
            <form method="post" class="inline" onsubmit="return confirm('Удалить занятие из расписания?')">
              <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
              <input type="hidden" name="id" value="<?= $s['id'] ?>">
              <input type="hidden" name="action" value="delete">
              <button class="icon-btn" title="Удалить">🗑</button>
            </form>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php endif; ?>
<?php endforeach; ?>
<?php admin_footer();
