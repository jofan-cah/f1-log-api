'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Import bcrypt inside the function
    const bcrypt = require('bcrypt');
    
    // Hash passwords
    const hashedPasswords = {
      admin: await bcrypt.hash('admin123', 10),
      manager: await bcrypt.hash('manager123', 10),
      technician: await bcrypt.hash('tech123', 10),
      warehouse: await bcrypt.hash('warehouse123', 10),
      viewer: await bcrypt.hash('viewer123', 10)
    };

    await queryInterface.bulkInsert('users', [
      {
        id: 'USR001',
        username: 'admin',
        password: hashedPasswords.admin,
        full_name: 'System Administrator',
        email: 'admin@company.com',
        phone: '081234567890',
        user_level_id: 'admin',
        department: 'IT Department',
        is_active: 1,
        notes: 'System administrator with full access',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR002',
        username: 'manager01',
        password: hashedPasswords.manager,
        full_name: 'John Manager',
        email: 'john.manager@company.com',
        phone: '081234567891',
        user_level_id: 'manager',
        department: 'Operations',
        is_active: 1,
        notes: 'Operations manager',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR003',
        username: 'tech01',
        password: hashedPasswords.technician,
        full_name: 'Alice Technician',
        email: 'alice.tech@company.com',
        phone: '081234567892',
        user_level_id: 'technician',
        department: 'Field Operations',
        is_active: 1,
        notes: 'Senior field technician',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR004',
        username: 'tech02',
        password: hashedPasswords.technician,
        full_name: 'Bob Technician',
        email: 'bob.tech@company.com',
        phone: '081234567893',
        user_level_id: 'technician',
        department: 'Field Operations',
        is_active: 1,
        notes: 'Junior field technician',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR005',
        username: 'warehouse01',
        password: hashedPasswords.warehouse,
        full_name: 'Charlie Warehouse',
        email: 'charlie.warehouse@company.com',
        phone: '081234567894',
        user_level_id: 'warehouse',
        department: 'Warehouse',
        is_active: 1,
        notes: 'Warehouse supervisor',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR006',
        username: 'warehouse02',
        password: hashedPasswords.warehouse,
        full_name: 'Diana Warehouse',
        email: 'diana.warehouse@company.com',
        phone: '081234567895',
        user_level_id: 'warehouse',
        department: 'Warehouse',
        is_active: 1,
        notes: 'Warehouse staff',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR007',
        username: 'viewer01',
        password: hashedPasswords.viewer,
        full_name: 'Eva Viewer',
        email: 'eva.viewer@company.com',
        phone: '081234567896',
        user_level_id: 'viewer',
        department: 'Finance',
        is_active: 1,
        notes: 'Finance staff with view access',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR008',
        username: 'manager02',
        password: hashedPasswords.manager,
        full_name: 'Frank Manager',
        email: 'frank.manager@company.com',
        phone: '081234567897',
        user_level_id: 'manager',
        department: 'Procurement',
        is_active: 1,
        notes: 'Procurement manager',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR009',
        username: 'tech03',
        password: hashedPasswords.technician,
        full_name: 'Grace Technician',
        email: 'grace.tech@company.com',
        phone: '081234567898',
        user_level_id: 'technician',
        department: 'Maintenance',
        is_active: 0,
        notes: 'Maintenance technician - currently inactive',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'USR010',
        username: 'viewer02',
        password: hashedPasswords.viewer,
        full_name: 'Henry Viewer',
        email: 'henry.viewer@company.com',
        phone: '081234567899',
        user_level_id: 'viewer',
        department: 'HR',
        is_active: 1,
        notes: 'HR staff with view access',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      id: ['USR001', 'USR002', 'USR003', 'USR004', 'USR005', 'USR006', 'USR007', 'USR008', 'USR009', 'USR010']
    }, {});
  }
};