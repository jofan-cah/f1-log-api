  
module.exports = (sequelize, DataTypes) => {
  const TransactionItem = sequelize.define('TransactionItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'products',
        key: 'product_id'
      }
    },
    related_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    condition_before: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    condition_after: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    breakdown_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    breakdown_unit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'processed'
    }
  }, {
    tableName: 'transaction_items',
    timestamps: false,
    underscored: true
  });

  TransactionItem.associate = (models) => {
    TransactionItem.belongsTo(models.Transaction, {
      foreignKey: 'transaction_id',
      as: 'transaction'
    });
    TransactionItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return TransactionItem;
};