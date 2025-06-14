  
// Application constants

// User levels
const USER_LEVELS = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TECHNICIAN: 'technician',
  WAREHOUSE: 'warehouse',
  VIEWER: 'viewer'
};

// User level descriptions
const USER_LEVEL_DESCRIPTIONS = {
  [USER_LEVELS.ADMIN]: 'Administrator - Full system access',
  [USER_LEVELS.MANAGER]: 'Manager - Management level access',
  [USER_LEVELS.TECHNICIAN]: 'Technician - Field technician access',
  [USER_LEVELS.WAREHOUSE]: 'Warehouse Staff - Warehouse operations access',
  [USER_LEVELS.VIEWER]: 'Viewer - Read-only access'
};

// Product status
const PRODUCT_STATUS = {
  AVAILABLE: 'Available',
  IN_USE: 'In Use',
  MAINTENANCE:'repair',
  DAMAGED: 'Damaged',
  DISPOSED: 'Disposed'
};

// Product conditions
const PRODUCT_CONDITIONS = {
  NEW: 'New',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
  DAMAGED: 'Damaged'
};

// Transaction types
const TRANSACTION_TYPES = {
  CHECK_OUT: 'check_out',
  CHECK_IN: 'check_in',
  TRANSFER: 'lost',
  MAINTENANCE:'repair'
};

// Transaction status
const TRANSACTION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  PENDING: 'pending'
};

// Stock movement types
const STOCK_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
  TRANSFER: 'lost'
};

// Purchase receipt status
const PURCHASE_RECEIPT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Category codes dan names
const CATEGORIES = {
  RTR: { code: 'RTR', name: 'Router' },
  SWH: { code: 'SWH', name: 'Switch' },
  MDM: { code: 'MDM', name: 'Modem' },
  APT: { code: 'APT', name: 'Access Point' },
  FBR: { code: 'FBR', name: 'Kabel Fiber Optic' },
  UTP: { code: 'UTP', name: 'Kabel UTP Cat6' },
  ANT: { code: 'ANT', name: 'Antenna' },
  SVR: { code: 'SVR', name: 'Server' },
  LPT: { code: 'LPT', name: 'Laptop' },
  TLS: { code: 'TLS', name: 'Tools & Equipment' }
};

// Modules untuk permissions
const MODULES = {
  CATEGORIES: 'categories',
  SUPPLIERS: 'suppliers',
  PRODUCTS: 'products',
  PURCHASING: 'purchasing',
  TRANSACTIONS: 'transactions',
  USERS: 'users',
  REPORTS: 'reports'
};

// Permission actions
const PERMISSIONS = {
  VIEW: 'view',
  ADD: 'add',
  EDIT: 'edit',
  DELETE: 'delete'
};

// File types untuk uploads
const ALLOWED_FILE_TYPES = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'],
  ARCHIVES: ['.zip', '.rar']
};

// File size limits (dalam bytes)
const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024,      // 5MB
  DOCUMENT: 10 * 1024 * 1024,  // 10MB
  AVATAR: 2 * 1024 * 1024      // 2MB
};

// API response messages
const MESSAGES = {
  SUCCESS: {
    CREATE: 'Data created successfully',
    UPDATE: 'Data updated successfully',
    DELETE: 'Data deleted successfully',
    FETCH: 'Data retrieved successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful'
  },
  ERROR: {
    NOT_FOUND: 'Data not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    DUPLICATE_ENTRY: 'Data already exists',
    INVALID_CREDENTIALS: 'Invalid username or password',
    TOKEN_EXPIRED: 'Token has expired',
    INSUFFICIENT_STOCK: 'Insufficient stock',
    INVALID_TRANSACTION: 'Invalid transaction'
  }
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Date formats
const DATE_FORMATS = {
  DB_DATE: 'YYYY-MM-DD',
  DB_DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'DD MMMM YYYY',
  DISPLAY_DATETIME: 'DD MMMM YYYY HH:mm:ss',
  SHORT_DATE: 'DD/MM/YY',
  ISO_DATE: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// Email notification types
const NOTIFICATION_TYPES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  LOW_STOCK: 'low_stock',
  TRANSACTION: 'transaction',
  PURCHASE: 'purchase'
};

// QR code types
const QR_CODE_TYPES = {
  PRODUCT: 'product',
  TRANSACTION: 'transaction',
  LOCATION: 'location',
  CUSTOM: 'custom'
};

// Default QR code options
const QR_CODE_OPTIONS = {
  TYPE: 'png',
  QUALITY: 0.92,
  MARGIN: 1,
  WIDTH: 200,
  ERROR_CORRECTION_LEVEL: 'M'
};

// Stock alert thresholds
const STOCK_ALERTS = {
  CRITICAL: 0.1,  // 10% of max stock
  LOW: 0.2,       // 20% of max stock
  WARNING: 0.3    // 30% of max stock
};

// Rate limiting configurations
const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  },
  UPLOAD: {
    WINDOW_MS: 10 * 60 * 1000, // 10 minutes
    MAX_REQUESTS: 10
  }
};

// Validation rules
const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true
  },
  PRODUCT_ID: {
    LENGTH: 6,
    PATTERN: /^[A-Z]{3}\d{3}$/
  },
  PHONE: {
    PATTERN: /^(\+62|62|0)8[1-9][0-9]{7,11}$/
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
};

// HTTP status codes yang sering digunakan
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Indonesian province codes (sample, bisa diperluas)
const PROVINCE_CODES = {
  '11': 'Aceh',
  '12': 'Sumatera Utara',
  '13': 'Sumatera Barat',
  '14': 'Riau',
  '15': 'Jambi',
  '16': 'Sumatera Selatan',
  '17': 'Bengkulu',
  '18': 'Lampung',
  '19': 'Kepulauan Bangka Belitung',
  '21': 'Kepulauan Riau',
  '31': 'DKI Jakarta',
  '32': 'Jawa Barat',
  '33': 'Jawa Tengah',
  '34': 'DI Yogyakarta',
  '35': 'Jawa Timur',
  '36': 'Banten',
  '51': 'Bali',
  '52': 'Nusa Tenggara Barat',
  '53': 'Nusa Tenggara Timur',
  '61': 'Kalimantan Barat',
  '62': 'Kalimantan Tengah',
  '63': 'Kalimantan Selatan',
  '64': 'Kalimantan Timur',
  '65': 'Kalimantan Utara',
  '71': 'Sulawesi Utara',
  '72': 'Sulawesi Tengah',
  '73': 'Sulawesi Selatan',
  '74': 'Sulawesi Tenggara',
  '75': 'Gorontalo',
  '76': 'Sulawesi Barat',
  '81': 'Maluku',
  '82': 'Maluku Utara',
  '91': 'Papua Barat',
  '94': 'Papua'
};

// Indonesian bank codes (sample)
const BANK_CODES = {
  'BCA': 'Bank Central Asia',
  'BNI': 'Bank Negara Indonesia',
  'BRI': 'Bank Rakyat Indonesia',
  'MANDIRI': 'Bank Mandiri',
  'DANAMON': 'Bank Danamon',
  'CIMB': 'CIMB Niaga',
  'PERMATA': 'Bank Permata',
  'MAYBANK': 'Maybank Indonesia'
};

// Default application settings
const APP_SETTINGS = {
  TIMEZONE: 'Asia/Jakarta',
  LOCALE: 'id-ID',
  CURRENCY: 'IDR',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: '24h',
  PAGINATION_SIZE: 10,
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_TIMEOUT: 60 * 60 * 1000, // 1 hour
  QR_CODE_EXPIRY: 365 * 24 * 60 * 60 * 1000 // 1 year
};

// Feature flags
const FEATURE_FLAGS = {
  EMAIL_NOTIFICATIONS: true,
  SMS_NOTIFICATIONS: false,
  AUDIT_LOGGING: true,
  RATE_LIMITING: true,
  FILE_UPLOADS: true,
  QR_CODE_GENERATION: true,
  BULK_OPERATIONS: true,
  ADVANCED_SEARCH: true,
  EXPORT_FEATURES: true,
  API_VERSIONING: false
};

module.exports = {
  USER_LEVELS,
  USER_LEVEL_DESCRIPTIONS,
  PRODUCT_STATUS,
  PRODUCT_CONDITIONS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  STOCK_MOVEMENT_TYPES,
  PURCHASE_RECEIPT_STATUS,
  CATEGORIES,
  MODULES,
  PERMISSIONS,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  MESSAGES,
  PAGINATION,
  DATE_FORMATS,
  NOTIFICATION_TYPES,
  QR_CODE_TYPES,
  QR_CODE_OPTIONS,
  STOCK_ALERTS,
  RATE_LIMITS,
  VALIDATION_RULES,
  HTTP_STATUS,
  PROVINCE_CODES,
  BANK_CODES,
  APP_SETTINGS,
  FEATURE_FLAGS
};