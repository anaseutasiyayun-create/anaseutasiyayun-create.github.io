<?php
declare(strict_types=1);

session_start();

$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
        $config['db_user'],
        $config['db_pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    exit('Ошибка подключения к базе данных. Проверьте includes/config.php и импортируйте schema.sql.');
}

function e(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_check(): void
{
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        http_response_code(419);
        exit('Сессия устарела. Обновите страницу.');
    }
}

function flash(?string $message = null): ?string
{
    if ($message !== null) {
        $_SESSION['flash'] = $message;
        return null;
    }
    $msg = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $msg;
}

const WEEKDAYS      = [1 => 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const WEEKDAYS_SHORT = [1 => 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const AUDIENCES     = ['kids' => 'Для детей', 'teens' => 'Для подростков', 'adults' => 'Для взрослых'];
const LEVELS        = ['beginner' => 'Для начинающих', 'pro' => 'PRO, только с опытом', 'kids' => 'Детская группа'];
const HALLS         = ['Зал 1', 'Зал 2', 'Зал 3'];

function age_label(int $min, ?int $max): string
{
    return $max ? "{$min}–{$max} лет" : "{$min}+";
}

function audience_of(int $min, ?int $max): string
{
    if ($max !== null && $max < 12) return 'kids';
    return $min >= 16 ? 'adults' : 'teens';
}
const APP_STATUSES  = ['new' => 'Новая', 'contacted' => 'Связались', 'trial' => 'Записан на пробное', 'enrolled' => 'Занимается', 'cancelled' => 'Отказ'];

function time_range(string $start, int $duration): string
{
    $from = DateTime::createFromFormat('H:i:s', $start) ?: DateTime::createFromFormat('H:i', $start);
    $to = (clone $from)->modify("+{$duration} minutes");
    return $from->format('H:i') . '–' . $to->format('H:i');
}
