const authService = require('../services/auth.service');
const { asyncHandler } = require('../middleware/error.middleware');

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, token } = await authService.register({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });

  res.json({
    success: true,
    message: 'Login successful',
    data: { user, token },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);

  res.json({
    success: true,
    data: { user },
  });
});

module.exports = { register, login, getMe };
