const express = require('express');
const multer = require('multer');
const uuid = require('uuid');
const fs = require('fs');
const AWS = require('aws-sdk');

const router = express.Router();

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

// route: /api/upload/:accountNumber
router.post('/:accountNumber', upload.single('index-face'), (req, res) => {
  // TODO check that :accountNumber is a valid student
  const { accountNumber } = req.params;
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
});

module.exports = router;
