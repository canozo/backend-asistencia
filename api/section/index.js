const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

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
