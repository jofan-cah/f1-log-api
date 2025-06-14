  
require('dotenv').config();

// Konfigurasi database untuk Sequelize CLI dan aplikasi
// File ini dibaca oleh sequelize-cli untuk migration, seeding, dll
module.exports = {
  // Environment Development
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'isp_inventory_dev',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    
    // Opsi khusus MariaDB/MySQL
    dialectOptions: {
      timezone: 'Etc/GMT-7', // UTC+7 untuk Indonesia
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      // Opsi koneksi tambahan
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
    },
    
    // Timezone aplikasi
    timezone: '+07:00', // Indonesia
    
    // Pool koneksi untuk optimasi
    pool: {
      max: 10,          // Maksimal 10 koneksi
      min: 0,           // Minimal 0 koneksi
      acquire: 30000,   // Timeout untuk acquire koneksi
      idle: 10000       // Timeout untuk idle koneksi
    },
    
    // Logging SQL queries (untuk development)
    logging: console.log,
    
    // Options untuk migration
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelizemeta',
    
    // Options untuk seeding
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelizedata'
  },

  // Environment Test
  test: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME_TEST || 'isp_inventory_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    
    dialectOptions: {
      timezone: 'Etc/GMT-7',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    
    timezone: '+07:00',
    
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    
    // Disable logging untuk test
    logging: false,
    
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelizemeta'
  },

  // Environment Production
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mariadb',
    
    dialectOptions: {
      timezone: 'Etc/GMT-7',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      
      // SSL untuk production (jika perlu)
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    
    timezone: '+07:00',
    
    // Pool lebih besar untuk production
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    
    // Disable logging untuk production
    logging: false,
    
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelizemeta'
  }
};