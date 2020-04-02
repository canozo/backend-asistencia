const util = require('util');
const mysql = require('mysql');

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 5,
};

const pool = mysql.createPool(config);
pool.query = util.promisify(pool.query);

module.exports = pool;
