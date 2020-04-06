const assert = require('assert');
const mysql = require('mysql');
const path = require('path');
const fs = require('fs');

module.exports = {
  startup: () => {
    // check env vars
    assert(!isNaN(process.env.BCRYPT_SALT), 'Variable de entorno BCRYPT_SALT no es un numero');
    assert(process.env.JWT_SALT, 'Variable de entorno JWT_SALT no se configuro');
    assert(process.env.ENVIRONMENT, 'Variable de entorno ENVIRONMENT no se configuro');
    assert(process.env.AWS_ACCESS_KEY_ID, 'Variable de entorno AWS_ACCESS_KEY_ID no se configuro');
    assert(process.env.AWS_SECRET_ACCESS_KEY_ID, 'Variable de entorno AWS_SECRET_ACCESS_KEY_ID no se configuro');
    assert(process.env.MAIN_BUCKET, 'Variable de entorno MAIN_BUCKET no se configuro');

    // make a temporary connection with multipleStatements = true
    const db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });

    // check connection with database
    db.connect();
    db.query('select 1', (err) => {
      assert(!err, 'Error de conexión con la base de datos, revise las variables de entorno');

      // execute DDL.sql
      db.query(fs.readFileSync(path.join(__dirname, 'DDL.sql'), 'utf8'), (err) => {
        assert(!err, 'Error al ejecutar DDL.sql');

        // execute DML.sql
        db.query(fs.readFileSync(path.join(__dirname, 'DML.sql'), 'utf8'), (err) => {
          assert(!err, 'Error al ejecutar DML.sql');

          // end temporary connection
          db.end();
        });
      });
    });
  },
};
