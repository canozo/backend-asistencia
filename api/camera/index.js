const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all cameras
 * @route GET /api/camera
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
    where id_user_type = 4`,
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener camaras' });
      } else {
        res.json({ status: 'success', msg: 'Camaras obtenidas', data: result });
      }
    }
  );
});

/**
 * Get cameras paginated
 * @route GET /api/camera/:from/:to
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
    where id_user_type = 4
    order by id_user asc
    limit ?, ?`,
    [req.params.from, req.params.to],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener camaras' });
      } else {
        res.json({ status: 'success', msg: 'Camaras obtenidas', data: result });
      }
    }
  );
});

/**
 * Create a new cameras user
 * @route POST /api/camera
 * @permissions admin
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 * @body {string | undefined} accountNumber
 */
router.post(
  '/',
  auth.getToken,
  auth.verify(1),
  setUserType.camera,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de camara registrado' });
  },
);

module.exports = router;
