<?php
require __DIR__ . '/includes/db.php';

$directions = $pdo->query('SELECT * FROM directions ORDER BY sort')->fetchAll();
$slots = $pdo->query(
    'SELECT s.*, d.name AS direction, d.slug
     FROM schedule s JOIN directions d ON d.id = s.direction_id
     WHERE s.is_active = 1
     ORDER BY s.weekday, s.start_time, s.hall'
)->fetchAll();

function slot_audiences(array $s): string
{
    $min = (int)$s['min_age'];
    $max = $s['max_age'] !== null ? (int)$s['max_age'] : 99;
    $list = [];
    if ($min < 12) $list[] = 'kids';
    if ($min <= 17 && $max >= 12) $list[] = 'teens';
    if ($max >= 18) $list[] = 'adults';
    return implode(',', $list);
}

function photo(string $name): string
{
    foreach (['webp', 'jpg', 'jpeg', 'png'] as $ext) {
        if (is_file(__DIR__ . "/assets/img/$name.$ext")) return "assets/img/$name.$ext";
    }
    return '';
}

function video(string $name): string
{
    return is_file(__DIR__ . "/assets/video/$name.mp4") ? "assets/video/$name.mp4" : '';
}

function ph_style(string $path): string
{
    return $path ? ' style="--img: url(\'' . $path . '\')"' : '';
}

$slotsByDirection = [];
foreach ($slots as $slot) {
    $slotsByDirection[$slot['direction_id']][] = WEEKDAYS_SHORT[$slot['weekday']] . ' ' . substr($slot['start_time'], 0, 5)
        . ' · ' . age_label((int)$slot['min_age'], $slot['max_age'] !== null ? (int)$slot['max_age'] : null)
        . ($slot['level'] === 'pro' ? ' · PRO' : '');
}
$price = (int)min(array_column($directions, 'price') ?: [3000]);

$reviews = [
    ['Варвара П.', 'Яндекс Карты', 'Чудесная школа танцев! Отличные преподаватели, много мероприятий для учеников, мастер-классы от других хореографов и всегда весёлая, дружелюбная атмосфера.'],
    ['Милана П.', 'Яндекс Карты', 'Занимаюсь уже больше года и вдохновляюсь всё больше каждый день. Место, где проблемы моментально забываются. Самый лучший коллектив!'],
    ['Александра Х.', 'Яндекс Карты', 'Безгранично благодарна школе: она вдохновила меня поступать на хореографа. Преподаватели талантливы, атмосфера шикарная. Family Dance стал вторым домом.'],
    ['Виктория С.', 'Яндекс Карты', 'Это не просто место, где учат двигаться под музыку, — это настоящий космос, где каждый шаг превращается в искусство. А какие у нас выступления!'],
    ['Дина Н.', 'Яндекс Карты', 'Самая лучшая школа танцев в Оренбурге. Никогда никого не ругают, всегда поддержат и расскажут, как правильно. С этой школой я стала птицей в свободном полёте.'],
    ['Валерия Б.', 'Яндекс Карты', 'Возвращаясь сюда, чувствуешь себя как дома. Подготовка к концертам и съёмкам даёт незабываемые эмоции и заряд энергии!'],
    ['Марина П.', 'Яндекс Карты', 'Дочка почти 2 года ходит на детскую хореографию. Сюжеты и образы в постановках всегда восхищают, а ученики искренне любят своих педагогов.'],
    ['Диана Л.', 'ВКонтакте', 'Находка для тех, кто хочет научиться или уже танцует. Хожу всего пару месяцев, и мне очень нравится! Добрые хореографы.'],
    ['Татьяна Г.', 'ВКонтакте', 'Любимая школа танцев, лучшая в городе. Здесь все очень хорошие, и всегда хочется вернуться ещё и ещё.'],
];

$gallery = ['Сцена', 'Отчётный концерт', 'Детская хореография', 'Пластика', 'Командная постановка', 'В полёте', 'За кулисами', 'Вся семья Family Dance'];
$heroPhoto = photo('hero');
$heroVideo = is_file(__DIR__ . '/assets/img/hero.mp4') ? 'assets/img/hero.mp4' : '';
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/png" href="assets/img/favicon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Dance — школа танцев в Оренбурге</title>
  <meta name="description" content="Школа танцев Family Dance в Степном, Оренбург: Choreo, Jazz Funk, Contemporary, High Heels, детская хореография. Танцы для детей от 5 лет, подростков и взрослых.">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <link rel="stylesheet" href="assets/style.css?v=<?= filemtime(__DIR__ . '/assets/style.css') ?>">
  <script>document.documentElement.classList.add('js');</script>
</head>
<body class="is-loading">

  <div class="preloader" aria-hidden="true">
    <div class="preloader__word"><?php foreach (str_split('FAMILY DANCE') as $i => $ch): ?><span style="--i: <?= $i ?>"><?= $ch === ' ' ? '&nbsp;' : $ch ?></span><?php endforeach; ?></div>
    <div class="preloader__bar"><i id="preBar"></i></div>
  </div>

  <div class="cursor" aria-hidden="true"><span class="cursor__label"></span></div>

  <header class="header">
    <div class="container header__row">
      <a class="logo" href="#top" aria-label="Family Dance — наверх">
        <img class="logo__img" src="assets/img/logo.webp" alt="Family Dance" width="67" height="56">
      </a>
      <nav class="nav" id="nav">
        <a href="#about">О нас</a>
        <a href="#directions">Направления</a>
        <a href="#reviews">Отзывы</a>
        <a href="#prices">Цены</a>
        <a href="#contacts">Контакты</a>
      </nav>
      <button class="btn btn--sm header__cta magnetic" data-modal-open="signupModal">Записаться</button>
      <button class="burger" aria-label="Меню" aria-expanded="false" aria-controls="nav"><span></span></button>
    </div>
  </header>

  <section class="hero" id="top">
    <div class="hero__media" data-parallax="0.3">
      <?php if ($heroVideo): ?>
        <video src="<?= $heroVideo ?>" autoplay muted loop playsinline <?= $heroPhoto ? 'poster="' . $heroPhoto . '"' : '' ?>></video>
      <?php elseif ($heroPhoto): ?>
        <img src="<?= $heroPhoto ?>" alt="">
      <?php else: ?>
        <div class="hero__blobs"><i></i><i></i><i></i></div>
      <?php endif; ?>
    </div>
    <div class="hero__grain" aria-hidden="true"></div>
    <div class="hero__spot" aria-hidden="true"></div>

    <div class="container hero__inner">
      <p class="hero__kicker"><span class="dot"></span>Школа танцев · Оренбург, Степной</p>
      <h1 class="hero__title" aria-label="Танцуй жизнь">
        <span class="line"><span class="word" data-letters>ТАНЦУЙ</span></span>
        <span class="line line--outline"><span class="word" data-letters>ЖИЗНЬ</span><span class="hero__script">вместе с нами</span></span>
      </h1>
      <div class="hero__bottom">
        <p class="hero__text">Не просто учим танцевать — снимаем клипы и кино, устраиваем концерты, фотосессии и вечеринки. Для детей от 5 лет, подростков и взрослых.</p>
        <div class="hero__btns">
          <button class="btn magnetic" data-modal-open="signupModal"><span>Записаться на пробный</span> →</button>
          <a href="#directions" class="btn btn--ghost magnetic">Направления</a>
        </div>
      </div>
    </div>

    <button class="badge-spin" data-modal-open="signupModal" data-cursor="го!" aria-label="Записаться на пробный урок">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <defs><path id="circlePath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs>
        <text><textPath href="#circlePath" textLength="486" lengthAdjust="spacingAndGlyphs">ПРОБНЫЙ УРОК ✦ ЗАПИШИСЬ ✦ ПРОБНЫЙ УРОК ✦ ЗАПИШИСЬ ✦ </textPath></text>
      </svg>
      <span class="badge-spin__arrow">↗</span>
    </button>

    <a href="#about" class="hero__scroll" aria-label="Листать вниз"><span></span></a>
  </section>

  <div class="ribbons" aria-hidden="true">
    <div class="ribbon ribbon--pink"><div class="ribbon__track"><?php for ($i = 0; $i < 6; $i++): ?><span>танцуй жизнь</span><b>✦</b><span>FAMILY DANCE</span><b>✦</b><?php endfor; ?></div></div>
    <div class="ribbon ribbon--light"><div class="ribbon__track ribbon__track--reverse"><?php for ($i = 0; $i < 3; $i++): foreach ($directions as $d): ?><span><?= e($d['name']) ?></span><b>✦</b><?php endforeach; endfor; ?></div></div>
  </div>

  <main>
    <section class="section manifesto" id="about">
      <div class="container">
        <p class="eyebrow" data-reveal>( о нас )</p>
        <p class="manifesto__text" data-words>Family Dance — не просто школа танцев. Мы — театр танца. Протест против скуки, выход за рамки, смешение искусств и новая реальность для каждого ученика. Наша задача — раскрыть танец внутри тебя.</p>

        <div class="manifesto__row">
          <div class="manifesto__photo ph" data-reveal <?= ph_style(photo('about')) ?>><span class="ph__label">about</span></div>
          <ul class="stats">
            <li data-reveal><b data-count="2017">0</b><span>год, с которого танцуем вместе</span></li>
            <li data-reveal><b data-count="166">0</b><span>оценок 5,0 на Яндекс Картах</span></li>
            <li data-reveal><b data-count="4800" data-suffix="+">0</b><span>человек в сообществе ВК</span></li>
            <li data-reveal><b data-count="5" data-suffix="+">0</b><span>лет — возраст, с которого можно начать</span></li>
          </ul>
        </div>

        <div class="more" data-reveal>
          <h3 class="more__title">Не просто учим <span class="hl-script">танцевать</span></h3>
          <div class="more__grid">
            <div class="more__item tilt"><span>01</span><b>Кино и клипы</b><p>Ученики снимаются в настоящих видеопроектах</p></div>
            <div class="more__item tilt"><span>02</span><b>Сцена</b><p>Отчётные концерты и выступления перед родными</p></div>
            <div class="more__item tilt"><span>03</span><b>Фотосессии</b><p>Профессиональные съёмки в образах</p></div>
            <div class="more__item tilt"><span>04</span><b>Вечеринки и мастер-классы</b><p>Ивенты школы и приглашённые хореографы</p></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section directions-sec" id="directions">
      <div class="container">
        <div class="sec-head">
          <h2 class="title" data-reveal>Направ&shy;ления</h2>
          <div class="chips" role="group" aria-label="Для кого" data-reveal>
            <button class="chip is-active" data-aud="all">Все</button>
            <?php foreach (AUDIENCES as $key => $label): ?>
              <button class="chip" data-aud="<?= $key ?>"><?= $label ?></button>
            <?php endforeach; ?>
          </div>
        </div>

        <ol class="dir-list">
          <?php foreach ($directions as $i => $d):
              $video = video($d['slug']);
              $poster = $video && is_file(__DIR__ . "/assets/video/{$d['slug']}.jpg") ? "assets/video/{$d['slug']}.jpg" : '';
              $img = photo($d['slug']) ?: $poster; ?>
            <li class="dir" data-aud="<?= e($d['audience']) ?>" data-reveal>
              <button class="dir__row" data-cursor="смотреть" data-img="<?= $img ?>" data-name="<?= e($d['name_ru']) ?>"
                      data-direction='<?= e(json_encode([
                          'id' => (int)$d['id'], 'name' => $d['name'], 'nameRu' => $d['name_ru'],
                          'ages' => $d['ages'], 'description' => $d['description'], 'img' => $img, 'video' => $video, 'poster' => $poster,
                          'slots' => $slotsByDirection[$d['id']] ?? [],
                      ], JSON_UNESCAPED_UNICODE)) ?>'>
                <span class="dir__num"><?= str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT) ?></span>
                <span class="dir__thumb ph" <?= ph_style($img) ?>><span class="ph__label"><?= e($d['name_ru']) ?></span></span>
                <span class="dir__name"><span class="dir__name-a"><?= e($d['name']) ?></span><span class="dir__name-b"><?= e($d['name_ru']) ?></span></span>
                <span class="dir__ages"><?= e($d['ages']) ?></span>
                <span class="dir__arrow">↗</span>
              </button>
            </li>
          <?php endforeach; ?>
        </ol>
      </div>
    </section>

    <section class="hscroll" id="gallery" aria-label="Галерея">
      <div class="hscroll__sticky">
        <div class="hscroll__head container">
          <h2 class="title">Это <span class="hl-script">мы</span></h2>
          <p>Концерты, съёмки, репетиции и сцена</p>
        </div>
        <div class="hscroll__track">
          <?php foreach ($gallery as $i => $caption): $n = $i + 1; ?>
            <figure class="shot shot--<?= $n % 3 ?>">
              <div class="shot__img ph" <?= ph_style(photo("gallery-$n")) ?>><span class="ph__label">gallery-<?= $n ?></span></div>
              <figcaption><span><?= str_pad((string)$n, 2, '0', STR_PAD_LEFT) ?></span><?= e($caption) ?></figcaption>
            </figure>
          <?php endforeach; ?>
          <div class="shot shot--cta">
            <p>Следующее фото — <span class="hl-script">с тобой</span></p>
            <button class="btn magnetic" data-modal-open="signupModal">Записаться</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section reviews-sec" id="reviews">
      <div class="container reviews-head">
        <h2 class="title" data-reveal>Говорят <span class="hl-script">ученики</span></h2>
        <div class="ratings" data-reveal>
          <a class="rating" href="https://yandex.ru/maps/org/69165600706/reviews/" target="_blank" rel="noopener"><b>5,0</b><span>★★★★★</span><small>166 оценок · Яндекс Карты</small></a>
        </div>
      </div>
      <?php foreach ([array_slice($reviews, 0, 5), array_slice($reviews, 5)] as $row => $list): ?>
        <div class="marquee <?= $row ? 'marquee--reverse' : '' ?>">
          <div class="marquee__track">
            <?php for ($copy = 0; $copy < 2; $copy++): foreach ($list as [$author, $source, $text]): ?>
              <figure class="review" <?= $copy ? 'aria-hidden="true"' : '' ?>>
                <span class="review__quote">“</span>
                <blockquote><?= e($text) ?></blockquote>
                <figcaption>
                  <span class="review__avatar"><?= e(mb_substr($author, 0, 1)) ?></span>
                  <span><b><?= e($author) ?></b><small><?= e($source) ?> · ★★★★★</small></span>
                </figcaption>
              </figure>
            <?php endforeach; endfor; ?>
          </div>
        </div>
      <?php endforeach; ?>
      <p class="container reviews__src" data-reveal>Настоящие отзывы учеников и родителей —
        <a href="https://yandex.ru/maps/org/69165600706/reviews/" target="_blank" rel="noopener">все отзывы на Яндекс Картах ↗</a></p>
    </section>

    <section class="section" id="prices">
      <div class="container">
        <h2 class="title" data-reveal>Цены</h2>
        <div class="prices">
          <article class="price price--main tilt" data-reveal>
            <span class="price__label">Абонемент · 8 занятий</span>
            <b class="price__sum"><span data-count="<?= $price ?>">0</span> ₽</b>
            <p>Одна цена для всех направлений — от детской хореографии до High Heels.</p>
            <button class="btn btn--light magnetic" data-modal-open="signupModal">Записаться на пробный →</button>
          </article>
          <article class="price tilt" data-reveal>
            <span class="price__label">Разовое занятие</span>
            <b class="price__sum">500 ₽</b>
            <p>Попробовать направление без абонемента.</p>
          </article>
          <article class="price tilt" data-reveal>
            <span class="price__label">Мерч «Танцую жизнь»</span>
            <b class="price__sum">2 500 ₽</b>
            <p>Печать на вашем лонгсливе или футболке с логотипом школы.</p>
          </article>
        </div>
        <div class="wear" data-reveal>
          <h3>Что взять на занятие</h3>
          <ul>
            <li><b>Всегда</b>свободная одежда, сменная обувь, вода</li>
            <li><b>Современная хореография, Contemporary</b>носочки или босиком</li>
            <li><b>High Heels</b>носочки или свои хилсы</li>
            <li><b>Choreo, Jazz Funk</b>кроссовки</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section" id="faq">
      <div class="container faq-wrap">
        <h2 class="title" data-reveal>Вопросы</h2>
        <div class="faq" data-reveal>
          <details><summary>Я никогда не танцевала. Мне можно?</summary><p>Можно. Большинство учеников приходят с нуля. На пробном уроке педагог показывает всё шаг за шагом — никто не оценивает, только поддерживают.</p></details>
          <details><summary>С какого возраста можно заниматься?</summary><p>Детская хореография — с 5 лет, детская группа современной хореографии — с 7, большинство направлений — с 12, High Heels и Lady Dance — с 18.</p></details>
          <details><summary>Сколько стоит абонемент?</summary><p>Абонемент на 8 занятий — <?= number_format($price, 0, ',', ' ') ?> ₽, разовое занятие — 500 ₽.</p></details>
          <details><summary>Можно прийти с подругой?</summary><p>Конечно! Приходите вдвоём — будет веселее. В заявке укажите имена обеих.</p></details>
          <details><summary>Записалась, но не смогу прийти — что делать?</summary><p>Обязательно предупредите администратора. Места в группах ограничены: записываясь, вы бронируете место, которое мог бы занять другой ученик.</p></details>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer" id="contacts">
    <button class="footer__cta" data-modal-open="signupModal" data-cursor="записаться">
      <span class="footer__cta-track"><?php for ($i = 0; $i < 6; $i++): ?><span>Приходи танцевать</span><b>✦</b><?php endfor; ?></span>
    </button>
    <div class="container footer__grid">
      <div class="footer__info">
        <div class="footer__col">
          <span class="eyebrow">Адрес</span>
          <p><b>ул. Джангильдина, 3, 1 этаж</b><br>Оренбург, Степной район</p>
          <a class="link" href="https://yandex.ru/maps/?rtext=~51.827373%2C55.156947&amp;rtt=auto" target="_blank" rel="noopener">Построить маршрут ↗</a>
        </div>
        <div class="footer__col">
          <span class="eyebrow">Связь</span>
          <p><b><a href="tel:+73532921561">+7 (3532) 92-15-61</a></b><br>Пн–Пт с 17:00, Сб–Вс по записи</p>
          <a class="link" href="https://t.me/familydance56" target="_blank" rel="noopener">Запись в Telegram ↗</a>
        </div>
        <div class="footer__col">
          <span class="eyebrow">Соцсети</span>
          <div class="socials">
            <a href="https://vk.ru/familyoren" target="_blank" rel="noopener">ВКонтакте</a>
            <a href="https://t.me/familydanceoren" target="_blank" rel="noopener">Telegram</a>
            <a href="https://www.tiktok.com/@familydanceoren" target="_blank" rel="noopener">TikTok</a>
            <a href="https://www.instagram.com/family_dance_oren/" target="_blank" rel="noopener">Instagram</a>
          </div>
        </div>
      </div>
      <iframe class="footer__map" title="Карта: Оренбург, ул. Джангильдина, 3" loading="lazy"
              src="https://yandex.ru/map-widget/v1/?ll=55.156947%2C51.827373&amp;z=16&amp;pt=55.156947%2C51.827373%2Cpm2rdm"></iframe>
    </div>
    <div class="container footer__bottom">
      <img class="footer__logo" src="assets/img/logo.webp" alt="Family Dance" width="143" height="120" loading="lazy">
      <span>© <?= date('Y') ?> · Дипломный проект · Фото: Юрий Тублицев · <a href="admin/">Вход для администратора</a></span>
    </div>
  </footer>

  <div class="modal" id="directionModal" hidden>
    <div class="modal__box modal__box--wide" role="dialog" aria-modal="true" aria-labelledby="dirTitle">
      <button class="modal__close" data-modal-close aria-label="Закрыть">×</button>
      <div class="dir-view">
        <div class="dir-view__img ph" id="dirImg"><span class="ph__label" id="dirImgLabel"></span><video class="dir-view__video" id="dirVideo" muted loop playsinline controls preload="none" hidden></video></div>
        <div class="dir-view__body">
          <span class="dir-view__ages" id="dirAges"></span>
          <h3 id="dirTitle"></h3>
          <p id="dirDesc"></p>
          <h4>Когда занятия</h4>
          <ul class="dir-view__slots" id="dirSlots"></ul>
          <button class="btn btn--block" id="dirSignup">Записаться на пробный →</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal" id="signupModal" hidden>
    <div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="signupTitle">
      <button class="modal__close" data-modal-close aria-label="Закрыть">×</button>
      <h3 id="signupTitle">Пробный урок</h3>
      <p class="modal__lead">Оставьте контакты — администратор свяжется с вами и забронирует место в группе.</p>
      <form id="signupForm" class="form" action="signup.php" method="post" novalidate>
        <input type="hidden" name="csrf" value="<?= csrf_token() ?>">
        <input type="hidden" name="schedule_id" value="">
        <div class="form__slot" id="chosenSlot" hidden></div>
        <label>Имя<input name="name" required maxlength="100" autocomplete="name"></label>
        <label>Телефон<input name="phone" type="tel" required placeholder="+7 900 000-00-00" autocomplete="tel"></label>
        <div class="form__row">
          <label>Возраст ученика<input name="student_age" type="number" min="<?= $config['min_age'] ?>" max="<?= $config['max_age'] ?>" inputmode="numeric" required></label>
          <label>Направление
            <select name="direction_id">
              <option value="">Пока не знаю</option>
              <?php foreach ($directions as $d): ?>
                <option value="<?= $d['id'] ?>"><?= e($d['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </label>
        </div>
        <label>Комментарий<textarea name="comment" rows="2" maxlength="500" placeholder="Например: есть опыт 2 года"></textarea></label>
        <label class="form__check"><input type="checkbox" name="agree"> Согласен(на) на обработку персональных данных</label>
        <ul class="form__errors" id="formErrors" hidden></ul>
        <button class="btn btn--block" type="submit">Записаться</button>
      </form>
      <div class="done" id="signupDone" hidden>
        <div class="done__icon">✓</div>
        <p id="signupDoneText"></p>
        <button class="btn" data-modal-close>Отлично</button>
      </div>
    </div>
  </div>

  <script>window.APP = { minAge: <?= (int)$config['min_age'] ?>, maxAge: <?= (int)$config['max_age'] ?> };</script>
  <script src="assets/app.js?v=<?= filemtime(__DIR__ . '/assets/app.js') ?>"></script>
  <script src="assets/motion.js?v=<?= filemtime(__DIR__ . '/assets/motion.js') ?>"></script>
</body>
</html>
