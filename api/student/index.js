const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
const regex = require('../../config/regex');
const db = require('../../config/db');

const router = express.Router();

// multer config and upload middleware
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tmp/faces');
  },
  filename: (req, file, cb) => {
    let ext;
    if (file.mimetype === 'image/jpeg') {
      ext = 'jpg';
    } else if (file.mimetype === 'image/png') {
      ext = 'png';
    } else {
      return cb(`Error: File type ${file.mimetype} not supported.`);
    }
    cb(null, `${uuid.v4().replace(/-/gi, '')}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
});

/**
 * Get all students
 * @route GET /api/student
 * @permissions admin
 */
router.get('/', auth.getToken, auth.verify(1), (req, res) => {
  db.query(
    `select
    id_user as idUser,
    email,
    names,
    surnames
    from user
    where id_user_type = 3`,
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener estudiantes' });
      } else {
        res.json({ status: 'success', msg: 'Estudiantes obtenidos', data: result });
      }
    }
  );
});

/**
 * Get students paginated
 * @route GET /api/student/:from/:to
 * @permissions admin
 */
router.get('/:from/:to', auth.getToken, auth.verify(1), pagination, (req, res) => {
  db.query(
    `select
    id_user as idUser,
    email,
    names,
    surnames
    from user
    where id_user_type = 3
    order by id_user asc
    limit ?, ?`,
    [req.params.from, req.params.to],
    (error, result) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al obtener estudiantes' });
      } else {
        res.json({ status: 'success', msg: 'Estudiantes obtenidos', data: result });
      }
    }
  );
});

/**
 * Get student attendance history
 * @route GET /api/student/attendance
 * @permissions student
 * @changed
 */
router.get('/attendance', auth.getToken, auth.verify(3), (req, res) => {
  db.query(
    `select
    section.id_section as idSection,
    al.id_attendance_log as idLog,
    id_professor as idProfessor,
    id_marked_by as idMarkedBy,
    marked_at as markedAt,
    class as className,
    code as classCode
    from attendance_log al
    inner join section
    on al.id_section = section.id_section
    inner join class
    on section.id_class = class.id_class
    inner join section_x_student sxs
    on section.id_section = sxs.id_section
    inner join user
    on user.id_user = sxs.id_student
    left join attendance_x_student axs
    on al.id_attendance_log = axs.id_attendance_log
    where user.id_user = ?`,
    [req.data.user.idUser],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al obtener historial de asistencia' });
      }

      res.json({ status: 'success', msg: 'Historial de asistencia obtenido', data: result });
    }
  );
});

/**
 * Get all registered face ids by a student
 * @route GET /api/student/faces
 * @permissions student
 * @changed
 */
router.get('/faces', auth.getToken, auth.verify(3), (req, res) => {
  db.query(
    'select account_number as accountNumber from user where id_user = ?',
    [req.data.user.idUser],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al obtener número de cuenta' });
      }

      const dynamodb = new AWS.DynamoDB({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
        region: process.env.MAIN_REGION,
      });

      const { accountNumber } = result[0];
      const params = {
        TableName: 'students_collection',
        FilterExpression: 'AccountNumber = :accountNumber',
        ExpressionAttributeValues: {
          ':accountNumber': { S: String(accountNumber) }
        }
      };

      dynamodb.scan(params, (error, result) => {
        if (error) {
          return res.json({ status: 'error', msg: 'Error al obtener identificadores de rostros' });
        }
        const data = result.Items.map(item => item.RekognitionId.S);
        return res.json({ status: 'success', msg: 'Identificadores obtenidos!', data });
      });
    }
  );
});

/**
 * Get all sections enrolled by the student
 * @route GET /api/student/enrolled
 * @changed
 */
router.get('/enrolled', auth.getToken, auth.verify(3), (req, res) => {
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
    concat_ws(' ', prof.names, prof.surnames) as professor,
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
    inner join section_x_student
    on section_x_student.id_section = section.id_section
    inner join user student
    on student.id_user = section_x_student.id_student
    where semester.active = 1 and student.id_user = ?
    group by section.id_section`,
    [req.data.user.idUser],
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
 * Create a new student registered by admin
 * @route POST /api/student
 * @permissions admin
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 * @body {string} accountNumber
 */
router.post(
  '/',
  auth.getToken,
  auth.verify(1),
  setUserType.student,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de estudiante registrado' });
  },
);

/**
 * Self register a student
 * @route POST /api/student/register
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 * @body {string | undefined} accountNumber
 */
router.post(
  '/register',
  setUserType.student,
  auth.register,
  auth.getUser,
  auth.signToken,
  (req, res) => {
    res.json({ status: 'success', token: req.token, user: req.user });
  }
);

/**
 * Update student account number
 * @route PUT /api/student/:idStudent
 * @permissions admin
 * @body {string} accountNumber
 */
router.put('/:idStudent', auth.getToken, auth.verify(1), (req, res) => {
  if (!regex.accountNum.test(req.body.accountNumber)) {
    return res.json({ status: 'error', msg: 'Número de cuenta no valido' });
  }
  db.query(
    'update user set accountNumber = ? where id_user = ?',
    [req.body.accountNumber, req.params.idStudent],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar número de cuenta' });
      } else {
        res.json({ status: 'success', msg: 'Número de cuenta modificado' });
      }
    }
  );
});

/**
 * Upload student face image to S3
 * @route POST /api/student/upload
 * @permissions student
 */
router.post('/upload', auth.getToken, auth.verify(3), upload.single('face'), (req, res) => {
  if (!req.file) {
    return res.json({ status: 'error', msg: 'Error, el archivo no fue definido' })
  }

  db.query(
    'select account_number as accountNumber from user where id_user = ?',
    [req.data.user.idUser],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al obtener número de cuenta' });
      }

      const { accountNumber } = result[0];
      fs.readFile(req.file.path, (err, data) => {
        if (err) {
          return res.status(500).json({ status: 'error', msg: 'Error leyendo archivo de imagen' });
        }

        const s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
        });

        s3.upload({
          Bucket: process.env.MAIN_BUCKET,
          Key: `index/${req.file.filename}`,
          Metadata: { AccountNumber: accountNumber },
          Body: data,
        }, (s3err, s3data) => {
          if (s3err) {
            return res.status(500).json({ status: 'error', msg: 'Error cargando archivo a S3' });
          }

          const deletePath = path.join(__dirname, '..', '..', 'tmp', 'faces', req.file.filename);
          fs.unlink(deletePath, (err) => {
            if (err) {
              console.log('Error eliminando imagen del servidor: ', err);
            }
          });

          res.json({ status: 'success', msg: 'Imagen cargada' });
        });
      });
    }
  );
});

module.exports = router;
