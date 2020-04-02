const express = require('express');
const auth = require('../../middleware/auth');

const router = express.Router();

const setIdUserType = {
  admin: (req, res, next) => {
    req.body.idUserType = 1;
    next();
  },
  professor: (req, res, next) => {
    req.body.idUserType = 2;
    next();
  },
  student: (req, res, next) => {
    req.body.idUserType = 3;
    next();
  },
};

// route: /api/admin/register/admin
router.post(
  '/register/admin',
  auth.getToken,
  auth.verifyAdmin,
  setIdUserType.admin,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de personal adm. registrado' });
  },
);

// route: /api/admin/register/professor
router.post(
  '/register/professor',
  auth.getToken,
  auth.verifyAdmin,
  setIdUserType.professor,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de profesor registrado' });
  },
);

// route: /api/admin/register/student
router.post(
  '/register/student',
  auth.getToken,
  auth.verifyAdmin,
  setIdUserType.student,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de estudiante registrado' });
  },
);

module.exports = router;
