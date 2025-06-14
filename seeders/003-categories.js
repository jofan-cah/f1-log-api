// seeders/01-categories-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = [
      {
        id: 1,
        name: 'Network Equipment',
        code: 'NET',
        has_stock: 1,
        min_stock: 5,
        max_stock: 50,
        current_stock: 25,
        unit: 'unit',
        reorder_point: 10,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Network infrastructure equipment'
      },
      {
        id: 2,
        name: 'Computer Hardware',
        code: 'COM',
        has_stock: 1,
        min_stock: 10,
        max_stock: 100,
        current_stock: 45,
        unit: 'unit',
        reorder_point: 15,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Desktop and laptop computers'
      },
      {
        id: 3,
        name: 'Server Equipment',
        code: 'SRV',
        has_stock: 1,
        min_stock: 2,
        max_stock: 20,
        current_stock: 8,
        unit: 'unit',
        reorder_point: 5,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Server hardware and related equipment'
      },
      {
        id: 4,
        name: 'Storage Devices',
        code: 'STG',
        has_stock: 1,
        min_stock: 20,
        max_stock: 200,
        current_stock: 150,
        unit: 'unit',
        reorder_point: 30,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Hard drives, SSDs, and storage arrays'
      },
      {
        id: 5,
        name: 'Peripherals',
        code: 'PER',
        has_stock: 1,
        min_stock: 15,
        max_stock: 150,
        current_stock: 75,
        unit: 'unit',
        reorder_point: 25,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Keyboards, mice, monitors, printers'
      },
      {
        id: 6,
        name: 'Software Licenses',
        code: 'SFT',
        has_stock: 1,
        min_stock: 10,
        max_stock: 500,
        current_stock: 250,
        unit: 'license',
        reorder_point: 50,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Software licenses and subscriptions'
      },
      {
        id: 7,
        name: 'Cables & Accessories',
        code: 'CAB',
        has_stock: 1,
        min_stock: 50,
        max_stock: 500,
        current_stock: 300,
        unit: 'meter',
        reorder_point: 100,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Network cables, power cables, accessories'
      },
      {
        id: 8,
        name: 'Security Equipment',
        code: 'SEC',
        has_stock: 1,
        min_stock: 5,
        max_stock: 30,
        current_stock: 12,
        unit: 'unit',
        reorder_point: 8,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Security cameras, access control systems'
      },
      {
        id: 9,
        name: 'Office Furniture',
        code: 'FUR',
        has_stock: 0,
        min_stock: 0,
        max_stock: 0,
        current_stock: 0,
        unit: null,
        reorder_point: 0,
        is_low_stock: 0,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Desks, chairs, cabinets - tracked individually'
      },
      {
        id: 10,
        name: 'Mobile Devices',
        code: 'MOB',
        has_stock: 1,
        min_stock: 5,
        max_stock: 50,
        current_stock: 8,
        unit: 'unit',
        reorder_point: 10,
        is_low_stock: 1,
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Smartphones, tablets, mobile accessories'
      }
    ];

    await queryInterface.bulkInsert('categories', categories, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
