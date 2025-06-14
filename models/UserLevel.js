  
  
module.exports = (sequelize, DataTypes) => {
  const UserLevel = sequelize.define('UserLevel', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    level_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
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
    }
  }, {
    tableName: 'user_levels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  UserLevel.associate = (models) => {
    UserLevel.hasMany(models.User, {
      foreignKey: 'user_level_id',
      as: 'users'
    });
    UserLevel.hasMany(models.UserPermission, {
      foreignKey: 'user_level_id',
      as: 'permissions'
    });
  };

  return UserLevel;
};