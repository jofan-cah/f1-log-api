  
const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response');

// Custom key generator berdasarkan IP dan user
const generateKey = (req) => {
  // Prioritas: User ID > IP Address
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  
  // Get real IP address
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
};

// Custom error handler
const rateLimitHandler = (req, res) => {
  console.warn('Rate limit exceeded:', {
    ip: generateKey(req),
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  return sendError(res, 'Too many requests, please try again later', 429);
};

// Skip function untuk authenticated users dengan level tertentu
const skipForAdmins = (req) => {
  return req.user && req.user.user_level_id === 'admin';
};

// Rate limit configurations
const rateLimitConfigs = {
  // General API rate limiting
  general: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skip: skipForAdmins
  }),

  // Strict rate limiting untuk auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skipSuccessfulRequests: true // Don't count successful requests
  }),

  // Very strict untuk password reset
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: 'Too many password reset attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler
  }),

  // Upload file rate limiting
  upload: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // limit each IP to 10 uploads per 10 minutes
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skip: skipForAdmins
  }),

  // Search rate limiting
  search: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 searches per minute
    message: 'Too many search requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skip: skipForAdmins
  }),

  // Report generation rate limiting
  reports: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // limit each IP to 5 reports per 5 minutes
    message: 'Too many report requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skip: skipForAdmins
  }),

  // API endpoints rate limiting (per user level)
  apiByLevel: {
    admin: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000, // Admins get higher limits
      keyGenerator: generateKey,
      handler: rateLimitHandler,
      skip: (req) => req.user && req.user.user_level_id === 'admin'
    }),
    
    manager: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      keyGenerator: generateKey,
      handler: rateLimitHandler,
      skip: (req) => !req.user || !['admin', 'manager'].includes(req.user.user_level_id)
    }),
    
    default: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      keyGenerator: generateKey,
      handler: rateLimitHandler
    })
  }
};

// Dynamic rate limiter berdasarkan user level
const dynamicRateLimit = (req, res, next) => {
  let limiter;

  if (!req.user) {
    limiter = rateLimitConfigs.general;
  } else {
    switch (req.user.user_level_id) {
      case 'admin':
        limiter = rateLimitConfigs.apiByLevel.admin;
        break;
      case 'manager':
        limiter = rateLimitConfigs.apiByLevel.manager;
        break;
      default:
        limiter = rateLimitConfigs.apiByLevel.default;
        break;
    }
  }

  return limiter(req, res, next);
};

// Rate limiter untuk specific actions
const createActionLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skip: skipForAdmins
  });
};

// Burst rate limiter (untuk handle sudden spikes)
const burstLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // max 10 requests per second
  message: 'Request rate too high, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateKey,
  handler: rateLimitHandler,
  skip: skipForAdmins
});

// Rate limiter dengan whitelist
const createWhitelistLimiter = (whitelist = []) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: generateKey,
    handler: rateLimitHandler,
    skip: (req) => {
      const key = generateKey(req);
      return whitelist.includes(key) || skipForAdmins(req);
    }
  });
};

// Environment-specific rate limits
const getEnvironmentLimits = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return rateLimitConfigs;
    case 'development':
      // More relaxed limits for development
      return {
        ...rateLimitConfigs,
        general: rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 1000,
          keyGenerator: generateKey,
          handler: rateLimitHandler,
          skip: skipForAdmins
        })
      };
    case 'test':
      // No rate limiting in test
      return {
        general: (req, res, next) => next(),
        auth: (req, res, next) => next(),
        upload: (req, res, next) => next(),
        search: (req, res, next) => next(),
        reports: (req, res, next) => next()
      };
    default:
      return rateLimitConfigs;
  }
};

module.exports = {
  ...getEnvironmentLimits(),
  dynamicRateLimit,
  createActionLimiter,
  burstLimiter,
  createWhitelistLimiter,
  generateKey
};