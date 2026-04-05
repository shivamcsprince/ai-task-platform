const { v4: uuidv4 } = require('uuid');
const Task = require('../models/task.model');
const { getRedisClient } = require('../config/redis');
const { AppError } = require('../middleware/error.middleware');
const logger = require('../utils/logger');

const QUEUE_NAME = process.env.REDIS_QUEUE_NAME || 'task_queue';
const PAGE_SIZE = 20;

// ─── Create Task ──────────────────────────────────────────────────────────────
async function createTask({ title, inputText, operation }, userId) {
  const task = await Task.create({
    title,
    inputText,
    operation,
    userId,
    status: 'pending',
  });

  logger.info(`Task created: ${task._id} [${operation}] by user ${userId}`);
  return task;
}

// ─── Enqueue Task for Processing ─────────────────────────────────────────────
async function enqueueTask(taskId, userId) {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) throw new AppError('Task not found.', 404);

  if (task.status === 'running') {
    throw new AppError('Task is already running.', 400);
  }
  if (task.status === 'success') {
    throw new AppError('Task already completed successfully.', 400);
  }

  // Reset state if re-running a failed task
  await Task.findByIdAndUpdate(taskId, {
    status: 'pending',
    result: null,
    logs: [],
    startedAt: null,
    completedAt: null,
  });

  // Build the job payload for the worker
  const job = {
    jobId: uuidv4(),
    taskId: task._id.toString(),
    operation: task.operation,
    inputText: task.inputText,
    enqueuedAt: new Date().toISOString(),
  };

  try {
    const redis = getRedisClient();
    // LPUSH adds to the left; worker uses BRPOP (blocking right-pop) for FIFO
    await redis.lpush(QUEUE_NAME, JSON.stringify(job));
    logger.info(`Job enqueued: ${job.jobId} for task ${taskId}`);
  } catch (redisErr) {
    // If Redis is down, mark task as failed rather than leaving it in limbo
    await Task.findByIdAndUpdate(taskId, {
      status: 'failed',
      logs: [{ level: 'error', message: 'Failed to enqueue job: Redis unavailable' }],
    });
    logger.error('Redis enqueue failed:', redisErr.message);
    throw new AppError('Task queue is temporarily unavailable. Please try again later.', 503);
  }

  const updatedTask = await Task.findById(taskId);
  return updatedTask;
}

// ─── List Tasks (Paginated) ───────────────────────────────────────────────────
async function listTasks(userId, { page = 1, status } = {}) {
  const filter = { userId };
  if (status) filter.status = status;

  const skip = (page - 1) * PAGE_SIZE;

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(PAGE_SIZE).lean(),
    Task.countDocuments(filter),
  ]);

  return {
    tasks,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / PAGE_SIZE),
      hasNext: page * PAGE_SIZE < total,
    },
  };
}

// ─── Get Single Task ──────────────────────────────────────────────────────────
async function getTaskById(taskId, userId) {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) throw new AppError('Task not found.', 404);
  return task;
}

// ─── Get Task Logs ────────────────────────────────────────────────────────────
async function getTaskLogs(taskId, userId) {
  const task = await Task.findOne({ _id: taskId, userId }, 'logs status');
  if (!task) throw new AppError('Task not found.', 404);
  return task.logs;
}

module.exports = { createTask, enqueueTask, listTasks, getTaskById, getTaskLogs };
