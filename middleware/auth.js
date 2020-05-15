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

auth.signToken = async (req, res, next) => {
  try {
    const token = jwt.sign({ user: req.user }, process.env.JWT_SALT, { expiresIn: '90m' });
    req.iat = Math.floor(Date.now() / 1000);
    req.token = token;
    next();
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error jsonwebtoken' });
  }
};

auth.verify = (...permisions) => {
  return async (req, res, next) => {
    try {
      const data = jwt.verify(req.token, process.env.JWT_SALT);
      if (!permisions.includes(data.user.idUserType)) {
        return res.json({ status: 'error', msg: 'Usuario no tiene permisos' });
      }
      req.data = data;
      next();
    } catch {
      res.json({ status: 'error', msg: 'Token de verificacion no valido' });
    }
  }
};

auth.verifyAny = async (req, res, next) => {
  try {
    const data = jwt.verify(req.token, process.env.JWT_SALT);
    req.data = data;
    next();
  } catch {
    res.json({ status: 'error', msg: 'Token de verificacion no valido' });
  }
};

auth.getUser = async (req, res, next) => {
  const { email, password } = req.body;

  let result;
  try {
    result = await db.query(
      `select id_user, a.id_user_type as id_user_type, b.alias as user_type, names, surnames, email, password, account_number
      from user a
      inner join user_type b
      on a.id_user_type = b.id_user_type
      where email = ?`,
      [email.trim().toLowerCase(), password],
    );
    if (result.length !== 1) {
      return res.json({ status: 'error', msg: `No se encontro al usuario con correo ${email}` });
    }
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error buscando usuario' });
  }

  // verify that the passwords are the same
  try {
    const match = bcrypt.compareSync(password, result[0].password);
    if (!match) {
      return res.json({ status: 'error', msg: 'Clave incorrecta' });
    }
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
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al comprobar contraseña' });
  }
};

auth.register = async (req, res, next) => {
  const { idUserType, names, surnames, email, password, accountNumber } = req.body;

  if (!regex.email.test(email)) {
    return res.json({ status: 'error', msg: 'Correo no valido' });
  }

  if (!regex.password.test(password)) {
    return res.json({ status: 'error', msg: 'Clave no valida' });
  }

  if (idUserType === 3 && !regex.accountNum.test(accountNumber)) {
    return res.json({ status: 'error', msg: 'Número de cuenta no valido' });
  }

  let hash;
  try {
    hash = bcrypt.hash(password, Number(process.env.BCRYPT_SALT));
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error encriptando contraseña' });
  }

  try {
    await db.query(
      `insert into user
      (id_user_type, names, surnames, email, password, account_number)
      values
      (?, ?, ?, ?, ?, ?)`,
      [idUserType, names, surnames, email.trim().toLowerCase(), hash, accountNumber],
    );
    next();
  } catch {
    res.json({ status: 'error', msg: 'Error al registrar usuario' });
  }
};

module.exports = auth;
