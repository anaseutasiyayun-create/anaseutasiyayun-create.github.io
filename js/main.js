'use strict';
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PROJECTS = [
    {
      url: '04-diploma-family-dance-php/demo/index.html',
      name: 'Family Dance',
      desc: 'Сайт школы танцев с админ-панелью: направления и время занятий из базы данных, онлайн-запись на пробное занятие с проверкой на клиенте и сервере, управление заявками и расписанием. Дипломный проект, реальные данные и фото школы.',
      type: 'Диплом',
      year: '2025',
      stack: 'PHP · MySQL · JS',
      img: 'img/previews/family-dance.webp',
      wide: true,
      hot: true,
      pos: 'center',
    },
    {
      url: '01-inter-auto/index.html',
      name: 'Интер-Авто',
      desc: 'Сайт автотехцентра по ремонту АКПП: концепция, дизайн, адаптивная вёрстка и интерактив. Отзывы и карта из Яндекс Бизнеса, быстрый звонок с телефона.',
      type: 'Коммерческий',
      year: '2026',
      stack: 'HTML · CSS · JS',
      img: 'img/previews/inter-auto.webp',
    },
    {
      url: '03-photographer/index.html',
      name: 'SHUKLINA',
      desc: 'Портфолио фотографа: видео на первом экране, горизонтальная лента серий, сравнение «цвет — ч/б», галерея с фильтром.',
      type: 'Фриланс',
      year: '2025',
      stack: 'HTML · CSS · JS',
      img: 'img/previews/photographer.webp',
    },
    {
      url: '02-online-school/index.html',
      name: 'CodeStart',
      desc: 'Лендинг онлайн-школы программирования: слайдер, аккордеон, форма заявки с валидацией.',
      type: 'Фриланс',
      year: '2025',
      stack: 'HTML · CSS · JS',
      img: 'img/previews/online-school.webp',
    },
    {
      url: '05-practice-taskboard-node/demo/index.html',
      name: 'TaskBoard',
      desc: 'Канбан-доска: REST API на Node.js и Express, перетаскивание с анимацией, фильтры, тёмная тема, горячие клавиши, тесты валидации.',
      type: 'Практика',
      year: '2025',
      stack: 'Node.js · Express',
      img: 'img/previews/taskboard.webp',
    },
    {
      url: '06-study-mini-projects/index.html',
      name: 'Мини-проекты',
      desc: 'Три приложения на чистом JavaScript: список дел, учёт расходов и калькулятор.',
      type: 'Учёба',
      year: '2024',
      stack: 'JS · localStorage',
      img: 'img/previews/mini-projects.webp',
    },
    {
      url: '07-first-steps/landing/index.html',
      name: 'Зелёный дом',
      desc: 'Первый лендинг — анимации только на CSS, без JavaScript.',
      type: 'Учёба',
      year: '2024',
      stack: 'HTML · CSS',
      img: 'img/previews/first-steps.webp',
    },
  ];
  $('#projects-list').innerHTML = PROJECTS.map(
    (p, i) => `
<a class="card reveal${p.wide ? ' card--wide' : ''}" href="${p.url}" style="--d:${(i % 2) * 0.1}s">
  <div class="card__media"><img src="${p.img}?v=9"${p.pos ? ` style="object-position:${p.pos}"` : ''} alt="Превью сайта ${p.name}" loading="lazy" width="1600" height="1000">${p.wide ? `<span class="card__badge">Главный проект</span>` : ''}<span class="card__num">${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}</span></div>
  <div class="card__body">
    <div>
      <div class="card__title"><h3>${p.name}</h3><span aria-hidden="true">↗</span></div>
      <p class="card__desc">${p.desc}</p>
    </div>
    <div class="specs">
      <div class="label">Тип<b class="${p.hot ? 'hot' : ''}">${p.type}</b></div>
      <div class="label">Год<b>${p.year}</b></div>
      <div class="label">Стек<b>${p.stack}</b></div>
    </div>
  </div>
</a>`
  ).join('');

  requestAnimationFrame(() => document.body.classList.add('is-ready'));
  setTimeout(() => document.body.classList.add('is-ready'), 150);
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      }),
    { threshold: 0.12 }
  );
  $$('.reveal').forEach((el) => (reduce ? el.classList.add('is-in') : io.observe(el)));

  const bar = $('#progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
  onScroll();
})();
