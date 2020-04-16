const express = require('express');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get attendance in one specific log
 * @route GET /api/attendance/:idAttendanceLog
 * @permissions professor
 */
router.get('/:idAttendanceLog', auth.getToken, auth.verify(2), (req, res) => {
  db.query(
    `select
    id_student as idStudent,
    id_marked_by as idMarkedBy,
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
router.post('/', auth.getToken, auth.verify(2), (req, res) => {
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
 * @permissions camera
 */
router.post(
  '/:idAttendanceLog/mark/:idStudent',
  auth.getToken,
  auth.verify(2, 4),
  (req, res) => {
    const { idAttendanceLog, idStudent } = req.params;
    db.query(
      `insert into attendance_x_student
      (id_attendance_log, id_student, id_marked_by, marked_at)
      values (?, ?, ?, now())`,
      [idAttendanceLog, idStudent, req.data.user.idUser],
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
 * Unmark a students attendance
 * @route DELETE /api/attendance/:idAttendanceLog/mark/:idStudent
 * @permissions professor
 * @permissions admin
 */
router.delete(
  '/:idAttendanceLog/mark/:idStudent',
  auth.getToken,
  auth.verify(1, 2),
  (req, res) => {
    const { idAttendanceLog, idStudent } = req.params;
    db.query(
      `delete from attendance_x_student where id_attendance_log = ? and id_student = ?`,
      [idAttendanceLog, idStudent],
      (error) => {
        if (error) {
          res.json({ status: 'error', msg: 'Error al desmarcar de estudiante' });
        } else {
          res.json({ status: 'success', msg: 'Estudiante desmarcado' });
        }
      }
    );
  }
);

/**
 * Close an attendance log
 * @route PUT /api/attendance/:idAttendanceLog
 * @permissions professor
 */
router.put('/:idAttendanceLog', auth.getToken, auth.verify(2), (req, res) => {
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
