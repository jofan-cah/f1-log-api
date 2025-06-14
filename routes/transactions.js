const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const createTransactionValidation = [
  body('transaction_type')
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['check_out', 'check_in', 'transfer', 'maintenance'])
    .withMessage('Transaction type must be: check_out, check_in, transfer, or maintenance'),

  body('reference_no')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Reference number must be between 3 and 50 characters'),

  body('first_person')
    .notEmpty()
    .withMessage('First person is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First person must be between 2 and 100 characters'),

  body('second_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Second person cannot exceed 100 characters'),

  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),

  body('transaction_date')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('items')
    .optional()
    .isArray()
    .withMessage('Items must be an array'),

  body('items.*.product_id')
    .notEmpty()
    .withMessage('Product ID is required for each item'),

  body('items.*.condition_before')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition before must be: New, Good, Fair, Poor, or Damaged'),

  body('items.*.condition_after')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition after must be: New, Good, Fair, Poor, or Damaged'),

  body('items.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('items.*.notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Item notes cannot exceed 500 characters')
];

const updateTransactionValidation = [
  body('reference_no')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Reference number must be between 3 and 50 characters'),

  body('first_person')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('First person must be between 2 and 100 characters'),

  body('second_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Second person cannot exceed 100 characters'),

  body('location')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),

  body('transaction_date')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('status')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage('Status must be: open or closed')
];

const addItemValidation = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required'),

  body('condition_before')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition before must be: New, Good, Fair, Poor, or Damaged'),

  body('condition_after')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition after must be: New, Good, Fair, Poor, or Damaged'),

  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('breakdown_quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Breakdown quantity must be a positive integer'),

  body('breakdown_unit')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Breakdown unit cannot exceed 20 characters'),

  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const paramValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const itemParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Transaction ID must be a positive integer'),

  param('itemId')
    .isInt({ min: 1 })
    .withMessage('Item ID must be a positive integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions dengan pagination dan search
 * @access  Private (requires 'transactions' view permission)
 */
router.get('/',
  canView('transactions'),

  transactionController.getTransactions
);

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics
 * @access  Private (requires 'transactions' view permission)
 */
router.get('/stats',
  canView('transactions'),
  transactionController.getTransactionStats
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private (requires 'transactions' view permission)
 */
router.get('/:id',
  paramValidation,
  handleValidationErrors,
  canView('transactions'),
  transactionController.getTransactionById
);

/**
 * @route   POST /api/transactions
 * @desc    Create new transaction
 * @access  Private (requires 'transactions' add permission)
 */
router.post('/',
  createTransactionValidation,
  handleValidationErrors,
  canAdd('transactions'),
  transactionController.createTransaction
);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction
 * @access  Private (requires 'transactions' edit permission)
 */
router.put('/:id',
  paramValidation,
  updateTransactionValidation,
  handleValidationErrors,
  canEdit('transactions'),
  
  transactionController.updateTransaction
);

/**
 * @route   PUT /api/transactions/:id/close
 * @desc    Close transaction
 * @access  Private (requires 'transactions' edit permission)
 */
router.put('/:id/close',
  paramValidation,
  handleValidationErrors,
  canEdit('transactions'),
  transactionController.closeTransaction
);

/**
 * @route   POST /api/transactions/:id/qr-code
 * @desc    Generate QR code for transaction
 * @access  Private (requires 'transactions' view permission)
 */
router.post('/:id/qr-code',
  paramValidation,
  handleValidationErrors,
  canView('transactions'),
  transactionController.generateTransactionQRCode
);

/**
 * @route   POST /api/transactions/:id/items
 * @desc    Add item to transaction
 * @access  Private (requires 'transactions' edit permission)
 */
router.post('/:id/items',
  paramValidation,
  addItemValidation,
  handleValidationErrors,
  canEdit('transactions'),
  transactionController.addTransactionItem
);

/**
 * @route   DELETE /api/transactions/:id/items/:itemId
 * @desc    Remove item from transaction
 * @access  Private (requires 'transactions' edit permission)
 */
router.delete('/:id/items/:itemId',
  itemParamValidation,
  handleValidationErrors,
  canEdit('transactions'),
  transactionController.removeTransactionItem
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction
 * @access  Private (requires 'transactions' delete permission)
 */
router.delete('/:id',
  paramValidation,
  handleValidationErrors,
  canDelete('transactions'),
  transactionController.deleteTransaction
);

module.exports = router;