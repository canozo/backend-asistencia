const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Middleware to verify that the professor is the one in the log that is sent
 * @middleware
 * @body {string | number} idAttendanceLog
 */
const verifyAttendanceLog = (req, res, next) => {
  const idAttendanceLog = req.body.idAttendanceLog || req.params.idAttendanceLog;
  db.query(
    `select count(*) as isProfessor
    from attendance_log
    inner join section
    on attendance_log.id_section = section.id_section
    where id_professor = ? and id_attendance_log = ?`,
    [req.data.user.idUser, idAttendanceLog],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al verificar profesor y asistencia' });
      } else if (!result.isProfessor) {
        res.json({ status: 'error', msg: 'Error, el profesor no es encargado de la asistencia' });
      } else {
        next();
      }
    }
  );
};

/**
 * Middleware to verify that the professor is the one in the section that is sent
 * @middleware
 * @body {string | number} idSection
 */
const verifySection = (req, res, next) => {
  const idSection = req.body.idSection || req.params.idSection;
  db.query(
    `select count(*) as isProfessor from section
    where id_professor = ? and section.id_section = ?`,
    [req.data.user.idUser, idSection],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al verificar profesor y sección' });
      } else if (!result.isProfessor) {
        res.json({ status: 'error', msg: 'Error, el profesor no es encargado de la sección' });
      } else {
        next();
      }
    }
  );
};

/**
 * Get attendance in one specific log
 * @route GET /api/attendance/:idAttendanceLog
 * @permissions professor
 */
router.get('/:idAttendanceLog', auth.getToken, auth.verifyProfessor, (req, res) => {
  db.query(
    `select
    id_student as idStudent,
    marked_at as markedAt
    from attendance_x_student
    inner join attendance_log
    on attendance_x_student.id_attendance_log = attendance_log.id_attendance_log
    where attendance_log.id_attendance_log = ?`,
    [req.params.idAttendanceLog],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener asistencia' });
      } else {
        res.json({ status: 'success', msg: 'Asistencia obtenida', data: result });
      }
    }
  );
});

/**
 * Create a new attendance log
 * @route POST /api/attendance
 * @permissions professor
 * @body {string | number} idSection
 */
router.post('/', auth.getToken, auth.verifyProfessor, (req, res) => {
  db.query(
    'insert into attendance_log (id_section, opened_at) values (?, now())',
    [req.body.idSection],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al crear nueva asistencia' });
      } else {
        // TODO DynamoDB
        setTimeout(() => {
          // TODO
        }, 900000);
        res.json({ status: 'success', msg: 'Asistencia creada', id: result.insertId });
      }
    }
  );
});

/**
 * Mark a students attendance
 * @route POST /api/attendance/:idAttendanceLog/mark/:idStudent
 * @permissions professor
 * @body {string | number} idSection
 */
router.post(
  '/:idAttendanceLog/mark/:idStudent',
  auth.getToken,
  auth.verifyProfOrCamera,
  (req, res) => {
    const { idAttendanceLog, idStudent } = req.params;
    db.query(
      `insert into attendance_x_student
      (id_attendance_log, id_student, marked_at)
      values (?, ?, now())`,
      [idAttendanceLog, idStudent],
      (error) => {
        if (error) {
          res.json({ status: 'error', msg: 'Error al marcar estudiante' });
        } else {
          res.json({ status: 'success', msg: 'Estudiante marcado' });
        }
      }
    );
  }
);

/**
 * Close an attendance log
 * @route PUT /api/attendance/:idAttendanceLog
 * @permissions professor
 * @body {string} alias
 * @body {boolean} active
 */
router.put('/:idAttendanceLog', auth.getToken, auth.verifyProfessor, (req, res) => {
  const { idAttendanceLog } = req.params;
  db.query(
    `update attendance_log
    set closed_at = now()
    where id_attendance_log = ? and closed_at is null`,
    [idAttendanceLog, idAttendanceLog],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al cerrar asistencia' });
      } else {
        res.json({ status: 'success', msg: 'Asistencia cerrada' });
      }
    }
  );
});

module.exports = router;
