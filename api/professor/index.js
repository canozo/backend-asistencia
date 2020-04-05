const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
const db = require('../../config/db');

const router = express.Router();

// route: /api/professor
router.get('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query(
    `select
    id_user as idUser,
    email,
    names,
    surnames
    from user
    where id_user_type = 2`,
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener profesores' });
      } else {
        res.json({ status: 'success', msg: 'Profesores obtenidos', data: result });
      }
    }
  );
});

// route: /api/professor/:from/:to
router.get('/:from/:to', auth.getToken, auth.verifyAdmin, pagination, (req, res) => {
  db.query(
    `select
    id_user as idUser,
    email,
    names,
    surnames
    from user
    where id_user_type = 2
    order by id_user asc
    limit ?, ?`,
    [req.params.from, req.params.to],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener profesores' });
      } else {
        res.json({ status: 'success', msg: 'Profesores obtenidos', data: result });
      }
    }
  );
});

// route: /api/professor
router.post(
  '/',
  auth.getToken,
  auth.verifyAdmin,
  setUserType.professor,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de profesor registrado' });
  },
);

module.exports = router;
