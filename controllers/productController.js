const { Product, Category, Supplier, TransactionItem } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateProductQR } = require('../utils/qrGenerator');
const { validateProductId, generateNextProductId } = require('../utils/validator');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/products');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '');
    cb(null, `product-${uniqueSuffix}-${name}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload product image endpoint
const uploadProductImage = asyncHandler(async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 'File too large. Maximum size is 5MB.', 400);
      }
      return sendError(res, `Upload error: ${err.message}`, 400);
    } else if (err) {
      return sendError(res, `File validation error: ${err.message}`, 400);
    }

    if (!req.file) {
      return sendError(res, 'No file uploaded', 400);
    }

    // Return the filename for frontend to use
    sendSuccess(res, 'Image uploaded successfully', {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/products/${req.file.filename}`
    });
  });
});

// Delete product image endpoint
const deleteProductImage = asyncHandler(async (req, res) => {
  const { filename } = req.params;

  try {
    const filePath = path.join(__dirname, '../uploads/products', filename);
    await fs.unlink(filePath);
    sendSuccess(res, 'Image deleted successfully');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return sendNotFound(res, 'Image file not found');
    }
    return sendError(res, 'Failed to delete image', 500);
  }
});

// Get all products dengan pagination dan search
const getProducts = asyncHandler(async (req, res) => {
  const queryOptions = {
    allowedSortFields: ['product_id', 'brand', 'model', 'status', 'condition', 'location', 'purchase_date', 'created_at'],
    defaultSort: { field: 'created_at', direction: 'DESC' },
    searchableFields: ['product_id', 'brand', 'model', 'serial_number', 'location'],
    allowedFilters: {
      category_id: 'category_id',
      supplier_id: 'supplier_id',
      status: 'status',
      condition: 'condition',
      location: {
        field: 'location',
        operator: 'like'
      }
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'code']
      },
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name']
      }
    ]
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  const { count, rows } = await Product.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

// Get product by ID
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'category'
      },
      {
        model: Supplier,
        as: 'supplier'
      },
      {
        model: TransactionItem,
        as: 'transactionItems',
        attributes: ['id', 'transaction_id', 'condition_before', 'condition_after', 'quantity'],
        limit: 10,
        order: [['id', 'DESC']]
      }
    ]
  });

  if (!product) {
    return sendNotFound(res, 'Product not found');
  }

  sendSuccess(res, 'Product retrieved successfully', product);
});

// Create new product
const createProduct = asyncHandler(async (req, res) => {
  const { 
    product_id, 
    category_id, 
    brand, 
    model, 
    serial_number, 
    origin, 
    supplier_id, 
    po_number, 
    description, 
    location, 
    img_product, // NEW: Accept image filename
    status, 
    condition, 
    quantity, 
    purchase_date, 
    purchase_price, 
    warranty_expiry,
    last_maintenance_date,
    next_maintenance_date,
    ticketing_id,
    is_linked_to_ticketing,
    notes 
  } = req.body;

  // Validate product ID format
  if (product_id) {
    const validation = validateProductId(product_id);
    if (!validation.valid) {
      return sendError(res, validation.message, 400);
    }

    // Check if product ID already exists
    const existingProduct = await Product.findByPk(product_id);
    if (existingProduct) {
      return sendError(res, 'Product ID already exists', 409);
    }
  }

  // Validate category exists
  const category = await Category.findByPk(category_id);
  if (!category) {
    return sendError(res, 'Category not found', 404);
  }

  // Generate product ID if not provided
  let finalProductId = product_id;
  if (!finalProductId) {
    const existingProducts = await Product.findAll({
      where: { category_id },
      attributes: ['product_id'],
      raw: true
    });
    const existingIds = existingProducts.map(p => p.product_id);
    finalProductId = generateNextProductId(category.code, existingIds);
  }

  // Validate supplier if provided
  if (supplier_id) {
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }
  }

  // Validate image file exists if provided
  if (img_product) {
    try {
      const imagePath = path.join(__dirname, '../uploads/products', img_product);
      await fs.access(imagePath);
    } catch (error) {
      return sendError(res, 'Uploaded image file not found', 400);
    }
  }

  const product = await Product.create({
    product_id: finalProductId,
    category_id,
    brand,
    model,
    serial_number,
    origin,
    supplier_id,
    po_number,
    description,
    location,
    img_product, // NEW: Save image filename
    status: status || 'Available',
    condition: condition || 'New',
    quantity: quantity || 1,
    purchase_date,
    purchase_price,
    warranty_expiry,
    last_maintenance_date,
    next_maintenance_date,
    ticketing_id,
    is_linked_to_ticketing: is_linked_to_ticketing || false,
    notes
  });

  // Get created product dengan associations
  const createdProduct = await Product.findByPk(product.product_id, {
    include: [
      {
        model: Category,
        as: 'category'
      },
      {
        model: Supplier,
        as: 'supplier'
      }
    ]
  });

  sendCreated(res, 'Product created successfully', createdProduct);
});

// Update product
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    brand, 
    model, 
    serial_number, 
    origin, 
    supplier_id, 
    po_number, 
    description, 
    location, 
    img_product, // NEW: Accept image filename
    status, 
    condition, 
    quantity, 
    purchase_date, 
    purchase_price, 
    warranty_expiry, 
    last_maintenance_date, 
    next_maintenance_date,
    ticketing_id,
    is_linked_to_ticketing,
    notes 
  } = req.body;

  const product = await Product.findByPk(id);
  if (!product) {
    return sendNotFound(res, 'Product not found');
  }

  // Validate supplier if provided
  if (supplier_id && supplier_id !== product.supplier_id) {
    const supplier = await Supplier.findByPk(supplier_id);
    if (!supplier) {
      return sendError(res, 'Supplier not found', 404);
    }
  }

  // Validate image file exists if provided
  if (img_product && img_product !== product.img_product) {
    try {
      const imagePath = path.join(__dirname, '../uploads/products', img_product);
      await fs.access(imagePath);
    } catch (error) {
      return sendError(res, 'New image file not found', 400);
    }

    // Optionally delete old image file
    if (product.img_product) {
      try {
        const oldImagePath = path.join(__dirname, '../uploads/products', product.img_product);
        await fs.unlink(oldImagePath);
      } catch (error) {
        // Log error but don't fail the update
        console.warn('Failed to delete old image:', error.message);
      }
    }
  }

  await product.update({
    brand: brand !== undefined ? brand : product.brand,
    model: model !== undefined ? model : product.model,
    serial_number: serial_number !== undefined ? serial_number : product.serial_number,
    origin: origin !== undefined ? origin : product.origin,
    supplier_id: supplier_id !== undefined ? supplier_id : product.supplier_id,
    po_number: po_number !== undefined ? po_number : product.po_number,
    description: description !== undefined ? description : product.description,
    location: location !== undefined ? location : product.location,
    img_product: img_product !== undefined ? img_product : product.img_product, // NEW: Update image
    status: status !== undefined ? status : product.status,
    condition: condition !== undefined ? condition : product.condition,
    quantity: quantity !== undefined ? quantity : product.quantity,
    purchase_date: purchase_date !== undefined ? purchase_date : product.purchase_date,
    purchase_price: purchase_price !== undefined ? purchase_price : product.purchase_price,
    warranty_expiry: warranty_expiry !== undefined ? warranty_expiry : product.warranty_expiry,
    last_maintenance_date: last_maintenance_date !== undefined ? last_maintenance_date : product.last_maintenance_date,
    next_maintenance_date: next_maintenance_date !== undefined ? next_maintenance_date : product.next_maintenance_date,
    ticketing_id: ticketing_id !== undefined ? ticketing_id : product.ticketing_id,
    is_linked_to_ticketing: is_linked_to_ticketing !== undefined ? is_linked_to_ticketing : product.is_linked_to_ticketing,
    notes: notes !== undefined ? notes : product.notes
  });

  // Get updated product dengan associations
  const updatedProduct = await Product.findByPk(product.product_id, {
    include: [
      {
        model: Category,
        as: 'category'
      },
      {
        model: Supplier,
        as: 'supplier'
      }
    ]
  });

  sendUpdated(res, 'Product updated successfully', updatedProduct);
});

// Delete product
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id);
  if (!product) {
    return sendNotFound(res, 'Product not found');
  }

  // Check if product has transaction history
  const transactionCount = await TransactionItem.count({
    where: { product_id: id }
  });

  if (transactionCount > 0) {
    return sendError(res, `Cannot delete product. Product has ${transactionCount} transaction records`, 400);
  }

  // Delete associated image file if exists
  if (product.img_product) {
    try {
      const imagePath = path.join(__dirname, '../uploads/products', product.img_product);
      await fs.unlink(imagePath);
    } catch (error) {
      // Log error but don't fail the deletion
      console.warn('Failed to delete product image:', error.message);
    }
  }

  await product.destroy();

  sendDeleted(res, 'Product deleted successfully');
});

// ADD TO productController.js
const getProductsForPrint = asyncHandler(async (req, res) => {
  const { product_ids } = req.body; // Selected IDs from FE
  
  const products = await Product.findAll({
    where: { product_id: { [Op.in]: product_ids } },
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ],
    order: [['product_id', 'ASC']]
  });

  // Return clean data for FE to generate QR/barcodes
  const printData = products.map(product => ({
    product_id: product.product_id,
    category_name: product.category?.name,
    category_code: product.category?.code,
    brand: product.brand,
    model: product.model,
    location: product.location,
    serial_number: product.serial_number,
    img_product: product.img_product, // NEW: Include image
    // FE will generate QR/barcode from this data
    qr_data: {
      id: product.product_id,
      category: product.category?.code,
      brand: product.brand,
      model: product.model
    }
  }));

  sendSuccess(res, 'Products data for printing', {
    total: printData.length,
    products: printData
  });
});

// Generate QR code for product
const generateProductQRCode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'category'
      }
    ]
  });

  if (!product) {
    return sendNotFound(res, 'Product not found');
  }

  try {
    const qrResult = await generateProductQR(product);

    // Update product dengan QR data
    await product.update({
      qr_data: qrResult.qr_data
    });

    sendSuccess(res, 'QR code generated successfully', {
      product_id: product.product_id,
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

// Get products by category
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const category = await Category.findByPk(categoryId);
  if (!category) {
    return sendNotFound(res, 'Category not found');
  }

  const queryOptions = {
    allowedSortFields: ['product_id', 'brand', 'model', 'status', 'condition', 'created_at'],
    defaultSort: { field: 'product_id', direction: 'ASC' },
    searchableFields: ['product_id', 'brand', 'model', 'serial_number'],
    allowedFilters: {
      status: 'status',
      condition: 'condition'
    },
    include: [
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name']
      }
    ]
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);
  
  // Add category filter
  query.where = { 
    ...query.where,
    category_id: categoryId 
  };

  const { count, rows } = await Product.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  }, `Products in category: ${category.name}`);
});

// Get products by location
const getProductsByLocation = asyncHandler(async (req, res) => {
  const { location } = req.params;

  const queryOptions = {
    allowedSortFields: ['product_id', 'brand', 'model', 'status', 'condition', 'created_at'],
    defaultSort: { field: 'product_id', direction: 'ASC' },
    searchableFields: ['product_id', 'brand', 'model', 'serial_number'],
    allowedFilters: {
      status: 'status',
      condition: 'condition',
      category_id: 'category_id'
    },
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'code']
      },
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name']
      }
    ]
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);
  
  // Add location filter
  query.where = { 
    ...query.where,
    location: { [Op.like]: `%${location}%` }
  };

  const { count, rows } = await Product.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  }, `Products at location: ${location}`);
});

// Get product statistics
const getProductStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    Product.count(),
    Product.count({ where: { status: 'Available' } }),
    Product.count({ where: { status: 'In Use' } }),
    Product.count({ where: { status: 'Maintenance' } }),
    Product.count({ where: { status: 'Damaged' } }),
    Product.count({ where: { status: 'Disposed' } }),
    // Products by category
    Product.findAll({
      attributes: [
        'category_id',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('Product.product_id')), 'count']
      ],
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'code']
      }],
      group: ['category_id'],
      order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('Product.product_id')), 'DESC']],
      limit: 10
    }),
    // Products by location
    Product.findAll({
      attributes: [
        'location',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('product_id')), 'count']
      ],
      where: {
        location: { [Op.ne]: null }
      },
      group: ['location'],
      order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('product_id')), 'DESC']],
      limit: 10,
      raw: true
    })
  ]);

  const productStats = {
    total: stats[0],
    byStatus: {
      available: stats[1],
      in_use: stats[2],
      maintenance: stats[3],
      damaged: stats[4],
      disposed: stats[5]
    },
    byCategory: stats[6],
    byLocation: stats[7]
  };

  sendSuccess(res, 'Product statistics retrieved successfully', productStats);
});

// Search products with advanced filters
const searchProducts = asyncHandler(async (req, res) => {
  const { q, category_id, status, condition, location, supplier_id } = req.query;

  let whereConditions = {};

  // Text search
  if (q && q.trim().length >= 2) {
    const searchTerm = q.trim();
    whereConditions[Op.or] = [
      { product_id: { [Op.like]: `%${searchTerm}%` } },
      { brand: { [Op.like]: `%${searchTerm}%` } },
      { model: { [Op.like]: `%${searchTerm}%` } },
      { serial_number: { [Op.like]: `%${searchTerm}%` } }
    ];
  }

  // Filters
  if (category_id) whereConditions.category_id = category_id;
  if (status) whereConditions.status = status;
  if (condition) whereConditions.condition = condition;
  if (location) whereConditions.location = { [Op.like]: `%${location}%` };
  if (supplier_id) whereConditions.supplier_id = supplier_id;

  const products = await Product.findAll({
    where: whereConditions,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'code']
      },
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name']
      }
    ],
    limit: 50,
    order: [['product_id', 'ASC']]
  });

  sendSuccess(res, 'Product search completed', products);
});

// Update product status
const updateProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const product = await Product.findByPk(id);
  if (!product) {
    return sendNotFound(res, 'Product not found');
  }

  const validStatuses = ['Available', 'In Use', 'Maintenance', 'Damaged', 'Disposed'];
  if (!validStatuses.includes(status)) {
    return sendError(res, 'Invalid status', 400);
  }

  const oldStatus = product.status;
  await product.update({ 
    status,
    notes: notes || product.notes
  });

  sendUpdated(res, `Product status updated from ${oldStatus} to ${status}`, {
    product_id: product.product_id,
    old_status: oldStatus,
    new_status: status
  });
});

// OPTIONAL: Breakdown functionality (jika dibutuhkan)
const createBreakdownTransaction = asyncHandler(async (req, res) => {
  const { product_id, breakdown_items, location, notes } = req.body;

  // Validate parent product
  const parentProduct = await Product.findByPk(product_id, {
    include: [{ model: Category, as: 'category' }]
  });
  
  if (!parentProduct) {
    return sendNotFound(res, 'Parent product not found');
  }

  if (parentProduct.status !== 'Available') {
    return sendError(res, 'Product must be available for breakdown', 400);
  }

  // Generate reference number
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Transaction.count({
    where: {
      transaction_type: 'breakdown',
      transaction_date: {
        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });
  const referenceNo = `BD-${today}-${(count + 1).toString().padStart(3, '0')}`;

  // Create breakdown transaction
  const transaction = await Transaction.create({
    transaction_type: 'breakdown',
    reference_no: referenceNo,
    first_person: req.user?.username || 'System',
    location: location || parentProduct.location,
    transaction_date: new Date(),
    notes: notes || `Breakdown of ${parentProduct.product_id}`,
    status: 'closed', // Auto close breakdown transactions
    created_by: req.user.id
  });

  // Update parent product status
  await parentProduct.update({ 
    status: 'Consumed',
    condition: 'Consumed'
  });

  // Create breakdown products
  const createdProducts = [];
  for (let i = 0; i < breakdown_items.length; i++) {
    const breakdownItem = breakdown_items[i];
    
    // Generate new product ID for breakdown piece
    const breakdownProductId = `${parentProduct.product_id}-${String.fromCharCode(65 + i)}`; // A, B, C, etc.
    
    const breakdownProduct = await Product.create({
      product_id: breakdownProductId,
      category_id: parentProduct.category_id,
      brand: parentProduct.brand,
      model: parentProduct.model,
      supplier_id: parentProduct.supplier_id,
      description: breakdownItem.description || `Breakdown piece ${String.fromCharCode(65 + i)} from ${parentProduct.product_id}`,
      location: location || parentProduct.location,
      status: 'Available',
      condition: breakdownItem.condition || 'Good',
      quantity: breakdownItem.quantity || 1,
      purchase_date: parentProduct.purchase_date,
      notes: breakdownItem.notes || `Created from breakdown of ${parentProduct.product_id}`
    });

    createdProducts.push(breakdownProduct);
  }

  sendCreated(res, 'Breakdown transaction completed successfully', {
    transaction_id: transaction.id,
    reference_no: referenceNo,
    parent_product: parentProduct.product_id,
    created_products: createdProducts.map(p => ({
      product_id: p.product_id,
      description: p.description,
      condition: p.condition,
      quantity: p.quantity
    }))
  });
});

const getProductBreakdownHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id);
  if (!product) {
    return sendNotFound(res, 'Product not found');
  }

  // Get breakdown transactions where this product was involved
  const breakdownHistory = await Transaction.findAll({
    where: {
      transaction_type: 'breakdown',
      [Op.or]: [
        { notes: { [Op.like]: `%${id}%` } },
        { '$items.product_id$': id },
        { '$items.product_id$': { [Op.like]: `${id}-%` } }
      ]
    },
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
    ],
    order: [['transaction_date', 'DESC']]
  });

  // Get child products (if this is a parent)
  const childProducts = await Product.findAll({
    where: {
      product_id: { [Op.like]: `${id}-%` }
    },
    include: [
      {
        model: Category,
        as: 'category'
      }
    ]
  });

  // Get parent product (if this is a child)
  const isChild = id.includes('-');
  let parentProduct = null;
  if (isChild) {
    const parentId = id.split('-')[0];
    parentProduct = await Product.findByPk(parentId);
  }

  sendSuccess(res, 'Product breakdown history retrieved', {
    product_id: id,
    breakdown_transactions: breakdownHistory,
    child_products: childProducts,
    parent_product: parentProduct,
    is_parent: childProducts.length > 0,
    is_child: isChild
  });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage, // NEW: Image upload endpoint
  deleteProductImage, // NEW: Image delete endpoint
  generateProductQRCode,
  getProductsByCategory,
  getProductsByLocation,
  getProductStats,
  searchProducts,
  updateProductStatus,
  getProductsForPrint,
  createBreakdownTransaction,
  getProductBreakdownHistory
};