const express = require('express');
const auth = require('../../middleware/auth');
const setUserType = require('../../middleware/setUserType');

const router = express.Router();

/**
 * Create new admin user
 * @route POST /api/admin
 * @permissions admin
 */
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
