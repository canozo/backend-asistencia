const express = require('express');
const bcrypt = require('bcryptjs');
const regex = require('../../config/regex');
const pagination = require('../../middleware/pagination');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all users
 * @route GET /api/user
 * @permissions admin
 */
router.get('/', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    const result = await db.query(
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
    );
    res.json({ status: 'success', msg: 'Usuarios obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener usuarios' });
  }
});

/**
 * Get users paginated
 * @route GET /api/user/:from/:to
 * @permissions admin
 */
router.get('/:from/:to', auth.getToken, auth.verify(1), pagination, async (req, res) => {
  try {
    const result = await db.query(
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
    );
    res.json({ status: 'success', msg: 'Usuarios obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener usuarios' });
  }
});

/**
 * Update user personal info
 * @route PUT /api/user
 * @permissions user
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 */
router.put('/', auth.getToken, auth.verifyAny, async (req, res) => {
  const { email, names, surnames } = req.body;

  if (!regex.email.test(email)) {
    return res.json({ status: 'error', msg: 'Correo no valido' });
  }

  try {
    await db.query(
      'update user set email = ?, names = ?, surnames = ? where id_user = ?',
      [email.trim().toLowerCase(), names, surnames, req.data.user.idUser],
    );
    res.json({ status: 'success', msg: 'Usuario modificado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al modificar usuario, correo ya existe.' });
  }
});

/**
 * Update user password
 * @route PUT /api/user/pw
 * @permissions user
 * @body {string} password
 */
router.put('/pw', auth.getToken, auth.verifyAny, async (req, res) => {
  const { password } = req.body;

  if (!regex.password.test(password)) {
    return res.json({ status: 'error', msg: 'Clave no valida' });
  }

  // hash password
  let hash;
  try {
    hash = bcrypt.hashSync(password, Number(process.env.BCRYPT_SALT));
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error bcryptjs' });
  }

  // update password
  try {
    await db.query('update user set password = ? where id_user = ?', [hash, req.data.user.idUser]);
    res.json({ status: 'success', msg: 'Clave modificada' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al modificar clave' });
  }
});

/**
 * Delete user (if it's not referenced anywhere else in the db)
 * @route DELETE /api/user/:idUser
 * @permissions admin
 */
router.delete('/:idUser', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    await db.query('delete from user where id_user != 1 and id_user = ?', [req.params.idUser]);
    res.json({ status: 'success', msg: 'Usuario eliminado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al eliminar usuario' });
  }
});

module.exports = router;
