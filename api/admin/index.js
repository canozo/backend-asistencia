const express = require('express');
const auth = require('../../middleware/auth');
const setUserType = require('../../middleware/setUserType');

const router = express.Router();

// route: /api/admin
router.post(
  '/',
  auth.getToken,
  auth.verifyAdmin,
  setUserType.admin,
  auth.register,
  (req, res) => {
    res.json({ status: 'success', msg: 'Usuario de personal adm. registrado' });
  },
);

module.exports = router;
