const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all buildings
 * @route GET /api/building
 */
router.get('/', (req, res) => {
  db.query(
    'select id_building as idBuilding, alias from building',
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener edificios' });
      } else {
        res.json({ status: 'success', msg: 'Edificios obtenidos', data: result });
      }
    }
  );
});

/**
 * Get all buildings in a specific campus
 * @route GET /api/building/:idCampus
 */
router.get('/:idCampus', (req, res) => {
  db.query(
    `select id_building as idBuilding, alias
    from building
    where id_campus = ?`,
    [req.params.idCampus],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener edificios' });
      } else {
        res.json({ status: 'success', msg: 'Edificios obtenidos', data: result });
      }
    }
  );
});

/**
 * Create a new building
 * @route POST /api/building
 * @permissions admin
 * @body {string | number} idCampus
 * @body {string} alias
 */
router.post('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { idCampus, alias } = req.body;
  db.query(
    `insert into building
    (id_campus, id_created_by, alias)
    values
    (?, ?, ?)`,
    [idCampus, req.data.user.idUser, alias],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear edificio' });
      } else {
        res.json({ status: 'success', msg: 'Edificio creado', id: result.insertId });
      }
    }
  );
});

/**
 * Update building
 * @route PUT /api/building/:idBuilding
 * @permissions admin
 * @body {string | number} idCampus
 * @body {string} alias
 */
router.put('/:idBuilding', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { idCampus, alias } = req.body;
  db.query(
    'update building set id_campus = ?, alias = ? where id_building = ?',
    [idCampus, alias, req.params.idBuilding],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar edificio' });
      } else {
        res.json({ status: 'success', msg: 'Edificio modificado' });
      }
    }
  );
});

/**
 * Delet building (if it's not referenced anywhere else in the db)
 * @route DELETE /api/building/:idBuilding
 * @permissions admin
 */
router.delete('/:idBuilding', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query('delete from building where id_building = ?', [req.params.idBuilding], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar edificio' });
    } else {
      res.json({ status: 'success', msg: 'Edificio eliminado' });
    }
  });
});

module.exports = router;
