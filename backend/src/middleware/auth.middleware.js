const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { AppError } = require('./error.middleware');

async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('User no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    next(err);
  }
}

module.exports = { authenticate };
