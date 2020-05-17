const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all buildings
 * @route GET /api/building
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `select
      id_building as idBuilding, campus.id_campus as idCampus, campus, building.alias as alias
      from building
      inner join campus
      on campus.id_campus = building.id_campus`
    );
    res.json({ status: 'success', msg: 'Edificios obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener edificios' });
  }
});

/**
 * Get all buildings in a specific campus
 * @route GET /api/building/in/:idCampus
 * @changed
 */
router.get('/in/:idCampus', async (req, res) => {
  try {
    const result = await db.query(
      'select id_building as idBuilding, alias from building where id_campus = ?',
      [req.params.idCampus],
    );
    res.json({ status: 'success', msg: 'Edificios obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener edificios' });
  }
});

/**
 * Create a new building
 * @route POST /api/building
 * @permissions admin
 * @body {string | number} idCampus
 * @body {string} alias
 */
router.post('/', auth.getToken, auth.verify(1), async (req, res) => {
  const { idCampus, alias } = req.body;
  try {
    const result = await db.query(
      'insert into building (id_campus, id_created_by, alias) values (?, ?, ?)',
      [idCampus, req.data.user.idUser, alias],
    );
    res.json({ status: 'success', msg: 'Edificio creado', id: result.insertId });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al crear edificio' });
  }
});

/**
 * Update building
 * @route PUT /api/building/:idBuilding
 * @permissions admin
 * @body {string | number} idCampus
 * @body {string} alias
 */
router.put('/:idBuilding', auth.getToken, auth.verify(1), async (req, res) => {
  const { idCampus, alias } = req.body;
  try {
    await db.query(
      'update building set id_campus = ?, alias = ? where id_building = ?',
      [idCampus, alias, req.params.idBuilding],
    );
    res.json({ status: 'success', msg: 'Edificio modificado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al modificar edificio' });
  }
});

/**
 * Delete building (if it's not referenced anywhere else in the db)
 * @route DELETE /api/building/:idBuilding
 * @permissions admin
 */
router.delete('/:idBuilding', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    await db.query('delete from building where id_building = ?', [req.params.idBuilding]);
    res.json({ status: 'success', msg: 'Edificio eliminado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al eliminar edificio' });
  }
});

module.exports = router;
