const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const regex = require('../config/regex');

const auth = {};

auth.getToken = (req, res, next) => {
  const bHeader = req.headers.authorization;
  if (bHeader !== undefined) {
    const bearerToken = bHeader.split(' ')[1];
    req.token = bearerToken;

    if (req.token) {
      next();
    } else {
      res.json({ status: 'error', msg: 'No se envio token de verificacion' });
    }
  } else {
    res.json({ status: 'error', msg: 'No se envio token de verificacion' });
  }
};

auth.verifyAny = (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SALT, (err, data) => {
    if (err) {
      res.json({ status: 'error', msg: 'Token de verificacion no valido' });
    } else {
      req.data = data;
      next();
    }
  });
};

auth.verifyAdmin = (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SALT, (err, data) => {
    if (err) {
      res.json({ status: 'error', msg: 'Token de verificacion no valido' });
    } else if (data.user.idUserType !== 1) {
      res.json({ status: 'error', msg: 'Usuario no tiene permisos' });
    } else {
      req.data = data;
      next();
    }
  });
};

auth.verifyProfessor = (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SALT, (err, data) => {
    if (err) {
      res.json({ status: 'error', msg: 'Token de verificacion no valido' });
    } else if (data.user.idUserType !== 2) {
      res.json({ status: 'error', msg: 'Usuario no tiene permisos' });
    } else {
      req.data = data;
      next();
    }
  });
};

auth.verifyStudent = (req, res, next) => {
  jwt.verify(req.token, process.env.JWT_SALT, (err, data) => {
    if (err) {
      res.json({ status: 'error', msg: 'Token de verificacion no valido' });
    } else if (data.user.idUserType !== 3) {
      res.json({ status: 'error', msg: 'Usuario no tiene permisos' });
    } else {
      req.data = data;
      next();
    }
  });
};

auth.getUser = (req, res, next) => {
  const { email, password } = req.body;

  db.query(
    `select id_user, id_user_type, names, surnames, email, password, account_number
    from users
    where email = ?`,
    [email.trim().toLowerCase(), password],
    (error, result) => {
      if (error) {
        console.error(error);
        res.json({ status: 'error', msg: 'Error MySQL' });
      } else if (result.length !== 1) {
        res.json({ status: 'error', msg: `No se encontro al usuario con correo ${email}` });
      } else {
        // verify that the passwords are the same
        bcrypt.compare(password, result[0].password, (err, res) => {
          if (err) {
            res.json({ status: 'error', msg: 'Error bcryptjs' });
          } else if (!res) {
            res.json({ status: 'error', msg: 'Clave incorrecta' });
          } else {
            // info that is stored into token
            req.user = {
              idUser: result[0].id_user,
              idUserType: result[0].id_user_type,
              names: result[0].names,
              surnames: result[0].surnames,
              email: result[0].email,
              accountNumber: result[0].account_number,
            };
            next();
          }
        });
      }
    },
  );
};

auth.register = (req, res, next) => {
  const { idUserType, names, surnames, email, password, accountNumber } = req.body;

  if (!regex.email.test(email)) {
    return res.json({ status: 'error', msg: 'Correo no valido' });
  }

  if (!regex.password.test(password)) {
    return res.json({ status: 'error', msg: 'Clave no valida' });
  }

  bcrypt.hash(password, Number(process.env.BCRYPT_SALT), (hashErr, hash) => {
    if (hashErr) {
      res.json({ status: 'error', msg: 'Error bcryptjs' });
    } else {
      db.query(
        `insert into users
        (id_user_type, names, surnames, email, password, account_number)
        values
        (?, ?, ?, ?, ?, ?)`,
        [idUserType, names, surnames, email.trim().toLowerCase(), hash, accountNumber],
        (error) => {
          if (error) {
            res.json({ status: 'error', msg: 'Error al registrar usuario' });
          } else {
            next();
          }
        }
      );
    }
  });
};

module.exports = auth;