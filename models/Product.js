  
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    product_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    origin: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    receipt_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_receipt_items',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    img_product: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Available'
    },
    condition: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'New'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    purchase_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    warranty_expiry: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    last_maintenance_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    next_maintenance_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    ticketing_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_linked_to_ticketing: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    qr_data: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  Product.associate = (models) => {
    Product.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
    Product.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier'
    });
    Product.belongsTo(models.PurchaseReceiptItem, {
      foreignKey: 'receipt_item_id',
      as: 'receiptItem'
    });
    Product.hasMany(models.TransactionItem, {
      foreignKey: 'product_id',
      as: 'transactionItems'
    });
  };

  return Product;
};