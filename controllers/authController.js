const bcrypt = require('bcryptjs');
const { User, UserLevel } = require('../models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// Login user
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find user dengan user level
  const user = await User.findOne({
    where: { username },
    include: [{
      model: UserLevel,
      as: 'userLevel'
    }]
  });

  if (!user) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return sendError(res, 'Invalid credentials', 401);
  }

  // Check if user is active
  if (!user.is_active) {
    return sendError(res, 'Account is inactive', 401);
  }

  // ✅ Generate tokens dengan user.id (bukan user.id)
  const token = generateToken(user.id);        // ← UBAH INI
  const refreshToken = generateRefreshToken(user.id);  // ← DAN INI

  // Update last login
  await user.update({ last_login: new Date() });

  // ✅ Remove password from response - sesuaikan field names
  const userResponse = {
    id: user.id,                    // ← UBAH dari id ke id
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    department: user.department,
    user_level_id: user.user_level_id,
    is_active: user.is_active,
    last_login: user.last_login
  };

  sendSuccess(res, 'Login successful', {
    token,
    refreshToken,
    user: userResponse
  });
});
// Logout user
const logout = asyncHandler(async (req, res) => {
  // TODO: Implement token blacklisting jika diperlukan
  sendSuccess(res, 'Logout successful');
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [{
      model: UserLevel,
      as: 'userLevel'
    }],
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  sendSuccess(res, 'Profile retrieved successfully', user);
});

// Update current user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, email, phone, department } = req.body;
  
  const user = await User.findByPk(req.user.id);
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Update user data
  await user.update({
    full_name: full_name || user.full_name,
    email: email || user.email,
    phone: phone || user.phone,
    department: department || user.department,
    updated_at: new Date()
  });

  // Get updated user data
  const updatedUser = await User.findByPk(user.id, {
    attributes: { exclude: ['password'] }
  });

  sendSuccess(res, 'Profile updated successfully', updatedUser);
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findByPk(req.user.id);
  
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    return sendError(res, 'Current password is incorrect', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update password
  await user.update({ 
    password: hashedPassword,
    updated_at: new Date()
  });

  sendSuccess(res, 'Password changed successfully');
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Generate new tokens
    const newToken = generateToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    sendSuccess(res, 'Token refreshed successfully', {
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return sendError(res, 'Invalid refresh token', 401);
  }
});

// Validate token
const validateToken = asyncHandler(async (req, res) => {
  // Jika middleware auth berhasil, berarti token valid
  sendSuccess(res, 'Token is valid', {
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      user_level_id: req.user.user_level_id
    }
  });
});

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    // Don't reveal if email exists or not for security
    return sendSuccess(res, 'If the email exists, a password reset link has been sent');
  }

  // TODO: Generate reset token and send email
  // For now, just return success
  sendSuccess(res, 'Password reset email sent');
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // TODO: Verify reset token from database
  // For now, just return success for valid-looking tokens
  if (token && token.length > 10) {
    sendSuccess(res, 'Password reset successful');
  } else {
    return sendError(res, 'Invalid or expired reset token', 400);
  }
});

// Check username availability
const checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const existingUser = await User.findOne({ where: { username } });
  
  sendSuccess(res, 'Username check completed', {
    username,
    available: !existingUser
  });
});

// Check email availability
const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const existingUser = await User.findOne({ where: { email } });
  
  sendSuccess(res, 'Email check completed', {
    email,
    available: !existingUser
  });
});

module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  validateToken,
  requestPasswordReset,
  resetPassword,
  checkUsername,
  checkEmail
};