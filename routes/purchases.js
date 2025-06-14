const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');

const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const createPurchaseReceiptValidation = [
  body('receipt_number')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Receipt number must be between 3 and 50 characters'),
  
  body('po_number')
    .notEmpty()
    .withMessage('PO number is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('PO number must be between 3 and 50 characters'),
  
  body('supplier_id')
    .notEmpty()
    .withMessage('Supplier ID is required')
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),
  
  body('receipt_date')
    .optional()
    .isISO8601()
    .withMessage('Receipt date must be a valid date'),
  
  body('status')
    .optional()
    .isIn(['completed', 'pending', 'cancelled'])
    .withMessage('Status must be: completed, pending, or cancelled'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),
  
  body('items.*.category_id')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid category_id'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid quantity'),
  
  body('items.*.unit_price')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Each item must have a valid unit price'),
  
  body('items.*.serial_numbers')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Serial numbers cannot exceed 1000 characters'),
  
  body('items.*.condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be: New, Good, Fair, Poor, or Damaged'),
  
  body('items.*.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Item notes cannot exceed 500 characters'),
  
  body('items.*.generate_products')
    .optional()
    .isBoolean()
    .withMessage('generate_products must be a boolean')
];

const updatePurchaseReceiptValidation = [
  body('receipt_number')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Receipt number must be between 3 and 50 characters'),
  
  body('po_number')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('PO number must be between 3 and 50 characters'),
  
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),
  
  body('receipt_date')
    .optional()
    .isISO8601()
    .withMessage('Receipt date must be a valid date'),
  
  body('status')
    .optional()
    .isIn(['completed', 'pending', 'cancelled'])
    .withMessage('Status must be: completed, pending, or cancelled'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const addReceiptItemValidation = [
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('unit_price')
    .notEmpty()
    .withMessage('Unit price is required')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Unit price must be a valid decimal'),
  
  body('serial_numbers')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Serial numbers cannot exceed 1000 characters'),
  
  body('condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be: New, Good, Fair, Poor, or Damaged'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Supplier ID must be a positive integer'),
  
  query('status')
    .optional()
    .isIn(['completed', 'pending', 'cancelled'])
    .withMessage('Status must be: completed, pending, or cancelled'),
  
  query('receipt_date')
    .optional()
    .isISO8601()
    .withMessage('Receipt date must be a valid date')
];

const paramValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const itemParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Receipt ID must be a positive integer'),
  
  param('itemId')
    .isInt({ min: 1 })
    .withMessage('Item ID must be a positive integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/purchases
 * @desc    Get all purchase receipts with pagination and search
 * @access  Private (requires 'purchasing' view permission)
 * @query   {number} page - Page number
 * @query   {number} limit - Items per page
 * @query   {string} search - Search in receipt number or PO number
 * @query   {number} supplier_id - Filter by supplier
 * @query   {string} status - Filter by status
 * @query   {string} receipt_date - Filter by receipt date
 */
router.get('/', 
  queryValidation,
handleValidationErrors,
  canView('purchasing'),
   
  purchaseController.getPurchaseReceipts
);

/**
 * @route   GET /api/purchases/stats
 * @desc    Get purchase statistics
 * @access  Private (requires 'purchasing' view permission)
 */
router.get('/stats', 
  canView('purchasing'),
  purchaseController.getPurchaseStats
);

/**
 * @route   GET /api/purchases/:id
 * @desc    Get purchase receipt by ID
 * @access  Private (requires 'purchasing' view permission)
 * @param   {number} id - Purchase receipt ID
 */
router.get('/:id', 
  paramValidation,
handleValidationErrors,
  canView('purchasing'),
  purchaseController.getPurchaseReceiptById
);

/**
 * @route   POST /api/purchases
 * @desc    Create new purchase receipt
 * @access  Private (requires 'purchasing' add permission)
 * @body    {string} [receipt_number] - Receipt number (auto-generated if not provided)
 * @body    {string} po_number - Purchase order number
 * @body    {number} supplier_id - Supplier ID
 * @body    {string} [receipt_date] - Receipt date (default: today)
 * @body    {string} [status] - Status (default: completed)
 * @body    {string} [notes] - Additional notes
 * @body    {Array} [items] - Array of receipt items
 * @body    {number} items[].category_id - Category ID for the item
 * @body    {number} items[].quantity - Quantity
 * @body    {number} items[].unit_price - Unit price
 * @body    {string} [items[].serial_numbers] - Serial numbers
 * @body    {string} [items[].condition] - Item condition
 * @body    {string} [items[].notes] - Item notes
 * @body    {boolean} [items[].generate_products] - Generate individual products
 */
router.post('/', 
  createPurchaseReceiptValidation,
handleValidationErrors,
 canAdd('purchasing'),
  purchaseController.createPurchaseReceipt
);

/**
 * @route   PUT /api/purchases/:id
 * @desc    Update purchase receipt
 * @access  Private (requires 'purchasing' edit permission)
 * @param   {number} id - Purchase receipt ID
 * @body    {string} [receipt_number] - Receipt number
 * @body    {string} [po_number] - Purchase order number
 * @body    {number} [supplier_id] - Supplier ID
 * @body    {string} [receipt_date] - Receipt date
 * @body    {string} [status] - Status
 * @body    {string} [notes] - Additional notes
 */
router.put('/:id', 
  paramValidation,
  updatePurchaseReceiptValidation,
handleValidationErrors,
   canEdit('purchasing'),
  purchaseController.updatePurchaseReceipt
);

/**
 * @route   DELETE /api/purchases/:id
 * @desc    Delete purchase receipt
 * @access  Private (requires 'purchasing' delete permission)
 * @param   {number} id - Purchase receipt ID
 */
router.delete('/:id', 
  paramValidation,
handleValidationErrors,
  canDelete('purchasing'),
  purchaseController.deletePurchaseReceipt
);

/**
 * @route   POST /api/purchases/:id/items
 * @desc    Add item to purchase receipt
 * @access  Private (requires 'purchasing' edit permission)
 * @param   {number} id - Purchase receipt ID
 * @body    {number} category_id - Category ID
 * @body    {number} quantity - Quantity
 * @body    {number} unit_price - Unit price
 * @body    {string} [serial_numbers] - Serial numbers
 * @body    {string} [condition] - Item condition
 * @body    {string} [notes] - Item notes
 */
router.post('/:id/items', 
  paramValidation,
  addReceiptItemValidation,
handleValidationErrors,
   canEdit('purchasing'),
  purchaseController.addReceiptItem
);

/**
 * @route   DELETE /api/purchases/:id/items/:itemId
 * @desc    Remove item from purchase receipt
 * @access  Private (requires 'purchasing' edit permission)
 * @param   {number} id - Purchase receipt ID
 * @param   {number} itemId - Receipt item ID
 */
router.delete('/:id/items/:itemId', 
  itemParamValidation,
handleValidationErrors,
   canEdit('purchasing'),
  
  purchaseController.removeReceiptItem
);

module.exports = router;