  
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      product_id: {
        type: Sequelize.STRING(20),
        primaryKey: true,
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
      brand: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      model: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      serial_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      origin: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      po_number: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      receipt_item_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'purchase_receipt_items',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      img_product: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'Available'
      },
      condition: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'New'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      purchase_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      purchase_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      warranty_expiry: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      last_maintenance_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      next_maintenance_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      ticketing_id: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      is_linked_to_ticketing: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      qr_data: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['supplier_id']);
    await queryInterface.addIndex('products', ['status']);
    await queryInterface.addIndex('products', ['condition']);
    await queryInterface.addIndex('products', ['location']);
    await queryInterface.addIndex('products', ['serial_number']);
    await queryInterface.addIndex('products', ['brand']);
    await queryInterface.addIndex('products', ['ticketing_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  }
};