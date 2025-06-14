const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');

const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const createProductValidation = [
  body('product_id')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Product ID must be between 3 and 20 characters'),

  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),

  body('brand')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Brand cannot exceed 50 characters'),

  body('model')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Model cannot exceed 50 characters'),

  body('serial_number')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Serial number cannot exceed 100 characters'),

  body('origin')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Origin cannot exceed 100 characters'),

  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),

  body('po_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('PO number cannot exceed 50 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  // NEW: Add img_product validation
  body('img_product')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Image filename cannot exceed 255 characters'),

  body('status')
    .optional()
    .isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed'])
    .withMessage('Status must be: Available, In Use, Maintenance, Damaged, or Disposed'),

  body('condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be: New, Good, Fair, Poor, or Damaged'),

  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('purchase_date')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),

  body('purchase_price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Purchase price must be a valid decimal'),

  body('warranty_expiry')
    .optional()
    .isISO8601()
    .withMessage('Warranty expiry must be a valid date'),

  // NEW: Add fields from model
  body('last_maintenance_date')
    .optional()
    .isISO8601()
    .withMessage('Last maintenance date must be a valid date'),

  body('next_maintenance_date')
    .optional()
    .isISO8601()
    .withMessage('Next maintenance date must be a valid date'),

  body('ticketing_id')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ticketing ID cannot exceed 50 characters'),

  body('is_linked_to_ticketing')
    .optional()
    .isBoolean()
    .withMessage('is_linked_to_ticketing must be a boolean'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateProductValidation = [
  body('brand')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Brand cannot exceed 50 characters'),

  body('model')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Model cannot exceed 50 characters'),

  body('serial_number')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Serial number cannot exceed 100 characters'),

  body('origin')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Origin cannot exceed 100 characters'),

  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),

  body('po_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('PO number cannot exceed 50 characters'),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  // NEW: Add img_product validation
  body('img_product')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Image filename cannot exceed 255 characters'),

  body('status')
    .optional()
    .isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed'])
    .withMessage('Status must be: Available, In Use, Maintenance, Damaged, or Disposed'),

  body('condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be: New, Good, Fair, Poor, or Damaged'),

  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('purchase_date')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),

  body('purchase_price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Purchase price must be a valid decimal'),

  body('warranty_expiry')
    .optional()
    .isISO8601()
    .withMessage('Warranty expiry must be a valid date'),

  body('last_maintenance_date')
    .optional()
    .isISO8601()
    .withMessage('Last maintenance date must be a valid date'),

  body('next_maintenance_date')
    .optional()
    .isISO8601()
    .withMessage('Next maintenance date must be a valid date'),

  // NEW: Add fields from model
  body('ticketing_id')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Ticketing ID cannot exceed 50 characters'),

  body('is_linked_to_ticketing')
    .optional()
    .isBoolean()
    .withMessage('is_linked_to_ticketing must be a boolean'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed'])
    .withMessage('Status must be: Available, In Use, Maintenance, Damaged, or Disposed'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const searchValidation = [
  query('q')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),

  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),

  query('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),

  query('status')
    .optional()
    .isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed'])
    .withMessage('Status must be: Available, In Use, Maintenance, Damaged, or Disposed'),

  query('condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be: New, Good, Fair, Poor, or Damaged'),

  query('location')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters')
];

const paramValidation = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Product ID must be between 3 and 20 characters')
];

const categoryParamValidation = [
  param('categoryId')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer')
];

const locationParamValidation = [
  param('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters')
];

// NEW: Image upload validation
const imageFilenameValidation = [
  param('filename')
    .notEmpty()
    .withMessage('Filename is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Filename must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Filename contains invalid characters')
];

// OPTIONAL: Jika mau breakdown functionality
const breakdownValidation = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Product ID must be between 3 and 20 characters'),

  body('breakdown_items')
    .isArray({ min: 1 })
    .withMessage('Breakdown items must be an array with at least one item'),

  body('breakdown_items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Breakdown quantity must be a positive integer'),

  body('breakdown_items.*.description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Breakdown description cannot exceed 200 characters'),

  body('breakdown_items.*.condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be: New, Good, Fair, Poor, or Damaged'),

  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// TAMBAHKAN VALIDASI BARU untuk custom print
const customPrintValidation = [
  body('product_ids')
    .isArray({ min: 1 })
    .withMessage('Product IDs must be an array with at least one item'),

  body('product_ids.*')
    .isLength({ min: 3, max: 20 })
    .withMessage('Each Product ID must be between 3 and 20 characters')
];

// Apply authentication to all routes
router.use(authenticateToken);

// NEW: Image upload routes (must be BEFORE parameterized routes)
/**
 * @route   POST /api/products/upload-image
 * @desc    Upload product image
 * @access  Private (requires 'products' add/edit permission)
 */
router.post('/upload-image',
  canAdd('products'), // Can add or edit
  productController.uploadProductImage
);

/**
 * @route   DELETE /api/products/image/:filename
 * @desc    Delete product image
 * @access  Private (requires 'products' edit permission)
 */
router.delete('/image/:filename',
  imageFilenameValidation,
  handleValidationErrors,
  canEdit('products'),
  productController.deleteProductImage
);

/**
 * @route   POST /api/products/print/custom
 * @desc    Get selected products data for printing (QR/barcode generation di FE)
 * @access  Private (requires 'products' view permission)
 */
router.post('/print/custom',
  customPrintValidation,
  handleValidationErrors,
  canView('products'),
  productController.getProductsForPrint
);

/**
 * @route   POST /api/products/breakdown
 * @desc    Create breakdown transaction (potong/bagi barang)
 * @access  Private (requires 'products' edit permission)
 */
router.post('/breakdown',
  breakdownValidation,
  handleValidationErrors,
  canEdit('products'),
  productController.createBreakdownTransaction
);

/**
 * @route   GET /api/products/search
 * @desc    Search products with advanced filters
 * @access  Private (requires 'products' view permission)
 */
router.get('/search',
  searchValidation,
  handleValidationErrors,
  canView('products'),
  productController.searchProducts
);

/**
 * @route   GET /api/products/stats
 * @desc    Get product statistics
 * @access  Private (requires 'products' view permission)
 */
router.get('/stats',
  canView('products'),
  productController.getProductStats
);

/**
 * @route   GET /api/products/category/:categoryId
 * @desc    Get products by category
 * @access  Private (requires 'products' view permission)
 */
router.get('/category/:categoryId',
  categoryParamValidation,
  handleValidationErrors,
  canView('products'),
  productController.getProductsByCategory
);

/**
 * @route   GET /api/products/location/:location
 * @desc    Get products by location
 * @access  Private (requires 'products' view permission)
 */
router.get('/location/:location',
  locationParamValidation,
  handleValidationErrors,
  canView('products'),
  productController.getProductsByLocation
);

/**
 * @route   GET /api/products/:id/breakdown-history
 * @desc    Get product breakdown history
 * @access  Private (requires 'products' view permission)
 */
router.get('/:id/breakdown-history',
  paramValidation,
  handleValidationErrors,
  canView('products'),
  productController.getProductBreakdownHistory
);

/**
 * @route   GET /api/products
 * @desc    Get all products with pagination and search
 * @access  Private (requires 'products' view permission)
 */
router.get('/',
  canView('products'),
  productController.getProducts
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Private (requires 'products' view permission)
 */
router.get('/:id',
  paramValidation,
  handleValidationErrors,
  canView('products'),
  productController.getProductById
);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (requires 'products' add permission)
 */
router.post('/',
  createProductValidation,
  handleValidationErrors,
  canAdd('products'),
  productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (requires 'products' edit permission)
 */
router.put('/:id',
  paramValidation,
  updateProductValidation,
  handleValidationErrors,
  canEdit('products'),
  productController.updateProduct
);

/**
 * @route   PUT /api/products/:id/status
 * @desc    Update product status
 * @access  Private (requires 'products' edit permission)
 */
router.put('/:id/status',
  paramValidation,
  updateStatusValidation,
  handleValidationErrors,
  canEdit('products'),
  productController.updateProductStatus
);

/**
 * @route   POST /api/products/:id/qr-code
 * @desc    Generate QR code for product
 * @access  Private (requires 'products' view permission)
 */
router.post('/:id/qr-code',
  paramValidation,
  handleValidationErrors,
  canView('products'),
  productController.generateProductQRCode
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (requires 'products' delete permission)
 */
router.delete('/:id',
  paramValidation,
  handleValidationErrors,
  canDelete('products'),
  productController.deleteProduct
);

module.exports = router;