  
module.exports = (sequelize, DataTypes) => {
  const PurchaseReceipt = sequelize.define('PurchaseReceipt', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      }
    },
    receipt_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'completed'
    },
    created_by: {
      type: DataTypes.STRING,
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
    tableName: 'purchase_receipts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  PurchaseReceipt.associate = (models) => {
    PurchaseReceipt.belongsTo(models.Supplier, {
      foreignKey: 'supplier_id',
      as: 'supplier'
    });
    PurchaseReceipt.hasMany(models.PurchaseReceiptItem, {
      foreignKey: 'receipt_id',
      as: 'items'
    });
  };

  return PurchaseReceipt;
};