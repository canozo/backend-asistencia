const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');

const router = express.Router();

// route: /api/auth/login
router.post('/login', auth.getUser, (req, res) => {
  jwt.sign({ user: req.user }, process.env.JWT_SALT, { expiresIn: '90m' }, (err, token) => {
    if (err) {
      res.json({ status: 'error', msg: 'Error jsonwebtoken' });
    } else {
      res.json({ status: 'success', token });
    }
  });
});

// route: /api/auth/verify
router.post('/verify', auth.getToken, auth.verifyAny, (req, res) => {
  res.json({ status: 'success', user: req.data.user });
});

module.exports = router;
