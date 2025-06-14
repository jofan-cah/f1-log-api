  const { Product, Category, Supplier, Transaction, TransactionItem, PurchaseReceipt, StockMovement, User } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDateRange, formatDate } = require('../utils/dateHelper');
const { Op } = require('sequelize');

// Stock Report
const getStockReport = asyncHandler(async (req, res) => {
  const { category_id, status, location, format = 'summary' } = req.query;

  let whereConditions = {};
  if (category_id) whereConditions.category_id = category_id;
  if (status) whereConditions.status = status;
  if (location) whereConditions.location = { [Op.like]: `%${location}%` };

  if (format === 'detailed') {
    // Detailed stock report
    const products = await Product.findAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'code', 'current_stock', 'min_stock', 'max_stock', 'reorder_point']
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['name']
        }
      ],
      order: [['category_id', 'ASC'], ['product_id', 'ASC']]
    });

    sendSuccess(res, 'Detailed stock report generated', {
      report_type: 'detailed_stock',
      generated_at: new Date(),
      total_products: products.length,
      filters: { category_id, status, location },
      data: products
    });

  } else {
    // Summary stock report
    const stockSummary = await Category.findAll({
      where: category_id ? { id: category_id } : {},
      attributes: [
        'id',
        'name',
        'code',
        'current_stock',
        'min_stock',
        'max_stock',
        'reorder_point',
        'is_low_stock',
        'unit'
      ],
      include: [
        {
          model: Product,
          as: 'products',
          attributes: [
            'status',
            [Product.sequelize.fn('COUNT', Product.sequelize.col('products.product_id')), 'count']
          ],
          where: whereConditions,
          group: ['status'],
          required: false
        }
      ],
      order: [['name', 'ASC']]
    });

    // Calculate totals
    const totals = await Product.findOne({
      attributes: [
        [Product.sequelize.fn('COUNT', Product.sequelize.col('product_id')), 'total_products'],
        [Product.sequelize.fn('COUNT', Product.sequelize.literal("CASE WHEN status = 'Available' THEN 1 END")), 'available'],
        [Product.sequelize.fn('COUNT', Product.sequelize.literal("CASE WHEN status = 'In Use' THEN 1 END")), 'in_use'],
        [Product.sequelize.fn('COUNT', Product.sequelize.literal("CASE WHEN status = 'Maintenance' THEN 1 END")), 'maintenance'],
        [Product.sequelize.fn('COUNT', Product.sequelize.literal("CASE WHEN status = 'Damaged' THEN 1 END")), 'damaged']
      ],
      where: whereConditions,
      raw: true
    });

    sendSuccess(res, 'Stock summary report generated', {
      report_type: 'stock_summary',
      generated_at: new Date(),
      filters: { category_id, status, location },
      totals,
      categories: stockSummary
    });
  }
});

// Transaction Report
const getTransactionReport = asyncHandler(async (req, res) => {
  const { period = 'this_month', transaction_type, location, user_id } = req.query;

  const dateRange = getDateRange(period);
  
  let whereConditions = {
    transaction_date: {
      [Op.between]: [dateRange.start, dateRange.end]
    }
  };

  if (transaction_type) whereConditions.transaction_type = transaction_type;
  if (location) whereConditions.location = { [Op.like]: `%${location}%` };
  if (user_id) whereConditions.created_by = user_id;

  const transactions = await Transaction.findAll({
    where: whereConditions,
    include: [
      {
        model: TransactionItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['product_id', 'brand', 'model'],
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['name', 'code']
              }
            ]
          }
        ]
      }
    ],
    order: [['transaction_date', 'DESC']]
  });

  // Summary statistics
  const summary = await Transaction.findOne({
    attributes: [
      [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'total_transactions'],
      [Transaction.sequelize.fn('COUNT', Transaction.sequelize.literal("CASE WHEN transaction_type = 'check_out' THEN 1 END")), 'check_out'],
      [Transaction.sequelize.fn('COUNT', Transaction.sequelize.literal("CASE WHEN transaction_type = 'check_in' THEN 1 END")), 'check_in'],
      [Transaction.sequelize.fn('COUNT', Transaction.sequelize.literal("CASE WHEN transaction_type = 'transfer' THEN 1 END")), 'transfer'],
      [Transaction.sequelize.fn('COUNT', Transaction.sequelize.literal("CASE WHEN transaction_type = 'maintenance' THEN 1 END")), 'maintenance']
    ],
    where: whereConditions,
    raw: true
  });

  // Daily breakdown
  const dailyBreakdown = await Transaction.findAll({
    attributes: [
      [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transaction_date')), 'date'],
      [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count'],
      'transaction_type'
    ],
    where: whereConditions,
    group: [Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transaction_date')), 'transaction_type'],
    order: [[Transaction.sequelize.fn('DATE', Transaction.sequelize.col('transaction_date')), 'ASC']],
    raw: true
  });

  sendSuccess(res, 'Transaction report generated', {
    report_type: 'transaction',
    period,
    date_range: {
      start: formatDate(dateRange.start),
      end: formatDate(dateRange.end)
    },
    generated_at: new Date(),
    filters: { period, transaction_type, location, user_id },
    summary,
    daily_breakdown: dailyBreakdown,
    transactions
  });
});

// Financial Report
const getFinancialReport = asyncHandler(async (req, res) => {
  const { period = 'this_month' } = req.query;

  const dateRange = getDateRange(period);

  // Purchase receipts in period
  const purchases = await PurchaseReceipt.findAll({
    where: {
      receipt_date: {
        [Op.between]: [dateRange.start, dateRange.end]
      }
    },
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['name']
      }
    ],
    order: [['receipt_date', 'DESC']]
  });

  // Financial summary
  const purchaseSummary = await PurchaseReceipt.findOne({
    attributes: [
      [PurchaseReceipt.sequelize.fn('COUNT', PurchaseReceipt.sequelize.col('id')), 'total_receipts'],
      [PurchaseReceipt.sequelize.fn('SUM', PurchaseReceipt.sequelize.col('total_amount')), 'total_amount']
    ],
    where: {
      receipt_date: {
        [Op.between]: [dateRange.start, dateRange.end]
      }
    },
    raw: true
  });

  // Purchases by supplier
  const purchasesBySupplier = await PurchaseReceipt.findAll({
    attributes: [
      'supplier_id',
      [PurchaseReceipt.sequelize.fn('COUNT', PurchaseReceipt.sequelize.col('PurchaseReceipt.id')), 'receipt_count'],
      [PurchaseReceipt.sequelize.fn('SUM', PurchaseReceipt.sequelize.col('total_amount')), 'total_amount']
    ],
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['name']
      }
    ],
    where: {
      receipt_date: {
        [Op.between]: [dateRange.start, dateRange.end]
      }
    },
    group: ['supplier_id'],
    order: [[PurchaseReceipt.sequelize.fn('SUM', PurchaseReceipt.sequelize.col('total_amount')), 'DESC']]
  });

  // Monthly trend (last 12 months)
  const monthlyTrend = await PurchaseReceipt.findAll({
    attributes: [
      [PurchaseReceipt.sequelize.fn('YEAR', PurchaseReceipt.sequelize.col('receipt_date')), 'year'],
      [PurchaseReceipt.sequelize.fn('MONTH', PurchaseReceipt.sequelize.col('receipt_date')), 'month'],
      [PurchaseReceipt.sequelize.fn('COUNT', PurchaseReceipt.sequelize.col('id')), 'receipt_count'],
      [PurchaseReceipt.sequelize.fn('SUM', PurchaseReceipt.sequelize.col('total_amount')), 'total_amount']
    ],
    where: {
      receipt_date: {
        [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
      }
    },
    group: [
      PurchaseReceipt.sequelize.fn('YEAR', PurchaseReceipt.sequelize.col('receipt_date')),
      PurchaseReceipt.sequelize.fn('MONTH', PurchaseReceipt.sequelize.col('receipt_date'))
    ],
    order: [
      [PurchaseReceipt.sequelize.fn('YEAR', PurchaseReceipt.sequelize.col('receipt_date')), 'ASC'],
      [PurchaseReceipt.sequelize.fn('MONTH', PurchaseReceipt.sequelize.col('receipt_date')), 'ASC']
    ],
    raw: true
  });

  sendSuccess(res, 'Financial report generated', {
    report_type: 'financial',
    period,
    date_range: {
      start: formatDate(dateRange.start),
      end: formatDate(dateRange.end)
    },
    generated_at: new Date(),
    summary: purchaseSummary,
    purchases_by_supplier: purchasesBySupplier,
    monthly_trend: monthlyTrend,
    purchases
  });
});

// Asset Utilization Report
const getAssetUtilizationReport = asyncHandler(async (req, res) => {
  const { category_id, period = 'this_month' } = req.query;

  const dateRange = getDateRange(period);

  // Get products with their transaction history
  let whereConditions = {};
  if (category_id) whereConditions.category_id = category_id;

  const products = await Product.findAll({
    where: whereConditions,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['name', 'code']
      },
      {
        model: TransactionItem,
        as: 'transactionItems',
        include: [
          {
            model: Transaction,
            as: 'transaction',
            where: {
              transaction_date: {
                [Op.between]: [dateRange.start, dateRange.end]
              }
            },
            required: false
          }
        ],
        required: false
      }
    ]
  });

  // Calculate utilization metrics
  const utilizationData = products.map(product => {
    const transactions = product.transactionItems || [];
    const checkOuts = transactions.filter(t => t.transaction?.transaction_type === 'check_out').length;
    const checkIns = transactions.filter(t => t.transaction?.transaction_type === 'check_in').length;
    const maintenance = transactions.filter(t => t.transaction?.transaction_type === 'maintenance').length;

    return {
      product_id: product.product_id,
      brand: product.brand,
      model: product.model,
      category: product.category?.name,
      current_status: product.status,
      location: product.location,
      transaction_count: transactions.length,
      check_outs: checkOuts,
      check_ins: checkIns,
      maintenance_count: maintenance,
      utilization_score: transactions.length > 0 ? (checkOuts / (checkOuts + checkIns || 1)) * 100 : 0
    };
  });

  // Sort by utilization score
  utilizationData.sort((a, b) => b.utilization_score - a.utilization_score);

  // Summary
  const summary = {
    total_products: products.length,
    active_products: utilizationData.filter(p => p.transaction_count > 0).length,
    average_utilization: utilizationData.reduce((sum, p) => sum + p.utilization_score, 0) / products.length,
    most_utilized: utilizationData.slice(0, 10),
    least_utilized: utilizationData.slice(-10).reverse()
  };

  sendSuccess(res, 'Asset utilization report generated', {
    report_type: 'asset_utilization',
    period,
    date_range: {
      start: formatDate(dateRange.start),
      end: formatDate(dateRange.end)
    },
    generated_at: new Date(),
    filters: { category_id, period },
    summary,
    products: utilizationData
  });
});

// Maintenance Report
const getMaintenanceReport = asyncHandler(async (req, res) => {
  const { category_id, status = 'due' } = req.query;

  let whereConditions = {};
  if (category_id) whereConditions.category_id = category_id;

  if (status === 'due') {
    // Products due for maintenance
    whereConditions[Op.or] = [
      { next_maintenance_date: { [Op.lte]: new Date() } },
      { 
        next_maintenance_date: null,
        last_maintenance_date: {
          [Op.lt]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
        }
      }
    ];
  } else if (status === 'overdue') {
    // Products overdue for maintenance
    whereConditions.next_maintenance_date = { [Op.lt]: new Date() };
  }

  const products = await Product.findAll({
    where: whereConditions,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['name', 'code']
      },
      {
        model: TransactionItem,
        as: 'transactionItems',
        include: [
          {
            model: Transaction,
            as: 'transaction',
            where: { transaction_type: 'maintenance' },
            required: false
          }
        ],
        required: false
      }
    ],
    order: [['next_maintenance_date', 'ASC']]
  });

  // Maintenance history summary
  const maintenanceHistory = await Transaction.findAll({
    where: {
      transaction_type: 'maintenance',
      transaction_date: {
        [Op.gte]: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) // Last 12 months
      }
    },
    include: [
      {
        model: TransactionItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['name', 'code']
              }
            ]
          }
        ]
      }
    ],
    order: [['transaction_date', 'DESC']]
  });

  sendSuccess(res, 'Maintenance report generated', {
    report_type: 'maintenance',
    status,
    generated_at: new Date(),
    filters: { category_id, status },
    summary: {
      products_due: products.length,
      maintenance_history_count: maintenanceHistory.length
    },
    products_due: products,
    maintenance_history: maintenanceHistory
  });
});

// Custom Report Builder
const getCustomReport = asyncHandler(async (req, res) => {
  const { 
    report_type,
    date_from,
    date_to,
    categories,
    suppliers,
    statuses,
    locations,
    metrics
  } = req.body;

  if (!report_type || !metrics || !Array.isArray(metrics)) {
    return sendError(res, 'Report type and metrics are required', 400);
  }

  let dateRange = {};
  if (date_from && date_to) {
    dateRange = {
      start: new Date(date_from),
      end: new Date(date_to)
    };
  }

  // Build filters
  let filters = {};
  if (categories && categories.length > 0) filters.category_id = { [Op.in]: categories };
  if (suppliers && suppliers.length > 0) filters.supplier_id = { [Op.in]: suppliers };
  if (statuses && statuses.length > 0) filters.status = { [Op.in]: statuses };
  if (locations && locations.length > 0) {
    filters.location = { [Op.in]: locations.map(loc => ({ [Op.like]: `%${loc}%` })) };
  }

  // This is a simplified custom report builder
  // In a real application, you'd want more sophisticated query building
  let data = {};

  if (metrics.includes('product_count')) {
    data.product_count = await Product.count({ where: filters });
  }

  if (metrics.includes('transaction_count') && Object.keys(dateRange).length > 0) {
    data.transaction_count = await Transaction.count({
      where: {
        transaction_date: { [Op.between]: [dateRange.start, dateRange.end] }
      }
    });
  }

  if (metrics.includes('purchase_amount') && Object.keys(dateRange).length > 0) {
    data.purchase_amount = await PurchaseReceipt.sum('total_amount', {
      where: {
        receipt_date: { [Op.between]: [dateRange.start, dateRange.end] }
      }
    });
  }

  sendSuccess(res, 'Custom report generated', {
    report_type: 'custom',
    generated_at: new Date(),
    filters: { categories, suppliers, statuses, locations },
    date_range: dateRange,
    metrics_requested: metrics,
    data
  });
});

module.exports = {
  getStockReport,
  getTransactionReport,
  getFinancialReport,
  getAssetUtilizationReport,
  getMaintenanceReport,
  getCustomReport
};
