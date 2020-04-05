const express = require('express');
const auth = require('../../middleware/auth');
const setUserType = require('../../middleware/setUserType');

const router = express.Router();

// route: /api/auth/login
router.post('/login', auth.getUser, auth.signToken, (req, res) => {
  res.json({ status: 'success', token: req.token });
});

// route: /api/auth/register
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

// route: /api/auth/verify
router.post('/verify', auth.getToken, auth.verifyAny, (req, res) => {
  res.json({ status: 'success', user: req.data.user });
});

module.exports = router;
