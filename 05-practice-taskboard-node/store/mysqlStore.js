const mysql = require('mysql2/promise');
const { seedTasks } = require('./seed');

const FIELDS = ['title', 'description', 'status', 'priority', 'deadline', 'tags', 'assignee'];

const toRow = (data, cols) => cols.map((c) => (c === 'tags' ? JSON.stringify(data.tags) : data[c]));

const toTask = (row) =>
  row && {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    deadline: row.deadline ? row.deadline.toISOString().slice(0, 10) : null,
    tags: row.tags ? JSON.parse(row.tags) : [],
    assignee: row.assignee || null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };

module.exports = async function createMysqlStore() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'taskboard',
    dateStrings: false,
    timezone: 'Z',
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(120) NOT NULL,
      description TEXT,
      status ENUM('todo','progress','done') NOT NULL DEFAULT 'todo',
      priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
      deadline DATE NULL,
      tags VARCHAR(255) NOT NULL DEFAULT '[]',
      assignee VARCHAR(40) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4`);

  for (const sql of [
    "ALTER TABLE tasks ADD COLUMN tags VARCHAR(255) NOT NULL DEFAULT '[]'",
    'ALTER TABLE tasks ADD COLUMN assignee VARCHAR(40) NULL',
  ]) {
    try {
      await pool.query(sql);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }
  }

  const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM tasks');
  if (n === 0) {
    for (const task of seedTasks()) {
      await pool.query(
        `INSERT INTO tasks (${FIELDS.join(', ')}) VALUES (${FIELDS.map(() => '?').join(', ')})`,
        toRow(task, FIELDS)
      );
    }
  }

  const get = async (id) => {
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    return toTask(rows[0]) || null;
  };

  return {
    name: 'MySQL',
    async all() {
      const [rows] = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
      return rows.map(toTask);
    },
    get,
    async create(data) {
      const cols = FIELDS.filter((f) => data[f] !== undefined);
      const [result] = await pool.query(
        `INSERT INTO tasks (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
        toRow(data, cols)
      );
      return get(result.insertId);
    },
    async update(id, data) {
      const cols = FIELDS.filter((f) => data[f] !== undefined);
      const [result] = await pool.query(
        `UPDATE tasks SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...toRow(data, cols), id]
      );
      return result.affectedRows ? get(id) : null;
    },
    async remove(id) {
      const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },
  };
};
