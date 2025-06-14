// seeders/07-transaction-items-seeder.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transactionItems = [
      // Transaction 1 - Check out computer
      {
        id: 1,
        transaction_id: 1,
        product_id: 'COM001',
        related_item_id: null,
        condition_before: 'New',
        condition_after: 'New',
        quantity: 1,
        breakdown_quantity: null,
        breakdown_unit: null,
        notes: 'Desktop computer assigned to Marketing',
        status: 'processed'
      },
      // Transaction 2 - Check out monitor
      {
        id: 2,
        transaction_id: 2,
        product_id: 'PER002',
        related_item_id: null,
        condition_before: 'New',
        condition_after: 'New',
        quantity: 1,
        breakdown_quantity: null,
        breakdown_unit: null,
        notes: 'Monitor for workstation setup',
        status: 'processed'
      },
      // Transaction 3 - Maintenance (open)
      {
        id: 3,
        transaction_id: 3,
        product_id: 'NET001',
        related_item_id: null,
        condition_before: 'Good',
        condition_after: 'Good',
        quantity: 1,
        breakdown_quantity: null,
        breakdown_unit: null,
        notes: 'Firmware update and port cleaning',
        status: 'processed'
      },
      // Transaction 4 - Transfer keyboard
      {
        id: 4,
        transaction_id: 4,
        product_id: 'PER001',
        related_item_id: null,
        condition_before: 'New',
        condition_after: 'New',
        quantity: 1,
        breakdown_quantity: null,
        breakdown_unit: null,
        notes: 'Moved from storage to office area',
        status: 'processed'
      }
    ];

    await queryInterface.bulkInsert('transaction_items', transactionItems, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('transaction_items', null, {});
  }
};
