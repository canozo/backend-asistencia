const express = require('express');
const auth = require('../../middleware/auth');
const setUserType = require('../../middleware/setUserType');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all admin users
 * @route GET /api/admin
 * @permissions admin
 * @changed
 */
router.get('/', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    const result = await db.query(
      'select id_user as idUser, email, names, surnames from user where id_user_type = 1'
    );
    res.json({ status: 'success', msg: 'Usuarios personal admin. obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener usuarios personal admin' });
  }
});

/**
 * Create new admin user
 * @route POST /api/admin
 * @permissions admin
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 */
router.post('/', auth.getToken, auth.verify(1), setUserType.admin, auth.register, (req, res) => {
  res.json({ status: 'success', msg: 'Usuario de personal adm. registrado', id: req.idUser });
});

module.exports = router;
