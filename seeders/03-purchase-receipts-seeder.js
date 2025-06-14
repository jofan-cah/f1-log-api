// seeders/03-purchase-receipts-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const purchaseReceipts = [
      {
        id: 1,
        receipt_number: 'RCP-20241201-001',
        po_number: 'PO-2024-NET-001',
        supplier_id: 1,
        receipt_date: '2024-12-01',
        total_amount: 75000000.00,
        status: 'completed',
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Network equipment procurement Q4 2024'
      },
      {
        id: 2,
        receipt_number: 'RCP-20241205-002',
        po_number: 'PO-2024-COM-002',
        supplier_id: 2,
        receipt_date: '2024-12-05',
        total_amount: 125000000.00,
        status: 'completed',
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Computer hardware batch order'
      },
      {
        id: 3,
        receipt_number: 'RCP-20241210-003',
        po_number: 'PO-2024-SRV-003',
        supplier_id: 3,
        receipt_date: '2024-12-10',
        total_amount: 250000000.00,
        status: 'completed',
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Server upgrade project'
      },
      {
        id: 4,
        receipt_number: 'RCP-20241215-004',
        po_number: 'PO-2024-PER-004',
        supplier_id: 4,
        receipt_date: '2024-12-15',
        total_amount: 25000000.00,
        status: 'completed',
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
        notes: 'Office peripherals restocking'
      }
    ];

    await queryInterface.bulkInsert('purchase_receipts', purchaseReceipts, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('purchase_receipts', null, {});
  }
};
