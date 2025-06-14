  
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    reference_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    first_person: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    second_person: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'open'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: false,
    underscored: true
  });

  Transaction.associate = (models) => {
    Transaction.hasMany(models.TransactionItem, {
      foreignKey: 'transaction_id',
      as: 'items'
    });
  };

  return Transaction;
};