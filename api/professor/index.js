const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all professors
 * @route GET /api/professor
 * @permissions admin
 */
router.get('/', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Get professors paginated
 * @route GET /api/professor/:from/:to
 * @permissions admin
 */
router.get('/:from/:to', auth.getToken, auth.verify(1), pagination, (req, res) => {
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

/**
 * Create a new professor user
 * @route POST /api/professor
 * @permissions admin
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 */
router.post(
  '/',
  auth.getToken,
  auth.verify(1),
  setUserType.professor,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de profesor registrado' });
  },
);

module.exports = router;
