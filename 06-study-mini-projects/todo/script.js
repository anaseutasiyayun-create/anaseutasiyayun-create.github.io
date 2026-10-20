'use strict';
const STORAGE_KEY = 'todo-items';
const list = document.getElementById('list');
const input = document.getElementById('input');
let filter = 'all';
let todos = load();
let justAdded = null;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {}
}
function plural(n, forms) {
  const i =
    n % 10 === 1 && n % 100 !== 11
      ? 0
      : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)
        ? 1
        : 2;
  return forms[i];
}

function render() {
  const visible = todos.filter((t) => filter === 'all' || (filter === 'done' ? t.done : !t.done));
  list.innerHTML = '';
  if (!visible.length) {
    list.innerHTML = `<li class="empty">${todos.length ? 'Здесь пусто' : 'Добавьте первую задачу'}</li>`;
  }
  visible.forEach((todo) => {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    li.className = (todo.done ? 'done' : '') + (todo.id === justAdded ? ' is-new' : '');
    li.innerHTML = `
    <button class="check" aria-label="Отметить выполненной" aria-pressed="${todo.done}"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7"/></svg></button>
    <span class="text"></span>
    <button class="del" aria-label="Удалить">×</button>`;
    li.querySelector('.text').textContent = todo.text;
    list.append(li);
  });
  justAdded = null;
  const left = todos.filter((t) => !t.done).length;
  document.getElementById('counter').textContent = todos.length
    ? left
      ? `Осталось ${left} ${plural(left, ['задача', 'задачи', 'задач'])}`
      : 'Всё сделано'
    : '';
}

document.getElementById('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return input.focus();
  const todo = { id: Date.now(), text, done: false };
  todos.unshift(todo);
  justAdded = todo.id;
  input.value = '';
  save();
  render();
});

list.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = Number(li.dataset.id);
  if (e.target.closest('.check')) {
    const todo = todos.find((t) => t.id === id);
    todo.done = !todo.done;
    save();
    li.classList.toggle('done', todo.done);
    setTimeout(render, filter === 'all' ? 300 : 400);
  } else if (e.target.closest('.del')) {
    li.classList.add('is-gone');
    li.addEventListener(
      'animationend',
      () => {
        todos = todos.filter((t) => t.id !== id);
        save();
        render();
      },
      { once: true }
    );
  }
});

list.addEventListener('dblclick', (e) => {
  const span = e.target.closest('.text');
  if (!span) return;
  const li = span.parentElement;
  const todo = todos.find((t) => t.id === Number(li.dataset.id));
  const edit = document.createElement('input');
  edit.className = 'edit';
  edit.value = todo.text;
  edit.maxLength = 120;
  span.replaceWith(edit);
  edit.focus();
  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    if (commit && edit.value.trim()) todo.text = edit.value.trim();
    save();
    render();
  };
  edit.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') finish(true);
    if (ev.key === 'Escape') finish(false);
  });
  edit.addEventListener('blur', () => finish(true));
});

document.getElementById('filters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-filter]');
  if (!btn) return;
  filter = btn.dataset.filter;
  document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('active', b === btn));
  render();
});

document.getElementById('clear').addEventListener('click', () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

document.getElementById('date').textContent = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
render();
