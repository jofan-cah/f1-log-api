  
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_level_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'user_levels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      can_view: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      can_add: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      can_edit: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      },
      can_delete: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: 0
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('user_permissions', ['user_level_id']);
    await queryInterface.addIndex('user_permissions', ['module']);
    await queryInterface.addIndex('user_permissions', ['user_level_id', 'module'], {
      unique: true,
      name: 'unique_user_level_module'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_permissions');
  }
};