'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_levels', [
      {
        id: 'admin',
        level_name: 'Administrator',
        description: 'Full system access with all permissions. Can manage users, system settings, and all modules.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'manager',
        level_name: 'Manager',
        description: 'Management level access with view and edit permissions for most modules. Can approve transactions and generate reports.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'technician',
        level_name: 'Technician',
        description: 'Field technician with access to equipment management, transactions, and basic inventory operations.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'warehouse',
        level_name: 'Warehouse Staff',
        description: 'Warehouse operations staff with access to inventory management, stock movements, and receiving.',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'viewer',
        level_name: 'Viewer',
        description: 'Read-only access to view inventory, reports, and basic system information.',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_levels', {
      id: ['admin', 'manager', 'technician', 'warehouse', 'viewer']
    }, {});
  }
};