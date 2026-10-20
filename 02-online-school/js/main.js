'use strict';

const codeLines = [
  'import random',
  '',
  'secret = random.randint(1, 100)',
  'tries = 0',
  '',
  'while True:',
  '    guess = int(input("Твоё число: "))',
  '    tries += 1',
  '    if guess == secret:',
  '        print(f"Победа за {tries} попыток!")',
  '        break',
  '    print("Больше" if guess < secret else "Меньше")',
];

function typeCode(el, text, speed = 28) {
  let i = 0;
  (function step() {
    el.textContent = text.slice(0, i) + (i < text.length ? '▍' : '');
    if (i++ < text.length) setTimeout(step, text[i - 1] === '\n' ? speed * 6 : speed);
  })();
}
const typed = document.getElementById('typed');
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) typed.textContent = codeLines.join('\n');
else typeCode(typed, codeLines.join('\n'));

const ageButtons = document.querySelectorAll('.age-filter button');
const courses = document.querySelectorAll('.course');

ageButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    ageButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
    const age = btn.dataset.age;
    courses.forEach((card) => {
      const match = age === 'all' || card.dataset.ages.split(' ').includes(age);
      card.classList.toggle('is-hidden', !match);
    });
  });
});

courses.forEach((card) => {
  card.addEventListener('click', () => {
    document.getElementById('course').value = card.querySelector('h3').textContent;
    document.getElementById('signup').scrollIntoView({ behavior: 'smooth' });
  });
});

class Slider {
  constructor(root, dotsRoot) {
    this.root = root;
    this.track = root.querySelector('.slider__track');
    this.slides = [...this.track.children];
    this.dotsRoot = dotsRoot;
    this.index = 0;

    document.querySelector('[data-slide="prev"]').addEventListener('click', () => this.go(this.index - 1));
    document.querySelector('[data-slide="next"]').addEventListener('click', () => this.go(this.index + 1));
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.go(this.index - 1);
      if (e.key === 'ArrowRight') this.go(this.index + 1);
    });
    root.tabIndex = 0;

    this.enableDrag();
    window.addEventListener('resize', () => this.go(this.index));
    this.go(0);
  }

  get perView() {
    const w = window.innerWidth;
    return w >= 1024 ? 3 : w >= 680 ? 2 : 1;
  }

  get max() {
    return this.slides.length - this.perView;
  }

  go(i) {
    this.index = Math.max(0, Math.min(i, this.max));
    const slideWidth = this.slides[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(this.track).gap) || 0;
    this.track.style.transform = `translateX(${-this.index * (slideWidth + gap)}px)`;
    this.renderDots();
  }

  renderDots() {
    this.dotsRoot.innerHTML = '';
    for (let i = 0; i <= this.max; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Слайд ${i + 1}`);
      if (i === this.index) dot.className = 'is-active';
      dot.addEventListener('click', () => this.go(i));
      this.dotsRoot.append(dot);
    }
  }

  enableDrag() {
    let startX = 0;
    let dragging = false;
    this.track.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      this.track.setPointerCapture(e.pointerId);
    });
    this.track.addEventListener('pointerup', (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) this.go(this.index + (dx < 0 ? 1 : -1));
    });
  }
}
new Slider(document.getElementById('slider'), document.getElementById('sliderDots'));

document.querySelectorAll('.acc__head').forEach((head) => {
  head.addEventListener('click', () => {
    const item = head.parentElement;
    const isOpen = item.classList.contains('is-open');

    document.querySelectorAll('.acc__item.is-open').forEach((openItem) => {
      openItem.classList.remove('is-open');
      openItem.querySelector('.acc__head').setAttribute('aria-expanded', 'false');
      openItem.querySelector('.acc__body').style.maxHeight = null;
    });

    if (!isOpen) {
      const body = item.querySelector('.acc__body');
      item.classList.add('is-open');
      head.setAttribute('aria-expanded', 'true');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

function nextDeadline() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
}
const deadline = nextDeadline();
const countdown = document.getElementById('countdown');
function plural(n, forms) {
  const n10 = n % 10,
    n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}
function tickCountdown() {
  const diff = Math.max(0, deadline - Date.now());
  const d = Math.floor(diff / 864e5);
  const h = Math.floor(diff / 36e5) % 24;
  const m = Math.floor(diff / 6e4) % 60;
  countdown.textContent = `${d} ${plural(d, ['день', 'дня', 'дней'])} ${h} ч ${String(m).padStart(2, '0')} мин`;
}
tickCountdown();
setInterval(tickCountdown, 30000);

const form = document.getElementById('form');
const statusEl = document.getElementById('formStatus');

const rules = {
  parent: (v) => (/^[А-Яа-яЁёA-Za-z\s-]{2,}$/.test(v.trim()) ? '' : 'Введите имя буквами, минимум 2 символа'),
  phone: (v) => {
    const digits = v.replace(/\D/g, '');
    return /^[78]\d{10}$/.test(digits) ? '' : 'Номер должен содержать 11 цифр, начиная с 7 или 8';
  },
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Проверьте email, например name@mail.ru',
  age: (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 10 && n <= 17 ? '' : 'Курсы для детей от 10 до 17 лет';
  },
};

function setError(input, message) {
  const box = input.closest('.field > div, .field').querySelector('.field__error');
  box.textContent = message;
  input.classList.toggle('invalid', !!message);
  input.classList.toggle('valid', !message && input.value !== '');
  input.setAttribute('aria-invalid', !!message);
}

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener('blur', () => setError(input, rules[name](input.value)));
  input.addEventListener('input', () => {
    if (input.classList.contains('invalid')) setError(input, rules[name](input.value));
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let firstInvalid = null;

  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    const msg = rules[name](input.value);
    setError(input, msg);
    if (msg && !firstInvalid) firstInvalid = input;
  });

  const agreeError = document.getElementById('agreeError');
  agreeError.textContent = form.agree.checked ? '' : 'Необходимо согласие';
  if (!form.agree.checked && !firstInvalid) firstInvalid = form.agree;

  if (firstInvalid) {
    firstInvalid.focus();
    statusEl.textContent = '';
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Отправляем…';

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const data = Object.fromEntries(new FormData(form));
    localStorage.setItem('codestart-lead', JSON.stringify({ ...data, date: new Date().toISOString() }));
    form.reset();
    form.querySelectorAll('.valid').forEach((el) => el.classList.remove('valid'));
    statusEl.className = 'form__status is-success';
    statusEl.textContent = `Спасибо, ${data.parent}! Менеджер позвонит в течение 15 минут в рабочее время.`;
  } catch {
    statusEl.className = 'form__status is-error';
    statusEl.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.';
  } finally {
    button.disabled = false;
    button.textContent = 'Записаться';
  }
});

const header = document.querySelector('.header');
window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 10), {
  passive: true,
});
