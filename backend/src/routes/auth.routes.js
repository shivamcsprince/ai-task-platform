const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { registerValidator, loginValidator } = require('../validation/validators');

const router = express.Router();

// Strict rate limit for auth endpoints — 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.get('/me', authenticate, getMe);

module.exports = router;
