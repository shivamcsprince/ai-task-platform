const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { AppError } = require('../middleware/error.middleware');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register({ name, email, password }) {
  // Check if user already exists
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered.', 409);

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  return { user, token };
}

async function login({ email, password }) {
  // Explicitly select password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    // Same message for both cases to prevent user enumeration
    throw new AppError('Invalid email or password.', 401);
  }

  const token = signToken(user._id);

  // Remove password from response
  user.password = undefined;

  return { user, token };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
}

module.exports = { register, login, getMe };
