// seeders/04-purchase-receipt-items-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const purchaseReceiptItems = [
      // Receipt 1 - Network Equipment
      {
        id: 1,
        receipt_id: 1,
        category_id: 1,
        quantity: 5,
        unit_price: 15000000.00,
        total_price: 75000000.00,
        serial_numbers: 'FCW2140L0AB,FCW2140L0AC,FCW2140L0AD,FCW2140L0AE,FCW2140L0AF',
        condition: 'New',
        notes: 'Cisco 2960X-24TS-L Switches'
      },
      // Receipt 2 - Computer Hardware
      {
        id: 2,
        receipt_id: 2,
        category_id: 2,
        quantity: 10,
        unit_price: 12500000.00,
        total_price: 125000000.00,
        serial_numbers: 'DL001,DL002,DL003,DL004,DL005,DL006,DL007,DL008,DL009,DL010',
        condition: 'New',
        notes: 'Dell OptiPlex 7090 Desktop Computers'
      },
      // Receipt 3 - Server Equipment
      {
        id: 3,
        receipt_id: 3,
        category_id: 3,
        quantity: 2,
        unit_price: 125000000.00,
        total_price: 250000000.00,
        serial_numbers: 'SVR001,SVR002',
        condition: 'New',
        notes: 'Dell PowerEdge R750 Servers'
      },
      // Receipt 4 - Peripherals
      {
        id: 4,
        receipt_id: 4,
        category_id: 5,
        quantity: 20,
        unit_price: 500000.00,
        total_price: 10000000.00,
        serial_numbers: null,
        condition: 'New',
        notes: 'Logitech MX Keys Keyboards'
      },
      {
        id: 5,
        receipt_id: 4,
        category_id: 5,
        quantity: 20,
        unit_price: 300000.00,
        total_price: 6000000.00,
        serial_numbers: null,
        condition: 'New',
        notes: 'Logitech MX Master 3 Mice'
      },
      {
        id: 6,
        receipt_id: 4,
        category_id: 5,
        quantity: 10,
        unit_price: 900000.00,
        total_price: 9000000.00,
        serial_numbers: 'MON001,MON002,MON003,MON004,MON005,MON006,MON007,MON008,MON009,MON010',
        condition: 'New',
        notes: '24" LED Monitors'
      }
    ];

    await queryInterface.bulkInsert('purchase_receipt_items', purchaseReceiptItems, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('purchase_receipt_items', null, {});
  }
};