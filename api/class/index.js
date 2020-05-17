const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all the classes
 * @route GET /api/class
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'select id_class as idClass, class as className, code as classCode, comments from class',
    );
    res.json({ status: 'success', msg: 'Clases obtenidas', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener clases' });
  }
});

/**
 * Get all the classes for a select
 * @route GET /api/class/select
 * @changed
 */
router.get('/select', async (req, res) => {
  try {
    const result = await db.query(
      `select id_class as id, concat_ws(' - ', code, class) as val from class`,
    );
    res.json({ status: 'success', msg: 'Clases obtenidas', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener clases' });
  }
});

/**
 * Get classes paginated
 * @route GET /api/class/:from/:to
 */
router.get('/:from/:to', pagination, async (req, res) => {
  try {
    const result = await db.query(
      `select id_class as idClass, class as className, code as classCode, comments
      from class
      order by id_class asc
      limit ?, ?`,
      [req.params.from, req.params.to],
    );
    res.json({ status: 'success', msg: 'Clases obtenidas', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener clases' });
  }
});

/**
 * Create a new class
 * @route POST /api/class
 * @permissions admin
 * @body {string} className
 * @body {string} classCode
 * @body {string | undefined} comments
 * @changed
 */
router.post('/', auth.getToken, auth.verify(1), async (req, res) => {
  const { className, classCode, comments } = req.body;
  try {
    const result = await db.query(
      'insert into class (id_created_by, class, code, comments) values (?, ?, ?, ?)',
      [req.data.user.idUser, className, classCode, comments],
    );
    res.json({ status: 'success', msg: 'Clase creada', id: result.insertId });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al crear clase' });
  }
});

/**
 * Update class data
 * @route PUT /api/class/:idClass
 * @permissions admin
 * @body {string} className
 * @body {string} classCode
 * @body {string | undefined} comments
 * @changed
 */
router.put('/:idClass', auth.getToken, auth.verify(1), async (req, res) => {
  const { className, classCode, comments } = req.body;
  try {
    await db.query(
      'update class set class = ?, code = ?, comments = ? where id_class = ?',
      [className, classCode, comments, req.params.idClass],
    );
    res.json({ status: 'success', msg: 'Clase modificada' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al modificar clase' });
  }
});

/**
 * Delete class (if it's not referenced anywhere else in the db)
 * @route DELETE /api/class/:idClass
 * @permissions admin
 */
router.delete('/:idClass', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    await db.query('delete from class where id_class = ?', [req.params.idClass]);
    res.json({ status: 'success', msg: 'Clase eliminada' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al eliminar clase' });
  }
});

module.exports = router;
