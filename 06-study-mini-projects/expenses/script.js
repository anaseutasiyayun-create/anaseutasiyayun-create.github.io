'use strict';
const STORAGE_KEY = 'expenses';
const CATEGORIES = {
  food: { name: 'Продукты', color: '#2f5bea' },
  cafe: { name: 'Кафе', color: '#f08c2e' },
  transport: { name: 'Транспорт', color: '#16a37f' },
  home: { name: 'Дом', color: '#8b5cf6' },
  fun: { name: 'Развлечения', color: '#e0457b' },
  other: { name: 'Другое', color: '#a3a19a' },
};

const $ = (id) => document.getElementById(id);
const money = (n) => {
  const digits = Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2;
  return n.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + ' ₽';
};
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthKey = (iso) => iso.slice(0, 7);

let expenses = load();
let month = monthKey(isoDate(new Date()));
let lastDeleted = null;
let justAdded = null;
let toastTimer;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch {}
}

function renderMonths() {
  const keys = new Set([monthKey(isoDate(new Date())), month, ...expenses.map((e) => monthKey(e.date))]);
  $('month').innerHTML = [...keys]
    .sort()
    .reverse()
    .map((k) => {
      const label = new Date(k + '-15').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      return `<option value="${k}" ${k === month ? 'selected' : ''}>${label[0].toUpperCase() + label.slice(1)}</option>`;
    })
    .join('');
}

function render() {
  renderMonths();
  const items = expenses
    .filter((e) => monthKey(e.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const total = items.reduce((sum, e) => sum + e.amount, 0);

  const byCat = Object.entries(
    items.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }), {})
  ).sort((a, b) => b[1] - a[1]);

  $('total').textContent = money(total);
  $('totalLabel').textContent = items.length
    ? `${items.length} ${plural(items.length, ['операция', 'операции', 'операций'])} за месяц`
    : 'За этот месяц расходов нет';
  $('bar').innerHTML = byCat
    .map(
      ([cat, sum]) =>
        `<i style="width:${(sum / total) * 100}%;background:${CATEGORIES[cat].color}" title="${CATEGORIES[cat].name}"></i>`
    )
    .join('');
  $('cats').innerHTML = byCat
    .map(
      ([cat, sum]) => `
  <li><span class="dot" style="background:${CATEGORIES[cat].color}"></span><span>${CATEGORIES[cat].name}</span><b>${money(sum)}</b><span>${Math.round((sum / total) * 100)}%</span></li>`
    )
    .join('');

  const list = $('list');
  list.innerHTML = '';
  if (!items.length) {
    list.innerHTML = `<div class="empty">Добавьте первый расход${expenses.length ? '' : '<button type="button" id="demo">Заполнить примером</button>'}</div>`;
    $('demo')?.addEventListener('click', fillDemo);
  }
  let lastDate = null;
  items.forEach((e) => {
    if (e.date !== lastDate) {
      lastDate = e.date;
      const g = document.createElement('p');
      g.className = 'group';
      g.textContent = new Date(e.date + 'T12:00').toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      list.append(g);
    }
    const row = document.createElement('div');
    row.className = 'item' + (e.id === justAdded ? ' is-new' : '');
    row.dataset.id = e.id;
    row.innerHTML = `<span class="dot" style="background:${CATEGORIES[e.category].color}"></span>
    <span class="item__title"><span class="t"></span><small>${CATEGORIES[e.category].name}</small></span>
    <span class="item__sum">−${money(e.amount)}</span>
    <button class="del" type="button" aria-label="Удалить">×</button>`;
    row.querySelector('.t').textContent = e.note || CATEGORIES[e.category].name;
    list.append(row);
  });
  justAdded = null;
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

$('category').innerHTML = Object.entries(CATEGORIES)
  .map(([k, c]) => `<option value="${k}">${c.name}</option>`)
  .join('');
$('date').value = isoDate(new Date());
$('date').max = isoDate(new Date());

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const amountInput = $('amount');
  const raw = amountInput.value.replace(/\s/g, '').replace(',', '.');
  const amount = /^\d+(\.\d{1,2})?$/.test(raw) ? Number(raw) : NaN;
  const date = $('date').value;
  let error = '';
  if (Number.isNaN(amount)) error = 'Введите сумму числом, например 250 или 199,90';
  else if (!(amount > 0)) error = 'Введите сумму больше нуля';
  else if (amount > 10_000_000) error = 'Слишком большая сумма';
  else if (!date) error = 'Укажите дату';
  else if (date > isoDate(new Date())) error = 'Дата не может быть в будущем';
  amountInput.setAttribute('aria-invalid', String(/сумм/i.test(error)));
  $('error').textContent = error;
  if (error) return;

  const item = {
    id: Date.now(),
    amount,
    date,
    category: $('category').value,
    note: $('note').value.trim(),
  };
  expenses.push(item);
  justAdded = item.id;
  month = monthKey(date);
  save();
  render();
  amountInput.value = '';
  $('note').value = '';
  amountInput.focus();
});

$('list').addEventListener('click', (e) => {
  const btn = e.target.closest('.del');
  if (!btn) return;
  const id = Number(btn.closest('.item').dataset.id);
  lastDeleted = expenses.find((x) => x.id === id);
  expenses = expenses.filter((x) => x.id !== id);
  save();
  render();
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $('toast').hidden = true;
  }, 4000);
});
$('undo').addEventListener('click', () => {
  if (!lastDeleted) return;
  expenses.push(lastDeleted);
  lastDeleted = null;
  $('toast').hidden = true;
  save();
  render();
});

$('month').addEventListener('change', (e) => {
  month = e.target.value;
  render();
});

function fillDemo() {
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return isoDate(d);
  };
  const sample = [
    [2350, 0, 'food', 'Продукты на неделю'],
    [420, 0, 'cafe', 'Кофе с коллегами'],
    [64, 1, 'transport', 'Автобус'],
    [1890, 2, 'home', 'Бытовая химия'],
    [900, 3, 'fun', 'Кино'],
    [1240, 4, 'food', 'Рынок'],
    [750, 5, 'cafe', 'Обед'],
    [300, 6, 'transport', 'Такси'],
    [520, 7, 'other', 'Подарок'],
  ];
  expenses = sample.map(([amount, offset, category, note], i) => ({
    id: Date.now() + i,
    amount,
    date: day(offset),
    category,
    note,
  }));
  month = monthKey(isoDate(new Date()));
  save();
  render();
}

render();
