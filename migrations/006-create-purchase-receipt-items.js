  
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_receipt_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      receipt_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'purchase_receipts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      total_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      serial_numbers: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      condition: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'New'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('purchase_receipt_items', ['receipt_id']);
    await queryInterface.addIndex('purchase_receipt_items', ['category_id']);
    await queryInterface.addIndex('purchase_receipt_items', ['condition']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('purchase_receipt_items');
  }
};