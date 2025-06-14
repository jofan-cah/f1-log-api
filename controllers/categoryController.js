  
const { Category, Product, StockMovement } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get all categories dengan pagination dan search
const getCategories = asyncHandler(async (req, res) => {
  const queryOptions = {
    allowedSortFields: ['name', 'code', 'current_stock', 'min_stock', 'max_stock', 'reorder_point', 'has_stock', 'is_low_stock', 'created_at'],
    defaultSort: { field: 'name', direction: 'ASC' },
    searchableFields: ['name', 'code', 'unit'],
    allowedFilters: {
      has_stock: {
        field: 'has_stock',
        transform: (value) => value === 'true' ? 1 : 0
      },
      is_low_stock: {
        field: 'is_low_stock',
        transform: (value) => value === 'true' ? 1 : 0
      },
      code: 'code'
    }
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  const { count, rows } = await Category.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

// Get category by ID
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByPk(id, {
    include: [{
      model: Product,
      as: 'products',
      attributes: ['product_id', 'brand', 'model', 'status', 'condition'],
      limit: 10 // Limit products untuk performance
    }]
  });

  if (!category) {
    return sendNotFound(res, 'Category not found');
  }

  sendSuccess(res, 'Category retrieved successfully', category);
});

// Create new category
const createCategory = asyncHandler(async (req, res) => {
  const { name, code, has_stock, min_stock, max_stock, current_stock, unit, reorder_point, notes } = req.body;

  // Check if code already exists
  const existingCode = await Category.findOne({
    where: { code: code.toUpperCase() },
    attributes: ['id']
  });

  if (existingCode) {
    return sendError(res, 'Category code already exists', 409);
  }

  // Check if name already exists
  const existingName = await Category.findOne({
    where: { name },
    attributes: ['id']
  });

  if (existingName) {
    return sendError(res, 'Category name already exists', 409);
  }

  // Validate stock values
  if (has_stock) {
    if (min_stock > max_stock) {
      return sendError(res, 'Minimum stock cannot be greater than maximum stock', 400);
    }
    
    if (current_stock < 0) {
      return sendError(res, 'Current stock cannot be negative', 400);
    }
  }

  // Calculate if low stock
  const isLowStock = has_stock && current_stock <= reorder_point;

  const category = await Category.create({
    name,
    code: code.toUpperCase(),
    has_stock: has_stock || false,
    min_stock: has_stock ? (min_stock || 0) : 0,
    max_stock: has_stock ? (max_stock || 0) : 0,
    current_stock: has_stock ? (current_stock || 0) : 0,
    unit: has_stock ? unit : null,
    reorder_point: has_stock ? (reorder_point || 0) : 0,
    is_low_stock: isLowStock,
    notes
  });

  sendCreated(res, 'Category created successfully', category);
});

// Update category
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, has_stock, min_stock, max_stock, current_stock, unit, reorder_point, notes } = req.body;

  const category = await Category.findByPk(id);
  if (!category) {
    return sendNotFound(res, 'Category not found');
  }

  // Check if new code already exists (excluding current category)
  if (code && code.toUpperCase() !== category.code) {
    const existingCode = await Category.findOne({
      where: { code: code.toUpperCase() },
      attributes: ['id']
    });

    if (existingCode) {
      return sendError(res, 'Category code already exists', 409);
    }
  }

  // Check if new name already exists (excluding current category)
  if (name && name !== category.name) {
    const existingName = await Category.findOne({
      where: { name },
      attributes: ['id']
    });

    if (existingName) {
      return sendError(res, 'Category name already exists', 409);
    }
  }

  // Validate stock values
  const newHasStock = has_stock !== undefined ? has_stock : category.has_stock;
  if (newHasStock) {
    const newMinStock = min_stock !== undefined ? min_stock : category.min_stock;
    const newMaxStock = max_stock !== undefined ? max_stock : category.max_stock;
    const newCurrentStock = current_stock !== undefined ? current_stock : category.current_stock;

    if (newMinStock > newMaxStock) {
      return sendError(res, 'Minimum stock cannot be greater than maximum stock', 400);
    }
    
    if (newCurrentStock < 0) {
      return sendError(res, 'Current stock cannot be negative', 400);
    }
  }

  // Calculate if low stock
  const newReorderPoint = reorder_point !== undefined ? reorder_point : category.reorder_point;
  const newCurrentStockValue = current_stock !== undefined ? current_stock : category.current_stock;
  const isLowStock = newHasStock && newCurrentStockValue <= newReorderPoint;

  // Update category
  await category.update({
    name: name || category.name,
    code: code ? code.toUpperCase() : category.code,
    has_stock: newHasStock,
    min_stock: newHasStock ? (min_stock !== undefined ? min_stock : category.min_stock) : 0,
    max_stock: newHasStock ? (max_stock !== undefined ? max_stock : category.max_stock) : 0,
    current_stock: newHasStock ? newCurrentStockValue : 0,
    unit: newHasStock ? (unit !== undefined ? unit : category.unit) : null,
    reorder_point: newHasStock ? newReorderPoint : 0,
    is_low_stock: isLowStock,
    notes: notes !== undefined ? notes : category.notes
  });

  sendUpdated(res, 'Category updated successfully', category);
});

// Delete category
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByPk(id);
  if (!category) {
    return sendNotFound(res, 'Category not found');
  }

  // Check if category has products
  const productCount = await Product.count({
    where: { category_id: id }
  });

  if (productCount > 0) {
    return sendError(res, `Cannot delete category. ${productCount} products are using this category`, 400);
  }

  await category.destroy();

  sendDeleted(res, 'Category deleted successfully');
});

// Get categories with stock tracking
const getCategoriesWithStock = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { has_stock: true },
    order: [['name', 'ASC']]
  });

  sendSuccess(res, 'Categories with stock retrieved successfully', categories);
});

// Get low stock categories
const getLowStockCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: {
      has_stock: true,
      is_low_stock: true
    },
    order: [['current_stock', 'ASC']]
  });

  sendSuccess(res, 'Low stock categories retrieved successfully', categories);
});

// Update category stock (manual adjustment)
const updateCategoryStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, notes, movement_type = 'adjustment' } = req.body;

  const category = await Category.findByPk(id);
  if (!category) {
    return sendNotFound(res, 'Category not found');
  }

  if (!category.has_stock) {
    return sendError(res, 'Category does not track stock', 400);
  }

  const oldStock = category.current_stock;
  const newStock = Math.max(0, oldStock + quantity); // Prevent negative stock

  // Create stock movement record
  await StockMovement.create({
    category_id: id,
    movement_type,
    quantity: Math.abs(quantity),
    reference_type: 'manual',
    before_stock: oldStock,
    after_stock: newStock,
    created_by: req.user.id,
    notes: notes || `Manual stock ${quantity > 0 ? 'increase' : 'decrease'}`
  });

  // Update category stock
  const isLowStock = newStock <= category.reorder_point;
  await category.update({
    current_stock: newStock,
    is_low_stock: isLowStock
  });

  // Get updated category
  const updatedCategory = await Category.findByPk(id);

  sendUpdated(res, 'Category stock updated successfully', {
    category: updatedCategory,
    stockMovement: {
      oldStock,
      newStock,
      change: quantity
    }
  });
});

// Get category statistics
const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    Category.count(),
    Category.count({ where: { has_stock: true } }),
    Category.count({ where: { is_low_stock: true } }),
    Category.sum('current_stock', { where: { has_stock: true } }),
    Category.findAll({
      attributes: ['code', 'name', 'current_stock', 'reorder_point'],
      where: { 
        has_stock: true,
        current_stock: { [Op.gt]: 0 }
      },
      order: [['current_stock', 'DESC']],
      limit: 5
    }),
    Category.findAll({
      attributes: ['code', 'name', 'current_stock', 'reorder_point'],
      where: { 
        has_stock: true,
        is_low_stock: true
      },
      order: [['current_stock', 'ASC']],
      limit: 5
    })
  ]);

  const categoryStats = {
    total: stats[0],
    withStock: stats[1],
    lowStock: stats[2],
    totalStockValue: stats[3] || 0,
    topStock: stats[4],
    criticalStock: stats[5]
  };

  sendSuccess(res, 'Category statistics retrieved successfully', categoryStats);
});

// Bulk stock adjustment
const bulkStockAdjustment = asyncHandler(async (req, res) => {
  const { adjustments } = req.body; // Array of { categoryId, quantity, notes }

  if (!Array.isArray(adjustments) || adjustments.length === 0) {
    return sendError(res, 'Adjustments array is required', 400);
  }

  const results = [];

  // Process each adjustment
  for (const adjustment of adjustments) {
    const { categoryId, quantity, notes } = adjustment;

    try {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        results.push({
          categoryId,
          success: false,
          error: 'Category not found'
        });
        continue;
      }

      if (!category.has_stock) {
        results.push({
          categoryId,
          success: false,
          error: 'Category does not track stock'
        });
        continue;
      }

      const oldStock = category.current_stock;
      const newStock = Math.max(0, oldStock + quantity);

      // Create stock movement
      await StockMovement.create({
        category_id: categoryId,
        movement_type: 'adjustment',
        quantity: Math.abs(quantity),
        reference_type: 'bulk_adjustment',
        before_stock: oldStock,
        after_stock: newStock,
        created_by: req.user.id,
        notes: notes || `Bulk adjustment: ${quantity > 0 ? '+' : ''}${quantity}`
      });

      // Update category
      const isLowStock = newStock <= category.reorder_point;
      await category.update({
        current_stock: newStock,
        is_low_stock: isLowStock
      });

      results.push({
        categoryId,
        success: true,
        oldStock,
        newStock,
        change: quantity
      });

    } catch (error) {
      results.push({
        categoryId,
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
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithStock,
  getLowStockCategories,
  updateCategoryStock,
  getCategoryStats,
  bulkStockAdjustment
};