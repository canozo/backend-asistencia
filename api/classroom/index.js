const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get list of all classrooms
 * @route GET /api/classroom
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `select
      id_classroom as idClassroom,
      campus.id_campus as idCampus,
      campus.campus as campus,
      building.id_building as idBuilding,
      building.alias as building,
      capacity,
      classroom.alias as alias
      from classroom
      inner join building
      on classroom.id_building = building.id_building
      inner join campus
      on building.id_campus = campus.id_campus`
    );
    res.json({ status: 'success', msg: 'Aulas obtenidas', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', msg: 'Error al obtener aulas' });
  }
});

/**
 * Get list of all classrooms in a building for a select
 * @route GET /api/classroom/select/:idBuilding
 * @changed
 */
router.get('/select/:idBuilding', async (req, res) => {
  try {
    const result = await db.query(
      `select id_classroom as id, concat('Aula: ', alias, ', capacidad: ', capacity) as val
      from classroom where id_building = ?`,
      [req.params.idBuilding],
    );
    res.json({ status: 'success', msg: 'Aulas obtenidas', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener aulas' });
  }
});

/**
 * Create a new classroom
 * @route POST /api/classroom
 * @permissions admin
 * @body {string | number} idBuilding
 * @body {string} capacity
 * @body {string} alias
 */
router.post('/', auth.getToken, auth.verify(1), async (req, res) => {
  const { idBuilding, capacity, alias } = req.body;
  try {
    const result = await db.query(
      `insert into classroom
      (id_building, id_created_by, capacity, alias)
      values
      (?, ?, ?, ?)`,
      [idBuilding, req.data.user.idUser, capacity, alias],
    );
    res.json({ status: 'success', msg: 'Aula creada', id: result.insertId });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al crear aula' });
  }
});

/**
 * Update classroom data
 * @route PUT /api/classroom/:idClassroom
 * @permissions admin
 * @body {string | number} idBuilding
 * @body {string} capacity
 * @body {string} alias
 */
router.put('/:idClassroom', auth.getToken, auth.verify(1), async (req, res) => {
  const { idBuilding, capacity, alias } = req.body;
  try {
    await db.query(
      'update classroom set id_building = ?, capacity = ?, alias = ? where id_classroom = ?',
      [idBuilding, capacity, alias, req.params.idClassroom],
    );
    res.json({ status: 'success', msg: 'Aula modificada' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al modificar aula' });
  }
});

/**
 * Delete classroom (if it's not referenced anywhere else in the db)
 * @route DELETE /api/classroom/:idClassroom
 * @permissions admin
 */
router.delete('/:idClassroom', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    await db.query('delete from classroom where id_classroom = ?', [req.params.idClassroom]);
    res.json({ status: 'success', msg: 'Aula eliminada' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al eliminar aula' });
  }
});

module.exports = router;
