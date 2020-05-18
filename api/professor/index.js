const express = require('express');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all professors
 * @route GET /api/professor
 * @permissions admin
 */
router.get('/', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    const result = await db.query(
      'select id_user as idUser, email, names, surnames from user where id_user_type = 2'
    );
    res.json({ status: 'success', msg: 'Profesores obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener profesores' });
  }
});

/**
 * Get all professors for a select
 * @route GET /api/professor/select
 * @permissions admin
 */
router.get('/select', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    const result = await db.query(
      `select id_user as id, concat_ws(' ', names, surnames) as val
      from user where id_user_type = 2`,
    );
    res.json({ status: 'success', msg: 'Profesores obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener profesores' });
  }
});

/**
 * Get professors paginated
 * @route GET /api/professor/:from/:to
 * @permissions admin
 */
router.get('/:from/:to', auth.getToken, auth.verify(1), pagination, async (req, res) => {
  try {
    const result = await db.query(
      `select id_user as idUser, email, names, surnames
      from user
      where id_user_type = 2
      order by id_user asc
      limit ?, ?`,
      [req.params.from, req.params.to],
    );
    res.json({ status: 'success', msg: 'Profesores obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener profesores' });
  }
});

/**
 * Get all sections given by the professor
 * @route GET /api/professor/enrolled
 * @permissions professor
 */
router.get('/enrolled', auth.getToken, auth.verify(2), async (req, res) => {
  try {
    const result = await db.query(
      `select
      section.id_section as idSection,
      class.code as classCode,
      class.class as class,
      section.comments as comments,
      a.schedule_time as startTime,
      b.schedule_time as finishTime,
      classroom.alias as classroom,
      building.alias as building,
      semester.alias as semester,
      group_concat(d.alias order by d.id_schedule_day separator '') as days
      from section
      inner join semester
      on section.id_semester = semester.id_semester
      inner join class
      on section.id_class = class.id_class
      inner join classroom
      on section.id_classroom = classroom.id_classroom
      inner join building
      on classroom.id_building = building.id_building
      inner join schedule_time a
      on section.id_start_time = a.id_schedule_time
      inner join schedule_time b
      on section.id_finish_time = b.id_schedule_time
      inner join user prof
      on section.id_professor = prof.id_user
      inner join section_x_schedule_day c
      on section.id_section = c.id_section
      inner join schedule_day d
      on c.id_schedule_day = d.id_schedule_day
      where semester.active = 1 and prof.id_user = ?
      group by section.id_section`,
      [req.data.user.idUser],
    );
    res.json({ status: 'success', msg: 'Secciones obtenidos', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener secciones' });
  }
});

/**
 * Create a new professor user
 * @route POST /api/professor
 * @permissions admin
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 */
router.post(
  '/',
  auth.getToken,
  auth.verify(1),
  setUserType.professor,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de profesor registrado', id: req.idUser });
  },
);

module.exports = router;
