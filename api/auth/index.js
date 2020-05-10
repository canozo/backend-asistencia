const express = require('express');
const auth = require('../../middleware/auth');
const setUserType = require('../../middleware/setUserType');

const router = express.Router();

/**
 * Login with any user type
 * @route POST /api/auth/login
 * @body {string} email
 * @body {string} password
 */
router.post('/login', auth.getUser, auth.signToken, (req, res) => {
  res.json({ status: 'success', token: req.token, user: req.user });
});

/**
 * Self register a student
 * @route POST /api/auth/register
 * @body {string} names
 * @body {string} surnames
 * @body {string} email
 * @body {string} password
 * @body {string} accountNumber
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
 * Check if jsonwebtoken is still valid
 * @route POST /api/auth/verify
 */
router.post('/verify', auth.getToken, auth.verifyAny, (req, res) => {
  res.json({ status: 'success', user: req.data.user });
});

module.exports = router;
