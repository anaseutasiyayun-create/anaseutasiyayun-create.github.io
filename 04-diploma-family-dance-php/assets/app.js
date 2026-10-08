'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const burger = $('.burger');
const nav = $('#nav');
function setMenu(open) {
  nav.classList.toggle('is-open', open);
  burger.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
}
burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') setMenu(false);
});

let lastFocus = null;

function openModal(id) {
  $$('.modal.is-open').forEach((m) => closeModal(m, false));
  const modal = document.getElementById(id);
  lastFocus = lastFocus || document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
  $('input:not([type=hidden]), button', modal).focus();
}

function closeModal(modal, restoreFocus = true) {
  modal.classList.remove('is-open');
  modal.hidden = true;
  document.body.style.overflow = '';
  if (restoreFocus) {
    lastFocus?.focus();
    lastFocus = null;
  }
  if (modal.id === 'signupModal') resetSignup();
  $$('video', modal).forEach((v) => v.pause());
}

document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-modal-open]');
  if (opener) {
    lastFocus = opener;
    if (opener.dataset.modalOpen === 'signupModal') prepareSignup({ directionId: opener.dataset.direction });
    openModal(opener.dataset.modalOpen);
  }
  if (e.target.closest('[data-modal-close]') || e.target.classList.contains('modal')) {
    closeModal(e.target.closest('.modal'));
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $$('.modal.is-open').forEach((m) => closeModal(m));
});

$$('.chips .chip').forEach((chip) =>
  chip.addEventListener('click', () => {
    $$('.chips .chip').forEach((c) => c.classList.toggle('is-active', c === chip));
    const aud = chip.dataset.aud;
    $$('.dir').forEach((row) => {
      row.hidden = aud !== 'all' && !row.dataset.aud.split(',').includes(aud);
    });
  })
);

let currentDirection = null;

$$('.dir__row').forEach((row) =>
  row.addEventListener('click', () => {
    currentDirection = JSON.parse(row.dataset.direction);
    const img = $('#dirImg');
    img.style.setProperty('--img', currentDirection.img ? `url('${currentDirection.img}')` : 'none');
    img.classList.toggle('ph--empty', !currentDirection.img);
    $('#dirImgLabel').textContent = currentDirection.nameRu;
    const video = $('#dirVideo');
    video.hidden = !currentDirection.video;
    img.classList.toggle('has-video', !!currentDirection.video);
    if (currentDirection.video) {
      video.poster = currentDirection.poster || '';
      video.src = currentDirection.video;
      video.onloadedmetadata = () =>
        video.classList.toggle('is-vertical', video.videoHeight > video.videoWidth);
      video.play().catch(() => {});
    } else {
      video.removeAttribute('src');
      video.load();
    }
    $('#dirAges').textContent = currentDirection.ages;
    $('#dirTitle').textContent = currentDirection.name;
    $('#dirDesc').textContent = currentDirection.description;
    const list = $('#dirSlots');
    list.innerHTML = '';
    (currentDirection.slots.length
      ? currentDirection.slots
      : ['Расписание уточняйте у администратора']
    ).forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      list.append(li);
    });
    lastFocus = row;
    openModal('directionModal');
  })
);

$('#dirSignup').addEventListener('click', () => {
  prepareSignup({ directionId: currentDirection.id });
  openModal('signupModal');
});

const form = $('#signupForm');
const errorsBox = $('#formErrors');
const chosenSlot = $('#chosenSlot');

function prepareSignup({ directionId = '', slot = null } = {}) {
  form.schedule_id.value = slot ? slot.id : '';
  form.direction_id.value = slot ? slot.directionId : directionId || '';
  form.direction_id.disabled = !!slot;
  chosenSlot.hidden = !slot;
  if (slot) {
    chosenSlot.innerHTML = `<b></b><span></span><button type="button" aria-label="Убрать занятие">×</button>`;
    $('b', chosenSlot).textContent = slot.direction;
    $('span', chosenSlot).textContent = `${slot.day}, ${slot.time} · ${slot.age}`;
    $('button', chosenSlot).addEventListener('click', () => prepareSignup({ directionId: slot.directionId }));
  }
}

function resetSignup() {
  form.hidden = false;
  $('#signupDone').hidden = true;
  showErrors([]);
}

function showErrors(list) {
  errorsBox.innerHTML = '';
  list.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    errorsBox.append(li);
  });
  errorsBox.hidden = list.length === 0;
}

function clientValidate() {
  const errors = [];
  if (form.name.value.trim().length < 2) errors.push('Укажите имя');
  if (!/^[78]\d{10}$/.test(form.phone.value.replace(/\D/g, '')))
    errors.push('Телефон должен содержать 11 цифр');
  const age = Number(form.student_age.value);
  if (!Number.isInteger(age) || age < APP.minAge || age > APP.maxAge)
    errors.push(`Принимаем учеников от ${APP.minAge} лет`);
  if (!form.agree.checked) errors.push('Нужно согласие на обработку персональных данных');
  return errors;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errors = clientValidate();
  showErrors(errors);
  if (errors.length) return;

  const btn = $('[type=submit]', form);
  btn.disabled = true;
  btn.textContent = 'Отправляем…';
  const data = new FormData(form);
  if (form.direction_id.disabled) data.set('direction_id', form.direction_id.value);

  try {
    const res = await fetch(form.action, { method: 'POST', body: data });
    const json = await res.json();
    if (!json.ok) {
      showErrors(json.errors);
      return;
    }
    form.reset();
    prepareSignup();
    form.hidden = true;
    $('#signupDoneText').textContent = json.message;
    $('#signupDone').hidden = false;
  } catch {
    showErrors(['Сервер недоступен. Позвоните нам, пожалуйста.']);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Записаться';
  }
});

const header = $('.header');
window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 10), {
  passive: true,
});
