  
const jwt = require('jsonwebtoken');
const { User, UserLevel } = require('../models');
const { sendError } = require('../utils/response');

// Middleware untuk autentikasi JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return sendError(res, 'Access token required', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data from database
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: UserLevel,
        as: 'userLevel'
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    if (!user.is_active) {
      return sendError(res, 'User account is inactive', 401);
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401);
    }
    
    console.error('Auth middleware error:', error);
    return sendError(res, 'Authentication failed', 401);
  }
};

// Middleware untuk optional authentication (tidak wajib login)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: UserLevel,
        as: 'userLevel'
      }],
      attributes: { exclude: ['password'] }
    });

    req.user = user && user.is_active ? user : null;
    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

// Middleware untuk check user level
const requireLevel = (...allowedLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const userLevel = req.user.user_level_id;
    
    if (!allowedLevels.includes(userLevel)) {
      return sendError(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

// Middleware untuk check user aktif
const requireActive = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  if (!req.user.is_active) {
    return sendError(res, 'Account is inactive', 403);
  }

  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.APP_NAME || 'ISP Inventory API'
    }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.APP_NAME || 'ISP Inventory API'
    }
  );
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireLevel,
  requireActive,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};