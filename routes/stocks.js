const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { body, query, param } = require('express-validator');

// Validation rules
const createMovementValidation = [
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('movement_type')
    .notEmpty()
    .withMessage('Movement type is required')
    .isIn(['in', 'out', 'adjustment'])
    .withMessage('Movement type must be: in, out, or adjustment'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('reference_type')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Reference type cannot exceed 20 characters'),
  
  body('reference_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reference ID must be a positive integer')
];

const bulkAdjustmentValidation = [
  body('adjustments')
    .isArray({ min: 1 })
    .withMessage('Adjustments must be an array with at least one item'),
  
  body('adjustments.*.category_id')
    .isInt({ min: 1 })
    .withMessage('Each adjustment must have a valid category_id'),
  
  body('adjustments.*.quantity')
    .isInt()
    .withMessage('Each adjustment must have a valid quantity'),
  
  body('adjustments.*.notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const paramValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/stocks
 * @desc    Get all stock movements dengan pagination & filtering
 * @access  Private (requires 'stocks' view permission)
 */
router.get('/', 
   canView('stocks'),
  stockController.getStockMovements
);

/**
 * @route   GET /api/stocks/summary
 * @desc    Get stock summary by categories
 * @access  Private (requires 'stocks' view permission)
 */
router.get('/summary', 
  query('low_stock_only')
    .optional()
    .isBoolean()
    .withMessage('low_stock_only must be a boolean'),
 handleValidationErrors,
   canView('stocks'),
 
  stockController.getStockSummary
);

/**
 * @route   GET /api/stocks/recent
 * @desc    Get recent stock movements
 * @access  Private (requires 'stocks' view permission)
 */
router.get('/recent', 
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
 handleValidationErrors,
   canView('stocks'),
  stockController.getRecentMovements
);

/**
 * @route   GET /api/stocks/analytics
 * @desc    Get stock analytics dan trends
 * @access  Private (requires 'stocks' view permission)
 */
router.get('/analytics', 
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days'),
 handleValidationErrors,
   canView('stocks'),
  stockController.getStockAnalytics
);

/**
 * @route   GET /api/stocks/alerts
 * @desc    Get low stock alerts
 * @access  Private (requires 'stocks' view permission)
 */
router.get('/alerts', 
   canView('stocks'),
  stockController.getLowStockAlerts
);

/**
 * @route   GET /api/stocks/:id
 * @desc    Get specific stock movement by ID
 * @access  Private (requires 'stocks' view permission)
 */
router.get('/:id', 
  paramValidation,
 handleValidationErrors,
   canView('stocks'),
  stockController.getStockMovementById
);

/**
 * @route   POST /api/stocks/movements
 * @desc    Create manual stock movement
 * @access  Private (requires 'stocks' add permission)
 */
router.post('/movements', 
  createMovementValidation,
 handleValidationErrors,
   canAdd('stocks'),
  stockController.createStockMovement
);

/**
 * @route   POST /api/stocks/bulk-adjustment
 * @desc    Perform bulk stock adjustments
 * @access  Private (requires 'stocks' edit permission)
 */
router.post('/bulk-adjustment', 
  bulkAdjustmentValidation,
 handleValidationErrors,
   canEdit('stocks'),
  stockController.bulkStockAdjustment
);

module.exports = router;