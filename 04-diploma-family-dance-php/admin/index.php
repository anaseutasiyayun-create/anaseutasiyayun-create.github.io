<?php
require __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $id = (int)($_POST['id'] ?? 0);

    if (($_POST['action'] ?? '') === 'status' && isset(APP_STATUSES[$_POST['status'] ?? ''])) {
        $pdo->prepare('UPDATE applications SET status = ? WHERE id = ?')->execute([$_POST['status'], $id]);
        flash("Статус заявки №$id обновлён");
    }
    if (($_POST['action'] ?? '') === 'delete') {
        $pdo->prepare('DELETE FROM applications WHERE id = ?')->execute([$id]);
        flash("Заявка №$id удалена");
    }
    header('Location: index.php?' . http_build_query(array_intersect_key($_GET, ['status' => 1, 'direction' => 1, 'q' => 1])));
    exit;
}

$where = [];
$params = [];
$filterStatus = $_GET['status'] ?? '';
$filterDirection = (int)($_GET['direction'] ?? 0);
$q = trim($_GET['q'] ?? '');

if (isset(APP_STATUSES[$filterStatus])) {
    $where[] = 'a.status = ?';
    $params[] = $filterStatus;
}
if ($filterDirection) {
    $where[] = 'a.direction_id = ?';
    $params[] = $filterDirection;
}
if ($q !== '') {
    $digits = preg_replace('/\D/', '', $q);
    $where[] = $digits !== '' ? '(a.name LIKE ? OR a.phone LIKE ?)' : 'a.name LIKE ?';
    $params[] = "%$q%";
    if ($digits !== '') $params[] = "%$digits%";
}

$stmt = $pdo->prepare(
    'SELECT a.*, d.name AS direction, s.weekday, s.start_time, s.duration
     FROM applications a
     LEFT JOIN directions d ON d.id = a.direction_id
     LEFT JOIN schedule s ON s.id = a.schedule_id'
    . ($where ? ' WHERE ' . implode(' AND ', $where) : '') .
    ' ORDER BY a.created_at DESC LIMIT 300'
);
$stmt->execute($params);
$apps = $stmt->fetchAll();

$directions = $pdo->query('SELECT id, name FROM directions ORDER BY sort')->fetchAll();

$stats = $pdo->query(
    "SELECT
        SUM(status = 'new') AS new_count,
        SUM(created_at >= CURDATE()) AS today,
        SUM(status = 'trial') AS trial,
        SUM(status = 'enrolled') AS enrolled,
        COUNT(*) AS total
     FROM applications"
)->fetch();
$conversion = $stats['total'] ? round($stats['enrolled'] / $stats['total'] * 100) : 0;

$popular = $pdo->query(
    'SELECT d.name, COUNT(a.id) AS cnt
     FROM directions d LEFT JOIN applications a ON a.direction_id = d.id
     GROUP BY d.id ORDER BY cnt DESC'
)->fetchAll();
$maxCnt = max(array_column($popular, 'cnt') ?: [1]) ?: 1;

admin_header('Заявки', 'index.php');
?>
<div class="stats">
  <div class="stat stat--accent"><b><?= (int)$stats['new_count'] ?></b>новых, ждут звонка</div>
  <div class="stat"><b><?= (int)$stats['today'] ?></b>пришло сегодня</div>
  <div class="stat"><b><?= (int)$stats['trial'] ?></b>записаны на пробное</div>
  <div class="stat"><b><?= $conversion ?>%</b>заявок стали учениками</div>
</div>

<div class="popular">
  <h2>Интерес по направлениям</h2>
  <?php foreach ($popular as $p): ?>
    <div class="popular__row">
      <span><?= e($p['name']) ?></span>
      <div class="popular__bar"><i style="width: <?= round($p['cnt'] / $maxCnt * 100) ?>%"></i></div>
      <b><?= (int)$p['cnt'] ?></b>
    </div>
  <?php endforeach; ?>
</div>

<form class="filters" method="get">
  <input type="search" name="q" value="<?= e($q) ?>" placeholder="Имя или телефон">
  <select name="status">
    <option value="">Все статусы</option>
    <?php foreach (APP_STATUSES as $key => $label): ?>
      <option value="<?= $key ?>" <?= $filterStatus === $key ? 'selected' : '' ?>><?= $label ?></option>
    <?php endforeach; ?>
  </select>
  <select name="direction">
    <option value="">Все направления</option>
    <?php foreach ($directions as $d): ?>
      <option value="<?= $d['id'] ?>" <?= $filterDirection === (int)$d['id'] ? 'selected' : '' ?>><?= e($d['name']) ?></option>
    <?php endforeach; ?>
  </select>
  <button class="btn btn--sm">Показать</button>
  <a href="index.php" class="btn btn--sm btn--light">Сбросить</a>
</form>

<?php if (!$apps): ?>
  <p class="muted">Заявок не найдено.</p>
<?php else: ?>
<div class="table-wrap">
  <table class="table">
    <thead><tr><th>№</th><th>Пришла</th><th>Имя</th><th>Телефон</th><th>Возраст</th><th>Направление / занятие</th><th>Комментарий</th><th>Статус</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($apps as $a): ?>
      <tr class="<?= $a['status'] === 'cancelled' ? 'is-muted' : '' ?>">
        <td><?= $a['id'] ?></td>
        <td class="nowrap"><?= date('d.m H:i', strtotime($a['created_at'])) ?></td>
        <td><?= e($a['name']) ?></td>
        <td class="nowrap"><a href="tel:+<?= e($a['phone']) ?>">+<?= e($a['phone']) ?></a></td>
        <td><?= (int)$a['student_age'] ?></td>
        <td>
          <?php if ($a['direction']): ?>
            <span class="dot"></span><?= e($a['direction']) ?>
            <?php if ($a['weekday']): ?><br><span class="muted"><?= WEEKDAYS_SHORT[$a['weekday']] ?>, <?= time_range($a['start_time'], (int)$a['duration']) ?></span><?php endif; ?>
          <?php else: ?><span class="muted">не выбрано</span><?php endif; ?>
        </td>
        <td class="muted"><?= e($a['comment']) ?></td>
        <td>
          <form method="post" class="inline">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <input type="hidden" name="id" value="<?= $a['id'] ?>">
            <input type="hidden" name="action" value="status">
            <select name="status" class="badge badge--<?= $a['status'] ?>" onchange="this.form.submit()" aria-label="Статус заявки">
              <?php foreach (APP_STATUSES as $key => $label): ?>
                <option value="<?= $key ?>" <?= $a['status'] === $key ? 'selected' : '' ?>><?= $label ?></option>
              <?php endforeach; ?>
            </select>
          </form>
        </td>
        <td>
          <form method="post" class="inline" onsubmit="return confirm('Удалить заявку №<?= $a['id'] ?>?')">
            <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
            <input type="hidden" name="id" value="<?= $a['id'] ?>">
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
<?php admin_footer();
