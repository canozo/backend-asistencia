const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all the classes
 * @route GET /api/class
 */
router.get('/', (req, res) => {
  db.query(
    'select id_class as idClass, class, code, comments from class',
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener clases' });
      } else {
        res.json({ status: 'success', msg: 'Clases obtenidas', data: result });
      }
    }
  );
});

/**
 * Get classes paginated
 * @route GET /api/class/:from/:to
 */
router.get('/:from/:to', pagination, (req, res) => {
  db.query(
    'select id_class as idClass, class, code, comments from class order by id_class asc limit ?, ?',
    [req.params.from, req.params.to],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener clases' });
      } else {
        res.json({ status: 'success', msg: 'Clases obtenidas', data: result });
      }
    }
  );
});

/**
 * Create a new class
 * @route POST /api/class
 * @permissions admin
 * @body {string} className
 * @body {string} code
 * @body {string | undefined} comments
 */
router.post('/', auth.getToken, auth.verify(1), (req, res) => {
  const { className, code, comments } = req.body;
  db.query(
    `insert into class
    (id_created_by, class, code, comments)
    values
    (?, ?, ?, ?)`,
    [req.data.user.idUser, className, code, comments],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear clase' });
      } else {
        res.json({ status: 'success', msg: 'Clase creada', id: result.insertId });
      }
    }
  );
});

/**
 * Create a new class
 * @route PUT /api/class/:idClass
 * @permissions admin
 * @body {string} className
 * @body {string} code
 * @body {string | undefined} comments
 */
router.put('/:idClass', auth.getToken, auth.verify(1), (req, res) => {
  const { className, code, comments } = req.body;
  db.query(
    'update class set class = ?, code = ?, comments = ? where id_class = ?',
    [className, code, comments, req.params.idClass],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar clase' });
      } else {
        res.json({ status: 'success', msg: 'Clase modificada' });
      }
    }
  );
});

/**
 * Delete class (if it's not referenced anywhere else in the db)
 * @route DELETE /api/class/:idClass
 * @permissions admin
 */
router.delete('/:idClass', auth.getToken, auth.verify(1), (req, res) => {
  db.query('delete from class where id_class = ?', [req.params.idClass], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar clase' });
    } else {
      res.json({ status: 'success', msg: 'Clase eliminada' });
    }
  });
});

module.exports = router;
