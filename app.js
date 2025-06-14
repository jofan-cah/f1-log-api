require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable CORS
if (process.env.ENABLE_CORS === 'true') {
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.APP_URL] 
      : true,
    credentials: true
  }));
} else {
  // Default CORS for development
  app.use(cors());
}

// Compression middleware
app.use(compression());

// Request logging
if (process.env.ENABLE_MORGAN_LOGGING === 'true') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
} else {
  // Default logging for development
  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - create directories if they don't exist
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/public', express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

// Basic rate limiting (without external middleware for now)
app.use((req, res, next) => {
  // Simple rate limiting - can be replaced with proper middleware later
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  // Safely get version
  let version = '1.0.0';
  try {
    const packageJson = require('./package.json');
    version = packageJson.version || '1.0.0';
  } catch (error) {
    console.warn('package.json not found, using default version');
  }

  res.json({
    message: `${process.env.APP_NAME || 'ISP Inventory API'} is running!`,
    version: version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

  const routes = require('./routes');
  app.use('/api', routes);


// Import and use routes (with error handling)
// try {
//   const routes = require('./routes');
//   app.use('/api', routes);
//   console.log('✅ Routes loaded successfully');
// } catch (error) {
//   console.error('❌ Error loading routes:', error.message);
  
//   // Fallback route
//   app.use('/api', (req, res) => {
//     res.status(503).json({
//       success: false,
//       message: 'API routes are not available yet',
//       error: 'Routes loading failed'
//     });
//   });
// }

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Basic error handler (without external middleware for now)
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Server configuration
const PORT = process.env.PORT || 3000;

// Database connection and server start
const startServer = async () => {
  try {
    // Try to connect to database if models are available
    try {
      const db = require('./models');
      await db.sequelize.authenticate();
      console.log(`✅ Database connected successfully (${process.env.NODE_ENV || 'development'})`);

      // Sync database (only in development)
      if (process.env.NODE_ENV === 'development') {
        await db.sequelize.sync({ alter: false });
        console.log('📊 Database synced');
      }
    } catch (dbError) {
      console.warn('⚠️  Database connection failed:', dbError.message);
      console.log('🔄 Server will start without database connection');
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 ${process.env.APP_NAME || 'ISP Inventory API'} is running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('🛑 Shutdown signal received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('🔥 Unhandled Promise Rejection:', err);
  // Don't exit immediately in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  // Don't exit immediately in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start the server
startServer();

module.exports = app;