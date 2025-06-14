  
const { StockMovement, Category, User } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get all stock movements dengan pagination dan filtering
const getStockMovements = asyncHandler(async (req, res) => {
  const queryOptions = {
    allowedSortFields: ['movement_date', 'movement_type', 'quantity', 'before_stock', 'after_stock', 'created_at'],
    defaultSort: { field: 'movement_date', direction: 'DESC' },
    searchableFields: [],
    allowedFilters: {
      category_id: 'category_id',
      movement_type: 'movement_type',
      reference_type: 'reference_type',
      start_date: {
        field: 'movement_date',
        transform: (value) => ({ [Op.gte]: new Date(value) })
      },
      end_date: {
        field: 'movement_date',
        transform: (value) => ({ [Op.lte]: new Date(value) })
      }
    },
    include: [{
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'code', 'unit']
    }]
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  const { count, rows } = await StockMovement.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

// Get stock movement by ID
const getStockMovementById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movement = await StockMovement.findByPk(id, {
    include: [{
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'code', 'unit']
    }]
  });

  if (!movement) {
    return sendNotFound(res, 'Stock movement not found');
  }

  sendSuccess(res, 'Stock movement retrieved successfully', movement);
});

// Create manual stock movement
const createStockMovement = asyncHandler(async (req, res) => {
  const {
    category_id,
    movement_type,
    quantity,
    notes,
    reference_type = 'manual',
    reference_id = null
  } = req.body;

  // Validasi movement_type
  if (!['in', 'out', 'adjustment'].includes(movement_type)) {
    return sendError(res, 'Invalid movement type. Must be: in, out, or adjustment', 400);
  }

  if (quantity <= 0) {
    return sendError(res, 'Quantity must be greater than 0', 400);
  }

  // Get current category stock
  const category = await Category.findByPk(category_id);
  if (!category) {
    return sendNotFound(res, 'Category not found');
  }

  if (!category.has_stock) {
    return sendError(res, 'This category does not track stock', 400);
  }

  const before_stock = category.current_stock;
  let after_stock;
  let actualQuantity = quantity;

  // Calculate new stock based on movement type
  switch (movement_type) {
    case 'in':
      after_stock = before_stock + quantity;
      break;
    case 'out':
      after_stock = before_stock - quantity;
      if (after_stock < 0) {
        return sendError(res, 'Insufficient stock for this operation', 400);
      }
      break;
    case 'adjustment':
      after_stock = quantity; // Direct adjustment to specific quantity
      actualQuantity = Math.abs(after_stock - before_stock);
      break;
  }

  // Create stock movement record
  const movement = await StockMovement.create({
    category_id,
    movement_type,
    quantity: actualQuantity,
    reference_type,
    reference_id,
    before_stock,
    after_stock,
    movement_date: new Date(),
    created_by: req.user?.id || req.user?.username,
    notes
  });

  // Update category stock
  const is_low_stock = after_stock <= category.reorder_point;
  await category.update({
    current_stock: after_stock,
    is_low_stock
  });

  // Get the created movement with category info
  const createdMovement = await StockMovement.findByPk(movement.id, {
    include: [{
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'code', 'unit']
    }]
  });

  sendCreated(res, 'Stock movement created successfully', {
    movement: createdMovement,
    updated_stock: after_stock,
    is_low_stock
  });
});

// Get stock summary by categories
const getStockSummary = asyncHandler(async (req, res) => {
  const { low_stock_only } = req.query;

  const where = { has_stock: true };
  if (low_stock_only === 'true') {
    where.is_low_stock = true;
  }

  const categories = await Category.findAll({
    where,
    attributes: [
      'id', 'name', 'code', 'unit',
      'current_stock', 'min_stock', 'max_stock',
      'reorder_point', 'is_low_stock'
    ],
    order: [
      ['is_low_stock', 'DESC'],
      ['current_stock', 'ASC'],
      ['name', 'ASC']
    ]
  });

  const summary = {
    total_categories: categories.length,
    low_stock_count: categories.filter(cat => cat.is_low_stock).length,
    out_of_stock_count: categories.filter(cat => cat.current_stock === 0).length,
    categories
  };

  sendSuccess(res, 'Stock summary retrieved successfully', summary);
});

// Get recent stock movements
const getRecentMovements = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const movements = await StockMovement.findAll({
    limit: parseInt(limit),
    include: [{
      model: Category,
      as: 'category',
      attributes: ['id', 'name', 'code', 'unit']
    }],
    order: [['movement_date', 'DESC'], ['id', 'DESC']]
  });

  sendSuccess(res, 'Recent movements retrieved successfully', movements);
});

// Get stock analytics
const getStockAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Get movements in period
  const movements = await StockMovement.findAll({
    where: {
      movement_date: {
        [Op.gte]: startDate
      }
    },
    include: [{
      model: Category,
      as: 'category',
      attributes: ['name', 'code']
    }],
    order: [['movement_date', 'ASC']]
  });

  // Group by movement type
  const movementsByType = movements.reduce((acc, movement) => {
    const type = movement.movement_type;
    if (!acc[type]) acc[type] = 0;
    acc[type] += movement.quantity;
    return acc;
  }, {});

  // Group by date for trend analysis
  const dailyMovements = movements.reduce((acc, movement) => {
    const date = movement.movement_date.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { in: 0, out: 0, adjustment: 0 };
    }
    acc[date][movement.movement_type] += movement.quantity;
    return acc;
  }, {});

  // Most active categories
  const categoryActivity = movements.reduce((acc, movement) => {
    const categoryName = movement.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = { in: 0, out: 0, adjustment: 0, total: 0 };
    }
    acc[categoryName][movement.movement_type] += movement.quantity;
    acc[categoryName].total += movement.quantity;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryActivity)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([name, data]) => ({ name, ...data }));

  const analytics = {
    period_days: parseInt(period),
    movements_by_type: movementsByType,
    daily_trends: dailyMovements,
    top_categories: topCategories,
    total_movements: movements.length
  };

  sendSuccess(res, 'Stock analytics retrieved successfully', analytics);
});

// Get low stock alerts
const getLowStockAlerts = asyncHandler(async (req, res) => {
  const lowStockCategories = await Category.findAll({
    where: {
      has_stock: true,
      is_low_stock: true
    },
    attributes: [
      'id', 'name', 'code', 'unit',
      'current_stock', 'min_stock', 'reorder_point'
    ],
    order: [['current_stock', 'ASC']]
  });

  const alerts = lowStockCategories.map(category => ({
    ...category.toJSON(),
    urgency: category.current_stock === 0 ? 'critical' : 
            category.current_stock <= (category.reorder_point * 0.5) ? 'high' : 'medium',
    shortage: Math.max(0, category.min_stock - category.current_stock)
  }));

  const alertSummary = {
    alerts,
    total_alerts: alerts.length,
    critical_count: alerts.filter(a => a.urgency === 'critical').length,
    high_count: alerts.filter(a => a.urgency === 'high').length
  };

  sendSuccess(res, 'Low stock alerts retrieved successfully', alertSummary);
});

// Bulk stock adjustment
const bulkStockAdjustment = asyncHandler(async (req, res) => {
  const { adjustments } = req.body; // Array of { category_id, quantity, notes }

  if (!Array.isArray(adjustments) || adjustments.length === 0) {
    return sendError(res, 'Adjustments array is required', 400);
  }

  const results = [];

  // Process each adjustment
  for (const adjustment of adjustments) {
    const { category_id, quantity, notes } = adjustment;

    try {
      const category = await Category.findByPk(category_id);
      if (!category) {
        results.push({
          category_id,
          success: false,
          error: 'Category not found'
        });
        continue;
      }

      if (!category.has_stock) {
        results.push({
          category_id,
          success: false,
          error: 'Category does not track stock'
        });
        continue;
      }

      const before_stock = category.current_stock;
      const after_stock = Math.max(0, before_stock + quantity);

      // Create stock movement
      await StockMovement.create({
        category_id,
        movement_type: 'adjustment',
        quantity: Math.abs(quantity),
        reference_type: 'bulk_adjustment',
        before_stock,
        after_stock,
        created_by: req.user.id,
        notes: notes || `Bulk adjustment: ${quantity > 0 ? '+' : ''}${quantity}`
      });

      // Update category
      const is_low_stock = after_stock <= category.reorder_point;
      await category.update({
        current_stock: after_stock,
        is_low_stock
      });

      results.push({
        category_id,
        success: true,
        before_stock,
        after_stock,
        change: quantity
      });

    } catch (error) {
      results.push({
        category_id,
        success: false,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  sendSuccess(res, `Bulk stock adjustment completed. ${successCount} successful, ${failureCount} failed.`, {
    results,
    summary: {
      total: results.length,
      successful: successCount,
      failed: failureCount
    }
  });
});

module.exports = {
  getStockMovements,
  getStockMovementById,
  createStockMovement,
  getStockSummary,
  getRecentMovements,
  getStockAnalytics,
  getLowStockAlerts,
  bulkStockAdjustment
};