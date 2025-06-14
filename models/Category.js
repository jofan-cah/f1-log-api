  
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true
    },
    has_stock: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    min_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    max_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    current_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    reorder_point: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_low_stock: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
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
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  Category.associate = (models) => {
    Category.hasMany(models.Product, {
      foreignKey: 'category_id',
      as: 'products'
    });
    Category.hasMany(models.PurchaseReceiptItem, {
      foreignKey: 'category_id',
      as: 'purchaseItems'
    });
    Category.hasMany(models.StockMovement, {
      foreignKey: 'category_id',
      as: 'stockMovements'
    });
  };

  return Category;
};