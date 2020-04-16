const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all semesters
 * @route GET /api/semester
 * @permissions admin
 */
router.get('/', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Create a new semester
 * @route POST /api/semester
 * @permissions admin
 * @body {string} alias
 * @body {boolean} active
 */
router.post('/', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Update semester data
 * @route PUT /api/semester/:idSemester
 * @permissions admin
 * @body {string} alias
 * @body {boolean} active
 */
router.put('/:idSemester', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Delete semester (if it's not referenced anywhere else in the db)
 * @route DELETE /api/semester/:idSemester
 * @permissions admin
 */
router.delete('/:idSemester', auth.getToken, auth.verify(1), (req, res) => {
  db.query('delete from semester where id_semester = ?', [req.params.idSemester], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar semestre' });
    } else {
      res.json({ status: 'success', msg: 'Semestre eliminado' });
    }
  });
});

module.exports = router;
