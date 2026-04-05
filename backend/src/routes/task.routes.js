const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { createTaskValidator } = require('../validation/validators');
const {
  createTask,
  runTask,
  listTasks,
  getTask,
  getTaskLogs,
} = require('../controllers/task.controller');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

router.post('/', createTaskValidator, createTask);
router.get('/', listTasks);
router.get('/:id', getTask);
router.post('/:id/run', runTask);
router.get('/:id/logs', getTaskLogs);

module.exports = router;
