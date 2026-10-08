module.exports = async function createStore() {
  if (process.env.DB_HOST) {
    const createMysqlStore = require('./mysqlStore');
    return createMysqlStore();
  }
  const createJsonStore = require('./jsonStore');
  return createJsonStore();
};
