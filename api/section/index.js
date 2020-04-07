const express = require('express');
const pagination = require('../../middleware/pagination');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

// route: /api/section
router.get('/', (req, res) => {
  db.query(
    `select
    id_section as idSection,
    class.code as classCode,
    class.class as class,
    section.comments as comments,
    a.schedule_time as startTime,
    b.schedule_time as finishTime,
    classroom.alias as classroom,
    building.alias as building,
    concat_ws(' ', user.names, user.surnames) as professor,
    semester.alias as semester,
    semester.active as semesterActive
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
    on section.id_start_time = b.id_schedule_time
    inner join user
    on section.id_professor = user.id_user`,
    (error, result) => {
      if (error) {
        console.log(error);
        res.json({ status: 'error', msg: 'Error al obtener secciones' });
      } else {
        res.json({ status: 'success', msg: 'Secciones obtenidos', data: result });
      }
    }
  );
});

// route: /api/section
router.get('/:from/:to', pagination, (req, res) => {
  db.query(
    `select
    id_section as idSection,
    class.code as classCode,
    class.class as class,
    section.comments as comments,
    a.schedule_time as startTime,
    b.schedule_time as finishTime,
    classroom.alias as classroom,
    building.alias as building,
    concat_ws(' ', user.names, user.surnames) as professor,
    semester.alias as semester,
    semester.active as semesterActive
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
    on section.id_start_time = b.id_schedule_time
    inner join user
    on section.id_professor = user.id_user
    order by id_section
    asc limit ?, ?`,
    [req.params.from, req.params.to],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener secciones' });
      } else {
        res.json({ status: 'success', msg: 'Secciones obtenidas', data: result });
      }
    }
  );
});

// route: /api/section
router.post('/', auth.getToken, auth.verifyAdmin, (req, res) => {
  const values = [
    req.body.idSemester,
    req.body.idClass,
    req.body.idClassroom,
    req.body.idStartTime,
    req.body.idFinishTime,
    req.body.idProfessor,
    req.data.user.idUser,
    req.body.comments,
    req.body.idStartTime,
    req.body.idFinishTime,
  ];
  db.query(
    `insert into section (
      id_semester,
      id_class,
      id_classroom,
      id_start_time,
      id_finish_time,
      id_professor,
      id_created_by,
      comments
    ) (
      select ?, ?, ?, ?, ?, ?, ?, ?
      where (
        select (
          select schedule_time
          from schedule_time
          where id_schedule_time = ?
        ) < (
          select schedule_time
          from schedule_time
          where id_schedule_time = ?
        )
      )
    )`,
    values,
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear sección' });
      } else {
        res.json({ status: 'success', msg: 'Sección creada', id: result.insertId });
      }
    }
  );
});

// route: /api/section/days
router.post('/days', (req, res) => {
  const { idSection, idDays } = req.body;

  if (!Array.isArray(idDays)) {
    return res.json({ status: 'error', msg: 'Error al agregar dia de semana a la sección' });
  }

  let query = 'insert into section_x_schedule_day (id_section, id_schedule_day) values';
  const values = [];

  idDays.forEach(day => {
    query += '(?, ?),';
    values.push(idSection, day);
  });

  // TODO revisar si el aula entra en conflicto los dias que se ingreso con otra seccion

  // eliminar los dias que no estan marcados
  db.query('delete from section_x_schedule_day where id_section = ?', [idSection], (error) => {
    if (error) {
      res.json({ status: 'error', msg: 'Error al actualizar dias de semana a la sección' });
    } else {
      // agregar los dias que si marco
      db.query(query.substr(0, query.length - 1), values, (error) => {
        if (error) {
          res.json({ status: 'error', msg: 'Error al agregar dias de semana a la sección' });
        } else {
          res.json({ status: 'success', msg: 'Dias de semana de sección agregados' });
        }
      });
    }
  });
});

// route: /api/section/student
router.post('/student', (req, res) => {
  const { idSection, idStudent } = req.body;
  db.query(
    'insert into section_x_student (id_section, id_student) values (?, ?)',
    [idSection, idStudent],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al agregar estudiante' });
      } else {
        res.json({ status: 'success', msg: 'Estudiante agregado a sección' });
      }
    }
  );
});

// route: /api/section/student
router.delete('/student', (req, res) => {
  const { idSection, idStudent } = req.body;
  db.query(
    'delete from section_x_student where id_section = ? and id_student = ?',
    [idSection, idStudent],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al quitar estudiante de sección' });
      } else {
        res.json({ status: 'success', msg: 'Estudiante removido de sección' });
      }
    }
  );
});

module.exports = router;
