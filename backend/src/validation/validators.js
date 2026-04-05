const { body, validationResult } = require('express-validator');
const { TASK_OPERATIONS } = require('../models/task.model');

// Run validations and return 400 if any fail
function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  };
}

// ─── Auth Validators ──────────────────────────────────────────────────────────
const registerValidator = validate([
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]);

const loginValidator = validate([
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]);

// ─── Task Validators ──────────────────────────────────────────────────────────
const createTaskValidator = validate([
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('inputText')
    .notEmpty()
    .withMessage('Input text is required')
    .isLength({ max: 10000 })
    .withMessage('Input text cannot exceed 10,000 characters'),
  body('operation')
    .notEmpty()
    .withMessage('Operation is required')
    .isIn(TASK_OPERATIONS)
    .withMessage(`Operation must be one of: ${TASK_OPERATIONS.join(', ')}`),
]);

module.exports = { registerValidator, loginValidator, createTaskValidator };
