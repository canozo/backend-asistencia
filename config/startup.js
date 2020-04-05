const assert = require('assert');
const db = require('./db');

module.exports = () => {
  // check connection with database
  db.query('select 1', (err) => assert(!err, 'Error de conexión con la base de datos, revise las variables de entorno'));

  // check env vars
  assert(!isNaN(process.env.BCRYPT_SALT), 'Variable de entorno BCRYPT_SALT no es un numero')
  assert(process.env.JWT_SALT, 'Variable de entorno JWT_SALT no se configuro');
  assert(process.env.ENVIRONMENT, 'Variable de entorno ENVIRONMENT no se configuro');
  assert(process.env.AWS_ACCESS_KEY_ID, 'Variable de entorno AWS_ACCESS_KEY_ID no se configuro');
  assert(process.env.AWS_SECRET_ACCESS_KEY_ID, 'Variable de entorno AWS_SECRET_ACCESS_KEY_ID no se configuro');
  assert(process.env.MAIN_BUCKET, 'Variable de entorno MAIN_BUCKET no se configuro');

  // check DML.sql
  db.query(
    `insert ignore into user_type
    (id_user_type, user_type)
    values
    (1, 'Personal Administrativo'),
    (2, 'Profesor'),
    (3, 'Estudiante')`,
    (err) => assert(!err, 'Error ingersando a tabla "user_type"'),
  );

  db.query(
    `insert ignore into schedule_time
    (id_schedule_time, schedule_time)
    values
    (1, time('7:00')),
    (2, time('8:30')),
    (3, time('10:10')),
    (4, time('11:30')),
    (5, time('13:00')),
    (6, time('14:20')),
    (7, time('15:40')),
    (8, time('17:00')),
    (9, time('18:30')),
    (10, time('20:00')),
    (11, time('21:30'))`,
    (err) => assert(!err, 'Error ingersando a tabla "schedule_time"'),
  );

  db.query(
    `insert ignore into schedule_day
    (id_schedule_day, schedule_day, alias)
    values
    (1, 'Domingo', 'Do'),
    (2, 'Lunes', 'Lu'),
    (3, 'Martes', 'Ma'),
    (4, 'Miercoles', 'Mi'),
    (5, 'Jueves', 'Ju'),
    (6, 'Viernes', 'Vi'),
    (7, 'Sabado', 'Sa')`,
    (err) => assert(!err, 'Error ingersando a tabla "schedule_day"'),
  );

  db.query(
    `insert ignore into user
    (\`id_user\`, \`id_user_type\`, \`names\`, \`surnames\`, \`email\`, \`password\`)
    values
    (1, 1, 'super', 'usuario', 'admin@unitec.edu', '$2a$12$4nEaL8xOt0OMgdGN..67GOqyCXkWCeQf18J.g2hKG6S0nNRIu9qiS')`,
    (err) => assert(!err, 'Error ingersando a tabla "user"'),
  );
};
