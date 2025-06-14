  
const { PurchaseReceipt, PurchaseReceiptItem, Supplier, Category, Product, StockMovement } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { formatDate } = require('../utils/dateHelper');
const { Op } = require('sequelize');

// Get all purchase receipts dengan pagination dan search
const getPurchaseReceipts = asyncHandler(async (req, res) => {
  const queryOptions = {
    allowedSortFields: ['receipt_number', 'po_number', 'receipt_date', 'total_amount', 'status', 'created_at'],
    defaultSort: { field: 'receipt_date', direction: 'DESC' },
    searchableFields: ['receipt_number', 'po_number'],
    allowedFilters: {
      supplier_id: 'supplier_id',
      status: 'status',
      receipt_date: {
        field: 'receipt_date',
        operator: 'between'
      }
    },
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name']
      },
      {
        model: PurchaseReceiptItem,
        as: 'items',
        attributes: ['id', 'category_id', 'quantity', 'unit_price', 'total_price'],
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'code']
          }
        ]
      }
    ]
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  const { count, rows } = await PurchaseReceipt.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

// Get purchase receipt by ID
const getPurchaseReceiptById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const receipt = await PurchaseReceipt.findByPk(id, {
    include: [
      {
        model: Supplier,
        as: 'supplier'
      },
      {
        model: PurchaseReceiptItem,
        as: 'items',
        include: [
          {
            model: Category,
            as: 'category'
          }
        ]
      }
    ]
  });

  if (!receipt) {
    return sendNotFound(res, 'Purchase receipt not found');
  }

  sendSuccess(res, 'Purchase receipt retrieved successfully', receipt);
});

// Create new purchase receipt
const createPurchaseReceipt = asyncHandler(async (req, res) => {
  const { receipt_number, po_number, supplier_id, receipt_date, status, notes, items } = req.body;

  // Validate supplier exists
  const supplier = await Supplier.findByPk(supplier_id);
  if (!supplier) {
    return sendError(res, 'Supplier not found', 404);
  }

  // Check if receipt number already exists
  if (receipt_number) {
    const existingReceipt = await PurchaseReceipt.findOne({
      where: { receipt_number },
      attributes: ['id']
    });

    if (existingReceipt) {
      return sendError(res, 'Receipt number already exists', 409);
    }
  }

  // Generate receipt number if not provided
  let finalReceiptNumber = receipt_number;
  if (!finalReceiptNumber) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await PurchaseReceipt.count({
      where: {
        receipt_date: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    finalReceiptNumber = `RCP-${today}-${(count + 1).toString().padStart(3, '0')}`;
  }

  // Calculate total amount from items
  let totalAmount = 0;
  if (items && Array.isArray(items)) {
    for (const item of items) {
      // Validate category exists
      const category = await Category.findByPk(item.category_id);
      if (!category) {
        return sendError(res, `Category ${item.category_id} not found`, 404);
      }
      totalAmount += (item.unit_price || 0) * (item.quantity || 0);
    }
  }

  const receipt = await PurchaseReceipt.create({
    receipt_number: finalReceiptNumber,
    po_number,
    supplier_id,
    receipt_date: receipt_date || new Date(),
    total_amount: totalAmount,
    status: status || 'completed',
    created_by: req.user.id,
    notes
  });

  // Add items if provided
  if (items && Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const receiptItem = await PurchaseReceiptItem.create({
        receipt_id: receipt.id,
        category_id: item.category_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: (item.unit_price || 0) * (item.quantity || 0),
        serial_numbers: item.serial_numbers,
        condition: item.condition || 'New',
        notes: item.notes
      });

      // Update category stock if it tracks stock
      const category = await Category.findByPk(item.category_id);
      if (category && category.has_stock) {
        const oldStock = category.current_stock;
        const newStock = oldStock + item.quantity;

        // Create stock movement record
        await StockMovement.create({
          category_id: item.category_id,
          movement_type: 'in',
          quantity: item.quantity,
          reference_type: 'purchase_receipt',
          reference_id: receipt.id,
          before_stock: oldStock,
          after_stock: newStock,
          created_by: req.user.id,
          notes: `Purchase receipt: ${finalReceiptNumber}`
        });

        // Update category stock
        const isLowStock = newStock <= category.reorder_point;
        await category.update({
          current_stock: newStock,
          is_low_stock: isLowStock
        });
      }

      // Generate individual products if needed
      if (item.generate_products && item.quantity > 0) {
        const categoryCode = category.code;
        
        // Get existing product IDs for this category
        const existingProducts = await Product.findAll({
          where: { category_id: item.category_id },
          attributes: ['product_id'],
          raw: true
        });
        const existingIds = existingProducts.map(p => p.product_id);

        // Generate products
        for (let i = 0; i < item.quantity; i++) {
          // Generate next product ID
          let productId;
          let counter = 1;
          do {
            productId = `${categoryCode}${counter.toString().padStart(3, '0')}`;
            counter++;
          } while (existingIds.includes(productId));
          
          existingIds.push(productId);

          await Product.create({
            product_id: productId,
            category_id: item.category_id,
            supplier_id,
              serial_number: item.serial_numbers,
            po_number,
            receipt_item_id: receiptItem.id,
            status: 'Available',
            condition: item.condition || 'New',
            quantity: 1,
            purchase_date: receipt_date || new Date(),
            purchase_price: item.unit_price
          });
        }
      }
    }
  }

  // Get created receipt dengan associations
  const createdReceipt = await PurchaseReceipt.findByPk(receipt.id, {
    include: [
      {
        model: Supplier,
        as: 'supplier'
      },
      {
        model: PurchaseReceiptItem,
        as: 'items',
        include: [
          {
            model: Category,
            as: 'category'
          }
        ]
      }
    ]
  });

  sendCreated(res, 'Purchase receipt created successfully', createdReceipt);
});

// Update purchase receipt
const updatePurchaseReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { receipt_number, po_number, supplier_id, receipt_date, status, notes } = req.body;

  const receipt = await PurchaseReceipt.findByPk(id);
  if (!receipt) {
    return sendNotFound(res, 'Purchase receipt not found');
  }

  // Prevent updating completed receipts (except status change)
  if (receipt.status === 'completed' && status !== 'cancelled') {
    return sendError(res, 'Cannot modify completed purchase receipt', 400);
  }

  // Check if new receipt number already exists (excluding current receipt)
  if (receipt_number && receipt_number !== receipt.receipt_number) {
    const existingReceipt = await PurchaseReceipt.findOne({
      where: { receipt_number },
      attributes: ['id']
    });

    if (existingReceipt) {
      return sendError(res, 'Receipt number already exists', 409);
    }
  }

  // Validate supplier if provided
  if (supplier_id && supplier_id !== receipt.supplier_id) {
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }
  }

  await receipt.update({
    receipt_number: receipt_number || receipt.receipt_number,
    po_number: po_number || receipt.po_number,
    supplier_id: supplier_id || receipt.supplier_id,
    receipt_date: receipt_date || receipt.receipt_date,
    status: status || receipt.status,
    notes: notes !== undefined ? notes : receipt.notes
  });

  // Get updated receipt dengan associations
  const updatedReceipt = await PurchaseReceipt.findByPk(receipt.id, {
    include: [
      {
        model: Supplier,
        as: 'supplier'
      },
      {
        model: PurchaseReceiptItem,
        as: 'items',
        include: [
          {
            model: Category,
            as: 'category'
          }
        ]
      }
    ]
  });

  sendUpdated(res, 'Purchase receipt updated successfully', updatedReceipt);
});

// Delete purchase receipt
const deletePurchaseReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const receipt = await PurchaseReceipt.findByPk(id, {
    include: [
      {
        model: PurchaseReceiptItem,
        as: 'items'
      }
    ]
  });

  if (!receipt) {
    return sendNotFound(res, 'Purchase receipt not found');
  }

  // Prevent deleting completed receipts
  if (receipt.status === 'completed') {
    return sendError(res, 'Cannot delete completed purchase receipt', 400);
  }

  // Check if receipt has generated products
  const productCount = await Product.count({
    include: [
      {
        model: PurchaseReceiptItem,
        as: 'receiptItem',
        where: { receipt_id: id }
      }
    ]
  });

  if (productCount > 0) {
    return sendError(res, `Cannot delete receipt. ${productCount} products are linked to this receipt`, 400);
  }

  // Revert stock movements
  if (receipt.items && receipt.items.length > 0) {
    for (const item of receipt.items) {
      const category = await Category.findByPk(item.category_id);
      if (category && category.has_stock) {
        const oldStock = category.current_stock;
        const newStock = Math.max(0, oldStock - item.quantity);

        // Create reversal stock movement
        await StockMovement.create({
          category_id: item.category_id,
          movement_type: 'out',
          quantity: item.quantity,
          reference_type: 'purchase_receipt_reversal',
          reference_id: id,
          before_stock: oldStock,
          after_stock: newStock,
          created_by: req.user.id,
          notes: `Reversal of receipt: ${receipt.receipt_number}`
        });

        // Update category stock
        const isLowStock = newStock <= category.reorder_point;
        await category.update({
          current_stock: newStock,
          is_low_stock: isLowStock
        });
      }
    }
  }

  await receipt.destroy();

  sendDeleted(res, 'Purchase receipt deleted successfully');
});

// Add item to purchase receipt
const addReceiptItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category_id, quantity, unit_price, serial_numbers, condition, notes } = req.body;

  const receipt = await PurchaseReceipt.findByPk(id);
  if (!receipt) {
    return sendNotFound(res, 'Purchase receipt not found');
  }

  if (receipt.status === 'completed') {
    return sendError(res, 'Cannot add items to completed receipt', 400);
  }

  // Validate category exists
  const category = await Category.findByPk(category_id);
  if (!category) {
    return sendError(res, 'Category not found', 404);
  }

  const totalPrice = (unit_price || 0) * (quantity || 0);

  const receiptItem = await PurchaseReceiptItem.create({
    receipt_id: id,
    category_id,
    quantity: quantity || 0,
    unit_price: unit_price || 0,
    total_price: totalPrice,
    serial_numbers,
    condition: condition || 'New',
    notes
  });

  // Update receipt total amount
  const newTotalAmount = (receipt.total_amount || 0) + totalPrice;
  await receipt.update({ total_amount: newTotalAmount });

  // Update category stock if it tracks stock
  if (category.has_stock) {
    const oldStock = category.current_stock;
    const newStock = oldStock + quantity;

    await StockMovement.create({
      category_id,
      movement_type: 'in',
      quantity,
      reference_type: 'purchase_receipt',
      reference_id: id,
      before_stock: oldStock,
      after_stock: newStock,
      created_by: req.user.id,
      notes: `Added to receipt: ${receipt.receipt_number}`
    });

    const isLowStock = newStock <= category.reorder_point;
    await category.update({
      current_stock: newStock,
      is_low_stock: isLowStock
    });
  }

  // Get created item dengan associations
  const createdItem = await PurchaseReceiptItem.findByPk(receiptItem.id, {
    include: [
      {
        model: Category,
        as: 'category'
      }
    ]
  });

  sendCreated(res, 'Item added to receipt successfully', createdItem);
});

// Remove item from purchase receipt
const removeReceiptItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;

  const receipt = await PurchaseReceipt.findByPk(id);
  if (!receipt) {
    return sendNotFound(res, 'Purchase receipt not found');
  }

  if (receipt.status === 'completed') {
    return sendError(res, 'Cannot remove items from completed receipt', 400);
  }

  const receiptItem = await PurchaseReceiptItem.findOne({
    where: {
      id: itemId,
      receipt_id: id
    },
    include: [
      {
        model: Category,
        as: 'category'
      }
    ]
  });

  if (!receiptItem) {
    return sendNotFound(res, 'Receipt item not found');
  }

  // Check if item has generated products
  const productCount = await Product.count({
    where: { receipt_item_id: itemId }
  });

  if (productCount > 0) {
    return sendError(res, `Cannot remove item. ${productCount} products are linked to this item`, 400);
  }

  // Revert stock if category tracks stock
  const category = receiptItem.category;
  if (category && category.has_stock) {
    const oldStock = category.current_stock;
    const newStock = Math.max(0, oldStock - receiptItem.quantity);

    await StockMovement.create({
      category_id: category.id,
      movement_type: 'out',
      quantity: receiptItem.quantity,
      reference_type: 'purchase_receipt_item_removal',
      reference_id: id,
      before_stock: oldStock,
      after_stock: newStock,
      created_by: req.user.id,
      notes: `Removed from receipt: ${receipt.receipt_number}`
    });

    const isLowStock = newStock <= category.reorder_point;
    await category.update({
      current_stock: newStock,
      is_low_stock: isLowStock
    });
  }

  // Update receipt total amount
  const newTotalAmount = Math.max(0, (receipt.total_amount || 0) - (receiptItem.total_price || 0));
  await receipt.update({ total_amount: newTotalAmount });

  await receiptItem.destroy();

  sendDeleted(res, 'Item removed from receipt successfully');
});

// Get purchase statistics
const getPurchaseStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    PurchaseReceipt.count(),
    PurchaseReceipt.count({ where: { status: 'completed' } }),
    PurchaseReceipt.count({ where: { status: 'pending' } }),
    PurchaseReceipt.sum('total_amount'),
    PurchaseReceipt.sum('total_amount', {
      where: {
        receipt_date: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    // Recent receipts
    PurchaseReceipt.findAll({
      attributes: ['id', 'receipt_number', 'receipt_date', 'total_amount', 'status'],
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['name']
        }
      ],
      order: [['receipt_date', 'DESC']],
      limit: 10
    }),
    // Top suppliers by purchase amount
    PurchaseReceipt.findAll({
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
      group: ['supplier_id'],
      order: [[PurchaseReceipt.sequelize.fn('SUM', PurchaseReceipt.sequelize.col('total_amount')), 'DESC']],
      limit: 5
    })
  ]);

  const purchaseStats = {
    total_receipts: stats[0],
    completed_receipts: stats[1],
    pending_receipts: stats[2],
    total_amount: stats[3] || 0,
    this_month_amount: stats[4] || 0,
    recent_receipts: stats[5],
    top_suppliers: stats[6]
  };

  sendSuccess(res, 'Purchase statistics retrieved successfully', purchaseStats);
});

module.exports = {
  getPurchaseReceipts,
  getPurchaseReceiptById,
  createPurchaseReceipt,
  updatePurchaseReceipt,
  deletePurchaseReceipt,
  addReceiptItem,
  removeReceiptItem,
  getPurchaseStats
};