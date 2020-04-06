const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const db = require('../../config/db');

const router = express.Router();

// route: /api/class
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

// route: /api/class/:from/:to
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

// route: /api/class
router.post('/', auth.getToken, auth.verifyAdmin, (req, res) => {
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

// route: /api/class/:idClass
router.put('/:idClass', auth.getToken, auth.verifyAdmin, (req, res) => {
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

// route: /api/class/:idClass
router.delete('/:idClass', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query('delete from class where id_class = ?', [req.params.idClass], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al eliminar clase' });
    } else {
      res.json({ status: 'success', msg: 'Clase eliminada' });
    }
  });
});

module.exports = router;
