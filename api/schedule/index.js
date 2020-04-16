const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all time schedule data
 * @route GET /api/schedule
 * @permissions admin
 */
router.get('/', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Create a new time schedule
 * @route GET /api/schedule
 * @permissions admin
 * @body {string} scheduleTime
 */
router.post('/', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Update a schedule
 * @route PUT /api/schedule/:idScheduleTime
 * @permissions admin
 * @body {string} scheduleTime
 */
router.put('/:idScheduleTime', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Delete a schedule (if it's not referenced anywhere else in the db)
 * @route DELETE /api/schedule/:idScheduleTime
 * @permissions admin
 */
router.delete('/:idScheduleTime', auth.getToken, auth.verify(1), (req, res) => {
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
