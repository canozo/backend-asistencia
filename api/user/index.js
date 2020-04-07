const express = require('express');
const bcrypt = require('bcryptjs');
const regex = require('../config/regex');
const pagination = require('../../middleware/pagination');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

// route: /api/user
router.get('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query(
    `select
    id_user as idUser,
    user_type as userType,
    email,
    names,
    surnames,
    account_number as accountNumber
    from user a
    inner join user_type b
    on a.id_user_type = b.id_user_type`,
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener usuarios' });
      } else {
        res.json({ status: 'success', msg: 'Usuarios obtenidos', data: result });
      }
    }
  );
});

// route: /api/user/:from/:to
router.get('/:from/:to', auth.getToken, auth.verifyAdmin, pagination, (req, res) => {
  db.query(
    `select
    id_user as idUser,
    user_type as userType,
    email,
    names,
    surnames,
    account_number as accountNumber
    from user a
    inner join user_type b
    on a.id_user_type = b.id_user_type
    order by id_user asc
    limit ?, ?`,
    [req.params.from, req.params.to],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener usuarios' });
      } else {
        res.json({ status: 'success', msg: 'Usuarios obtenidos', data: result });
      }
    }
  );
});

// route: /api/user
router.put('/', auth.getToken, auth.verifyAny, (req, res) => {
  const { email, names, surnames } = req.body;

  if (!regex.email.test(email)) {
    return res.json({ status: 'error', msg: 'Correo no valido' });
  }

  db.query(
    `update user set
    email = ?,
    names = ?,
    surnames = ?
    where id_user = ?`,
    [email.trim().toLowerCase(), names, surnames, req.data.user.idUser],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar usuario' });
      } else {
        res.json({ status: 'success', msg: 'Usuario modificado' });
      }
    }
  );
});

// route: /api/user/pw
router.put('/pw', auth.getToken, auth.verifyAny, (req, res) => {
  const { password } = req.body;

  if (!regex.password.test(password)) {
    return res.json({ status: 'error', msg: 'Clave no valida' });
  }

  bcrypt.hash(password, Number(process.env.BCRYPT_SALT), (hashErr, hash) => {
    if (hashErr) {
      return res.json({ status: 'error', msg: 'Error bcryptjs' });
    }
    db.query(
      'update user set password = ? where id_user = ?',
      [hash, req.data.user.idUser],
      (error) => {
        if (error) {
          res.json({ status: 'error', msg: 'Error al modificar clave' });
        } else {
          res.json({ status: 'success', msg: 'Clave modificada' });
        }
      }
    );
  });
});

// route: /api/user/:idUser
router.delete('/:idUser', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query('delete from user where id_user != 1 and id_user = ?', [req.params.idUser], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar usuario' });
    } else {
      res.json({ status: 'success', msg: 'Usuario eliminado' });
    }
  });
});

module.exports = router;