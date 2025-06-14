  module.exports = (sequelize, DataTypes) => {
  const StockMovement = sequelize.define('StockMovement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    movement_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reference_type: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    before_stock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    after_stock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    movement_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'stock_movements',
    timestamps: false,
    underscored: true
  });

  StockMovement.associate = (models) => {
    StockMovement.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });
  };

  return StockMovement;
};
