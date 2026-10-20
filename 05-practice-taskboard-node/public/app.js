'use strict';

const PRIORITY = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
const STATUS = { todo: 'К выполнению', progress: 'В работе', done: 'Готово' };
const ORDER = ['todo', 'progress', 'done'];
const TEAM = [
  { name: 'Анастасия', color: '#c8f04a' },
  { name: 'Илья', color: '#9ec5ff' },
  { name: 'Марина', color: '#ffb3c7' },
];
const TAG_COLORS = ['#2f7de1', '#8b4fd8', '#d9480f', '#0f9d76', '#c2255c', '#a07400', '#4c63e0'];
const KNOWN_TAGS = {
  вёрстка: '#2f7de1',
  дизайн: '#c2255c',
  js: '#a07400',
  api: '#8b4fd8',
  ux: '#0f9d76',
  тесты: '#d9480f',
  скорость: '#4c63e0',
  документация: '#5f7a3a',
};

const $ = (id) => document.getElementById(id);
const board = $('board');
const dialog = $('taskDialog');
const form = $('taskForm');
const formErrors = $('formErrors');
const deleteBtn = $('deleteBtn');
const searchInput = $('search');

let tasks = [];
let editingId = null;
const filters = { q: '', priority: '', tag: '', assignee: '' };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Ошибка запроса');
    err.details = data.errors;
    throw err;
  }
  return data;
}

function toast(text, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = text;
  $('toasts').append(el);
  setTimeout(() => el.classList.add('is-leaving'), 2600);
  setTimeout(() => el.remove(), 3000);
}

const escapeHTML = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.codePointAt(0)) >>> 0, 7);
const tagColor = (tag) => KNOWN_TAGS[tag] || TAG_COLORS[hash(tag) % TAG_COLORS.length];
const memberColor = (name) =>
  (TEAM.find((m) => m.name === name) || { color: TAG_COLORS[hash(name) % TAG_COLORS.length] }).color;
const tagHTML = (tag) => `<span class="tag" style="--tc:${tagColor(tag)}">${escapeHTML(tag)}</span>`;
const avatarHTML = (name) =>
  name
    ? `<span class="avatar" style="--c:${memberColor(name)}" title="${escapeHTML(name)}">${escapeHTML(name.slice(0, 1).toUpperCase())}</span>`
    : '<span class="avatar avatar--empty" title="Не назначен">?</span>';

const parseDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const today = () => new Date(new Date().setHours(0, 0, 0, 0));
const daysLeft = (task) => Math.round((parseDate(task.deadline) - today()) / 864e5);
const isOverdue = (t) => t.deadline && t.status !== 'done' && daysLeft(t) < 0;

function deadlineHTML(task) {
  if (!task.deadline) return '';
  const days = daysLeft(task);
  const label =
    { '-1': 'вчера', 0: 'сегодня', 1: 'завтра' }[days] ??
    parseDate(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
  const active = task.status !== 'done';
  const cls = active && days < 0 ? 'is-overdue' : active && days <= 2 ? 'is-soon' : '';
  return `<span class="deadline ${cls}" title="Дедлайн"><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2"/></svg>${label}</span>`;
}

function cardHTML(t) {
  return `
    <article class="card card--${t.status}" draggable="true" data-id="${t.id}" tabindex="0"
      aria-label="${escapeHTML(t.title)}. ${PRIORITY[t.priority]} приоритет">
      ${t.tags.length ? `<div class="card__tags">${t.tags.map(tagHTML).join('')}</div>` : ''}
      <h3 class="card__title">${escapeHTML(t.title)}</h3>
      ${t.description ? `<p class="card__desc">${escapeHTML(t.description)}</p>` : ''}
      <div class="card__foot">
        <span class="prio prio--${t.priority}" title="${PRIORITY[t.priority]} приоритет"><i></i><i></i><i></i></span>
        ${deadlineHTML(t)}
        ${avatarHTML(t.assignee)}
      </div>
    </article>`;
}

const matches = (t) => {
  const q = filters.q.toLowerCase();
  return (
    (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) &&
    (!filters.priority || t.priority === filters.priority) &&
    (!filters.tag || t.tags.includes(filters.tag)) &&
    (!filters.assignee || t.assignee === filters.assignee)
  );
};
const hasFilters = () => Object.values(filters).some(Boolean);

function render() {
  const before = new Map(
    [...board.querySelectorAll('.card')].map((el) => [el.dataset.id, el.getBoundingClientRect()])
  );
  const filtered = tasks.filter(matches);

  board.querySelectorAll('.column').forEach((col) => {
    const status = col.dataset.status;
    const items = filtered.filter((t) => t.status === status);
    col.querySelector('.column__count').textContent = items.length;
    col.querySelector('.column__list').innerHTML = items.length
      ? items.map(cardHTML).join('')
      : `<p class="column__empty">${hasFilters() ? 'Нет задач по фильтру' : 'Перетащите задачу сюда'}</p>`;
    const wip = col.querySelector('.wip');
    if (wip) {
      const n = tasks.filter((t) => t.status === status).length;
      wip.textContent = `${n} / ${col.dataset.limit}`;
      wip.classList.toggle('is-over', n > Number(col.dataset.limit));
    }
  });

  if (!reduceMotion) {
    board.querySelectorAll('.card').forEach((el) => {
      const prev = before.get(el.dataset.id);
      const now = el.getBoundingClientRect();
      if (!prev) {
        if (before.size)
          el.animate(
            [
              { opacity: 0, transform: 'scale(.96)' },
              { opacity: 1, transform: 'none' },
            ],
            { duration: 250, easing: 'ease-out' }
          );
        return;
      }
      const dx = prev.left - now.left;
      const dy = prev.top - now.top;
      if (!dx && !dy) return;
      el.classList.add('is-moving');
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: 420,
        easing: 'cubic-bezier(.2, .8, .2, 1)',
      }).finished.then(
        () => el.classList.remove('is-moving'),
        () => {}
      );
    });
  }

  renderStats();
  renderFilters();
}

function renderStats() {
  const done = tasks.filter((t) => t.status === 'done').length;
  const overdue = tasks.filter(isOverdue).length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  $('stats').innerHTML = `
    <span class="ring" style="--p:${percent}" role="img" aria-label="Выполнено ${percent}%"></span>
    <span>Готово <b>${done} из ${tasks.length}</b></span>
    ${overdue ? `<span class="overdue">Просрочено: <b class="overdue">${overdue}</b></span>` : ''}`;
}

function renderFilters() {
  const names = [...new Set([...TEAM.map((m) => m.name), ...tasks.map((t) => t.assignee).filter(Boolean)])];
  const team = $('team');
  team.classList.toggle('has-filter', Boolean(filters.assignee));
  team.innerHTML = names
    .map(
      (
        n
      ) => `<button type="button" data-assignee="${escapeHTML(n)}" class="${filters.assignee === n ? 'is-active' : ''}"
    aria-pressed="${filters.assignee === n}" title="Задачи: ${escapeHTML(n)}">${avatarHTML(n)}</button>`
    )
    .join('');

  const tags = [...new Set(tasks.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b, 'ru'));
  const tagFilter = $('tagFilter');
  tagFilter.classList.toggle('has-filter', Boolean(filters.tag));
  tagFilter.innerHTML = tags
    .map(
      (
        tag
      ) => `<button type="button" data-tag="${escapeHTML(tag)}" class="${filters.tag === tag ? 'is-active' : ''}"
    aria-pressed="${filters.tag === tag}">${tagHTML(tag)}</button>`
    )
    .join('');
  $('tagList').innerHTML = tags.map((tag) => `<option value="${escapeHTML(tag)}">`).join('');
}

async function load() {
  try {
    tasks = (await api('/api/tasks')).map((t) => ({ tags: [], assignee: null, ...t }));
    render();
  } catch {
    board.innerHTML = '<p class="error">Не удалось загрузить задачи. Сервер запущен?</p>';
  }
}

$('priorityFilter').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  filters.priority = btn.dataset.priority;
  $('priorityFilter')
    .querySelectorAll('button')
    .forEach((b) => b.classList.toggle('is-active', b === btn));
  render();
});
$('tagFilter').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  filters.tag = filters.tag === btn.dataset.tag ? '' : btn.dataset.tag;
  render();
});
$('team').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  filters.assignee = filters.assignee === btn.dataset.assignee ? '' : btn.dataset.assignee;
  render();
});
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.q = searchInput.value.trim();
    render();
  }, 150);
});
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchInput.value = '';
    filters.q = '';
    searchInput.blur();
    render();
  }
});

$('assigneeSelect').innerHTML += TEAM.map((m) => `<option value="${m.name}">${m.name}</option>`).join('');

function openForm(task = null, status = 'todo') {
  editingId = task?.id ?? null;
  form.reset();
  formErrors.hidden = true;
  $('dialogTitle').textContent = task ? 'Редактирование' : 'Новая задача';
  deleteBtn.hidden = !task;
  form.status.value = status;
  if (task) {
    form.title.value = task.title;
    form.description.value = task.description;
    form.status.value = task.status;
    form.priority.value = task.priority;
    form.deadline.value = task.deadline || '';
    form.assignee.value = task.assignee || '';
    form.tags.value = task.tags.join(', ');
  }
  dialog.showModal();
  form.title.focus();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(form));
  body.deadline = body.deadline || null;
  body.tags = body.tags
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const errors = [];
  if (body.title.trim().length < 3) errors.push('Название: минимум 3 символа');
  if (body.tags.length > 5) errors.push('Теги: не больше 5');
  if (errors.length) {
    formErrors.innerHTML = errors.map((m) => `<li>${m}</li>`).join('');
    formErrors.hidden = false;
    return;
  }

  try {
    if (editingId) {
      const updated = await api(`/api/tasks/${editingId}`, { method: 'PATCH', body });
      tasks = tasks.map((t) => (t.id === editingId ? updated : t));
      toast('Задача обновлена');
    } else {
      const created = await api('/api/tasks', { method: 'POST', body });
      tasks.unshift(created);
      toast('Задача создана');
    }
    dialog.close();
    render();
  } catch (err) {
    formErrors.innerHTML = (err.details || [err.message]).map((m) => `<li>${escapeHTML(m)}</li>`).join('');
    formErrors.hidden = false;
  }
});

form.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
    e.preventDefault();
    form.requestSubmit();
  }
});

deleteBtn.addEventListener('click', async () => {
  if (!confirm('Удалить задачу?')) return;
  try {
    await api(`/api/tasks/${editingId}`, { method: 'DELETE' });
    tasks = tasks.filter((t) => t.id !== editingId);
    dialog.close();
    render();
    toast('Задача удалена');
  } catch (err) {
    toast(err.message, 'err');
  }
});

$('cancelBtn').addEventListener('click', () => dialog.close());
$('closeBtn').addEventListener('click', () => dialog.close());
$('addBtn').addEventListener('click', () => openForm());
document.querySelectorAll('dialog').forEach((d) => {
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-close]')) d.close();
  });
});

board.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) return openForm(null, add.dataset.add);
  const card = e.target.closest('.card');
  if (card) openForm(tasks.find((t) => t.id === Number(card.dataset.id)));
});

async function moveTask(task, status) {
  if (!task || task.status === status) return;
  const prev = task.status;
  task.status = status;
  render();
  try {
    Object.assign(task, await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: { status } }));
    const col = board.querySelector(`.column[data-status="${status}"]`);
    if (col.dataset.limit && tasks.filter((t) => t.status === status).length > Number(col.dataset.limit)) {
      toast(`В работе больше ${col.dataset.limit} задач — лимит превышен`, 'err');
    } else {
      toast(status === 'done' ? 'Задача выполнена' : `Перенесено: ${STATUS[status]}`);
    }
  } catch {
    task.status = prev;
    render();
    toast('Не удалось перенести задачу', 'err');
  }
}

let draggedId = null;
board.addEventListener('dragstart', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  draggedId = Number(card.dataset.id);
  card.classList.add('is-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', card.dataset.id);
});
board.addEventListener('dragend', (e) => {
  e.target.closest('.card')?.classList.remove('is-dragging');
  board.querySelectorAll('.is-over').forEach((c) => c.classList.remove('is-over'));
});
board.addEventListener('dragover', (e) => {
  const col = e.target.closest('.column');
  if (!col) return;
  e.preventDefault();
  board.querySelectorAll('.column').forEach((c) => c.classList.toggle('is-over', c === col));
});
board.addEventListener('drop', (e) => {
  const col = e.target.closest('.column');
  if (!col || draggedId === null) return;
  e.preventDefault();
  const task = tasks.find((t) => t.id === draggedId);
  draggedId = null;
  board.querySelectorAll('.is-over').forEach((c) => c.classList.remove('is-over'));
  moveTask(task, col.dataset.status);
});

board.addEventListener('keydown', async (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const task = tasks.find((t) => t.id === Number(card.dataset.id));
  if (e.key === 'Enter') return openForm(task);
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  const next = ORDER[ORDER.indexOf(task.status) + (e.key === 'ArrowRight' ? 1 : -1)];
  if (!next) return;
  await moveTask(task, next);
  board.querySelector(`.card[data-id="${task.id}"]`)?.focus();
});

function toggleTheme() {
  const dark = getComputedStyle(document.documentElement).colorScheme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  try {
    localStorage.setItem('taskboard-theme', document.documentElement.dataset.theme);
  } catch {}
}
$('themeBtn').addEventListener('click', toggleTheme);
$('helpBtn').addEventListener('click', () => $('helpDialog').showModal());

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.code === 'KeyN') {
    e.preventDefault();
    openForm();
  } else if (e.code === 'KeyT') toggleTheme();
  else if (e.code === 'Slash' && e.shiftKey) $('helpDialog').showModal();
  else if (e.code === 'Slash') {
    e.preventDefault();
    searchInput.focus();
  }
});

load();
