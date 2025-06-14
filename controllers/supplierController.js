 const { Supplier, PurchaseReceipt, Product } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// Get all suppliers dengan pagination dan search
const getSuppliers = asyncHandler(async (req, res) => {
  const queryOptions = {
    allowedSortFields: ['name', 'contact_person', 'phone', 'email', 'created_at'],
    defaultSort: { field: 'name', direction: 'ASC' },
    searchableFields: ['name', 'contact_person', 'phone', 'email', 'address'],
    allowedFilters: {
      name: {
        field: 'name',
        operator: 'like'
      }
    }
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  const { count, rows } = await Supplier.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

// Get supplier by ID
const getSupplierById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findByPk(id, {
    include: [
      {
        model: PurchaseReceipt,
        as: 'purchaseReceipts',
        attributes: ['id', 'receipt_number', 'po_number', 'receipt_date', 'total_amount', 'status'],
        limit: 10,
        order: [['receipt_date', 'DESC']]
      },
      {
        model: Product,
        as: 'products',
        attributes: ['product_id', 'brand', 'model', 'status'],
        limit: 10,
        order: [['created_at', 'DESC']]
      }
    ]
  });

  if (!supplier) {
    return sendNotFound(res, 'Supplier not found');
  }

  sendSuccess(res, 'Supplier retrieved successfully', supplier);
});

// Create new supplier
const createSupplier = asyncHandler(async (req, res) => {
  const { name, address, contact_person, phone, email, notes } = req.body;

  // Check if supplier name already exists
  const existingSupplier = await Supplier.findOne({
    where: { name },
    attributes: ['id']
  });

  if (existingSupplier) {
    return sendError(res, 'Supplier name already exists', 409);
  }

  // Check if email already exists (if provided)
  if (email) {
    const existingEmail = await Supplier.findOne({
      where: { email },
      attributes: ['id']
    });

    if (existingEmail) {
      return sendError(res, 'Email already exists', 409);
    }
  }

  const supplier = await Supplier.create({
    name,
    address,
    contact_person,
    phone,
    email,
    notes
  });

  sendCreated(res, 'Supplier created successfully', supplier);
});

// Update supplier
const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, address, contact_person, phone, email, notes } = req.body;

  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    return sendNotFound(res, 'Supplier not found');
  }

  // Check if new name already exists (excluding current supplier)
  if (name && name !== supplier.name) {
    const existingSupplier = await Supplier.findOne({
      where: { name },
      attributes: ['id']
    });

    if (existingSupplier) {
      return sendError(res, 'Supplier name already exists', 409);
    }
  }

  // Check if new email already exists (excluding current supplier)
  if (email && email !== supplier.email) {
    const existingEmail = await Supplier.findOne({
      where: { email },
      attributes: ['id']
    });

    if (existingEmail) {
      return sendError(res, 'Email already exists', 409);
    }
  }

  await supplier.update({
    name: name || supplier.name,
    address,
    contact_person,
    phone,
    email,
    notes
  });

  sendUpdated(res, 'Supplier updated successfully', supplier);
});

// Delete supplier
const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    return sendNotFound(res, 'Supplier not found');
  }

  // Check if supplier has purchase receipts
  const purchaseCount = await PurchaseReceipt.count({
    where: { supplier_id: id }
  });

  if (purchaseCount > 0) {
    return sendError(res, `Cannot delete supplier. ${purchaseCount} purchase receipts are associated with this supplier`, 400);
  }

  // Check if supplier has products
  const productCount = await Product.count({
    where: { supplier_id: id }
  });

  if (productCount > 0) {
    return sendError(res, `Cannot delete supplier. ${productCount} products are associated with this supplier`, 400);
  }

  await supplier.destroy();

  sendDeleted(res, 'Supplier deleted successfully');
});

// Get supplier statistics
const getSupplierStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    Supplier.count(),
    PurchaseReceipt.count({
      include: [{
        model: Supplier,
        as: 'supplier'
      }]
    }),
    PurchaseReceipt.sum('total_amount'),
    // Top suppliers by purchase amount
    Supplier.findAll({
      attributes: [
        'id',
        'name',
        [Supplier.sequelize.fn('COUNT', Supplier.sequelize.col('purchaseReceipts.id')), 'purchase_count'],
        [Supplier.sequelize.fn('SUM', Supplier.sequelize.col('purchaseReceipts.total_amount')), 'total_amount']
      ],
      include: [{
        model: PurchaseReceipt,
        as: 'purchaseReceipts',
        attributes: []
      }],
      group: ['Supplier.id'],
      order: [[Supplier.sequelize.fn('SUM', Supplier.sequelize.col('purchaseReceipts.total_amount')), 'DESC']],
      limit: 5,
      raw: false,
      subQuery: false
    }),
    // Recent suppliers
    Supplier.findAll({
      attributes: ['id', 'name', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    })
  ]);

  const supplierStats = {
    total: stats[0],
    totalPurchases: stats[1],
    totalPurchaseAmount: stats[2] || 0,
    topSuppliers: stats[3],
    recentSuppliers: stats[4]
  };

  sendSuccess(res, 'Supplier statistics retrieved successfully', supplierStats);
});

// Get supplier purchase history
const getSupplierPurchaseHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    return sendNotFound(res, 'Supplier not found');
  }

  const queryOptions = {
    allowedSortFields: ['receipt_date', 'total_amount', 'status'],
    defaultSort: { field: 'receipt_date', direction: 'DESC' },
    searchableFields: ['receipt_number', 'po_number'],
    allowedFilters: {
      status: 'status'
    }
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);
  
  // Add supplier filter
  query.where = { 
    ...query.where,
    supplier_id: id 
  };

  const { count, rows } = await PurchaseReceipt.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  }, `Purchase history for ${supplier.name}`);
});

// Get supplier products
const getSupplierProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    return sendNotFound(res, 'Supplier not found');
  }

  const queryOptions = {
    allowedSortFields: ['product_id', 'brand', 'model', 'status', 'created_at'],
    defaultSort: { field: 'created_at', direction: 'DESC' },
    searchableFields: ['product_id', 'brand', 'model', 'serial_number'],
    allowedFilters: {
      status: 'status',
      condition: 'condition'
    }
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);
  
  // Add supplier filter
  query.where = { 
    ...query.where,
    supplier_id: id 
  };

  const { count, rows } = await Product.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  }, `Products from ${supplier.name}`);
});

// Get supplier performance metrics
const getSupplierPerformance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    return sendNotFound(res, 'Supplier not found');
  }

  // Get supplier performance data
  const performance = await Promise.all([
    // Total purchases
    PurchaseReceipt.count({
      where: { supplier_id: id }
    }),
    // Total purchase amount
    PurchaseReceipt.sum('total_amount', {
      where: { supplier_id: id }
    }),
    // Average purchase amount
    PurchaseReceipt.findOne({
      attributes: [[PurchaseReceipt.sequelize.fn('AVG', PurchaseReceipt.sequelize.col('total_amount')), 'avg_amount']],
      where: { supplier_id: id },
      raw: true
    }),
    // Products count
    Product.count({
      where: { supplier_id: id }
    }),
    // Recent purchases (last 6 months)
    PurchaseReceipt.count({
      where: {
        supplier_id: id,
        receipt_date: {
          [Op.gte]: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    // Purchase by status
    PurchaseReceipt.findAll({
      attributes: [
        'status',
        [PurchaseReceipt.sequelize.fn('COUNT', PurchaseReceipt.sequelize.col('id')), 'count']
      ],
      where: { supplier_id: id },
      group: ['status'],
      raw: true
    })
  ]);

  const performanceData = {
    supplier: {
      id: supplier.id,
      name: supplier.name
    },
    totalPurchases: performance[0],
    totalAmount: performance[1] || 0,
    averageAmount: parseFloat(performance[2]?.avg_amount || 0),
    totalProducts: performance[3],
    recentPurchases: performance[4],
    purchasesByStatus: performance[5].reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {})
  };

  sendSuccess(res, 'Supplier performance retrieved successfully', performanceData);
});

// Search suppliers
const searchSuppliers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return sendError(res, 'Search query must be at least 2 characters', 400);
  }

  const searchTerm = q.trim();

  const suppliers = await Supplier.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { contact_person: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { phone: { [Op.like]: `%${searchTerm}%` } }
      ]
    },
    attributes: ['id', 'name', 'contact_person', 'phone', 'email'],
    limit: 20,
    order: [['name', 'ASC']]
  });

  sendSuccess(res, 'Supplier search completed', suppliers);
});

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats,
  getSupplierPurchaseHistory,
  getSupplierProducts,
  getSupplierPerformance,
  searchSuppliers
}; 
