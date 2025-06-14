const express = require('express');
const router = express.Router();

// Import all route modules with error handling
let authRoutes, categoryRoutes, productRoutes, stockRoutes, dashboardRoutes;
let purchaseRoutes, reportRoutes, supplierRoutes, transactionRoutes, userRoutes,userLevelRoutes;

// Load routes with individual error handling
const loadRoute = (routeName, routePath) => {
  try {
    const route = require(routePath);
    console.log(`✅ ${routeName} routes loaded successfully`);
    return route;
  } catch (error) {
    console.error(`❌ Failed to load ${routeName} routes:`, error.message);
    return null;
  }
};

// Load all routes
authRoutes = loadRoute('Auth', './auth');
categoryRoutes = loadRoute('Category', './categories');
productRoutes = loadRoute('Product', './products');
stockRoutes = loadRoute('Stock', './stocks');
dashboardRoutes = loadRoute('Dashboard', './dashboard');
purchaseRoutes = loadRoute('Purchase', './purchases');
reportRoutes = loadRoute('Report', './reports');
supplierRoutes = loadRoute('Supplier', './suppliers');
transactionRoutes = loadRoute('Transaction', './transactions');
userRoutes = loadRoute('User', './users');
userLevelRoutes = loadRoute('UserLevel', './userLevels');

// API Routes - only mount routes that loaded successfully
if (authRoutes) {
  router.use('/auth', authRoutes);
  console.log('🔗 Auth routes mounted at /api/auth');
}

if (categoryRoutes) {
  router.use('/categories', categoryRoutes);
  console.log('🔗 Category routes mounted at /api/categories');
}

if (productRoutes) {
  router.use('/products', productRoutes);
  console.log('🔗 Product routes mounted at /api/products');
}

if (stockRoutes) {
  router.use('/stocks', stockRoutes);
  console.log('🔗 Stock routes mounted at /api/stocks');
}

if (dashboardRoutes) {
  router.use('/dashboard', dashboardRoutes);
  console.log('🔗 Dashboard routes mounted at /api/dashboard');
}

if (purchaseRoutes) {
  router.use('/purchases', purchaseRoutes);
  console.log('🔗 Purchase routes mounted at /api/purchases');
}

if (reportRoutes) {
  router.use('/reports', reportRoutes);
  console.log('🔗 Report routes mounted at /api/reports');
}

if (supplierRoutes) {
  router.use('/suppliers', supplierRoutes);
  console.log('🔗 Supplier routes mounted at /api/suppliers');
}

if (transactionRoutes) {
  router.use('/transactions', transactionRoutes);
  console.log('🔗 Transaction routes mounted at /api/transactions');
}

if (userRoutes) {
  router.use('/users', userRoutes);
  console.log('🔗 User routes mounted at /api/users');
}
if (userLevelRoutes) {
  router.use('/usersLevel', userLevelRoutes);
  console.log('🔗 UserLevel routes mounted at /api/userLevel');
}

// Health check endpoint
router.get('/health', (req, res) => {
  const loadedRoutes = {
    auth: !!authRoutes,
    categories: !!categoryRoutes,
    products: !!productRoutes,
    stocks: !!stockRoutes,
    dashboard: !!dashboardRoutes,
    purchases: !!purchaseRoutes,
    reports: !!reportRoutes,
    suppliers: !!supplierRoutes,
    transactions: !!transactionRoutes,
    users: !!userRoutes,
    usersLevel: !!userLevelRoutes,
  };

  const totalLoaded = Object.values(loadedRoutes).filter(Boolean).length;
  const totalRoutes = Object.keys(loadedRoutes).length;

  res.json({
    success: true,
    message: 'ISP Inventory API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    routeStatus: {
      loaded: totalLoaded,
      total: totalRoutes,
      loadedRoutes,
      missingRoutes: Object.keys(loadedRoutes).filter(key => !loadedRoutes[key])
    }
  });
});

// API documentation endpoint
router.get('/', (req, res) => {
  const endpoints = {};

  // Only include documentation for loaded routes
  if (authRoutes) {
    endpoints.auth = {
      base: '/api/auth',
      description: 'Authentication and user profile management',
      status: '✅ Available',
      endpoints: [
        'POST /login - User login',
        'POST /logout - User logout',
        'GET /profile - Get current user profile',
        'PUT /profile - Update user profile',
        'PUT /change-password - Change password',
        'POST /refresh-token - Refresh access token',
        'GET /validate-token - Validate token',
        'GET /check-username/:username - Check username availability',
        'GET /check-email/:email - Check email availability'
      ]
    };
  } else {
    endpoints.auth = {
      base: '/api/auth',
      description: 'Authentication and user profile management',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (categoryRoutes) {
    endpoints.categories = {
      base: '/api/categories',
      description: 'Product categories and stock management',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all categories',
        'GET /with-stock - Get categories with stock tracking',
        'GET /low-stock - Get low stock categories',
        'GET /stats - Category statistics',
        'GET /:id - Get category by ID',
        'POST / - Create new category',
        'PUT /:id - Update category',
        'PUT /:id/stock - Manual stock adjustment',
        'POST /bulk-adjustment - Bulk stock adjustments',
        'DELETE /:id - Delete category'
      ]
    };
  } else {
    endpoints.categories = {
      base: '/api/categories',
      description: 'Product categories and stock management',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (productRoutes) {
    endpoints.products = {
      base: '/api/products',
      description: 'Product inventory management',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all products',
        'GET /search - Advanced product search',
        'GET /stats - Product statistics',
        'GET /category/:categoryId - Products by category',
        'GET /location/:location - Products by location',
        'GET /:id - Get product by ID',
        'POST / - Create new product',
        'PUT /:id - Update product',
        'PUT /:id/status - Update product status',
        'POST /:id/qr-code - Generate QR code',
        'DELETE /:id - Delete product'
      ]
    };
  } else {
    endpoints.products = {
      base: '/api/products',
      description: 'Product inventory management',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (stockRoutes) {
    endpoints.stocks = {
      base: '/api/stocks',
      description: 'Stock movements and inventory tracking',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all stock movements',
        'GET /summary - Stock summary by categories',
        'GET /recent - Recent stock movements',
        'GET /analytics - Stock analytics and trends',
        'GET /alerts - Low stock alerts',
        'GET /:id - Get movement by ID',
        'POST /movements - Create manual movement',
        'POST /bulk-adjustment - Bulk adjustments'
      ]
    };
  } else {
    endpoints.stocks = {
      base: '/api/stocks',
      description: 'Stock movements and inventory tracking',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (dashboardRoutes) {
    endpoints.dashboard = {
      base: '/api/dashboard',
      description: 'Dashboard data and analytics',
      status: '✅ Available',
      endpoints: [
        'GET /overview - Main dashboard overview',
        'GET /stock-status - Stock status details',
        'GET /analytics - Analytics for charts',
        'GET /alerts - System alerts',
        'GET /quick-stats - Quick statistics'
      ]
    };
  } else {
    endpoints.dashboard = {
      base: '/api/dashboard',
      description: 'Dashboard data and analytics',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (purchaseRoutes) {
    endpoints.purchases = {
      base: '/api/purchases',
      description: 'Purchase receipts and procurement',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all purchase receipts',
        'GET /stats - Purchase statistics',
        'GET /:id - Get receipt by ID',
        'POST / - Create new receipt',
        'PUT /:id - Update receipt',
        'POST /:id/items - Add item to receipt',
        'DELETE /:id/items/:itemId - Remove item',
        'DELETE /:id - Delete receipt'
      ]
    };
  } else {
    endpoints.purchases = {
      base: '/api/purchases',
      description: 'Purchase receipts and procurement',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (reportRoutes) {
    endpoints.reports = {
      base: '/api/reports',
      description: 'Various business reports',
      status: '✅ Available',
      endpoints: [
        'GET /stock - Stock reports (summary/detailed)',
        'GET /transactions - Transaction reports',
        'GET /financial - Financial reports',
        'GET /asset-utilization - Asset utilization',
        'GET /maintenance - Maintenance reports',
        'POST /custom - Custom report builder'
      ]
    };
  } else {
    endpoints.reports = {
      base: '/api/reports',
      description: 'Various business reports',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (supplierRoutes) {
    endpoints.suppliers = {
      base: '/api/suppliers',
      description: 'Supplier management',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all suppliers',
        'GET /search - Search suppliers',
        'GET /stats - Supplier statistics',
        'GET /:id - Get supplier by ID',
        'GET /:id/purchases - Purchase history',
        'GET /:id/products - Supplier products',
        'GET /:id/performance - Performance metrics',
        'POST / - Create new supplier',
        'PUT /:id - Update supplier',
        'DELETE /:id - Delete supplier'
      ]
    };
  } else {
    endpoints.suppliers = {
      base: '/api/suppliers',
      description: 'Supplier management',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (transactionRoutes) {
    endpoints.transactions = {
      base: '/api/transactions',
      description: 'Asset transactions (check-in/out, transfers)',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all transactions',
        'GET /stats - Transaction statistics',
        'GET /:id - Get transaction by ID',
        'POST / - Create new transaction',
        'PUT /:id - Update transaction',
        'PUT /:id/close - Close transaction',
        'POST /:id/qr-code - Generate QR code',
        'POST /:id/items - Add item',
        'DELETE /:id/items/:itemId - Remove item',
        'DELETE /:id - Delete transaction'
      ]
    };
  } else {
    endpoints.transactions = {
      base: '/api/transactions',
      description: 'Asset transactions (check-in/out, transfers)',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (userRoutes) {
    endpoints.users = {
      base: '/api/users',
      description: 'User management and administration',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all users',
        'GET /stats - User statistics',
        'GET /departments - Users by department',
        'GET /:id - Get user by ID',
        'POST / - Create new user',
        'PUT /:id - Update user',
        'PUT /:id/toggle-status - Activate/deactivate',
        'PUT /:id/reset-password - Reset password',
        'PUT /bulk-update - Bulk update users',
        'DELETE /:id - Delete user'
      ]
    };
  } else {
    endpoints.users = {
      base: '/api/users',
      description: 'User management and administration',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  if (userLevelRoutes) {
    endpoints.users = {
      base: '/api/usersLevel',
      description: 'User management and administration',
      status: '✅ Available',
      endpoints: [
        'GET / - Get all users',
        'GET /stats - User statistics',
        'GET /departments - Users by department',
        'GET /:id - Get user by ID',
        'POST / - Create new user',
        'PUT /:id - Update user',
        'PUT /:id/toggle-status - Activate/deactivate',
        'PUT /:id/reset-password - Reset password',
        'PUT /bulk-update - Bulk update users',
        'DELETE /:id - Delete user'
      ]
    };
  } else {
    endpoints.users = {
      base: '/api/userLevel',
      description: 'User management and administration',
      status: '❌ Not Available',
      error: 'Route file not found or has errors'
    };
  }

  const loadedCount = Object.values(endpoints).filter(endpoint => endpoint.status.includes('✅')).length;
  const totalCount = Object.keys(endpoints).length;

  res.json({
    success: true,
    message: 'ISP Inventory Management API',
    version: '1.0.0',
    status: `${loadedCount}/${totalCount} route modules loaded`,
    endpoints,
    authentication: 'Bearer token required for protected endpoints',
    permissions: 'Role-based access control with module-level permissions',
    note: 'Check console logs for specific route loading errors'
  });
});

// Catch-all for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableEndpoints: '/api/ for documentation'
  });
});

// console.log('📋 Routes index loaded with error handling');

module.exports = router;