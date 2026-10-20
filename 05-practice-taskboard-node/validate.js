const STATUSES = ['todo', 'progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

function validateTask(body, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (!body || typeof body !== 'object') return { errors: ['Тело запроса должно быть объектом'], value };

  if (body.title !== undefined || !partial) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 3 || title.length > 120) errors.push('Название: от 3 до 120 символов');
    else value.title = title;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.length > 1000)
      errors.push('Описание: строка до 1000 символов');
    else value.description = body.description.trim();
  }

  if (body.status !== undefined || !partial) {
    const status = body.status ?? 'todo';
    if (!STATUSES.includes(status)) errors.push(`Статус: одно из ${STATUSES.join(', ')}`);
    else value.status = status;
  }

  if (body.priority !== undefined || !partial) {
    const priority = body.priority ?? 'medium';
    if (!PRIORITIES.includes(priority)) errors.push(`Приоритет: одно из ${PRIORITIES.join(', ')}`);
    else value.priority = priority;
  }

  if (body.deadline !== undefined && body.deadline !== null && body.deadline !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.deadline) || Number.isNaN(Date.parse(body.deadline)))
      errors.push('Дедлайн: дата в формате ГГГГ-ММ-ДД');
    else value.deadline = body.deadline;
  } else if (body.deadline !== undefined) {
    value.deadline = null;
  }

  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags)
      ? body.tags.map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
      : null;
    if (!tags || tags.length > 5 || tags.some((t) => t.length < 1 || t.length > 20))
      errors.push('Теги: до 5 штук, каждый от 1 до 20 символов');
    else value.tags = [...new Set(tags)];
  }

  if (body.assignee !== undefined) {
    if (body.assignee === null || body.assignee === '') value.assignee = null;
    else if (typeof body.assignee !== 'string' || body.assignee.trim().length > 40)
      errors.push('Исполнитель: строка до 40 символов');
    else value.assignee = body.assignee.trim();
  }

  if (partial && Object.keys(value).length === 0 && errors.length === 0)
    errors.push('Нет полей для обновления');

  return { errors, value };
}

module.exports = { validateTask, STATUSES, PRIORITIES };
