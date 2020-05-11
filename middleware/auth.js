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

auth.signToken = (req, res, next) => {
  // TODO:
  // jwt.sign({ user: req.user }, process.env.JWT_SALT, { expiresIn: '90m' }, (err, token) => {
  jwt.sign({ user: req.user }, process.env.JWT_SALT, (err, token) => {
    req.iat = Math.floor(Date.now() / 1000);
    if (err) {
      res.json({ status: 'error', msg: 'Error jsonwebtoken' });
    } else {
      req.token = token;
      next();
    }
  });
};

auth.verify = (...permisions) => {
  return (req, res, next) => {
    jwt.verify(req.token, process.env.JWT_SALT, (err, data) => {
      if (err) {
        res.json({ status: 'error', msg: 'Token de verificacion no valido' });
      } else if (!permisions.includes(data.user.idUserType)) {
        res.json({ status: 'error', msg: 'Usuario no tiene permisos' });
      } else {
        req.data = data;
        next();
      }
    });
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

auth.getUser = (req, res, next) => {
  const { email, password } = req.body;

  db.query(
    `select id_user, a.id_user_type as id_user_type, b.alias as user_type, names, surnames, email, password, account_number
    from user a
    inner join user_type b
    on a.id_user_type = b.id_user_type
    where email = ?`,
    [email.trim().toLowerCase(), password],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error MySQL' });
      } else if (result.length !== 1) {
        res.json({ status: 'error', msg: `No se encontro al usuario con correo ${email}` });
      } else {
        // verify that the passwords are the same
        bcrypt.compare(password, result[0].password, (err, match) => {
          if (err) {
            res.json({ status: 'error', msg: 'Error bcryptjs' });
          } else if (!match) {
            res.json({ status: 'error', msg: 'Clave incorrecta' });
          } else {
            // info that is stored into token
            req.user = {
              idUser: result[0].id_user,
              idUserType: result[0].id_user_type,
              userType: result[0].user_type,
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

  if (idUserType === 3 && !regex.accountNum.test(accountNumber)) {
    return res.json({ status: 'error', msg: 'Numero de cuenta no valido' });
  }

  bcrypt.hash(password, Number(process.env.BCRYPT_SALT), (hashErr, hash) => {
    if (hashErr) {
      return res.json({ status: 'error', msg: 'Error bcryptjs' });
    }
    db.query(
      `insert into user
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
  });
};

module.exports = auth;
