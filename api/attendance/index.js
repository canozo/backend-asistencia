const express = require('express');
const AWS = require('aws-sdk');
const auth = require('../../middleware/auth');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get open attendance logs by a professor, also used to verify if there is attendance open
 * @route GET /api/attendance
 * @permissions professor
 */
router.get('/', auth.getToken, auth.verify(2), async (req, res) => {
  try {
    const result = await db.query(
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
    );
    if (result.length === 0) {
      return res.json({ status: 'success', msg: 'No tiene asistencia abierta' });
    }
    return res.json({ status: 'success', msg: 'Asistencia obtenida', data: result[0] });
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al verificar asistencia abierta' });
  }
});

/**
 * Get student attendance in one specific log
 * @route GET /api/attendance/:idAttendanceLog
 * @permissions professor
 */
router.get('/:idAttendanceLog', auth.getToken, auth.verify(2), async (req, res) => {
  try {
    const result = await db.query(
      `select
      sxs.id_student as idStudent,
      concat_ws(' ', user.names, user.surnames) as student,
      user.account_number as accountNumber,
      id_marked_by as idMarkedBy,
      marked_at as markedAt,
      capture_key as captureKey
      from attendance_log al
      inner join section
      on al.id_section = section.id_section
      inner join section_x_student sxs
      on section.id_section = sxs.id_section
      inner join user
      on user.id_user = sxs.id_student
      left join attendance_x_student axs
      on al.id_attendance_log = axs.id_attendance_log and sxs.id_student = axs.id_student
      where al.id_attendance_log = ?
      and section.id_professor = ?
      and al.closed_at is null`,
      [req.params.idAttendanceLog, req.data.user.idUser],
    );
    if (result.length === 0) {
      return res.json({ status: 'error', msg: 'La asistencia ya no está abierta' });
    }
    return res.json({ status: 'success', msg: 'Asistencia obtenida', data: result });
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al obtener asistencia' });
  }
});

/**
 * Create a new attendance log
 * @route POST /api/attendance
 * @permissions professor
 * @body {string | number} idSection
 */
router.post('/', auth.getToken, auth.verify(2), async (req, res) => {
  const { idSection } = req.body;

  if (isNaN(idSection)) {
    return res.json({ status: 'error', msg: 'Parametro "idSection" no es un número' });
  }

  // verify if professor already has another attendance open
  try {
    const result = await db.query(
      `select id_attendance_log as idAttendanceLog
      from attendance_log al
      inner join section s
      on al.id_section = s.id_section
      inner join user prof
      on prof.id_user = s.id_professor
      where id_user = ?
      and closed_at is null`,
      [req.data.user.idUser],
    );
    if (result.length > 0) {
      const id = result[0].idAttendanceLog;
      return res.json({ status: 'error', msg: 'Ya tiene asistencia abierta', data: id });
    }
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al verificar asistencia abierta' });
  }

  // create new attendance log
  let insertId;
  try {
    const result = await db.query(
      'insert into attendance_log (id_section, opened_at) values (?, now())',
      [idSection],
    );
    insertId = result.insertId;
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al crear nueva asistencia' });
  }

  // get id classroom for later
  let IdClassroom;
  try {
    const result = await db.query(
      'select id_classroom as IdClassroom from section where id_section = ?',
      [idSection],
    );
    IdClassroom = result[0].IdClassroom;
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al obtener id de aula de clases' });
  }

  // open attendance on dynamodb
  const dynamodb = new AWS.DynamoDB({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
    region: process.env.MAIN_REGION,
  });

  const putParams = {
    TableName: 'active_classrooms',
    Item: {
      IdClassroom: { N: String(IdClassroom) },
      IdAttendanceLog: { N: String(insertId) },
    },
  };

  try {
    await dynamodb.putItem(putParams).promise();
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error abriendo asistencia con DynamoDB' });
  }

  res.json({ status: 'success', msg: 'Asistencia creada', id: insertId });

  // set timeout to close attendance in 15 minutes
  setTimeout(async () => {
    const delParams = {
      TableName: 'active_classrooms',
      Key: {
        IdClassroom: { N: String(IdClassroom) },
      }
    };

    try {
      await dynamodb.deleteItem(delParams).promise();
    } catch {
      console.log('Error cerrando asistencia (DynamoDB)');
    }

    try {
      await db.query(
        `update attendance_log
        set closed_at = now()
        where id_attendance_log = ? and closed_at is null`,
        [insertId],
      );
    } catch {
      console.log('Error cerrando asistencia (MySQL)');
    }
  }, 900000);
});

/**
 * Mark a students attendance
 * @route POST /api/attendance/:idAttendanceLog/mark/:idStudent
 * @permissions professor
 * @permissions camera
 * @body {string} captureKey
 */
router.post(
  '/:idAttendanceLog/mark/:idStudent',
  auth.getToken,
  auth.verify(2, 4),
  async (req, res) => {
    const { idAttendanceLog, idStudent } = req.params;

    // verify that attendance is open
    try {
      const result = await db.query(
        `select count(*) as isOpen
        from attendance_log where id_attendance_log = ? and closed_at is null`,
        [idAttendanceLog],
      );
      if (!result[0].isOpen) {
        return res.json({ status: 'error', msg: 'No puede marcar, la asistencia ya está cerrada' });
      }
    } catch {
      res.status(500);
      return res.json({ status: 'error', msg: 'Error al verificar asistencia abierta' });
    }

    // mark student
    try {
      await db.query(
        `insert ignore into attendance_x_student
        (id_attendance_log, id_student, id_marked_by, marked_at, capture_key)
        values (?, ?, ?, now(), ?)`,
        [idAttendanceLog, idStudent, req.data.user.idUser, req.body.captureKey],
      );
      return res.json({ status: 'success', msg: 'Estudiante marcado' });
    } catch {
      return res.status(500).json({ status: 'error', msg: 'Error al marcar estudiante' });
    }
  }
);

/**
 * Mark a students attendance with account number instead of user id
 * @route POST /api/attendance/:idAttendanceLog/mark-account-num/:accountNumber
 * @permissions professor
 * @permissions camera
 * @body {string} captureKey
 */
router.post(
  '/:idAttendanceLog/mark-account-num/:accountNumber',
  auth.getToken,
  auth.verify(2, 4),
  async (req, res) => {
    let idUser;
    const { idAttendanceLog, accountNumber } = req.params;

    // verify that attendance is open
    try {
      const result = await db.query(
        `select count(*) as isOpen
        from attendance_log where id_attendance_log = ? and closed_at is null`,
        [idAttendanceLog],
      );
      if (!result[0].isOpen) {
        return res.json({ status: 'error', msg: 'No puede marcar, la asistencia ya está cerrada' });
      }
    } catch {
      res.status(500);
      return res.json({ status: 'error', msg: 'Error al verificar asistencia abierta' });
    }

    // get user id from student account number
    try {
      const result = await db.query(
        'select id_user as idUser from user where account_number = ?',
        [accountNumber],
      );
      if (result.length === 0) {
        return res.json({ status: 'error', msg: 'Error, número de cuenta no valido' });
      }
      idUser = result[0].idUser;
    } catch {
      res.status(500);
      return res.json({ status: 'error', msg: 'Error al obtener id de usuario de estudiante' });
    }

    // mark student
    try {
      await db.query(
        `insert ignore into attendance_x_student
        (id_attendance_log, id_student, id_marked_by, marked_at, capture_key)
        values (?, ?, ?, now(), ?)`,
        [idAttendanceLog, idUser, req.data.user.idUser, req.body.captureKey],
      );
      return res.json({ status: 'success', msg: 'Estudiante marcado (con num. cuenta)' });
    } catch {
      res.status(500);
      return res.json({ status: 'error', msg: 'Error al marcar estudiante (con num. cuenta)', });
    }
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
  async (req, res) => {
    const { idAttendanceLog, idStudent } = req.params;

    // verify that attendance is open
    try {
      const result = await db.query(
        `select count(*) as isOpen
        from attendance_log where id_attendance_log = ? and closed_at is null`,
        [idAttendanceLog],
      );
      if (!result[0].isOpen) {
        return res.json({ status: 'error', msg: 'La asistencia ya está cerrada' });
      }
    } catch {
      res.status(500);
      return res.json({ status: 'error', msg: 'Error al verificar asistencia abierta' });
    }

    // unmark student
    try {
      await db.query(
        `delete from attendance_x_student where id_attendance_log = ? and id_student = ?`,
        [idAttendanceLog, idStudent],
      );
      return res.json({ status: 'success', msg: 'Estudiante desmarcado' });
    } catch {
      return res.status(500).json({ status: 'error', msg: 'Error al desmarcar de estudiante' });
    }
  }
);

/**
 * Close an attendance log
 * @route PUT /api/attendance/:idAttendanceLog
 * @permissions professor
 */
router.put('/:idAttendanceLog', auth.getToken, auth.verify(2), async (req, res) => {
  const { idAttendanceLog } = req.params;

  // get classroom id for later
  let IdClassroom;
  try {
    const result = await db.query(
      `select section.id_classroom as IdClassroom
      from attendance_log
      inner join section
      on section.id_section = attendance_log.id_section
      where id_attendance_log = ?`,
      [idAttendanceLog],
    );
    IdClassroom = result[0].IdClassroom;
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al obtener id de aula de clases' });
  }

  // close attendance log in mysql
  try {
    await db.query(
      `update attendance_log
      set closed_at = now()
      where id_attendance_log = ? and closed_at is null`,
      [idAttendanceLog],
    );
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al cerrar asistencia' });
  }

  // close attendance in dynamodb
  const dynamodb = new AWS.DynamoDB({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
    region: process.env.MAIN_REGION,
  });

  const delParams = {
    TableName: 'active_classrooms',
    Key: {
      IdClassroom: { N: String(IdClassroom) },
    }
  };

  try {
    await dynamodb.deleteItem(delParams).promise();
    return res.json({ status: 'success', msg: 'Asistencia cerrada' });
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error cerrando asistencia (DynamoDB)' });
  }
});

module.exports = router;
