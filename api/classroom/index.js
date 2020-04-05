const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

// route: /api/classroom
router.get('/', (req, res) => {
  db.query(
    'select id_classroom as idClassroom, capacity, alias from classroom',
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener aulas' });
      } else {
        res.json({ status: 'success', msg: 'Aulas obtenidas', data: result });
      }
    }
  );
});

// route: /api/classroom/:idBuilding
router.get('/:idBuilding', (req, res) => {
  db.query(
    'select id_classroom as idClassroom, capacity, alias from classroom where id_building = ?',
    [req.params.idBuilding],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener aulas' });
      } else {
        res.json({ status: 'success', msg: 'Aulas obtenidas', data: result });
      }
    }
  );
});

// route: /api/classroom
router.post('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { idBuilding, capacity, alias } = req.body;
  db.query(
    `insert into classroom
    (id_building, id_created_by, capacity, alias)
    values
    (?, ?, ?, ?)`,
    [idBuilding, req.data.user.idUser, capacity, alias],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear aula' });
      } else {
        res.json({ status: 'success', msg: 'Aula creada' });
      }
    }
  );
});

// route: /api/classroom/:idClassroom
router.post('/:idClassroom', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { idBuilding, capacity, alias } = req.body;
  db.query(
    'update classroom set id_building = ?, capacity = ?, alias = ? where id_classroom = ?',
    [idBuilding, capacity, alias, req.params.idClassroom],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar aula' });
      } else {
        res.json({ status: 'success', msg: 'Aula modificada' });
      }
    }
  );
});

// route: /api/classroom/:idClassroom
router.delete('/:idClassroom', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query('delete from classroom where id_classroom = ?', [req.params.idClassroom], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar aula' });
    } else {
      res.json({ status: 'success', msg: 'Aula eliminada' });
    }
  });
});

module.exports = router;
