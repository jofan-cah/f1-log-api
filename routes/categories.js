const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');

const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const createCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  
  body('code')
    .notEmpty()
    .withMessage('Category code is required')
    .isLength({ min: 2, max: 3 })
    .withMessage('Category code must be between 2 and 3 characters')
    .matches(/^[A-Z]+$/)
    .withMessage('Category code must contain only uppercase letters'),
  
  body('has_stock')
    .optional()
    .isBoolean()
    .withMessage('has_stock must be a boolean'),
  
  body('min_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('min_stock must be a non-negative integer'),
  
  body('max_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('max_stock must be a non-negative integer'),
  
  body('current_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('current_stock must be a non-negative integer'),
  
  body('unit')
    .optional()
    .isLength({ max: 20 })
    .withMessage('unit cannot exceed 20 characters'),
  
  body('reorder_point')
    .optional()
    .isInt({ min: 0 })
    .withMessage('reorder_point must be a non-negative integer'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('notes cannot exceed 1000 characters')
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  
  body('code')
    .optional()
    .isLength({ min: 2, max: 3 })
    .withMessage('Category code must be between 2 and 3 characters')
    .matches(/^[A-Z]+$/)
    .withMessage('Category code must contain only uppercase letters'),
  
  body('has_stock')
    .optional()
    .isBoolean()
    .withMessage('has_stock must be a boolean'),
  
  body('min_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('min_stock must be a non-negative integer'),
  
  body('max_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('max_stock must be a non-negative integer'),
  
  body('current_stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('current_stock must be a non-negative integer'),
  
  body('unit')
    .optional()
    .isLength({ max: 20 })
    .withMessage('unit cannot exceed 20 characters'),
  
  body('reorder_point')
    .optional()
    .isInt({ min: 0 })
    .withMessage('reorder_point must be a non-negative integer'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('notes cannot exceed 1000 characters')
];

const updateStockValidation = [
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt()
    .withMessage('Quantity must be an integer'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('notes cannot exceed 1000 characters'),
  
  body('movement_type')
    .optional()
    .isIn(['in', 'out', 'adjustment'])
    .withMessage('movement_type must be: in, out, or adjustment')
];

const bulkAdjustmentValidation = [
  body('adjustments')
    .isArray({ min: 1 })
    .withMessage('adjustments must be an array with at least one item'),
  
  body('adjustments.*.categoryId')
    .isInt({ min: 1 })
    .withMessage('Each adjustment must have a valid categoryId'),
  
  body('adjustments.*.quantity')
    .isInt()
    .withMessage('Each adjustment must have a valid quantity'),
  
  body('adjustments.*.notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('notes cannot exceed 1000 characters')
];

const paramValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
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
  
  query('has_stock')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('has_stock must be true or false'),
  
  query('is_low_stock')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('is_low_stock must be true or false'),
  
  query('code')
    .optional()
    .isLength({ min: 2, max: 3 })
    .withMessage('Code must be between 2 and 3 characters')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/categories
 * @desc    Get all categories with pagination and search
 * @access  Private (requires 'categories' view permission)
 */
router.get('/', 
  queryValidation,
  handleValidationErrors,
   canView('categories'),
  categoryController.getCategories
);

/**
 * @route   GET /api/categories/with-stock
 * @desc    Get categories that track stock
 * @access  Private (requires 'categories' view permission)
 */
router.get('/with-stock', 
   canView('categories'),
  categoryController.getCategoriesWithStock
);

/**
 * @route   GET /api/categories/low-stock
 * @desc    Get categories with low stock
 * @access  Private (requires 'categories' view permission)
 */
router.get('/low-stock', 
    authenticateToken,
   canView('categories'),
  categoryController.getLowStockCategories
);

/**
 * @route   GET /api/categories/stats
 * @desc    Get category statistics
 * @access  Private (requires 'categories' view permission)
 */
router.get('/stats', 
   canView('categories'),
  categoryController.getCategoryStats
);

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private (requires 'categories' view permission)
 */
router.get('/:id', 
  paramValidation,
  handleValidationErrors,
   canView('categories'),
  categoryController.getCategoryById
);

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private (requires 'categories' add permission)
 */
router.post('/', 
  createCategoryValidation,
  handleValidationErrors,
  canAdd('categories'),
  categoryController.createCategory
);

/**
 * @route   POST /api/categories/bulk-adjustment
 * @desc    Perform bulk stock adjustments
 * @access  Private (requires 'categories' edit permission)
 */
router.post('/bulk-adjustment', 
  bulkAdjustmentValidation,
  handleValidationErrors,
   canEdit('categories'),
  categoryController.bulkStockAdjustment
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private (requires 'categories' edit permission)
 */
router.put('/:id', 
  paramValidation,
  updateCategoryValidation,
  handleValidationErrors,
  canEdit('categories'),
  categoryController.updateCategory
);

/**
 * @route   PUT /api/categories/:id/stock
 * @desc    Update category stock (manual adjustment)
 * @access  Private (requires 'categories' edit permission)
 */
router.put('/:id/stock', 
  paramValidation,
  updateStockValidation,
  handleValidationErrors,
   canEdit('categories'),
  categoryController.updateCategoryStock
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private (requires 'categories' delete permission)
 */
router.delete('/:id', 
  paramValidation,
  handleValidationErrors,
   canDelete('categories'),
  categoryController.deleteCategory
);

module.exports = router;