const express = require('express');
const router = express.Router();
const userLevelController = require('../controllers/userLevelController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');
const { handleValidationErrors } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const createUserLevelValidation = [
    body('id')
        .notEmpty()
        .withMessage('User level ID is required')
        .isLength({ min: 2, max: 20 })
        .withMessage('User level ID must be between 2 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('User level ID can only contain letters, numbers, and underscores'),

    body('level_name')
        .notEmpty()
        .withMessage('Level name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Level name must be between 2 and 50 characters'),

    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
];

const updateUserLevelValidation = [
    body('level_name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Level name must be between 2 and 50 characters'),

    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters')
];

const paramValidation = [
    param('id')
        .notEmpty()
        .withMessage('User level ID is required')
        .isLength({ min: 2, max: 20 })
        .withMessage('User level ID must be between 2 and 20 characters')
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

    query('include_users')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('include_users must be true or false'),

    query('include_permissions')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('include_permissions must be true or false')
];

const updatePermissionsValidation = [
    body('permissions')
        .isArray({ min: 0 })
        .withMessage('Permissions must be an array'),
    
    body('permissions.*.module')
        .if(body('permissions').isArray({ min: 1 }))
        .notEmpty()
        .withMessage('Module is required for each permission')
        .isIn(['dashboard', 'users', 'categories', 'suppliers', 'products', 'transactions', 'stock', 'reports', 'settings', 'purchases'])
        .withMessage('Invalid module name'),
    
    body('permissions.*.can_view')
        .if(body('permissions').isArray({ min: 1 }))
        .isBoolean()
        .withMessage('can_view must be boolean'),
    
    body('permissions.*.can_add')
        .if(body('permissions').isArray({ min: 1 }))
        .isBoolean()
        .withMessage('can_add must be boolean'),
    
    body('permissions.*.can_edit')
        .if(body('permissions').isArray({ min: 1 }))
        .isBoolean()
        .withMessage('can_edit must be boolean'),
    
    body('permissions.*.can_delete')
        .if(body('permissions').isArray({ min: 1 }))
        .isBoolean()
        .withMessage('can_delete must be boolean')
];



// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/user-levels
 * @desc    Get all user levels with pagination and search
 * @access  Private (requires 'users' view permission)
 * @query   {number} [page=1] - Page number for pagination
 * @query   {number} [limit=10] - Number of items per page (max 100)
 * @query   {string} [search] - Search term for level name or description
 * @query   {boolean} [include_users=false] - Include associated users
 * @query   {boolean} [include_permissions=false] - Include user permissions
 */
router.get('/',
    queryValidation,
    handleValidationErrors,
    canView('users'),
    userLevelController.getUserLevels
);


router.put('/:id/permissions',
    paramValidation,
    updatePermissionsValidation,
    handleValidationErrors,
    canEdit('users'),
    userLevelController.updateUserLevelPermissions
);

/**
 * @route   GET /api/user-levels/search
 * @desc    Search user levels
 * @access  Private (requires 'users' view permission)
 * @query   {string} q - Search query (minimum 2 characters)
 */
router.get('/search',
    query('q')
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters'),
    handleValidationErrors,
    canView('users'),
    userLevelController.searchUserLevels
);

/**
 * @route   GET /api/user-levels/available
 * @desc    Get available user levels (for dropdowns)
 * @access  Private (requires 'users' view permission)
 */
router.get('/available',
    canView('users'),

    userLevelController.getAvailableUserLevels
);

/**
 * @route   GET /api/user-levels/stats
 * @desc    Get user level statistics
 * @access  Private (requires 'users' view permission)
 */
router.get('/stats',
    canView('users'),
    userLevelController.getUserLevelStats
);

/**
 * @route   GET /api/user-levels/:id/usage
 * @desc    Get users assigned to specific user level with pagination
 * @access  Private (requires 'users' view permission)
 * @param   {string} id - User level ID
 * @query   {number} [page=1] - Page number for pagination
 * @query   {number} [limit=10] - Number of items per page
 * @query   {string} [search] - Search term for user data
 * @query   {boolean} [is_active] - Filter by active status
 * @query   {string} [department] - Filter by department
 */
router.get('/:id/usage',
    paramValidation,
    queryValidation,
    handleValidationErrors,
    canView('users'),
    userLevelController.getUserLevelUsage
);

/**
 * @route   GET /api/user-levels/:id
 * @desc    Get user level by ID
 * @access  Private (requires 'users' view permission)
 * @param   {string} id - User level ID
 * @query   {boolean} [include_users=false] - Include associated users
 * @query   {boolean} [include_permissions=false] - Include user permissions
 */
router.get('/:id',
    paramValidation,
    query('include_users')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('include_users must be true or false'),
    query('include_permissions')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('include_permissions must be true or false'),
    handleValidationErrors,
    canView('users'),
    userLevelController.getUserLevelById
);

/**
 * @route   POST /api/user-levels
 * @desc    Create new user level
 * @access  Private (requires 'users' add permission)
 * @body    {string} id - Unique user level ID (2-20 chars, alphanumeric + underscore)
 * @body    {string} level_name - Display name for the user level (2-50 chars)
 * @body    {string} [description] - Optional description (max 1000 chars)
 */
router.post('/',
    createUserLevelValidation,
    handleValidationErrors,
    canAdd('users'),
    userLevelController.createUserLevel
);

/**
 * @route   PUT /api/user-levels/:id
 * @desc    Update user level
 * @access  Private (requires 'users' edit permission)
 * @param   {string} id - User level ID
 * @body    {string} [level_name] - Display name for the user level (2-50 chars)
 * @body    {string} [description] - Optional description (max 1000 chars)
 */
router.put('/:id',
    paramValidation,
    updateUserLevelValidation,
    handleValidationErrors,
    canEdit('users'),
    userLevelController.updateUserLevel
);

/**
 * @route   DELETE /api/user-levels/:id
 * @desc    Delete user level
 * @access  Private (requires 'users' delete permission)
 * @param   {string} id - User level ID
 * @note    Cannot delete user level if it's assigned to any users
 */
router.delete('/:id',
    paramValidation,
    handleValidationErrors,
    canDelete('users'),
    userLevelController.deleteUserLevel
);

module.exports = router;