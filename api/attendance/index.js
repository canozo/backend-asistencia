const express = require('express');
const AWS = require('aws-sdk');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get open attendance logs by a professor, also used to verify if there is attendance open
 * @route GET /api/attendance
 * @permissions professor
 * @changed
 */
router.get('/', auth.getToken, auth.verify(2), (req, res) => {
  db.query(
    `select
    id_attendance_log as idAttendanceLog,
    s.id_section as idSection,
    class as className,
    code as classCode
    from attendance_log al
    inner join section s
    on al.id_section = s.id_section
    inner join user prof
    on prof.id_user = s.id_professor
    inner join class
    on class.id_class = s.id_class
    where id_user = ?
    and closed_at is null`,
    [req.data.user.idUser],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al verificar asistencia abierta' });
      } else if (result.length === 0) {
        return res.json({ status: 'success', msg: 'No tiene asistencia abierta' });
      }

      res.json({ status: 'success', msg: 'Asistencia obtenida', data: result[0] });
    }
  );
});

/**
 * Get student attendance in one specific log
 * @route GET /api/attendance/:idAttendanceLog
 * @permissions professor
 */
router.get('/:idAttendanceLog', auth.getToken, auth.verify(2), (req, res) => {
  db.query(
    `select
    sxs.id_student as idStudent,
    concat_ws(' ', user.names, user.surnames) as student,
    user.account_number as accountNumber,
    id_marked_by as idMarkedBy,
    marked_at as markedAt
    from attendance_log al
    inner join section
    on al.id_section = section.id_section
    inner join section_x_student sxs
    on section.id_section = sxs.id_section
    inner join user
    on user.id_user = sxs.id_student
    left join attendance_x_student axs
    on al.id_attendance_log = axs.id_attendance_log
    where al.id_attendance_log = ? and al.closed_at is null`,
    [req.params.idAttendanceLog],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al obtener asistencia' });
      } else if (result.length === 0) {
        return res.json({ status: 'error', msg: 'Error, la asistencia ya no está abierta' });
      }

      res.json({ status: 'success', msg: 'Asistencia obtenida', data: result });
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
  const { idSection } = req.body;

  if (isNaN(idSection)) {
    return res.json({ status: 'error', msg: 'Parametro "idSection" no es un número' });
  }

  const dynamodb = new AWS.DynamoDB({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
    region: process.env.MAIN_REGION,
  });

  db.query(
    `select id_attendance_log as idAttendanceLog
    from attendance_log al
    inner join section s
    on al.id_section = s.id_section
    inner join user prof
    on prof.id_user = s.id_professor
    where id_user = ?
    and closed_at is null`,
    [req.data.user.idUser],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al verificar asistencia abierta' });
      } else if (result.length > 0) {
        const { idAttendanceLog } = result[0];
        return res.json({
          status: 'error',
          msg: 'Ya tiene asistencia abierta',
          data: idAttendanceLog,
        });
      }

      db.query(
        'insert into attendance_log (id_section, opened_at) values (?, now())',
        [idSection],
        (error, result) => {
          if (error) {
            return res.json({ status: 'error', msg: 'Error al crear nueva asistencia' });
          }

          const { insertId } = result;
          db.query(
            'select id_classroom as IdClassroom from section where id_section = ?',
            [idSection],
            (error, result) => {
              if (error) {
                return res.json({ status: 'error', msg: 'Error al obtener id de aula de clases' });
              }

              const { IdClassroom } = result[0];
              const putParams = {
                TableName: 'active_classrooms',
                Item: {
                  IdClassroom: { N: String(IdClassroom) },
                  IdAttendanceLog: { N: String(insertId) },
                },
              };

              dynamodb.putItem(putParams, (error) => {
                if (error) {
                  return res.json({
                    status: 'error',
                    msg: 'Error abriendo asistencia con DynamoDB',
                  });
                }

                setTimeout(() => {
                  const delParams = {
                    TableName: 'active_classrooms',
                    Key: {
                      IdClassroom: { N: String(IdClassroom) },
                    }
                  };

                  dynamodb.deleteItem(delParams, (error) => {
                    if (error) {
                      console.log('Error cerrando asistencia (DynamoDB)');
                    }
                  });

                  db.query(
                    `update attendance_log
                    set closed_at = now()
                    where id_attendance_log = ? and closed_at is null`,
                    [insertId],
                    (error) => {
                      if (error) {
                        console.log('Error cerrando asistencia (MySQL)');
                      }
                    }
                  );
                }, 900000);

                res.json({ status: 'success', msg: 'Asistencia creada', id: insertId });
              });
            }
          );
        }
      );
    }
  );
});

/**
 * Mark a students attendance
 * @route POST /api/attendance/:idAttendanceLog/mark/:idStudent
 * @permissions professor
 * @permissions camera
 */
router.post('/:idAttendanceLog/mark/:idStudent', auth.getToken, auth.verify(2, 4), (req, res) => {
  const { idAttendanceLog, idStudent } = req.params;
  db.query(
    `insert ignore into attendance_x_student
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
});

/**
 * Mark a students attendance with account number instead of user id
 * @route POST /api/attendance/:idAttendanceLog/mark-account-num/:accountNumber
 * @permissions professor
 * @permissions camera
 */
router.post(
  '/:idAttendanceLog/mark-account-num/:accountNumber',
  auth.getToken,
  auth.verify(2, 4),
  (req, res) => {
    const { idAttendanceLog, accountNumber } = req.params;
    db.query(
      'select id_user as idUser from user where account_number = ?',
      [accountNumber],
      (error, result) => {
        if (error) {
          return res.json({ status: 'error', msg: 'Error al obtener id de usuario de estudiante' });
        } else if (result.length === 0) {
          return res.json({ status: 'error', msg: 'Error, número de cuenta no valido' });
        }

        const { idUser } = result[0];
        db.query(
          `insert ignore into attendance_x_student
          (id_attendance_log, id_student, id_marked_by, marked_at)
          values (?, ?, ?, now())`,
          [idAttendanceLog, idUser, req.data.user.idUser],
          (error) => {
            if (error) {
              res.json({ status: 'error', msg: 'Error al marcar estudiante (con num. cuenta)' });
            } else {
              res.json({ status: 'success', msg: 'Estudiante marcado (con num. cuenta)' });
            }
          }
        );
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
router.delete('/:idAttendanceLog/mark/:idStudent', auth.getToken, auth.verify(1, 2), (req, res) => {
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
});

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
    [idAttendanceLog],
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
