const express = require('express');
const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
const db = require('../../config/db');

const router = express.Router();

/**
 * Get all cameras
 * @route GET /api/camera
 * @permissions admin
 */
router.get('/', auth.getToken, auth.verify(1), async (req, res) => {
  try {
    const result = await db.query(
      'select id_user as idUser, email, names, surnames from user where id_user_type = 4',
    );
    res.json({ status: 'success', msg: 'Camaras obtenidas', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener camaras' });
  }
});

/**
 * Get attendance log history by this camera
 * @route GET /api/camera/marked
 * @permissions camera
 */
router.get('/marked', auth.getToken, auth.verify(4), async (req, res) => {
  try {
    const result = await db.query(
      `select
      al.id_attendance_log as idLog,
      student.id_user as idStudent,
      c.code as classCode,
      c.class as className,
      concat_ws(' ', student.names, student.surnames) as student,
      student.account_number as accountNumber,
      marked_at as markedAt,
      capture_key as captureKey
      from attendance_x_student axs
      inner join user student
      on axs.id_student = student.id_user
      inner join attendance_log al
      on al.id_attendance_log = axs.id_attendance_log
      inner join section s
      on s.id_section = al.id_section
      inner join class c
      on c.id_class = s.id_class
      where id_marked_by = ?`,
      [req.data.user.idUser],
    );
    res.json({ status: 'success', msg: 'Estudiantes marcados obtenidos', data: result });
  } catch {
    return res.status(500).json({ status: 'error', msg: 'Error al obtener estudiantes marcados' });
  }
});

/**
 * Get capture key as image
 * @route GET /api/camera/capture/:key
 * @permissions camera
 */
router.get('/capture/:key', auth.getToken, auth.verify(4), async (req, res) => {
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
  });
  const local = path.join(__dirname, '..', '..', 'tmp', 'captures', req.params.key);

  try {
    if (!fs.existsSync(local)) {
      // download from s3
      const file = fs.createWriteStream(local);
      const params = {
        Key: `captures/${req.params.key}`,
        Bucket: process.env.MAIN_BUCKET,
      };
      const stream = s3.getObject(params).createReadStream().pipe(file);
      stream.on('finish', () => res.sendFile(local));
    } else {
      res.sendFile(local);
    }
  } catch (err) {
    res.status(500).json({ status: 'error', msg: 'Error al obtener imagen de estudiante' });
  }
});

/**
 * Get cameras paginated
 * @route GET /api/camera/:from/:to
 * @permissions admin
 */
router.get('/:from/:to', auth.getToken, auth.verify(1), pagination, async (req, res) => {
  try {
    const result = await db.query(
      `select id_user as idUser, email, names, surnames
      from user
      where id_user_type = 4
      order by id_user asc
      limit ?, ?`,
      [req.params.from, req.params.to],
    );
    res.json({ status: 'success', msg: 'Camaras obtenidas', data: result });
  } catch {
    res.status(500).json({ status: 'error', msg: 'Error al obtener camaras' });
  }
});

/**
 * Create a new camera user
 * @route POST /api/camera
 * @permissions admin
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 */
router.post('/', auth.getToken, auth.verify(1), setUserType.camera, auth.register, (req, res) => {
  res.json({ status: 'success', msg: 'Usuario de camara registrado', id: req.idUser });
});

module.exports = router;
