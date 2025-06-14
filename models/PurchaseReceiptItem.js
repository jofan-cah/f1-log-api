  
module.exports = (sequelize, DataTypes) => {
  const PurchaseReceiptItem = sequelize.define('PurchaseReceiptItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    receipt_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_receipts',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    total_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    serial_numbers: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    condition: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'New'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'purchase_receipt_items',
    timestamps: false,
    underscored: true
  });

  PurchaseReceiptItem.associate = (models) => {
    PurchaseReceiptItem.belongsTo(models.PurchaseReceipt, {
      foreignKey: 'receipt_id',
      as: 'receipt'
    });
    PurchaseReceiptItem.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    PurchaseReceiptItem.hasMany(models.Product, {
      foreignKey: 'receipt_item_id',
      as: 'products'
    });
  };

  return PurchaseReceiptItem;
};