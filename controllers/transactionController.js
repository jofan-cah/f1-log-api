  const { Transaction, TransactionItem, Product, Category } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateTransactionQR } = require('../utils/qrGenerator');
const { Op } = require('sequelize');

// Get all transactions dengan pagination dan search
const getTransactions = asyncHandler(async (req, res) => {
  const queryOptions = {
    allowedSortFields: ['transaction_date', 'transaction_type', 'reference_no', 'status', 'location', 'created_at'],
    defaultSort: { field: 'transaction_date', direction: 'DESC' },
    searchableFields: ['reference_no', 'first_person', 'second_person', 'location'],
    allowedFilters: {
      transaction_type: 'transaction_type',
      status: 'status',
      location: {
        field: 'location',
        operator: 'like'
      },
      created_by: 'created_by'
    },
    include: [
      {
        model: TransactionItem,
        as: 'items',
        attributes: ['id', 'product_id', 'quantity', 'condition_before', 'condition_after'],
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
    ]
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  const { count, rows } = await Transaction.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

// Get transaction by ID
const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findByPk(id, {
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
                as: 'category'
              }
            ]
          }
        ]
      }
    ]
  });

  if (!transaction) {
    return sendNotFound(res, 'Transaction not found');
  }

  sendSuccess(res, 'Transaction retrieved successfully', transaction);
});

// Create new transaction
const createTransaction = asyncHandler(async (req, res) => {
  const { transaction_type, reference_no, first_person, second_person, location, transaction_date, notes, items } = req.body;

  // Validate transaction type
  const validTypes = ['check_out', 'check_in', 'lost', 'repair'];
  if (!validTypes.includes(transaction_type)) {
    return sendError(res, 'Invalid transaction type', 400);
  }

  // Generate reference number if not provided
  let finalReferenceNo = reference_no;
  if (!finalReferenceNo) {
    const prefix = transaction_type.toUpperCase().substring(0, 2);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Transaction.count({
      where: {
        transaction_type,
        transaction_date: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    finalReferenceNo = `${prefix}-${today}-${(count + 1).toString().padStart(3, '0')}`;
  }

  const transaction = await Transaction.create({
    transaction_type,
    reference_no: finalReferenceNo,
    first_person,
    second_person,
    location,
    transaction_date: transaction_date || new Date(),
    notes,
    status: 'open',
    created_by: req.user.id
  });

  // Add items if provided
  if (items && Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      // Validate product exists
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        await transaction.destroy();
        return sendError(res, `Product ${item.product_id} not found`, 404);
      }

      await TransactionItem.create({
        transaction_id: transaction.id,
        product_id: item.product_id,
        condition_before: item.condition_before || product.condition,
        condition_after: item.condition_after || product.condition,
        quantity: item.quantity || 1,
        breakdown_quantity: item.breakdown_quantity,
        breakdown_unit: item.breakdown_unit,
        notes: item.notes,
        status: 'processed'
      });

      // Update product status based on transaction type
      if (transaction_type === 'check_out') {
        await product.update({
          status: 'In Use',
          location: location
        });
      } else if (transaction_type === 'check_in') {
        await product.update({
          status: 'Available',
          condition: item.condition_after || product.condition
        });
      } else if (transaction_type === 'repair') {
        await product.update({
          status: 'repair',
          last_maintenance_date: new Date()
        });
      }
      else if (transaction_type === 'lost') {
        await product.update({
          status: 'lost',
          last_maintenance_date: new Date()
        });
      }
    }
  }

  // Get created transaction dengan associations
  const createdTransaction = await Transaction.findByPk(transaction.id, {
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
                as: 'category'
              }
            ]
          }
        ]
      }
    ]
  });

  sendCreated(res, 'Transaction created successfully', createdTransaction);
});

// Update transaction
const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reference_no, first_person, second_person, location, transaction_date, notes, status } = req.body;

  const transaction = await Transaction.findByPk(id);
  if (!transaction) {
    return sendNotFound(res, 'Transaction not found');
  }

  // Only allow certain updates if transaction is closed
  if (transaction.status === 'closed' && status !== 'open') {
    return sendError(res, 'Cannot modify closed transaction', 400);
  }

  await transaction.update({
    reference_no: reference_no || transaction.reference_no,
    first_person: first_person || transaction.first_person,
    second_person: second_person || transaction.second_person,
    location: location || transaction.location,
    transaction_date: transaction_date || transaction.transaction_date,
    notes: notes !== undefined ? notes : transaction.notes,
    status: status || transaction.status
  });

  // Get updated transaction dengan associations
  const updatedTransaction = await Transaction.findByPk(transaction.id, {
    include: [
      {
        model: TransactionItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      }
    ]
  });

  sendUpdated(res, 'Transaction updated successfully', updatedTransaction);
});

// Delete transaction
const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findByPk(id, {
    include: [
      {
        model: TransactionItem,
        as: 'items'
      }
    ]
  });

  if (!transaction) {
    return sendNotFound(res, 'Transaction not found');
  }

  // Only allow deletion if status is open or pending
  if (transaction.status === 'closed') {
    return sendError(res, 'Cannot delete closed transaction', 400);
  }

  // Revert product statuses if necessary
  if (transaction.items && transaction.items.length > 0) {
    for (const item of transaction.items) {
      const product = await Product.findByPk(item.product_id);
      if (product && transaction.transaction_type === 'check_out') {
        // Revert to Available status
        await product.update({ status: 'Available' });
      }
    }
  }

  await transaction.destroy();

  sendDeleted(res, 'Transaction deleted successfully');
});

// Add item to transaction
const addTransactionItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { product_id, condition_before, condition_after, quantity, breakdown_quantity, breakdown_unit, notes } = req.body;

  const transaction = await Transaction.findByPk(id);
  if (!transaction) {
    return sendNotFound(res, 'Transaction not found');
  }

  if (transaction.status === 'closed') {
    return sendError(res, 'Cannot add items to closed transaction', 400);
  }

  // Validate product exists
  const product = await Product.findByPk(product_id);
  if (!product) {
    return sendError(res, 'Product not found', 404);
  }

  // Check if product already in transaction
  const existingItem = await TransactionItem.findOne({
    where: {
      transaction_id: id,
      product_id
    }
  });

  if (existingItem) {
    return sendError(res, 'Product already exists in this transaction', 409);
  }

  const transactionItem = await TransactionItem.create({
    transaction_id: id,
    product_id,
    condition_before: condition_before || product.condition,
    condition_after: condition_after || product.condition,
    quantity: quantity || 1,
    breakdown_quantity,
    breakdown_unit,
    notes,
    status: 'processed'
  });

  // Update product status based on transaction type
  if (transaction.transaction_type === 'check_out') {
    await product.update({
      status: 'In Use',
      location: transaction.location
    });
  } else if (transaction.transaction_type === 'check_in') {
    await product.update({
      status: 'Available',
      condition: condition_after || product.condition
    });
  } else if (transaction.transaction_type === 'repair') {
    await product.update({
      status: 'repair',
      last_maintenance_date: new Date()
    });
  }
   else if (transaction.transaction_type === 'lost') {
    await product.update({
      status: 'lost',
      last_maintenance_date: new Date()
    });
  }

  // Get created item dengan associations
  const createdItem = await TransactionItem.findByPk(transactionItem.id, {
    include: [
      {
        model: Product,
        as: 'product',
        include: [
          {
            model: Category,
            as: 'category'
          }
        ]
      }
    ]
  });

  sendCreated(res, 'Item added to transaction successfully', createdItem);
});

// Remove item from transaction
const removeTransactionItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;

  const transaction = await Transaction.findByPk(id);
  if (!transaction) {
    return sendNotFound(res, 'Transaction not found');
  }

  if (transaction.status === 'closed') {
    return sendError(res, 'Cannot remove items from closed transaction', 400);
  }

  const transactionItem = await TransactionItem.findOne({
    where: {
      id: itemId,
      transaction_id: id
    },
    include: [
      {
        model: Product,
        as: 'product'
      }
    ]
  });

  if (!transactionItem) {
    return sendNotFound(res, 'Transaction item not found');
  }

  // Revert product status if necessary
  if (transaction.transaction_type === 'check_out') {
    await transactionItem.product.update({ status: 'Available' });
  }

  await transactionItem.destroy();

  sendDeleted(res, 'Item removed from transaction successfully');
});

// Close transaction
const closeTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findByPk(id, {
    include: [
      {
        model: TransactionItem,
        as: 'items'
      }
    ]
  });

  if (!transaction) {
    return sendNotFound(res, 'Transaction not found');
  }

  if (transaction.status === 'closed') {
    return sendError(res, 'Transaction already closed', 400);
  }

  if (!transaction.items || transaction.items.length === 0) {
    return sendError(res, 'Cannot close transaction without items', 400);
  }

  await transaction.update({ status: 'closed' });

  sendUpdated(res, 'Transaction closed successfully', transaction);
});

// Generate QR code for transaction
const generateTransactionQRCode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transaction = await Transaction.findByPk(id);
  if (!transaction) {
    return sendNotFound(res, 'Transaction not found');
  }

  try {
    const qrResult = await generateTransactionQR(transaction);

    sendSuccess(res, 'QR code generated successfully', {
      transaction_id: transaction.id,
      qr_code: {
        filename: qrResult.filename,
        url: qrResult.url,
        data: qrResult.qr_data
      }
    });

  } catch (error) {
    return sendError(res, `Failed to generate QR code: ${error.message}`, 500);
  }
});

// Get transaction statistics
const getTransactionStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    Transaction.count(),
    Transaction.count({ where: { status: 'open' } }),
    Transaction.count({ where: { status: 'closed' } }),
    Transaction.count({ where: { transaction_type: 'check_out' } }),
    Transaction.count({ where: { transaction_type: 'check_in' } }),
    Transaction.count({ where: { transaction_type: 'lost' } }),
    Transaction.count({ where: { transaction_type: 'repair' } }),
    // Recent transactions
    Transaction.findAll({
      attributes: ['id', 'transaction_type', 'reference_no', 'transaction_date', 'status'],
      order: [['transaction_date', 'DESC']],
      limit: 10
    }),
    // Transactions by location
    Transaction.findAll({
      attributes: [
        'location',
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'count']
      ],
      group: ['location'],
      order: [[Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    })
  ]);

  const transactionStats = {
    total: stats[0],
    byStatus: {
      open: stats[1],
      closed: stats[2]
    },
    byType: {
      check_out: stats[3],
      check_in: stats[4],
      transfer: stats[5],
      maintenance: stats[6]
    },
    recent: stats[7],
    byLocation: stats[8]
  };

  sendSuccess(res, 'Transaction statistics retrieved successfully', transactionStats);
});

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  addTransactionItem,
  removeTransactionItem,
  closeTransaction,
  generateTransactionQRCode,
  getTransactionStats
};
