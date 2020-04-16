const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all the campuses
 * @route GET /api/campus
 */
router.get('/', (req, res) => {
  db.query(
    'select id_campus as idCampus, campus, alias from campus',
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener campus' });
      } else {
        res.json({ status: 'success', msg: 'Campus obtenidos', data: result });
      }
    }
  );
});

/**
 * Create a new campus
 * @route POST /api/campus
 * @permissions admin
 * @body {string} campus
 * @body {string} alias
 */
router.post('/', auth.getToken, auth.verify(1), (req, res) => {
  const { campus, alias } = req.body;
  db.query(
    `insert into campus
    (id_created_by, campus, alias)
    values
    (?, ?, ?)`,
    [req.data.user.idUser, campus, alias],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear campus' });
      } else {
        res.json({ status: 'success', msg: 'Campus creado', id: result.insertId });
      }
    }
  );
});

/**
 * Update campus data
 * @route PUT /api/campus/:idCampus
 * @permissions admin
 * @body {string} campus
 * @body {string} alias
 */
router.put('/:idCampus', auth.getToken, auth.verify(1), (req, res) => {
  const { campus, alias } = req.body;
  db.query(
    'update campus set campus = ?, alias = ? where id_campus = ?',
    [campus, alias, req.params.idCampus],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar campus' });
      } else {
        res.json({ status: 'success', msg: 'Campus modificado' });
      }
    }
  );
});

/**
 * Delete campus (if it's not referenced anywhere else in the db)
 * @route DELETE /api/campus/:idCampus
 * @permissions admin
 */
router.delete('/:idCampus', auth.getToken, auth.verify(1), (req, res) => {
  db.query('delete from campus where id_campus = ?', [req.params.idCampus], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar campus' });
    } else {
      res.json({ status: 'success', msg: 'Campus eliminado' });
    }
  });
});

module.exports = router;
