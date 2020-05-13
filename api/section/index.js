const express = require('express');
const pagination = require('../../middleware/pagination');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all sections data
 * @route GET /api/section
 */
router.get('/', (req, res) => {
  db.query(
    `select
    section.id_section as idSection,
    class.code as classCode,
    class.class as class,
    section.comments as comments,
    a.schedule_time as startTime,
    b.schedule_time as finishTime,
    classroom.alias as classroom,
    building.alias as building,
    concat_ws(' ', user.names, user.surnames) as professor,
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
    inner join user
    on section.id_professor = user.id_user
    inner join section_x_schedule_day c
    on section.id_section = c.id_section
    inner join schedule_day d
    on c.id_schedule_day = d.id_schedule_day
    where semester.active = 1
    group by section.id_section`,
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener secciones' });
      } else {
        res.json({ status: 'success', msg: 'Secciones obtenidos', data: result });
      }
    }
  );
});

/**
 * Get all sections data paginated
 * @route GET /api/section/:from/:to
 */
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
    on section.id_finish_time = b.id_schedule_time
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

/**
 * Create a new section
 * @route POST /api/section
 * @permissions admin
 * @body {string | number} idSemester
 * @body {string | number} idClass
 * @body {string | number} idClassroom
 * @body {string | number} idStartTime
 * @body {string | number} idFinishTime
 * @body {string | number} idProfessor
 * @body {string | undefined} comments
 */
router.post('/', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Set days schedule for the section
 * @route POST /api/section/days
 * @permissions admin
 * @body {string | number} idSection
 * @body {string[] | number[]} idDays
 */
router.post('/days', auth.getToken, auth.verify(1), (req, res) => {
  const { idSection, idDays } = req.body;

  if (!Array.isArray(idDays)) {
    return res.json({ status: 'error', msg: 'Error, campo "idDays" no es un arreglo' });
  }

  let query = 'insert into section_x_schedule_day (id_section, id_schedule_day) values ';
  const values = [];

  // OBSERVACION solo revisa si hay conflicto en el mismo semestre, habria problemas si hay
  // semestres para pregrado y maestria, y se supone que se revisa en todos los semestres activos

  let daysQuery =
    `select count(*) as conflict from (
      select
      a.schedule_time as start_time,
      b.schedule_time as finish_time,
      id_semester,
      id_classroom,
      section.id_section as id_section
      from section
      inner join schedule_time a
      on id_start_time = a.id_schedule_time
      inner join schedule_time b
      on id_finish_time = b.id_schedule_time
      where section.id_section = ?
    ) a
    inner join (
      select
      a.schedule_time as start_time,
      b.schedule_time as finish_time,
      id_semester,
      id_schedule_day,
      id_classroom,
      section.id_section as id_section
      from section
      inner join schedule_time a
      on id_start_time = a.id_schedule_time
      inner join schedule_time b
      on id_finish_time = b.id_schedule_time
      inner join section_x_schedule_day
      on section.id_section = section_x_schedule_day.id_section
    ) b
    on
      a.id_semester = b.id_semester
      and a.id_classroom = b.id_classroom
    where a.id_section != b.id_section
    and a.start_time < b.finish_time and b.start_time < a.finish_time
    and (`;
  const daysValues = [idSection];

  let profQuery =
    `select count(*) as conflict from section
    inner join schedule_time a
    on id_start_time = a.id_schedule_time
    inner join schedule_time b
    on id_finish_time = b.id_schedule_time
    inner join section_x_schedule_day
    on section.id_section = section_x_schedule_day.id_section
    where id_professor = (select id_professor from section where id_section = ?)
    and id_semester = (select id_semester from section where id_section = ?)
    and section.id_section != ?
    and a.schedule_time < (
      select
      schedule_time
      from section
      inner join schedule_time
      on id_finish_time = schedule_time.id_schedule_time
      where section.id_section = ?
    ) and (
      select
      schedule_time
      from section
      inner join schedule_time
      on id_start_time = schedule_time.id_schedule_time
      where section.id_section = ?
    ) < b.schedule_time
    and (`;
  const profValues = [idSection, idSection, idSection, idSection, idSection];

  idDays.forEach(day => {
    // days check
    daysQuery += 'id_schedule_day = ? or ';
    daysValues.push(day);

    // professor check
    profQuery += 'id_schedule_day = ? or ';
    profValues.push(day);

    // main query
    query += '(?, ?), ';
    values.push(idSection, day);
  });

  if (idDays.length === 0) {
    daysQuery += 'false)';
    profQuery += 'false)';
  } else {
    daysQuery = daysQuery.substr(0, daysQuery.length - 4) + ')'
    profQuery = profQuery.substr(0, profQuery.length - 4) + ')'
  }
  query = query.substr(0, query.length - 2);

  const countStudents = 'select count(*) as conflict from section_x_student where id_section = ?';
  db.query(countStudents, [idSection], (error, result) => {
    if (error) {
      return res.json({ status: 'error', msg: 'Error al verificar estudiantes de sección' });
    } else if (result[0].conflict) {
      return res.json({ status: 'error', msg: 'Error, sección ya tiene estudiantes matriculados' });
    }

    db.query(daysQuery, daysValues, (error, result) => {
      if (error) {
        return res.json({
          status: 'error',
          msg: 'Error al revisar si hay conflicto en días de sección',
        });
      } else if (result[0].conflict) {
        return res.json({
          status: 'error',
          msg: 'Esta sección entra en conflicto con otra en la misma aula',
        });
      }

      db.query(profQuery, profValues, (error, result) => {
        if (error) {
          return res.json({
            status: 'error',
            msg: 'Error al revisar si hay conflicto en horario del profesor de sección',
          });
        } else if (result[0].conflict) {
          return res.json({
            status: 'error',
            msg: 'Este profesor ya da clases a esta misma hora',
          });
        }

        // eliminar los días que no estan marcados
        const deleteDays = 'delete from section_x_schedule_day where id_section = ?';
        db.query(deleteDays, [idSection], (error) => {
          if (error) {
            res.json({ status: 'error', msg: 'Error al actualizar días de semana a la sección' });
          } else {
            // agregar los días que si marco
            db.query(query, values, (error) => {
              if (error && values.length > 0) {
                res.json({ status: 'error', msg: 'Error al agregar días de semana a la sección' });
              } else {
                res.json({ status: 'success', msg: 'Dias de semana de sección modificados' });
              }
            });
          }
        });
      });
    });
  });
});

/**
 * Get all students from a section
 * @route GET /api/section/:idSection/students
 * @permissions professor
 * @permissions admin
 */
router.get('/:idSection/students', auth.getToken, auth.verify(1, 2), (req, res) => {
  const { idSection } = req.params;
  db.query(
    `select
    id_student as idStudent,
    names,
    surnames,
    email,
    account_number as accountNumber
    from section_x_student
    inner join user
    on id_student = id_user
    where id_section = ?`,
    [idSection, idStudent],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener estudiantes de sección' });
      } else {
        res.json({ status: 'success', msg: 'Estudiantes de sección obtenidos', data: result });
      }
    }
  );
});

/**
 * Add student to section
 * @route POST /api/section/student
 * @permissions admin
 * @body {string | number} idSection
 * @body {string | number} idStudent
 */
router.post('/student', auth.getToken, auth.verify(1), (req, res) => {
  const { idSection, idStudent } = req.body;
  db.query(
    `select user.id_user_type = 3 as isStudent
    from user
    inner join user_type
    on user.id_user_type = user_type.id_user_type
    where id_user = ?`,
    [idStudent],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al verificar que usuario es estudiante' });
      } else if (!result[0].isStudent) {
        return res.json({ status: 'error', msg: 'Error, usuario no es un estudiante' });
      }

      db.query(
        `select count(*) as conflict
        from (
          select
          a.schedule_time as start_time,
          b.schedule_time as finish_time,
          id_semester,
          id_schedule_day
          from section
          inner join schedule_time a
          on id_start_time = a.id_schedule_time
          inner join schedule_time b
          on id_finish_time = b.id_schedule_time
          inner join section_x_schedule_day
          on section.id_section = section_x_schedule_day.id_section
          where section.id_section = ?
        ) a
        inner join (
          select
          a.schedule_time as start_time,
          b.schedule_time as finish_time,
          id_semester,
          id_schedule_day
          from section_x_student
          inner join section
          on section_x_student.id_section = section.id_section
          inner join schedule_time a
          on section.id_start_time = a.id_schedule_time
          inner join schedule_time b
          on section.id_finish_time = b.id_schedule_time
          inner join section_x_schedule_day
          on section.id_section = section_x_schedule_day.id_section
          where id_student = ?
        ) b
        on a.id_semester = b.id_semester and a.id_schedule_day = b.id_schedule_day
        where a.start_time < b.finish_time and b.start_time < a.finish_time`,
        [idSection, idStudent],
        (error, result) => {
          if (error) {
            return res.json({ status: 'error', msg: 'Error al verificar horario del estudiante' });
          } else if (result[0].conflict) {
            return res.json({
              status: 'error',
              msg: 'Error, el estudiante ya lleva clases a esa hora'
            });
          }

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
        }
      );
    }
  );
});

/**
 * Remove student from section
 * @route DELETE /api/section/student
 * @permissions admin
 * @body {string | number} idSection
 * @body {string | number} idStudent
 */
router.delete('/student', auth.getToken, auth.verify(1), (req, res) => {
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

/**
 * Delete section (if it's not referenced anywhere else in the db)
 * @route DELETE /api/section/:idSection
 * @permissions admin
 */
router.delete('/:idSection', auth.getToken, auth.verify(1), (req, res) => {
  db.query(
    'delete from section where id_section = ?',
    [req.params.idSection],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al eliminar sección' });
      } else {
        res.json({ status: 'success', msg: 'Sección eliminada' });
      }
    }
  );
});

module.exports = router;
