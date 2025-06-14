const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');

const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const createSupplierValidation = [
  body('name')
    .notEmpty()
    .withMessage('Supplier name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('contact_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Contact person cannot exceed 100 characters'),
  
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateSupplierValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Supplier name must be between 2 and 100 characters'),
  
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('contact_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Contact person cannot exceed 100 characters'),
  
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const paramValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const searchValidation = [
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/suppliers
 * @desc    Get all suppliers dengan pagination dan search
 * @access  Private (requires 'suppliers' view permission)
 */
router.get('/', 
 canView('suppliers'),
    

  supplierController.getSuppliers
);

/**
 * @route   GET /api/suppliers/search
 * @desc    Search suppliers
 * @access  Private (requires 'suppliers' view permission)
 */
router.get('/search', 
  searchValidation,
 handleValidationErrors,
 canView('suppliers'),
  supplierController.searchSuppliers
);

/**
 * @route   GET /api/suppliers/stats
 * @desc    Get supplier statistics
 * @access  Private (requires 'suppliers' view permission)
 */
router.get('/stats', 
 canView('suppliers'),
  supplierController.getSupplierStats
);

/**
 * @route   GET /api/suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private (requires 'suppliers' view permission)
 */
router.get('/:id', 
  paramValidation,
 handleValidationErrors,
 canView('suppliers'),
  supplierController.getSupplierById
);

/**
 * @route   GET /api/suppliers/:id/purchases
 * @desc    Get supplier purchase history
 * @access  Private (requires 'suppliers' view permission)
 */
router.get('/:id/purchases', 
  paramValidation,
 handleValidationErrors,
 canView('suppliers'),
  supplierController.getSupplierPurchaseHistory
);

/**
 * @route   GET /api/suppliers/:id/products
 * @desc    Get supplier products
 * @access  Private (requires 'suppliers' view permission)
 */
router.get('/:id/products', 
  paramValidation,
 handleValidationErrors,
 canView('suppliers'),
  supplierController.getSupplierProducts
);

/**
 * @route   GET /api/suppliers/:id/performance
 * @desc    Get supplier performance metrics
 * @access  Private (requires 'suppliers' view permission)
 */
router.get('/:id/performance', 
  paramValidation,
 handleValidationErrors,
 canView('suppliers'),
  supplierController.getSupplierPerformance
);

/**
 * @route   POST /api/suppliers
 * @desc    Create new supplier
 * @access  Private (requires 'suppliers' add permission)
 */
router.post('/', 
  createSupplierValidation,
 handleValidationErrors,
  canAdd('suppliers'),
  supplierController.createSupplier
);

/**
 * @route   PUT /api/suppliers/:id
 * @desc    Update supplier
 * @access  Private (requires 'suppliers' edit permission)
 */
router.put('/:id', 
  paramValidation,
  updateSupplierValidation,
 handleValidationErrors,
  canEdit('suppliers'),
  supplierController.updateSupplier
);

/**
 * @route   DELETE /api/suppliers/:id
 * @desc    Delete supplier
 * @access  Private (requires 'suppliers' delete permission)
 */
router.delete('/:id', 
  paramValidation,
 handleValidationErrors,
  canDelete('suppliers'),
  supplierController.deleteSupplier
);

module.exports = router;