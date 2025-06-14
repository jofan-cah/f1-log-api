// seeders/09-user-permissions-seeder.js (CORRECTED VERSION)
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userPermissions = [
      // Admin - Full Access (semua permission)
      { id: 1, user_level_id: 'admin', module: 'dashboard', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 2, user_level_id: 'admin', module: 'products', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 3, user_level_id: 'admin', module: 'categories', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 4, user_level_id: 'admin', module: 'suppliers', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 5, user_level_id: 'admin', module: 'purchases', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 6, user_level_id: 'admin', module: 'transactions', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 7, user_level_id: 'admin', module: 'stock', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 8, user_level_id: 'admin', module: 'reports', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 9, user_level_id: 'admin', module: 'users', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },
      { id: 10, user_level_id: 'admin', module: 'settings', can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 },

      // Manager - Management Access (kebanyakan bisa, kecuali delete sensitif)
      { id: 11, user_level_id: 'manager', module: 'dashboard', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 12, user_level_id: 'manager', module: 'products', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 13, user_level_id: 'manager', module: 'categories', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 14, user_level_id: 'manager', module: 'suppliers', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 15, user_level_id: 'manager', module: 'purchases', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 16, user_level_id: 'manager', module: 'transactions', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 17, user_level_id: 'manager', module: 'stock', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 18, user_level_id: 'manager', module: 'reports', can_view: 1, can_add: 1, can_edit: 0, can_delete: 0 },
      { id: 19, user_level_id: 'manager', module: 'users', can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 },
      { id: 20, user_level_id: 'manager', module: 'settings', can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 },

      // Technician - Field Operations Access (fokus ke products, transactions, maintenance)
      { id: 21, user_level_id: 'technician', module: 'dashboard', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 22, user_level_id: 'technician', module: 'products', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 23, user_level_id: 'technician', module: 'categories', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 24, user_level_id: 'technician', module: 'suppliers', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 25, user_level_id: 'technician', module: 'purchases', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 26, user_level_id: 'technician', module: 'transactions', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 27, user_level_id: 'technician', module: 'stock', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 28, user_level_id: 'technician', module: 'reports', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 29, user_level_id: 'technician', module: 'users', can_view: 0, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 30, user_level_id: 'technician', module: 'settings', can_view: 0, can_add: 0, can_edit: 0, can_delete: 0 },

      // Warehouse - Inventory Management Access (fokus ke stock, purchases, products)
      { id: 31, user_level_id: 'warehouse', module: 'dashboard', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 32, user_level_id: 'warehouse', module: 'products', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 33, user_level_id: 'warehouse', module: 'categories', can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 },
      { id: 34, user_level_id: 'warehouse', module: 'suppliers', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 35, user_level_id: 'warehouse', module: 'purchases', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 36, user_level_id: 'warehouse', module: 'transactions', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 37, user_level_id: 'warehouse', module: 'stock', can_view: 1, can_add: 1, can_edit: 1, can_delete: 0 },
      { id: 38, user_level_id: 'warehouse', module: 'reports', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 39, user_level_id: 'warehouse', module: 'users', can_view: 0, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 40, user_level_id: 'warehouse', module: 'settings', can_view: 0, can_add: 0, can_edit: 0, can_delete: 0 },

      // Viewer - Read Only Access (semua view, tidak ada add/edit/delete)
      { id: 41, user_level_id: 'viewer', module: 'dashboard', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 42, user_level_id: 'viewer', module: 'products', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 43, user_level_id: 'viewer', module: 'categories', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 44, user_level_id: 'viewer', module: 'suppliers', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 45, user_level_id: 'viewer', module: 'purchases', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 46, user_level_id: 'viewer', module: 'transactions', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 47, user_level_id: 'viewer', module: 'stock', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 48, user_level_id: 'viewer', module: 'reports', can_view: 1, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 49, user_level_id: 'viewer', module: 'users', can_view: 0, can_add: 0, can_edit: 0, can_delete: 0 },
      { id: 50, user_level_id: 'viewer', module: 'settings', can_view: 0, can_add: 0, can_edit: 0, can_delete: 0 }
    ];

    await queryInterface.bulkInsert('user_permissions', userPermissions, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('user_permissions', null, {});
  }
};