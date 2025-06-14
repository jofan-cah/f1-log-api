  
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_movements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      movement_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      reference_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      reference_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      before_stock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      after_stock: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      movement_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('stock_movements', ['category_id']);
    await queryInterface.addIndex('stock_movements', ['movement_type']);
    await queryInterface.addIndex('stock_movements', ['reference_type', 'reference_id']);
    await queryInterface.addIndex('stock_movements', ['movement_date']);
    await queryInterface.addIndex('stock_movements', ['created_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stock_movements');
  }
};