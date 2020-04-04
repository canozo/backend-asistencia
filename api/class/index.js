const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

// route: /api/class
router.post('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { className, code, comments } = req.body;
  db.query(
    `insert into class
    (id_created_by, class, code, comments)
    values
    (?, ?, ?, ?)`,
    [req.data.user.idUser, className, code, comments],
    error => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear clase' });
      } else {
        res.json({ status: 'success', msg: 'Clase creada' });
      }
    }
  );
});

module.exports = router;
