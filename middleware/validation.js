  
const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

// Middleware untuk handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

// Common validation rules
const commonValidations = {
  // ID validation
  id: param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
  
  // String ID validation (untuk product_id, user_id, dll)
  stringId: param('id').isLength({ min: 1, max: 50 }).withMessage('ID must be 1-50 characters'),
  
  // Pagination validation
  page: query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  limit: query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  
  // Search validation
  search: query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search must be 1-100 characters'),
  
  // Date validation
  date: (field) => body(field).optional().isISO8601().withMessage(`${field} must be a valid date`),
  
  // Required string validation
  requiredString: (field, min = 1, max = 255) => 
    body(field).trim().isLength({ min, max }).withMessage(`${field} must be ${min}-${max} characters`),
  
  // Optional string validation
  optionalString: (field, max = 255) => 
    body(field).optional().trim().isLength({ max }).withMessage(`${field} must be max ${max} characters`),
  
  // Email validation
  email: body('email').optional().isEmail().normalizeEmail().withMessage('Must be a valid email'),
  
  // Phone validation
  phone: body('phone').optional().isMobilePhone('id-ID').withMessage('Must be a valid Indonesian phone number'),
  
  // Number validation
  number: (field, min = 0) => 
    body(field).isInt({ min }).withMessage(`${field} must be a number >= ${min}`),
  
  // Decimal validation
  decimal: (field, min = 0) => 
    body(field).isFloat({ min }).withMessage(`${field} must be a decimal >= ${min}`)
};

// Auth validation rules
const authValidation = {
  login: [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidationErrors
  ],
  
  register: [
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Must be a valid email'),
    body('user_level_id').isIn(['admin', 'manager', 'technician', 'warehouse', 'viewer']).withMessage('Invalid user level'),
    handleValidationErrors
  ]
};

// User validation rules
const userValidation = {
  create: [
    commonValidations.requiredString('username', 3, 50),
    commonValidations.requiredString('password', 6, 255),
    commonValidations.requiredString('full_name', 2, 100),
    commonValidations.email,
    commonValidations.phone,
    body('user_level_id').isIn(['admin', 'manager', 'technician', 'warehouse', 'viewer']).withMessage('Invalid user level'),
    commonValidations.optionalString('department', 100),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.optionalString('full_name', 2, 100),
    commonValidations.email,
    commonValidations.phone,
    body('user_level_id').optional().isIn(['admin', 'manager', 'technician', 'warehouse', 'viewer']).withMessage('Invalid user level'),
    commonValidations.optionalString('department', 100),
    body('is_active').optional().isBoolean().withMessage('is_active must be boolean'),
    handleValidationErrors
  ]
};

// Category validation rules
const categoryValidation = {
  create: [
    commonValidations.requiredString('name', 2, 50),
    body('code').trim().isLength({ min: 2, max: 3 }).isAlpha().withMessage('Code must be 2-3 letters'),
    body('has_stock').optional().isBoolean().withMessage('has_stock must be boolean'),
    commonValidations.number('min_stock'),
    commonValidations.number('max_stock'),
    commonValidations.number('reorder_point'),
    commonValidations.optionalString('unit', 20),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.optionalString('name', 2, 50),
    body('code').optional().trim().isLength({ min: 2, max: 3 }).isAlpha().withMessage('Code must be 2-3 letters'),
    body('has_stock').optional().isBoolean().withMessage('has_stock must be boolean'),
    body('min_stock').optional().isInt({ min: 0 }).withMessage('min_stock must be >= 0'),
    body('max_stock').optional().isInt({ min: 0 }).withMessage('max_stock must be >= 0'),
    body('reorder_point').optional().isInt({ min: 0 }).withMessage('reorder_point must be >= 0'),
    commonValidations.optionalString('unit', 20),
    handleValidationErrors
  ]
};

// Product validation rules
const productValidation = {
  create: [
    commonValidations.requiredString('product_id', 3, 20),
    commonValidations.number('category_id', 1),
    commonValidations.optionalString('brand', 50),
    commonValidations.optionalString('model', 50),
    commonValidations.optionalString('serial_number', 100),
    commonValidations.optionalString('location', 100),
    body('status').optional().isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed']).withMessage('Invalid status'),
    body('condition').optional().isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged']).withMessage('Invalid condition'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
    commonValidations.decimal('purchase_price'),
    commonValidations.date('purchase_date'),
    commonValidations.date('warranty_expiry'),
    handleValidationErrors
  ],
  
  update: [
    commonValidations.optionalString('brand', 50),
    commonValidations.optionalString('model', 50),
    commonValidations.optionalString('serial_number', 100),
    commonValidations.optionalString('location', 100),
    body('status').optional().isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed']).withMessage('Invalid status'),
    body('condition').optional().isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged']).withMessage('Invalid condition'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
    body('purchase_price').optional().isFloat({ min: 0 }).withMessage('Purchase price must be >= 0'),
    commonValidations.date('purchase_date'),
    commonValidations.date('warranty_expiry'),
    handleValidationErrors
  ]
};

// Supplier validation rules
const supplierValidation = {
  create: [
    commonValidations.requiredString('name', 2, 100),
    commonValidations.optionalString('address', 500),
    commonValidations.optionalString('contact_person', 100),
    commonValidations.phone,
    commonValidations.email,
    handleValidationErrors
  ],
  
  update: [
    commonValidations.optionalString('name', 2, 100),
    commonValidations.optionalString('address', 500),
    commonValidations.optionalString('contact_person', 100),
    commonValidations.phone,
    commonValidations.email,
    handleValidationErrors
  ]
};

// Transaction validation rules
const transactionValidation = {
  create: [
    body('transaction_type').isIn(['check_out', 'check_in', 'lost', 'repair']).withMessage('Invalid transaction type'),
    commonValidations.optionalString('reference_no', 50),
    commonValidations.requiredString('first_person', 2, 100),
    commonValidations.optionalString('second_person', 100),
    commonValidations.requiredString('location', 2, 100),
    commonValidations.date('transaction_date'),
    handleValidationErrors
  ],
  
  addItem: [
    commonValidations.requiredString('product_id', 3, 20),
    commonValidations.optionalString('condition_before', 20),
    commonValidations.optionalString('condition_after', 20),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  authValidation,
  userValidation,
  categoryValidation,
  productValidation,
  supplierValidation,
  transactionValidation
};