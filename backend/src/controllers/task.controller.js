const taskService = require('../services/task.service');
const { asyncHandler } = require('../middleware/error.middleware');

const createTask = asyncHandler(async (req, res) => {
  const { title, inputText, operation } = req.body;
  const task = await taskService.createTask({ title, inputText, operation }, req.user._id);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task },
  });
});

const runTask = asyncHandler(async (req, res) => {
  const task = await taskService.enqueueTask(req.params.id, req.user._id);

  res.json({
    success: true,
    message: 'Task enqueued for processing',
    data: { task },
  });
});

const listTasks = asyncHandler(async (req, res) => {
  const { page, status } = req.query;
  const result = await taskService.listTasks(req.user._id, {
    page: parseInt(page) || 1,
    status,
  });

  res.json({
    success: true,
    data: result,
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id, req.user._id);

  res.json({
    success: true,
    data: { task },
  });
});

const getTaskLogs = asyncHandler(async (req, res) => {
  const logs = await taskService.getTaskLogs(req.params.id, req.user._id);

  res.json({
    success: true,
    data: { logs },
  });
});

module.exports = { createTask, runTask, listTasks, getTask, getTaskLogs };
