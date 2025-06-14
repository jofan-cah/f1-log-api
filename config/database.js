  
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Ambil konfigurasi berdasarkan environment
const env = process.env.NODE_ENV || 'development';
const config = require('./config.js')[env];

// Buat instance Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    timezone: config.timezone,
    pool: config.pool,
    logging: config.logging,
    
    // Opsi tambahan untuk optimasi
    define: {
      // Timestamps default
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      
      // Naming conventions
      underscored: true,        // Gunakan snake_case untuk kolom
      freezeTableName: true,    // Jangan ubah nama tabel
      
      // Charset untuk semua tabel
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    
    // Query options
    query: {
      raw: false  // Return Sequelize instances by default
    },
    
    // Retry options
    retry: {
      max: 3,
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
      ]
    }
  }
);

// Test koneksi database
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connection established successfully (${env})`);
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    
    // Log detail error untuk debugging
    if (env === 'development') {
      console.error('Database config:', {
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        dialect: config.dialect
      });
    }
    
    return false;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('📡 Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

// Event listeners untuk graceful shutdown
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
  config
};