const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { body, param } = require('express-validator');

// Validation rules
const createUserValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),

  body('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),

  body('user_level_id')
    .notEmpty()
    .withMessage('User level is required')
    .isIn(['admin', 'manager', 'technician', 'warehouse', 'viewer'])
    .withMessage('User level must be: admin, manager, technician, warehouse, or viewer'),

  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const updateUserValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),

  body('user_level_id')
    .optional()
    .isIn(['admin', 'manager', 'technician', 'warehouse', 'viewer'])
    .withMessage('User level must be: admin, manager, technician, warehouse, or viewer'),

  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number')
];

const bulkUpdateValidation = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs must be an array with at least one item'),

  body('userIds.*')
    .notEmpty()
    .withMessage('Each user ID must not be empty'),

  body('updates')
    .isObject()
    .withMessage('Updates must be an object'),

  body('updates.user_level_id')
    .optional()
    .isIn(['admin', 'manager', 'technician', 'warehouse', 'viewer'])
    .withMessage('User level must be: admin, manager, technician, warehouse, or viewer'),

  body('updates.department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),

  body('updates.is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const paramValidation = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/users
 * @desc    Get all users dengan pagination dan search
 * @access  Private (requires 'users' view permission)
 */
router.get('/',
  canView('users'),
  userController.getUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (requires 'users' view permission)
 */
router.get('/stats',
  canView('users'),
  userController.getUserStats
);

/**
 * @route   GET /api/users/departments
 * @desc    Get users by department
 * @access  Private (requires 'users' view permission)
 */
router.get('/departments',
  canView('users'),
  userController.getUsersByDepartment
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (requires 'users' view permission)
 */
router.get('/:id',
  paramValidation,
  handleValidationErrors,
  canView('users'),
  userController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (requires 'users' add permission)
 */
router.post('/',
  createUserValidation,
  handleValidationErrors,
  canAdd('users'),
  userController.createUser
);

/**
 * @route   PUT /api/users/bulk-update
 * @desc    Bulk update users
 * @access  Private (requires 'users' edit permission)
 */
router.put('/bulk-update',
  bulkUpdateValidation,
  handleValidationErrors,
  canEdit('users'),
  userController.bulkUpdateUsers
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (requires 'users' edit permission)
 */
router.put('/:id',
  paramValidation,
  updateUserValidation,
  handleValidationErrors,
  canEdit('users'),
  userController.updateUser
);

/**
 * @route   PUT /api/users/:id/toggle-status
 * @desc    Activate/Deactivate user
 * @access  Private (requires 'users' edit permission)
 */
router.put('/:id/toggle-status',
  paramValidation,
  handleValidationErrors,
  canEdit('users'),
  userController.toggleUserStatus
);

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password (by admin)
 * @access  Private (requires 'users' edit permission)
 */
router.put('/:id/reset-password',
  paramValidation,
  resetPasswordValidation,
  handleValidationErrors,
  canEdit('users'),
  userController.resetUserPassword
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (requires 'users' delete permission)
 */
router.delete('/:id',
  paramValidation,
  handleValidationErrors,
  canDelete('users'),
  userController.deleteUser
);

module.exports = router;