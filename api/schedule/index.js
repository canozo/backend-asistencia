const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

// route: /api/schedule
router.get('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query(
    'select id_schedule_time as idScheduleTime, schedule_time as scheduleTime from schedule_time',
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener horarios' });
      } else {
        res.json({ status: 'success', msg: 'Horarios obtenidos', data: result });
      }
    }
  );
});

// route: /api/schedule
router.post('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query(
    `insert into schedule_time
    (schedule_time)
    values
    (?)`,
    [req.body.scheduleTime],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear horario' });
      } else {
        res.json({ status: 'success', msg: 'Horario creado', id: result.insertId });
      }
    }
  );
});

// route: /api/schedule/:idScheduleTime
router.put('/:idScheduleTime', auth.getToken, auth.verifyAdmin, (req, res) => {
  const { scheduleTime } = req.body;
  db.query(
    'update schedule_time set schedule_time = ? where id_schedule_time = ?',
    [scheduleTime, req.params.idScheduleTime],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar horario' });
      } else {
        res.json({ status: 'success', msg: 'Horario modificado' });
      }
    }
  );
});

// route: /api/schedule/:idScheduleTime
router.delete('/:idScheduleTime', auth.getToken, auth.verifyAdmin, (req, res) => {
  db.query(
    'delete from schedule_time where id_schedule_time = ?',
    [req.params.idScheduleTime],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al eliminar horario' });
      } else {
        res.json({ status: 'success', msg: 'Horario eliminado' });
      }
    }
  );
});

module.exports = router;
