const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all the campuses
 * @route GET /api/campus
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query('select id_campus as idCampus, campus, alias from campus');
    res.json({ status: 'success', msg: 'Campus obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener campus' });
  }
});

/**
 * Get all the campuses for a select
 * @route GET /api/campus/select
 * @changed
 */
router.get('/select', async (req, res) => {
  try {
    const result = await db.query('select id_campus as id, campus as val from campus');
    res.json({ status: 'success', msg: 'Campus obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener campus' });
  }
});

/**
 * Create a new campus
 * @route POST /api/campus
 * @permissions admin
 * @body {string} campus
 * @body {string} alias
 */
router.post('/', auth.getToken, auth.verify(1), async (req, res) => {
  const { campus, alias } = req.body;
  try {
    const result = await db.query(
      'insert into campus (id_created_by, campus, alias) values (?, ?, ?)',
      [req.data.user.idUser, campus, alias],
    );
    res.json({ status: 'success', msg: 'Campus creado', id: result.insertId });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al crear campus' });
  }
});

/**
 * Update campus data
 * @route PUT /api/campus/:idCampus
 * @permissions admin
 * @body {string} campus
 * @body {string} alias
 */
router.put('/:idCampus', auth.getToken, auth.verify(1), async (req, res) => {
  const { campus, alias } = req.body;
  try {
    await db.query(
      'update campus set campus = ?, alias = ? where id_campus = ?',
      [campus, alias, req.params.idCampus],
    );
    res.json({ status: 'success', msg: 'Campus modificado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al modificar campus' });
  }
});

/**
 * Delete campus (if it's not referenced anywhere else in the db)
 * @route DELETE /api/campus/:idCampus
 * @permissions admin
 */
router.delete('/:idCampus', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    await db.query('delete from campus where id_campus = ?', [req.params.idCampus]);
    res.json({ status: 'success', msg: 'Campus eliminado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al eliminar campus' });
  }
});

module.exports = router;
