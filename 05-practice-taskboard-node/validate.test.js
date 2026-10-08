const { test } = require('node:test');
const assert = require('node:assert');
const { validateTask } = require('./validate');

test('корректная задача проходит валидацию и получает значения по умолчанию', () => {
  const { errors, value } = validateTask({ title: 'Новая задача' });
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(value.status, 'todo');
  assert.strictEqual(value.priority, 'medium');
});

test('короткое название — ошибка', () => {
  const { errors } = validateTask({ title: 'аб' });
  assert.strictEqual(errors.length, 1);
});

test('неизвестный статус — ошибка', () => {
  const { errors } = validateTask({ title: 'Задача', status: 'archived' });
  assert.match(errors[0], /Статус/);
});

test('PATCH: можно передать только статус', () => {
  const { errors, value } = validateTask({ status: 'done' }, { partial: true });
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(value, { status: 'done' });
});

test('PATCH: пустое тело — ошибка', () => {
  const { errors } = validateTask({}, { partial: true });
  assert.strictEqual(errors.length, 1);
});

test('неверный формат дедлайна — ошибка', () => {
  const { errors } = validateTask({ title: 'Задача', deadline: '31.12.2025' });
  assert.match(errors[0], /Дедлайн/);
});

test('теги приводятся к нижнему регистру, дубли убираются', () => {
  const { errors, value } = validateTask({ title: 'Задача', tags: ['CSS', ' css ', 'JS'] });
  assert.deepStrictEqual(errors, []);
  assert.deepStrictEqual(value.tags, ['css', 'js']);
});

test('больше пяти тегов или не массив — ошибка', () => {
  assert.match(validateTask({ title: 'Задача', tags: ['a', 'b', 'c', 'd', 'e', 'f'] }).errors[0], /Теги/);
  assert.match(validateTask({ title: 'Задача', tags: 'css' }).errors[0], /Теги/);
});

test('исполнителя можно снять пустой строкой', () => {
  const { errors, value } = validateTask({ assignee: '' }, { partial: true });
  assert.deepStrictEqual(errors, []);
  assert.strictEqual(value.assignee, null);
});
