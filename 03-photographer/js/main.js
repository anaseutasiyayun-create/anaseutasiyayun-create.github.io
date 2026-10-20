const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const heroVideo = document.querySelector('.hero__video');
if (reduceMotion) {
  heroVideo.removeAttribute('autoplay');
  heroVideo.pause();
}

const header = document.querySelector('.header');
const onScrollHeader = () =>
  header.classList.toggle('is-scrolled', window.scrollY > window.innerHeight * 0.8);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const series = document.querySelector('.series');
const track = document.querySelector('.series__track');
const horizontalMode = () => !reduceMotion && window.innerWidth > 760;

function seriesDistance() {
  const last = track.lastElementChild;
  const gutter = parseFloat(getComputedStyle(track).paddingLeft);
  return Math.max(last.offsetLeft + last.offsetWidth + gutter - window.innerWidth, 0);
}

function sizeSeries() {
  if (!horizontalMode()) {
    series.style.height = '';
    track.style.transform = '';
    return;
  }
  series.style.height = `${window.innerHeight + seriesDistance()}px`;
  moveSeries();
}

function moveSeries() {
  if (!horizontalMode()) return;
  const distance = seriesDistance();
  const progress = Math.min(Math.max(-series.getBoundingClientRect().top / distance, 0), 1);
  track.style.transform = `translate3d(${-progress * distance}px, 0, 0)`;
}

let ticking = false;
window.addEventListener(
  'scroll',
  () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      moveSeries();
      ticking = false;
    });
  },
  { passive: true }
);
window.addEventListener('resize', sizeSeries);
window.addEventListener('load', sizeSeries);
sizeSeries();
onScrollHeader();

const compare = document.querySelector('.compare');
const range = compare.querySelector('.compare__range');
range.addEventListener('input', () => compare.style.setProperty('--pos', `${range.value}%`));

const aboutVideo = document.querySelector('.about__media video');
if (!reduceMotion) {
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) aboutVideo.play().catch(() => {});
      else aboutVideo.pause();
    },
    { threshold: 0.3 }
  ).observe(aboutVideo);
}

const filters = document.querySelectorAll('.filter');
const items = document.querySelectorAll('.gallery li');
filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    filters.forEach((b) => {
      b.classList.toggle('is-active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    items.forEach((li) => {
      li.hidden = cat !== 'all' && li.dataset.cat !== cat;
    });
  });
});

const lightbox = document.querySelector('.lightbox');
const lightboxImg = lightbox.querySelector('.lightbox__img');
let group = [];
let current = 0;

function show(index) {
  current = (index + group.length) % group.length;
  lightboxImg.src = group[current].src;
  lightboxImg.alt = group[current].alt;
}

function open(img, list) {
  group = list;
  show(list.indexOf(img));
  lightbox.showModal();
}

items.forEach((li) => {
  li.querySelector('.gallery__item').addEventListener('click', () => {
    const visible = [...items].filter((x) => !x.hidden).map((x) => x.querySelector('img'));
    open(li.querySelector('img'), visible);
  });
});

const storyImages = [...document.querySelectorAll('.story img[data-zoom]')];
storyImages.forEach((img) => img.addEventListener('click', () => open(img, storyImages)));

lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
lightbox.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.close();
});
lightbox.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});

let touchX = null;
lightbox.addEventListener(
  'touchstart',
  (e) => {
    touchX = e.touches[0].clientX;
  },
  { passive: true }
);
lightbox.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

const cursor = document.querySelector('.cursor');
if (window.matchMedia('(hover: hover)').matches) {
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  });
  document.querySelectorAll('.gallery__item, .story img').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
  });
}
