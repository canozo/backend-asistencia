const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all time schedule data
 * @route GET /api/schedule
 */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'select id_schedule_time as idScheduleTime, schedule_time as scheduleTime from schedule_time',
    );
    res.json({ status: 'success', msg: 'Horarios obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener horarios' });
  }
});

/**
 * Get all time schedule data for a select
 * @route GET /api/schedule/select
 */
router.get('/select', async (req, res) => {
  try {
    const result = await db.query(
      'select id_schedule_time as id, schedule_time as val from schedule_time',
    );
    res.json({ status: 'success', msg: 'Horarios obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener horarios' });
  }
});

/**
 * Create a new time schedule
 * @route POST /api/schedule
 * @permissions admin
 * @body {string} scheduleTime
 */
router.post('/', auth.getToken, auth.verify(1), async (req, res) => {
  // TODO puede que tenga problemas
  try {
    const result = await db.query(
      'insert into schedule_time (schedule_time) values (time(?))',
      [req.body.scheduleTime],
    );
    res.json({ status: 'success', msg: 'Horario creado', id: result.insertId });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al crear horario' });
  }
});

/**
 * Update a schedule
 * @route PUT /api/schedule/:idScheduleTime
 * @permissions admin
 * @body {string} scheduleTime
 */
router.put('/:idScheduleTime', auth.getToken, auth.verify(1), async (req, res) => {
  // TODO solo actualizar si no se esta utilizando
  const { scheduleTime } = req.body;
  try {
    await db.query(
      'update schedule_time set schedule_time = ? where id_schedule_time = ?',
      [scheduleTime, req.params.idScheduleTime],
    );
    res.json({ status: 'success', msg: 'Horario modificado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al modificar horario' });
  }
});

/**
 * Delete a schedule (if it's not referenced anywhere else in the db)
 * @route DELETE /api/schedule/:idScheduleTime
 * @permissions admin
 */
router.delete('/:idScheduleTime', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    await db.query(
      'delete from schedule_time where id_schedule_time = ?',
      [req.params.idScheduleTime],
    );
    res.json({ status: 'success', msg: 'Horario eliminado' });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al eliminar horario' });
  }
});

module.exports = router;
