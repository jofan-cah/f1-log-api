  
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('purchase_receipts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      receipt_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      po_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      receipt_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'completed'
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('purchase_receipts', ['receipt_number']);
    await queryInterface.addIndex('purchase_receipts', ['po_number']);
    await queryInterface.addIndex('purchase_receipts', ['supplier_id']);
    await queryInterface.addIndex('purchase_receipts', ['status']);
    await queryInterface.addIndex('purchase_receipts', ['receipt_date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('purchase_receipts');
  }
};