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
 * Create a new student registered by admin
 * @route POST /api/student
 * @permissions admin
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 * @body {string | undefined} accountNumber
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
    res.json({ status: 'success', token: req.token });
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
    return res.json({ status: 'error', msg: 'Numero de cuenta no valido' });
  }
  db.query(
    'update user set accountNumber = ? where id_user = ?',
    [req.body.accountNumber, req.params.idStudent],
    (error) => {
      if (error) {
        res.json({ status: 'error', msg: 'Error al modificar numero de cuenta' });
      } else {
        res.json({ status: 'success', msg: 'Numero de cuenta modificado' });
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
  db.query(
    'select account_number as accountNumber from user where id_user = ?',
    [req.data.user.idUser],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al modificar numero de cuenta' });
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
