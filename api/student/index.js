const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const fs = require('fs');
const AWS = require('aws-sdk');
const auth = require('../../middleware/auth');
const pagination = require('../../middleware/pagination');
const setUserType = require('../../middleware/setUserType');
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

// route: /api/student
router.get('/', auth.getToken, auth.verifyAdmin, (req, res) => {
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

// route: /api/student/:from/:to
router.get('/:from/:to', auth.getToken, auth.verifyAdmin, pagination, (req, res) => {
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

// route: /api/student
router.post(
  '/',
  auth.getToken,
  auth.verifyAdmin,
  setUserType.student,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de estudiante registrado' });
  },
);

// route: /api/student/register
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

// route: /api/student/:idStudent
router.put('/:idStudent', auth.getToken, auth.verifyAdmin, (req, res) => {
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

// route: /api/student/upload
router.post('/upload', auth.getToken, auth.verifyStudent, upload.single('face'), (req, res) => {
  db.query(
    'select account_number as accountNumber from user where id_user = ?',
    [req.data.user.idUser],
    (error, result) => {
      if (error) {
        return res.json({ status: 'error', msg: 'Error al modificar numero de cuenta' });
      }

      const accountNumber = result[0].account_number;
      fs.readFile(req.file.path, (err, data) => {
        if (err) {
          return res.status(500).json({ status: 'error', msg: 'Error reading file.'});
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
            return res.status(500).json({ status: 'error', msg: 'Error uploading file to S3.'});
          }
          res.json({ status: 'success', msg: 'File uploaded.'});
        });
      });
    }
  );
});

module.exports = router;