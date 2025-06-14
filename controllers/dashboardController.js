  const { 
  Category, 
  Product, 
  StockMovement, 
  Transaction, 
  TransactionItem,
  PurchaseReceipt,
  User 
} = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op, fn, col } = require('sequelize');

// Get main dashboard overview
const getDashboardOverview = asyncHandler(async (req, res) => {
  // Get date ranges
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Parallel queries for better performance
  const [
    // Stock Statistics
    totalCategories,
    lowStockCategories,
    outOfStockCategories,
    totalProducts,
    
    // Recent Activities
    recentMovements,
    recentTransactions,
    recentPurchases,
    
    // Monthly Statistics
    monthlyMovements,
    monthlyTransactions,
    weeklyMovements
  ] = await Promise.all([
    // Stock Statistics
    Category.count({ where: { has_stock: true } }),
    Category.count({ where: { has_stock: true, is_low_stock: true } }),
    Category.count({ where: { has_stock: true, current_stock: 0 } }),
    Product.count(),
    
    // Recent Activities (last 5)
    StockMovement.findAll({
      limit: 5,
      include: [{ model: Category, as: 'category', attributes: ['name', 'code'] }],
      order: [['movement_date', 'DESC']]
    }),
    
    Transaction.findAll({
      limit: 5,
      order: [['transaction_date', 'DESC']],
      attributes: ['id', 'transaction_type', 'reference_no', 'first_person', 'location', 'transaction_date', 'status']
    }),
    
    PurchaseReceipt.findAll({
      limit: 3,
      order: [['receipt_date', 'DESC']],
      attributes: ['id', 'receipt_number', 'receipt_date', 'total_amount', 'status']
    }),
    
    // Monthly Statistics
    StockMovement.findAll({
      where: {
        movement_date: { [Op.gte]: startOfMonth }
      },
      attributes: [
        'movement_type',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('quantity')), 'total_quantity']
      ],
      group: ['movement_type']
    }),
    
    Transaction.count({
      where: {
        transaction_date: { [Op.gte]: startOfMonth }
      }
    }),
    
    StockMovement.count({
      where: {
        movement_date: { [Op.gte]: startOfWeek }
      }
    })
  ]);

  // Process monthly movements data
  const movementStats = monthlyMovements.reduce((acc, movement) => {
    acc[movement.movement_type] = {
      count: parseInt(movement.get('count')),
      total_quantity: parseInt(movement.get('total_quantity')) || 0
    };
    return acc;
  }, {});

  // Stock health calculation
  const stockHealthPercentage = totalCategories > 0 
    ? Math.round(((totalCategories - lowStockCategories) / totalCategories) * 100)
    : 100;

  const overview = {
    // Key Metrics
    stock_summary: {
      total_categories: totalCategories,
      low_stock_count: lowStockCategories,
      out_of_stock_count: outOfStockCategories,
      stock_health_percentage: stockHealthPercentage,
      total_products: totalProducts
    },
    
    // Activity Statistics
    activity_stats: {
      monthly_transactions: monthlyTransactions,
      weekly_movements: weeklyMovements,
      movements_this_month: {
        in: movementStats.in || { count: 0, total_quantity: 0 },
        out: movementStats.out || { count: 0, total_quantity: 0 },
        adjustment: movementStats.adjustment || { count: 0, total_quantity: 0 }
      }
    },
    
    // Recent Activities
    recent_activities: {
      stock_movements: recentMovements.map(movement => ({
        id: movement.id,
        type: movement.movement_type,
        category: movement.category.name,
        quantity: movement.quantity,
        date: movement.movement_date,
        notes: movement.notes
      })),
      
      transactions: recentTransactions.map(transaction => ({
        id: transaction.id,
        type: transaction.transaction_type,
        reference: transaction.reference_no,
        person: transaction.first_person,
        location: transaction.location,
        date: transaction.transaction_date,
        status: transaction.status
      })),
      
      purchases: recentPurchases.map(purchase => ({
        id: purchase.id,
        receipt_number: purchase.receipt_number,
        date: purchase.receipt_date,
        amount: purchase.total_amount,
        status: purchase.status
      }))
    }
  };

  sendSuccess(res, 'Dashboard overview retrieved successfully', overview);
});

// Get detailed stock status
const getStockStatus = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { has_stock: true },
    attributes: [
      'id', 'name', 'code', 'unit',
      'current_stock', 'min_stock', 'max_stock',
      'reorder_point', 'is_low_stock'
    ],
    order: [['is_low_stock', 'DESC'], ['current_stock', 'ASC']]
  });

  // Calculate stock levels distribution
  const stockLevels = {
    critical: categories.filter(cat => cat.current_stock === 0).length,
    low: categories.filter(cat => cat.is_low_stock && cat.current_stock > 0).length,
    normal: categories.filter(cat => !cat.is_low_stock && cat.current_stock < cat.max_stock * 0.8).length,
    high: categories.filter(cat => cat.current_stock >= cat.max_stock * 0.8).length
  };

  // Top 5 categories by stock value
  const topStockCategories = categories
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 5)
    .map(cat => ({
      name: cat.name,
      code: cat.code,
      current_stock: cat.current_stock,
      unit: cat.unit,
      stock_percentage: cat.max_stock > 0 ? Math.round((cat.current_stock / cat.max_stock) * 100) : 0
    }));

  // Categories needing attention
  const needsAttention = categories
    .filter(cat => cat.is_low_stock)
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      code: cat.code,
      current_stock: cat.current_stock,
      reorder_point: cat.reorder_point,
      min_stock: cat.min_stock,
      unit: cat.unit,
      urgency: cat.current_stock === 0 ? 'critical' : 
              cat.current_stock <= (cat.reorder_point * 0.5) ? 'high' : 'medium'
    }))
    .sort((a, b) => {
      const urgencyOrder = { critical: 3, high: 2, medium: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });

  const stockStatus = {
    total_categories: categories.length,
    stock_levels: stockLevels,
    top_stock_categories: topStockCategories,
    needs_attention: needsAttention,
    categories_overview: categories
  };

  sendSuccess(res, 'Stock status retrieved successfully', stockStatus);
});

// Get analytics data for charts
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  const days = parseInt(period);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Daily movement trends
  const dailyMovements = await StockMovement.findAll({
    where: {
      movement_date: { [Op.gte]: startDate }
    },
    attributes: [
      [fn('DATE', col('movement_date')), 'date'],
      'movement_type',
      [fn('SUM', col('quantity')), 'total_quantity'],
      [fn('COUNT', col('id')), 'count']
    ],
    group: [fn('DATE', col('movement_date')), 'movement_type'],
    order: [[fn('DATE', col('movement_date')), 'ASC']]
  });

  // Category activity
  const categoryActivity = await StockMovement.findAll({
    where: {
      movement_date: { [Op.gte]: startDate }
    },
    include: [{
      model: Category,
      as: 'category',
      attributes: ['name', 'code']
    }],
    attributes: [
      'category_id',
      'movement_type',
      [fn('SUM', col('quantity')), 'total_quantity'],
      [fn('COUNT', col('StockMovement.id')), 'count']
    ],
    group: ['category_id', 'movement_type', 'category.id'],
    order: [[fn('SUM', col('quantity')), 'DESC']]
  });

  // Transaction trends
  const transactionTrends = await Transaction.findAll({
    where: {
      transaction_date: { [Op.gte]: startDate }
    },
    attributes: [
      [fn('DATE', col('transaction_date')), 'date'],
      'transaction_type',
      [fn('COUNT', col('id')), 'count']
    ],
    group: [fn('DATE', col('transaction_date')), 'transaction_type'],
    order: [[fn('DATE', col('transaction_date')), 'ASC']]
  });

  // Process data for charts
  const processedDailyMovements = dailyMovements.reduce((acc, movement) => {
    const date = movement.get('date');
    const type = movement.movement_type;
    const quantity = parseInt(movement.get('total_quantity'));
    
    if (!acc[date]) acc[date] = { date, in: 0, out: 0, adjustment: 0 };
    acc[date][type] = quantity;
    return acc;
  }, {});

  const processedCategoryActivity = categoryActivity.reduce((acc, activity) => {
    const categoryName = activity.category.name;
    const type = activity.movement_type;
    const quantity = parseInt(activity.get('total_quantity'));
    
    if (!acc[categoryName]) {
      acc[categoryName] = { 
        category: categoryName, 
        code: activity.category.code,
        in: 0, 
        out: 0, 
        adjustment: 0, 
        total: 0 
      };
    }
    acc[categoryName][type] = quantity;
    acc[categoryName].total += quantity;
    return acc;
  }, {});

  const processedTransactionTrends = transactionTrends.reduce((acc, transaction) => {
    const date = transaction.get('date');
    const type = transaction.transaction_type;
    const count = parseInt(transaction.get('count'));
    
    if (!acc[date]) acc[date] = { date, check_in: 0, check_out: 0, maintenance: 0 };
    acc[date][type] = count;
    return acc;
  }, {});

  const analytics = {
    period_days: days,
    daily_movements: Object.values(processedDailyMovements),
    category_activity: Object.values(processedCategoryActivity)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10), // Top 10 most active categories
    transaction_trends: Object.values(processedTransactionTrends)
  };

  sendSuccess(res, 'Analytics data retrieved successfully', analytics);
});

// Get system alerts and notifications
const getDashboardAlerts = asyncHandler(async (req, res) => {
  // Low stock alerts
  const lowStockAlerts = await Category.findAll({
    where: {
      has_stock: true,
      is_low_stock: true
    },
    attributes: ['id', 'name', 'code', 'current_stock', 'reorder_point', 'min_stock'],
    order: [['current_stock', 'ASC']]
  });

  // Recent large stock movements (quantity > 50% of reorder point)
  const significantMovements = await StockMovement.findAll({
    where: {
      movement_date: {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    include: [{
      model: Category,
      as: 'category',
      attributes: ['name', 'code', 'reorder_point']
    }],
    order: [['movement_date', 'DESC']]
  });

  const largeMovements = significantMovements.filter(movement => 
    movement.quantity > (movement.category.reorder_point * 0.5)
  );

  // Pending transactions
  const pendingTransactions = await Transaction.findAll({
    where: { status: 'open' },
    attributes: ['id', 'transaction_type', 'reference_no', 'first_person', 'transaction_date'],
    order: [['transaction_date', 'ASC']],
    limit: 10
  });

  // Format alerts
  const alerts = [];

  // Critical stock alerts
  lowStockAlerts.forEach(category => {
    if (category.current_stock === 0) {
      alerts.push({
        type: 'critical',
        category: 'stock',
        title: `Out of Stock: ${category.name}`,
        message: `${category.name} (${category.code}) is completely out of stock`,
        priority: 'high',
        data: { category_id: category.id }
      });
    } else if (category.current_stock <= category.reorder_point * 0.5) {
      alerts.push({
        type: 'warning',
        category: 'stock',
        title: `Critical Low Stock: ${category.name}`,
        message: `Only ${category.current_stock} units remaining`,
        priority: 'high',
        data: { category_id: category.id }
      });
    } else {
      alerts.push({
        type: 'info',
        category: 'stock',
        title: `Low Stock: ${category.name}`,
        message: `Stock below reorder point (${category.current_stock}/${category.reorder_point})`,
        priority: 'medium',
        data: { category_id: category.id }
      });
    }
  });

  // Large movement alerts
  largeMovements.forEach(movement => {
    alerts.push({
      type: 'info',
      category: 'movement',
      title: `Large ${movement.movement_type} movement`,
      message: `${movement.quantity} units of ${movement.category.name} ${movement.movement_type === 'in' ? 'added' : 'removed'}`,
      priority: 'low',
      data: { movement_id: movement.id }
    });
  });

  // Pending transaction alerts
  pendingTransactions.forEach(transaction => {
    const daysPending = Math.floor((new Date() - new Date(transaction.transaction_date)) / (1000 * 60 * 60 * 24));
    if (daysPending > 1) {
      alerts.push({
        type: 'warning',
        category: 'transaction',
        title: `Pending Transaction`,
        message: `${transaction.transaction_type} ${transaction.reference_no} pending for ${daysPending} days`,
        priority: daysPending > 3 ? 'high' : 'medium',
        data: { transaction_id: transaction.id }
      });
    }
  });

  // Sort alerts by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  alerts.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  const alertData = {
    alerts,
    summary: {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'critical').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      info: alerts.filter(a => a.type === 'info').length,
      high_priority: alerts.filter(a => a.priority === 'high').length
    }
  };

  sendSuccess(res, 'Alerts retrieved successfully', alertData);
});

// Get quick statistics for widgets
const getQuickStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    // Today's activities
    todayMovements,
    todayTransactions,
    
    // Monthly totals
    monthlyInbound,
    monthlyOutbound,
    monthlyTransactions,
    
    // Current status
    activeUsers,
    totalProducts,
    lowStockCount
  ] = await Promise.all([
    StockMovement.count({
      where: {
        movement_date: {
          [Op.gte]: today.setHours(0, 0, 0, 0),
          [Op.lt]: today.setHours(23, 59, 59, 999)
        }
      }
    }),
    
    Transaction.count({
      where: {
        transaction_date: {
          [Op.gte]: today.setHours(0, 0, 0, 0),
          [Op.lt]: today.setHours(23, 59, 59, 999)
        }
      }
    }),
    
    StockMovement.sum('quantity', {
      where: {
        movement_type: 'in',
        movement_date: { [Op.gte]: startOfMonth }
      }
    }),
    
    StockMovement.sum('quantity', {
      where: {
        movement_type: 'out',
        movement_date: { [Op.gte]: startOfMonth }
      }
    }),
    
    Transaction.count({
      where: {
        transaction_date: { [Op.gte]: startOfMonth }
      }
    }),
    
    User.count({ where: { is_active: true } }),
    Product.count(),
    Category.count({ where: { has_stock: true, is_low_stock: true } })
  ]);

  const stats = {
    today: {
      movements: todayMovements || 0,
      transactions: todayTransactions || 0
    },
    monthly: {
      inbound_quantity: monthlyInbound || 0,
      outbound_quantity: monthlyOutbound || 0,
      transactions: monthlyTransactions || 0,
      net_movement: (monthlyInbound || 0) - (monthlyOutbound || 0)
    },
    current: {
      active_users: activeUsers || 0,
      total_products: totalProducts || 0,
      low_stock_alerts: lowStockCount || 0
    }
  };

  sendSuccess(res, 'Quick stats retrieved successfully', stats);
});

module.exports = {
  getDashboardOverview,
  getStockStatus,
  getDashboardAnalytics,
  getDashboardAlerts,
  getQuickStats
};
