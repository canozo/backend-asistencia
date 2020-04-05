const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
const db = require('../../config/db');

const router = express.Router();

// route: /api/student
router.get('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query(
    `select
    id_user as idUser,
    email,
    names,
    surnames
    from user
    where id_user_type = 3`,
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener estudiantes' });
      } else {
        res.json({ status: 'success', msg: 'Estudiantes obtenidos', data: result });
      }
    }
  );
});

// route: /api/student/:from/:to
router.get('/:from/:to', auth.getToken, auth.verifyAdmin, pagination, (req, res) => {
  db.query(
    `select
    id_user as idUser,
    email,
    names,
    surnames
    from user
    where id_user_type = 3
    order by id_user asc
    limit ?, ?`,
    [req.params.from, req.params.to],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener estudiantes' });
      } else {
        res.json({ status: 'success', msg: 'Estudiantes obtenidos', data: result });
      }
    }
  );
});

// route: /api/student
router.post(
  '/',
  auth.getToken,
  auth.verifyAdmin,
  setUserType.student,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de estudiante registrado' });
  },
);

// route: /api/student/register
router.post(
  '/register',
  setUserType.student,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de estudiante registrado' });
  },
);

// route: /api/student/accountnum
// TODO update account num

module.exports = router;
