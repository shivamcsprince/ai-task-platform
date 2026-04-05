const mongoose = require('mongoose');

const TASK_STATUSES = ['pending', 'running', 'success', 'failed'];
const TASK_OPERATIONS = ['uppercase', 'lowercase', 'reverse', 'word_count'];

const logEntrySchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    inputText: {
      type: String,
      required: [true, 'Input text is required'],
      maxlength: [10000, 'Input text cannot exceed 10,000 characters'],
    },
    operation: {
      type: String,
      required: [true, 'Operation is required'],
      enum: {
        values: TASK_OPERATIONS,
        message: `Operation must be one of: ${TASK_OPERATIONS.join(', ')}`,
      },
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'pending',
    },
    result: {
      type: String,
      default: null,
    },
    logs: {
      type: [logEntrySchema],
      default: [],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Track when processing started and ended
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// ─── Indexes for performance ──────────────────────────────────────────────────
taskSchema.index({ userId: 1, createdAt: -1 }); // List tasks per user, newest first
taskSchema.index({ status: 1 });                  // Filter by status
taskSchema.index({ userId: 1, status: 1 });       // Combined filter

// Virtual: duration in seconds
taskSchema.virtual('durationMs').get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return null;
});

module.exports = mongoose.model('Task', taskSchema);
module.exports.TASK_STATUSES = TASK_STATUSES;
module.exports.TASK_OPERATIONS = TASK_OPERATIONS;
