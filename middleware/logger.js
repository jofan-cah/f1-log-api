  
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log types
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Custom tokens for enhanced logging
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

morgan.token('user-level', (req) => {
  return req.user ? req.user.user_level_id : 'none';
});

morgan.token('real-ip', (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
});

morgan.token('timestamp', () => {
  return new Date().toISOString();
});

morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '-';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

// Custom format for detailed logging
const detailedFormat = ':timestamp :real-ip :user-id (:user-level) ":method :url" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// Custom format for production
const productionFormat = ':timestamp :real-ip :user-id ":method :url" :status :response-time-ms ms';

// Custom format for development
const developmentFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

// Skip options for different environments
const skipOptions = {
  // Skip successful requests in production
  skipSuccessful: (req, res) => {
    return process.env.NODE_ENV === 'production' && res.statusCode < 400;
  },
  
  // Only log errors
  onlyErrors: (req, res) => {
    return res.statusCode < 400;
  },
  
  // Skip health checks
  skipHealthChecks: (req, res) => {
    return req.url === '/health' || req.url === '/ping';
  }
};

// Logger configurations
const loggerConfigs = {
  // Development logger - console only
  development: morgan(developmentFormat, {
    skip: skipOptions.skipHealthChecks
  }),

  // Production logger - file + console for errors
  production: [
    // All requests to file
    morgan(productionFormat, {
      stream: accessLogStream,
      skip: skipOptions.skipHealthChecks
    }),
    
    // Errors to error file
    morgan(detailedFormat, {
      stream: errorLogStream,
      skip: (req, res) => res.statusCode < 400
    }),
    
    // Errors to console
    morgan(detailedFormat, {
      skip: (req, res) => res.statusCode < 400
    })
  ],

  // Detailed logger for debugging
  detailed: morgan(detailedFormat, {
    stream: accessLogStream
  })
};

// Security logger untuk track security events
const securityLogger = (req, res, next) => {
  const securityEvents = [];

  // Track authentication failures
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      securityEvents.push({
        type: 'auth_failure',
        ip: req.headers['x-forwarded-for'] || req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
    }

    // Track multiple failed attempts (should be enhanced with rate limiting)
    if (req.url.includes('/login') && res.statusCode === 401) {
      securityEvents.push({
        type: 'login_failure',
        ip: req.headers['x-forwarded-for'] || req.ip,
        username: req.body?.username,
        timestamp: new Date().toISOString()
      });
    }

    // Log security events
    if (securityEvents.length > 0) {
      securityEvents.forEach(event => {
        console.warn('SECURITY EVENT:', JSON.stringify(event));
        // TODO: Send to security monitoring service
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Audit logger untuk track important actions
const auditLogger = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      // Log successful important actions
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const auditEvent = {
          action,
          userId: req.user ? req.user.id : 'anonymous',
          userLevel: req.user ? req.user.user_level_id : 'none',
          ip: req.headers['x-forwarded-for'] || req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date().toISOString(),
          resourceId: req.params.id || null
        };

        console.log('AUDIT:', JSON.stringify(auditEvent));
        
        // TODO: Send to audit logging service
        // fs.appendFile(path.join(logsDir, 'audit.log'), 
        //   JSON.stringify(auditEvent) + '\n', 
        //   (err) => { if (err) console.error('Audit log error:', err); }
        // );
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

// Performance logger
const performanceLogger = (threshold = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (duration > threshold) {
        console.warn('SLOW REQUEST:', {
          method: req.method,
          url: req.originalUrl,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }
    });

    next();
  };
};

// Get appropriate logger based on environment
const getLogger = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return loggerConfigs.production;
    case 'development':
      return loggerConfigs.development;
    case 'test':
      return []; // No logging in test
    default:
      return loggerConfigs.detailed;
  }
};

module.exports = {
  getLogger,
  securityLogger,
  auditLogger,
  performanceLogger,
  accessLogStream,
  errorLogStream
};