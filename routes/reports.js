const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { canView, canAdd, canEdit, canDelete } = require('../middleware/permissions');

const { handleValidationErrors } = require('../middleware/validation');
const { body, query } = require('express-validator');

// Validation rules
const stockReportValidation = [
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  query('status')
    .optional()
    .isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed'])
    .withMessage('Status must be: Available, In Use, Maintenance, Damaged, or Disposed'),
  
  query('location')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  
  query('format')
    .optional()
    .isIn(['summary', 'detailed'])
    .withMessage('Format must be: summary or detailed')
];

const transactionReportValidation = [
  query('period')
    .optional()
    .isIn(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'])
    .withMessage('Period must be a valid time period'),
  
  query('transaction_type')
    .optional()
    .isIn(['check_out', 'check_in', 'transfer', 'maintenance'])
    .withMessage('Transaction type must be: check_out, check_in, transfer, or maintenance'),
  
  query('location')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location must be between 1 and 100 characters'),
  
  query('user_id')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('User ID must be between 1 and 50 characters')
];

const financialReportValidation = [
  query('period')
    .optional()
    .isIn(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'])
    .withMessage('Period must be a valid time period')
];

const assetUtilizationValidation = [
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  query('period')
    .optional()
    .isIn(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year'])
    .withMessage('Period must be a valid time period')
];

const maintenanceReportValidation = [
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  query('status')
    .optional()
    .isIn(['due', 'overdue'])
    .withMessage('Status must be: due or overdue')
];

const customReportValidation = [
  body('report_type')
    .notEmpty()
    .withMessage('Report type is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Report type must be between 1 and 50 characters'),
  
  body('metrics')
    .isArray({ min: 1 })
    .withMessage('Metrics must be an array with at least one item'),
  
  body('metrics.*')
    .isIn(['product_count', 'transaction_count', 'purchase_amount', 'stock_movement', 'utilization_rate'])
    .withMessage('Each metric must be a valid metric type'),
  
  body('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid date'),
  
  body('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid date'),
  
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  
  body('categories.*')
    .isInt({ min: 1 })
    .withMessage('Each category ID must be a positive integer'),
  
  body('suppliers')
    .optional()
    .isArray()
    .withMessage('Suppliers must be an array'),
  
  body('suppliers.*')
    .isInt({ min: 1 })
    .withMessage('Each supplier ID must be a positive integer'),
  
  body('statuses')
    .optional()
    .isArray()
    .withMessage('Statuses must be an array'),
  
  body('statuses.*')
    .isIn(['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed'])
    .withMessage('Each status must be a valid status'),
  
  body('locations')
    .optional()
    .isArray()
    .withMessage('Locations must be an array'),
  
  body('locations.*')
    .isLength({ min: 1, max: 100 })
    .withMessage('Each location must be between 1 and 100 characters')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/reports/stock
 * @desc    Generate stock report (summary or detailed)
 * @access  Private (requires 'reports' view permission)
 * @query   {number} [category_id] - Filter by category ID
 * @query   {string} [status] - Filter by product status
 * @query   {string} [location] - Filter by location (partial match)
 * @query   {string} [format] - Report format: summary (default) or detailed
 */
router.get('/stock', 
  stockReportValidation,
 handleValidationErrors,
  canView('reports'),
  reportController.getStockReport
);

/**
 * @route   GET /api/reports/transactions
 * @desc    Generate transaction report
 * @access  Private (requires 'reports' view permission)
 * @query   {string} [period] - Time period (default: this_month)
 * @query   {string} [transaction_type] - Filter by transaction type
 * @query   {string} [location] - Filter by location (partial match)
 * @query   {string} [user_id] - Filter by user who created transaction
 */
router.get('/transactions', 
  transactionReportValidation,
 handleValidationErrors,
  canView('reports'),
  reportController.getTransactionReport
);

/**
 * @route   GET /api/reports/financial
 * @desc    Generate financial report (purchases and expenses)
 * @access  Private (requires 'reports' view permission)
 * @query   {string} [period] - Time period (default: this_month)
 */
router.get('/financial', 
  financialReportValidation,
 handleValidationErrors,
  canView('reports'),
  reportController.getFinancialReport
);

/**
 * @route   GET /api/reports/asset-utilization
 * @desc    Generate asset utilization report
 * @access  Private (requires 'reports' view permission)
 * @query   {number} [category_id] - Filter by category ID
 * @query   {string} [period] - Time period (default: this_month)
 */
router.get('/asset-utilization', 
  assetUtilizationValidation,
 handleValidationErrors,
  canView('reports'),
  reportController.getAssetUtilizationReport
);

/**
 * @route   GET /api/reports/maintenance
 * @desc    Generate maintenance report
 * @access  Private (requires 'reports' view permission)
 * @query   {number} [category_id] - Filter by category ID
 * @query   {string} [status] - Filter by maintenance status: due (default) or overdue
 */
router.get('/maintenance', 
  maintenanceReportValidation,
 handleValidationErrors,
  canView('reports'),
  reportController.getMaintenanceReport
);

/**
 * @route   POST /api/reports/custom
 * @desc    Generate custom report with flexible parameters
 * @access  Private (requires 'reports' view permission)
 * @body    {string} report_type - Type of custom report
 * @body    {Array} metrics - Array of metrics to include
 * @body    {string} [date_from] - Start date for date range
 * @body    {string} [date_to] - End date for date range
 * @body    {Array} [categories] - Array of category IDs to filter
 * @body    {Array} [suppliers] - Array of supplier IDs to filter
 * @body    {Array} [statuses] - Array of statuses to filter
 * @body    {Array} [locations] - Array of locations to filter
 */
router.post('/custom', 
  customReportValidation,
 handleValidationErrors,
  canView('reports'),
  reportController.getCustomReport
);

module.exports = router;