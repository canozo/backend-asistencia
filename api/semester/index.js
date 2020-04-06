const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

// route: /api/semester
router.get('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query(
    'select id_semester as idSemester, alias, active from semester',
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener semestres' });
      } else {
        res.json({ status: 'success', msg: 'Semestres obtenidos', data: result });
      }
    }
  );
});

// route: /api/semester
router.post('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { alias, active } = req.body;
  db.query(
    `insert into semester
    (id_created_by, alias, active)
    values
    (?, ?, ?)`,
    [req.data.user.idUser, alias, active],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear semestre' });
      } else {
        res.json({ status: 'success', msg: 'Semestre creado', id: result.insertId });
      }
    }
  );
});

// route: /api/semester/:idSemester
router.put('/:idSemester', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { alias, active } = req.body;
  db.query(
    'update semester set alias = ?, active = ? where id_semester = ?',
    [alias, active, req.params.idSemester],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar semestre' });
      } else {
        res.json({ status: 'success', msg: 'Semestre modificado' });
      }
    }
  );
});

// route: /api/semester/:idSemester
router.delete('/:idSemester', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query('delete from semester where id_semester = ?', [req.params.idSemester], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar semestre' });
    } else {
      res.json({ status: 'success', msg: 'Semestre eliminado' });
    }
  });
});

module.exports = router;
