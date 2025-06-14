  
module.exports = (sequelize, DataTypes) => {
  const UserPermission = sequelize.define('UserPermission', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user_level_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'user_levels',
        key: 'id'
      }
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    can_view: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    can_add: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    can_edit: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    },
    can_delete: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'user_permissions',
    timestamps: false,
    underscored: true
  });

  UserPermission.associate = (models) => {
    UserPermission.belongsTo(models.UserLevel, {
      foreignKey: 'user_level_id',
      as: 'userLevel'
    });
  };

  return UserPermission;
};