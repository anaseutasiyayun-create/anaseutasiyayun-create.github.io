const fs = require('fs/promises');
const path = require('path');

const FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'tasks.json');

const { seedTasks } = require('./seed');

module.exports = async function createJsonStore() {
  let tasks = [];
  let nextId = 1;
  let writing = Promise.resolve();

  try {
    tasks = JSON.parse(await fs.readFile(FILE, 'utf8')).map((t) => ({ tags: [], assignee: null, ...t }));
    nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  } catch {
    const now = new Date().toISOString();
    tasks = seedTasks().map((t) => ({ id: nextId++, ...t, createdAt: now, updatedAt: now }));
    await save();
  }

  function save() {
    writing = writing.then(async () => {
      await fs.mkdir(path.dirname(FILE), { recursive: true });
      await fs.writeFile(FILE, JSON.stringify(tasks, null, 2));
    });
    return writing;
  }

  return {
    name: 'JSON-файл',
    async all() {
      return [...tasks].sort((a, b) => b.id - a.id);
    },
    async get(id) {
      return tasks.find((t) => t.id === id) || null;
    },
    async create(data) {
      const now = new Date().toISOString();
      const task = {
        id: nextId++,
        description: '',
        deadline: null,
        tags: [],
        assignee: null,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(task);
      await save();
      return task;
    },
    async update(id, data) {
      const task = tasks.find((t) => t.id === id);
      if (!task) return null;
      Object.assign(task, data, { updatedAt: new Date().toISOString() });
      await save();
      return task;
    },
    async remove(id) {
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) return false;
      tasks.splice(index, 1);
      await save();
      return true;
    },
  };
};
