const express = require('express');
const path = require('path');
const createStore = require('./store');
const { validateTask, STATUSES } = require('./validate');

const PORT = process.env.PORT || 3000;

async function main() {
  const store = await createStore();
  const app = express();

  app.use(express.json({ limit: '20kb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () =>
      console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start} мс)`)
    );
    next();
  });

  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  app.get(
    '/api/tasks',
    wrap(async (req, res) => {
      let tasks = await store.all();
      const { status, tag, assignee, q } = req.query;
      if (status && STATUSES.includes(status)) tasks = tasks.filter((t) => t.status === status);
      if (tag) tasks = tasks.filter((t) => (t.tags || []).includes(String(tag).toLowerCase()));
      if (assignee) tasks = tasks.filter((t) => t.assignee === assignee);
      if (q) {
        const needle = String(q).toLowerCase();
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(needle) || (t.description || '').toLowerCase().includes(needle)
        );
      }
      res.json(tasks);
    })
  );

  app.get(
    '/api/tasks/:id',
    wrap(async (req, res) => {
      const task = await store.get(Number(req.params.id));
      if (!task) return res.status(404).json({ error: 'Задача не найдена' });
      res.json(task);
    })
  );

  app.post(
    '/api/tasks',
    wrap(async (req, res) => {
      const { errors, value } = validateTask(req.body);
      if (errors.length) return res.status(400).json({ errors });
      const task = await store.create(value);
      res.status(201).json(task);
    })
  );

  app.patch(
    '/api/tasks/:id',
    wrap(async (req, res) => {
      const { errors, value } = validateTask(req.body, { partial: true });
      if (errors.length) return res.status(400).json({ errors });
      const task = await store.update(Number(req.params.id), value);
      if (!task) return res.status(404).json({ error: 'Задача не найдена' });
      res.json(task);
    })
  );

  app.delete(
    '/api/tasks/:id',
    wrap(async (req, res) => {
      const ok = await store.remove(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: 'Задача не найдена' });
      res.status(204).end();
    })
  );

  app.get(
    '/api/stats',
    wrap(async (req, res) => {
      const tasks = await store.all();
      const stats = Object.fromEntries(STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length]));
      res.json({ total: tasks.length, ...stats });
    })
  );

  app.use('/api', (req, res) => res.status(404).json({ error: 'Маршрут не найден' }));

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректный JSON' });
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  app.listen(PORT, () =>
    console.log(`TaskBoard запущен: http://localhost:${PORT} (хранилище: ${store.name})`)
  );
}

main();
