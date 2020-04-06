const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

// route: /api/building
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

// route: /api/building/:idCampus
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

// route: /api/building
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

// route: /api/building/:idBuilding
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

// route: /api/building/:idBuilding
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
