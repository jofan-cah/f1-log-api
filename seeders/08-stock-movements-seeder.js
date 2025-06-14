
// seeders/08-stock-movements-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const stockMovements = [
      // Purchase Receipt 1 - Network Equipment
      {
        id: 1,
        category_id: 1,
        movement_type: 'in',
        quantity: 5,
        reference_type: 'purchase_receipt',
        reference_id: 1,
        before_stock: 20,
        after_stock: 25,
        movement_date: '2024-12-01 10:00:00',
        created_by: 'admin',
        notes: 'Purchase receipt: RCP-20241201-001'
      },
      // Purchase Receipt 2 - Computer Hardware
      {
        id: 2,
        category_id: 2,
        movement_type: 'in',
        quantity: 10,
        reference_type: 'purchase_receipt',
        reference_id: 2,
        before_stock: 35,
        after_stock: 45,
        movement_date: '2024-12-05 11:00:00',
        created_by: 'admin',
        notes: 'Purchase receipt: RCP-20241205-002'
      },
      // Purchase Receipt 3 - Server Equipment
      {
        id: 3,
        category_id: 3,
        movement_type: 'in',
        quantity: 2,
        reference_type: 'purchase_receipt',
        reference_id: 3,
        before_stock: 6,
        after_stock: 8,
        movement_date: '2024-12-10 09:30:00',
        created_by: 'admin',
        notes: 'Purchase receipt: RCP-20241210-003'
      },
      // Purchase Receipt 4 - Peripherals (Keyboards)
      {
        id: 4,
        category_id: 5,
        movement_type: 'in',
        quantity: 20,
        reference_type: 'purchase_receipt',
        reference_id: 4,
        before_stock: 55,
        after_stock: 75,
        movement_date: '2024-12-15 10:15:00',
        created_by: 'admin',
        notes: 'Purchase receipt: RCP-20241215-004 - Keyboards'
      },
      // Purchase Receipt 4 - Peripherals (Mice)
      {
        id: 5,
        category_id: 5,
        movement_type: 'in',
        quantity: 20,
        reference_type: 'purchase_receipt',
        reference_id: 4,
        before_stock: 75,
        after_stock: 95,
        movement_date: '2024-12-15 10:20:00',
        created_by: 'admin',
        notes: 'Purchase receipt: RCP-20241215-004 - Mice'
      },
      // Purchase Receipt 4 - Peripherals (Monitors)
      {
        id: 6,
        category_id: 5,
        movement_type: 'in',
        quantity: 10,
        reference_type: 'purchase_receipt',
        reference_id: 4,
        before_stock: 95,
        after_stock: 105,
        movement_date: '2024-12-15 10:25:00',
        created_by: 'admin',
        notes: 'Purchase receipt: RCP-20241215-004 - Monitors'
      },
      // Manual adjustment - Storage audit
      {
        id: 7,
        category_id: 4,
        movement_type: 'adjustment',
        quantity: 10,
        reference_type: 'manual',
        reference_id: null,
        before_stock: 140,
        after_stock: 150,
        movement_date: '2024-11-30 14:00:00',
        created_by: 'warehouse_admin',
        notes: 'Stock audit adjustment - found additional SSDs'
      },
      // Manual stock out - Cables used for installation
      {
        id: 8,
        category_id: 7,
        movement_type: 'out',
        quantity: 50,
        reference_type: 'manual',
        reference_id: null,
        before_stock: 350,
        after_stock: 300,
        movement_date: '2024-12-08 16:00:00',
        created_by: 'technician',
        notes: 'Cables used for office network installation'
      },
      // Low stock movement - Mobile devices
      {
        id: 9,
        category_id: 10,
        movement_type: 'out',
        quantity: 2,
        reference_type: 'manual',
        reference_id: null,
        before_stock: 10,
        after_stock: 8,
        movement_date: '2024-12-12 13:30:00',
        created_by: 'admin',
        notes: 'Tablets deployed to field team'
      },
      // Bulk adjustment - Software licenses renewal
      {
        id: 10,
        category_id: 6,
        movement_type: 'in',
        quantity: 100,
        reference_type: 'bulk_adjustment',
        reference_id: null,
        before_stock: 150,
        after_stock: 250,
        movement_date: '2024-12-01 09:00:00',
        created_by: 'license_admin',
        notes: 'Annual software license renewal batch'
      }
    ];

    await queryInterface.bulkInsert('stock_movements', stockMovements, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('stock_movements', null, {});
  }
};