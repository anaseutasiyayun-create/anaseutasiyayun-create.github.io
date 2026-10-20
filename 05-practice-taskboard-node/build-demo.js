const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const html = read('public/index.html');
const css = read('public/style.css');
const appJs = read('public/app.js');
const validateJs = read('validate.js').replace(/module\.exports\s*=.*$/m, '');
const seedJs = read('store/seed.js').replace(/module\.exports\s*=.*$/m, '');

const mockApi = `
(() => {
  ${validateJs}
  const KEY = 'taskboard-demo-v2';
  ${seedJs}
  let tasks;
  try { tasks = JSON.parse(localStorage.getItem(KEY)); } catch { tasks = null; }
  if (!Array.isArray(tasks)) {
    const now = new Date().toISOString();
    tasks = seedTasks().map((t, i) => ({ id: i + 1, ...t, createdAt: now, updatedAt: now }));
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch {} };
  const json = (status, data) => new Response(status === 204 ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const realFetch = window.fetch.bind(window);

  window.fetch = async (url, options = {}) => {
    const u = new URL(url, location.href);
    if (!u.pathname.startsWith('/api/') && !u.pathname.includes('/api/')) return realFetch(url, options);
    await new Promise((r) => setTimeout(r, 120));
    const route = u.pathname.slice(u.pathname.indexOf('/api/'));
    const method = (options.method || 'GET').toUpperCase();
    let body = null;
    if (options.body) { try { body = JSON.parse(options.body); } catch { return json(400, { error: 'Некорректный JSON' }); } }
    const idMatch = route.match(/^\\/api\\/tasks\\/(\\d+)$/);
    const id = idMatch && Number(idMatch[1]);
    const find = () => tasks.find((t) => t.id === id);

    if (route === '/api/tasks' && method === 'GET') {
      let list = [...tasks].sort((a, b) => b.id - a.id);
      const status = u.searchParams.get('status');
      const q = (u.searchParams.get('q') || '').toLowerCase();
      if (status && STATUSES.includes(status)) list = list.filter((t) => t.status === status);
      const tag = (u.searchParams.get('tag') || '').toLowerCase();
      const assignee = u.searchParams.get('assignee');
      if (tag) list = list.filter((t) => (t.tags || []).includes(tag));
      if (assignee) list = list.filter((t) => t.assignee === assignee);
      if (q) list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
      return json(200, list);
    }
    if (route === '/api/tasks' && method === 'POST') {
      const { errors, value } = validateTask(body);
      if (errors.length) return json(400, { errors });
      const now = new Date().toISOString();
      const task = { id: tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1, description: '', deadline: null, tags: [], assignee: null, ...value, createdAt: now, updatedAt: now };
      tasks.push(task); save();
      return json(201, task);
    }
    if (id && method === 'GET') return find() ? json(200, find()) : json(404, { error: 'Задача не найдена' });
    if (id && method === 'PATCH') {
      const { errors, value } = validateTask(body, { partial: true });
      if (errors.length) return json(400, { errors });
      const task = find();
      if (!task) return json(404, { error: 'Задача не найдена' });
      Object.assign(task, value, { updatedAt: new Date().toISOString() }); save();
      return json(200, task);
    }
    if (id && method === 'DELETE') {
      const before = tasks.length;
      tasks = tasks.filter((t) => t.id !== id); save();
      return tasks.length < before ? json(204) : json(404, { error: 'Задача не найдена' });
    }
    if (route === '/api/stats') return json(200, { total: tasks.length, ...Object.fromEntries(STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length])) });
    return json(404, { error: 'Маршрут не найден' });
  };

  window.resetDemo = () => { try { localStorage.removeItem(KEY); } catch {} location.reload(); };
})();
`;

let out = html
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}</style>`)
  .replace('<title>TaskBoard — канбан-доска</title>', '<title>TaskBoard — демо-версия</title>')
  .replace(
    '<script src="app.js"></script>',
    `<script>\n${mockApi}\n</script>\n<script>\n${appJs}\n</script>`
  );

if (!out.includes('resetDemo') || out.includes('src="app.js"'))
  throw new Error('Не удалось собрать демо: проверьте public/index.html');
fs.mkdirSync(path.join(root, 'demo'), { recursive: true });
fs.writeFileSync(path.join(root, 'demo', 'index.html'), out);
console.log('demo/index.html собран,', out.length, 'байт');
