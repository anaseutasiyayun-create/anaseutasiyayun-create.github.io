'use strict';
const SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const state = { current: '0', previous: null, operator: null, fresh: false };
let history = [];
try {
  history = JSON.parse(localStorage.getItem('calc-history') || '[]');
} catch {}
const saveHistory = () => {
  try {
    localStorage.setItem('calc-history', JSON.stringify(history));
  } catch {}
};

const valueEl = document.getElementById('value');
const exprEl = document.getElementById('expr');

const format = (str) => {
  if (str === 'Ошибка') return 'Ошибка';
  const [int, dec] = str.split('.');
  const pretty = Number(int).toLocaleString('ru-RU');
  return (int.startsWith('-') && pretty === '0' ? '-0' : pretty) + (dec !== undefined ? ',' + dec : '');
};

function compute(a, b, op) {
  a = parseFloat(a);
  b = parseFloat(b);
  let r;
  switch (op) {
    case '+':
      r = a + b;
      break;
    case '-':
      r = a - b;
      break;
    case '*':
      r = a * b;
      break;
    case '/':
      if (b === 0) return 'Ошибка';
      r = a / b;
      break;
  }
  return String(parseFloat(r.toPrecision(12)));
}

function render() {
  const text = format(state.current);
  valueEl.textContent = text;
  valueEl.classList.toggle('small', text.length > 9);
  valueEl.classList.toggle('err', state.current === 'Ошибка');
  exprEl.textContent = state.operator ? `${format(state.previous)} ${SYMBOLS[state.operator]}` : '';
  document
    .querySelectorAll('[data-op]')
    .forEach((b) => b.classList.toggle('active', b.dataset.op === state.operator && state.fresh));
}

function inputDigit(d) {
  if (state.current === 'Ошибка' || state.fresh) {
    state.current = d;
    state.fresh = false;
  } else if (state.current.replace(/[-.]/g, '').length < 12)
    state.current = state.current === '0' ? d : state.current + d;
}
function inputDot() {
  if (state.fresh || state.current === 'Ошибка') {
    state.current = '0.';
    state.fresh = false;
  } else if (!state.current.includes('.')) state.current += '.';
}
function setOperator(op) {
  if (state.current === 'Ошибка') return;
  if (state.operator && !state.fresh) {
    state.current = compute(state.previous, state.current, state.operator);
    if (state.current === 'Ошибка') {
      state.operator = null;
      return;
    }
  }
  state.previous = state.current;
  state.operator = op;
  state.fresh = true;
}
function equals() {
  if (!state.operator || state.fresh) return;
  const expr = `${format(state.previous)} ${SYMBOLS[state.operator]} ${format(state.current)}`;
  const result = compute(state.previous, state.current, state.operator);
  if (result !== 'Ошибка') addHistory(expr, result);
  state.current = result;
  state.operator = null;
  state.previous = null;
  state.fresh = true;
}

function addHistory(expr, result) {
  history.unshift({ expr, result, fresh: true });
  history = history.slice(0, 30);
  saveHistory();
  renderHistory();
}
function renderHistory() {
  const box = document.getElementById('history');
  box.innerHTML = history.length
    ? history
        .map(
          (h, i) =>
            `<button class="entry${h.fresh ? ' is-new' : ''}" type="button" data-i="${i}"><small>${h.expr} =</small><b>${format(h.result)}</b></button>`
        )
        .join('')
    : '<div class="history__empty">Здесь появятся вычисления</div>';
  history.forEach((h) => {
    delete h.fresh;
  });
}

const actions = {
  clear: () => Object.assign(state, { current: '0', previous: null, operator: null, fresh: false }),
  sign: () => {
    if (state.current !== '0' && state.current !== 'Ошибка')
      state.current = state.current.startsWith('-') ? state.current.slice(1) : '-' + state.current;
  },
  percent: () => {
    if (state.current !== 'Ошибка') state.current = String(parseFloat(state.current) / 100);
  },
  dot: inputDot,
  equals,
  back: () => {
    if (state.fresh || state.current === 'Ошибка') return;
    state.current = state.current.length > 1 && state.current !== '-0' ? state.current.slice(0, -1) : '0';
    if (state.current === '-') state.current = '0';
  },
};

document.getElementById('keys').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  if (btn.dataset.digit) inputDigit(btn.dataset.digit);
  else if (btn.dataset.op) setOperator(btn.dataset.op);
  else actions[btn.dataset.action]();
  render();
});

document.addEventListener('keydown', (e) => {
  let selector = null;
  if (/^\d$/.test(e.key)) {
    inputDigit(e.key);
    selector = `[data-digit="${e.key}"]`;
  } else if (SYMBOLS[e.key]) {
    setOperator(e.key);
    selector = `[data-op="${e.key}"]`;
  } else if (e.key === '.' || e.key === ',') {
    inputDot();
    selector = '[data-action="dot"]';
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    equals();
    selector = '[data-action="equals"]';
  } else if (e.key === 'Escape') {
    actions.clear();
    selector = '[data-action="clear"]';
  } else if (e.key === 'Backspace') actions.back();
  else if (e.key === '%') {
    actions.percent();
    selector = '[data-action="percent"]';
  } else return;
  if (selector) {
    const btn = document.querySelector(selector);
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 110);
  }
  render();
});

document.getElementById('history').addEventListener('click', (e) => {
  const entry = e.target.closest('.entry');
  if (!entry) return;
  state.current = history[entry.dataset.i].result;
  state.fresh = true;
  render();
});
document.getElementById('clearHistory').addEventListener('click', () => {
  history = [];
  saveHistory();
  renderHistory();
});

render();
renderHistory();
