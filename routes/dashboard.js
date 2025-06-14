const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');

const { handleValidationErrors } = require('../middleware/validation');
const { query } = require('express-validator');

// Validation rules
const analyticsValidation = [
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get main dashboard overview with key metrics and recent activities
 * @access  Private (requires dashboard access)
 */
router.get('/overview', 
  // Basic dashboard access - most users should be able to view this
  (req, res, next) => {
    // Check if user has access to any module that would grant dashboard view
    const userPermissions = req.user.permissions || [];
    const hasAnyViewPermission = userPermissions.some(perm => perm.can_view);
    
    if (!hasAnyViewPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }
    next();
  },
  dashboardController.getDashboardOverview
);

/**
 * @route   GET /api/dashboard/stock-status
 * @desc    Get detailed stock status and inventory levels
 * @access  Private (requires 'stocks' view permission)
 */
router.get('/stock-status', 
   canView('stocks'),
  dashboardController.getStockStatus
);

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get analytics data for charts and trends
 * @access  Private (requires 'reports' view permission)
 * @query   {number} period - Analysis period in days (default: 30, max: 365)
 */
router.get('/analytics', 
  analyticsValidation,
 handleValidationErrors,
   canView('reports'),
  dashboardController.getDashboardAnalytics
);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get system alerts and notifications
 * @access  Private (requires dashboard access)
 */
router.get('/alerts', 
  // Check if user has access to any module
  (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const hasAnyViewPermission = userPermissions.some(perm => perm.can_view);
    
    if (!hasAnyViewPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }
    next();
  },
  dashboardController.getDashboardAlerts
);

/**
 * @route   GET /api/dashboard/quick-stats
 * @desc    Get quick statistics for dashboard widgets
 * @access  Private (requires dashboard access)
 */
router.get('/quick-stats', 
  // Check if user has access to any module
  (req, res, next) => {
    const userPermissions = req.user.permissions || [];
    const hasAnyViewPermission = userPermissions.some(perm => perm.can_view);
    
    if (!hasAnyViewPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }
    next();
  },
  dashboardController.getQuickStats
);

module.exports = router;