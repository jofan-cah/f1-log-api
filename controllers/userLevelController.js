const { UserLevel, User, UserPermission } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

/**
 * Get all user levels with pagination and search
 */
const getUserLevels = asyncHandler(async (req, res) => {
  const { include_users = false, include_permissions = false } = req.query;

  const queryOptions = {
    allowedSortFields: ['id', 'level_name', 'created_at', 'updated_at'],
    defaultSort: { field: 'level_name', direction: 'ASC' },
    searchableFields: ['id', 'level_name', 'description'],
    allowedFilters: {
      level_name: {
        field: 'level_name',
        operator: 'like'
      }
    }
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  // Build include array
  const include = [];
  if (include_users === 'true') {
    include.push({
      model: User,
      as: 'users',
      attributes: ['id', 'username', 'full_name', 'email', 'is_active', 'department']
    });
  }
  if (include_permissions === 'true') {
    include.push({
      model: UserPermission,
      as: 'permissions'
    });
  }

  if (include.length > 0) {
    query.include = include;
  }

  const { count, rows } = await UserLevel.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

/**
 * Get user level by ID
 */
const getUserLevelById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { include_users = false, include_permissions = false } = req.query;

  // Build include array
  const include = [];
  if (include_users === 'true') {
    include.push({
      model: User,
      as: 'users',
      attributes: ['id', 'username', 'full_name', 'email', 'is_active', 'department'],
      order: [['full_name', 'ASC']]
    });
  }
  if (include_permissions === 'true') {
    include.push({
      model: UserPermission,
      as: 'permissions'
    });
  }

  const userLevel = await UserLevel.findByPk(id, { 
    include: include.length > 0 ? include : undefined 
  });

  if (!userLevel) {
    return sendNotFound(res, 'User level not found');
  }

  sendSuccess(res, 'User level retrieved successfully', userLevel);
});

/**
 * Create new user level
 */
const createUserLevel = asyncHandler(async (req, res) => {
  const { id, level_name, description } = req.body;

  // Check if user level with same ID already exists
  const existingUserLevel = await UserLevel.findByPk(id, {
    attributes: ['id']
  });

  if (existingUserLevel) {
    return sendError(res, 'User level with this ID already exists', 409);
  }

  // Check if level name already exists
  const existingLevelName = await UserLevel.findOne({
    where: { level_name },
    attributes: ['id']
  });

  if (existingLevelName) {
    return sendError(res, 'User level with this name already exists', 409);
  }

  const userLevel = await UserLevel.create({
    id,
    level_name,
    description
  });

  sendCreated(res, 'User level created successfully', userLevel);
});

/**
 * Update user level
 */
const updateUserLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { level_name, description } = req.body;

  const userLevel = await UserLevel.findByPk(id);
  if (!userLevel) {
    return sendNotFound(res, 'User level not found');
  }

  // Check if new level name already exists (excluding current record)
  if (level_name && level_name !== userLevel.level_name) {
    const existingLevelName = await UserLevel.findOne({
      where: { 
        level_name,
        id: { [Op.ne]: id }
      },
      attributes: ['id']
    });

    if (existingLevelName) {
      return sendError(res, 'User level with this name already exists', 409);
    }
  }

  await userLevel.update({
    level_name: level_name || userLevel.level_name,
    description
  });

  sendUpdated(res, 'User level updated successfully', userLevel);
});

/**
 * Delete user level
 */
const deleteUserLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userLevel = await UserLevel.findByPk(id);
  if (!userLevel) {
    return sendNotFound(res, 'User level not found');
  }

  // Check if user level is being used by any users
  const userCount = await User.count({
    where: { user_level_id: id }
  });

  if (userCount > 0) {
    return sendError(res, `Cannot delete user level. ${userCount} user(s) are assigned to this level`, 400);
  }

  await userLevel.destroy();

  sendDeleted(res, 'User level deleted successfully');
});

/**
 * Get user level statistics
 */
const getUserLevelStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    // Total user levels
    UserLevel.count(),
    // Total users across all levels
    User.count(),
    // Active users
    User.count({ where: { is_active: true } }),
    // User levels with user count
    UserLevel.findAll({
      attributes: [
        'id',
        'level_name',
        'description',
        [UserLevel.sequelize.fn('COUNT', UserLevel.sequelize.col('users.id')), 'user_count'],
        [UserLevel.sequelize.fn('SUM', UserLevel.sequelize.literal('CASE WHEN users.is_active = 1 THEN 1 ELSE 0 END')), 'active_users']
      ],
      include: [{
        model: User,
        as: 'users',
        attributes: []
      }],
      group: ['UserLevel.id'],
      order: [[UserLevel.sequelize.fn('COUNT', UserLevel.sequelize.col('users.id')), 'DESC']],
      raw: false,
      subQuery: false
    }),
    // Recent user levels
    UserLevel.findAll({
      attributes: ['id', 'level_name', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    })
  ]);

  const levelStats = {
    total: stats[0],
    totalUsers: stats[1],
    activeUsers: stats[2],
    inactiveUsers: stats[1] - stats[2],
    levelBreakdown: stats[3].map(level => ({
      id: level.id,
      level_name: level.level_name,
      description: level.description,
      total_users: parseInt(level.dataValues.user_count) || 0,
      active_users: parseInt(level.dataValues.active_users) || 0,
      inactive_users: (parseInt(level.dataValues.user_count) || 0) - (parseInt(level.dataValues.active_users) || 0)
    })),
    recentLevels: stats[4]
  };

  sendSuccess(res, 'User level statistics retrieved successfully', levelStats);
});

/**
 * Get available user levels (for dropdowns)
 */
const getAvailableUserLevels = asyncHandler(async (req, res) => {
  const userLevels = await UserLevel.findAll({
    attributes: ['id', 'level_name', 'description'],
    order: [['level_name', 'ASC']]
  });

  sendSuccess(res, 'Available user levels retrieved successfully', userLevels);
});

/**
 * Search user levels
 */
const searchUserLevels = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return sendError(res, 'Search query must be at least 2 characters', 400);
  }

  const searchTerm = q.trim();

  const userLevels = await UserLevel.findAll({
    where: {
      [Op.or]: [
        { id: { [Op.like]: `%${searchTerm}%` } },
        { level_name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } }
      ]
    },
    attributes: ['id', 'level_name', 'description'],
    limit: 20,
    order: [['level_name', 'ASC']]
  });

  sendSuccess(res, 'User level search completed', userLevels);
});

/**
 * Get user level usage details
 */
const getUserLevelUsage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userLevel = await UserLevel.findByPk(id);
  if (!userLevel) {
    return sendNotFound(res, 'User level not found');
  }

  const queryOptions = {
    allowedSortFields: ['username', 'full_name', 'email', 'department', 'is_active', 'created_at'],
    defaultSort: { field: 'full_name', direction: 'ASC' },
    searchableFields: ['username', 'full_name', 'email', 'department'],
    allowedFilters: {
      is_active: 'is_active',
      department: {
        field: 'department',
        operator: 'like'
      }
    }
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);
  
  // Add user level filter
  query.where = { 
    ...query.where,
    user_level_id: id 
  };

  query.attributes = ['id', 'username', 'full_name', 'email', 'department', 'is_active', 'created_at'];

  const { count, rows } = await User.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  }, `Users with ${userLevel.level_name} level`);
});

const updateUserLevelPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  console.log('=== UPDATE PERMISSIONS ===');
  console.log('User Level ID:', id);
  console.log('Permissions:', permissions);

  // Check if user level exists
  const userLevel = await UserLevel.findByPk(id);
  if (!userLevel) {
    return sendNotFound(res, 'User level not found');
  }

  try {
    // Start transaction
    await UserLevel.sequelize.transaction(async (transaction) => {
      // Delete existing permissions for this user level
      await UserPermission.destroy({
        where: { user_level_id: id },
        transaction
      });

      console.log('Existing permissions deleted');

      // Insert new permissions if any
      if (permissions && permissions.length > 0) {
        const permissionData = permissions.map(perm => ({
          user_level_id: id,
          module: perm.module,
          can_view: perm.can_view ? 1 : 0,
          can_add: perm.can_add ? 1 : 0,
          can_edit: perm.can_edit ? 1 : 0,
          can_delete: perm.can_delete ? 1 : 0
        }));

        console.log('Creating new permissions:', permissionData);

        await UserPermission.bulkCreate(permissionData, { transaction });
        console.log('New permissions created');
      }
    });

    // Return success with updated permissions count
    const totalPermissions = permissions.reduce((sum, p) => 
      sum + (p.can_view ? 1 : 0) + (p.can_add ? 1 : 0) + 
      (p.can_edit ? 1 : 0) + (p.can_delete ? 1 : 0), 0
    );

    sendSuccess(res, `Permissions updated successfully. ${totalPermissions} permissions set across ${permissions.length} modules.`, {
      user_level_id: id,
      modules_count: permissions.length,
      total_permissions: totalPermissions
    });

  } catch (error) {
    console.error('Error updating permissions:', error);
    return sendError(res, `Failed to update permissions: ${error.message}`, 500);
  }
});

module.exports = {
  getUserLevels,
  getUserLevelById,
  createUserLevel,
  updateUserLevel,
  deleteUserLevel,
  getUserLevelStats,
  getAvailableUserLevels,
  searchUserLevels,
  getUserLevelUsage,
  updateUserLevelPermissions
};