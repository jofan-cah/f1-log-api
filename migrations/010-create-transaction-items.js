  
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaction_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      related_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      condition_before: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      condition_after: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      breakdown_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      breakdown_unit: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'processed'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('transaction_items', ['transaction_id']);
    await queryInterface.addIndex('transaction_items', ['product_id']);
    await queryInterface.addIndex('transaction_items', ['status']);
    await queryInterface.addIndex('transaction_items', ['condition_before']);
    await queryInterface.addIndex('transaction_items', ['condition_after']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transaction_items');
  }
};