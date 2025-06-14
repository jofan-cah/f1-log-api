const bcrypt = require('bcryptjs');
const { User, UserLevel } = require('../models');
const { sendSuccess, sendError, sendCreated, sendUpdated, sendDeleted, sendNotFound, sendPaginated } = require('../utils/response');
const { buildSequelizeQuery } = require('../utils/pagination');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateNextProductId } = require('../utils/validator');
const { Op } = require('sequelize'); // pastikan ini di-import di atas file

// Get all users dengan pagination dan search
const getUsers = asyncHandler(async (req, res) => {
  const queryOptions = {
    allowedSortFields: ['username', 'full_name', 'email', 'user_level_id', 'department', 'is_active', 'created_at'],
    defaultSort: { field: 'created_at', direction: 'DESC' },
    searchableFields: ['username', 'full_name', 'email', 'department'],
    allowedFilters: {
      user_level_id: 'user_level_id',
      department: 'department',
      is_active: {
        field: 'is_active',
        transform: (value) => value === 'true' ? 1 : 0
      }
    },
    include: [{
      model: UserLevel,
      as: 'userLevel'
    }],
    attributes: { exclude: ['password'] }
  };

  const { query, pagination } = buildSequelizeQuery(req, queryOptions);

  const { count, rows } = await User.findAndCountAll(query);

  sendPaginated(res, rows, {
    ...pagination,
    total: count
  });
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    include: [{
      model: UserLevel,
      as: 'userLevel'
    }],
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  sendSuccess(res, 'User retrieved successfully', user);
});


// Create new user
const createUser = asyncHandler(async (req, res) => {
  const { username, password, full_name, email, phone, user_level_id, department, notes } = req.body;

  // Check if username already exists
  const existingUsername = await User.findOne({
    where: { username },
    attributes: ['id']
  });

  if (existingUsername) {
    return sendError(res, 'Username already exists', 409);
  }

  // Check if email already exists (if provided)
  if (email) {
    const existingEmail = await User.findOne({
      where: { email },
      attributes: ['id']
    });

    if (existingEmail) {
      return sendError(res, 'Email already exists', 409);
    }
  }

  // Validate user level exists
  const userLevel = await UserLevel.findByPk(user_level_id);
  if (!userLevel) {
    return sendError(res, 'Invalid user level', 400);
  }

  // Generate unique user ID dengan format USR + YYMM + 3 digit number
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().slice(-2); // 2 digit terakhir tahun
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // 2 digit bulan
  const prefix = `USR${year}${month}`; // USR2506 untuk Juni 2025

  // Get existing IDs with same prefix
  const existingIds = await User.findAll({
    where: {
      id: {
        [Op.like]: `${prefix}%`
      }
    },
    attributes: ['id'],
    raw: true
  });

  const existingIdList = existingIds.map(u => u.id);
  
  // Generate ID dengan format USR + YYMM + 3 digit number
  let userId;
  let counter = 1;
  do {
    userId = `${prefix}${counter.toString().padStart(3, '0')}`;
    counter++;
  } while (existingIdList.includes(userId));

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await User.create({
    id: userId,
    username,
    password: hashedPassword,
    full_name,
    email,
    phone,
    user_level_id,
    department,
    notes
  });

  // Get created user dengan associations
  const createdUser = await User.findByPk(user.id, {
    include: [{
      model: UserLevel,
      as: 'userLevel'
    }],
    attributes: { exclude: ['password'] }
  });

  sendCreated(res, 'User created successfully', createdUser);
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, full_name, email, phone, user_level_id, department, is_active, notes } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  // Check if new username already exists (excluding current user)
  if (username && username !== user.username) {
    const existingUsername = await User.findOne({
      where: { username },
      attributes: ['id']
    });

    if (existingUsername) {
      return sendError(res, 'Username already exists', 409);
    }
  }

  // Check if new email already exists (excluding current user)
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({
      where: { email },
      attributes: ['id']
    });

    if (existingEmail) {
      return sendError(res, 'Email already exists', 409);
    }
  }

  // Validate user level if provided
  if (user_level_id && user_level_id !== user.user_level_id) {
    const userLevel = await UserLevel.findByPk(user_level_id);
    if (!userLevel) {
      return sendError(res, 'Invalid user level', 400);
    }
  }

  // Update user
  await user.update({
    username: username || user.username,
    full_name: full_name || user.full_name,
    email,
    phone,
    user_level_id: user_level_id || user.user_level_id,
    department,
    is_active: is_active !== undefined ? is_active : user.is_active,
    notes
  });

  // Get updated user dengan associations
  const updatedUser = await User.findByPk(user.id, {
    include: [{
      model: UserLevel,
      as: 'userLevel'
    }],
    attributes: { exclude: ['password'] }
  });

  sendUpdated(res, 'User updated successfully', updatedUser);
});

// Delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  // Prevent deleting own account
  if (user.id === req.user.id) {
    return sendError(res, 'Cannot delete your own account', 400);
  }

  // Soft delete: deactivate user instead of hard delete
  await user.update({ is_active: false });

  sendDeleted(res, 'User deleted successfully');
});

// Activate/Deactivate user
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  // Prevent deactivating own account
  if (user.id === req.user.id && user.is_active) {
    return sendError(res, 'Cannot deactivate your own account', 400);
  }

  // Toggle status
  await user.update({ is_active: !user.is_active });

  const updatedUser = await User.findByPk(user.id, {
    include: [{
      model: UserLevel,
      as: 'userLevel'
    }],
    attributes: { exclude: ['password'] }
  });

  sendUpdated(res, `User ${user.is_active ? 'deactivated' : 'activated'} successfully`, updatedUser);
});

// Reset user password (by admin)
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    return sendNotFound(res, 'User not found');
  }

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await user.update({ password: hashedPassword });

  sendSuccess(res, 'Password reset successfully');
});

// Get user statistics
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await Promise.all([
    User.count(),
    User.count({ where: { is_active: true } }),
    User.count({ where: { is_active: false } }),
    User.count({ where: { user_level_id: 'admin' } }),
    User.count({ where: { user_level_id: 'manager' } }),
    User.count({ where: { user_level_id: 'technician' } }),
    User.count({ where: { user_level_id: 'warehouse' } }),
    User.count({ where: { user_level_id: 'viewer' } })
  ]);

  const userStats = {
    total: stats[0],
    active: stats[1],
    inactive: stats[2],
    byLevel: {
      admin: stats[3],
      manager: stats[4],
      technician: stats[5],
      warehouse: stats[6],
      viewer: stats[7]
    }
  };

  sendSuccess(res, 'User statistics retrieved successfully', userStats);
});

// Get users by department
const getUsersByDepartment = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: ['department', [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']],
    group: ['department'],
    where: { is_active: true },
    raw: true
  });

  const departmentStats = users.reduce((acc, user) => {
    acc[user.department || 'No Department'] = parseInt(user.count);
    return acc;
  }, {});

  sendSuccess(res, 'Users by department retrieved successfully', departmentStats);
});

// Bulk update users
const bulkUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, updates } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return sendError(res, 'User IDs array is required', 400);
  }

  if (!updates || Object.keys(updates).length === 0) {
    return sendError(res, 'Updates object is required', 400);
  }

  // Prevent updating sensitive fields in bulk
  const allowedFields = ['user_level_id', 'department', 'is_active'];
  const updateFields = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields[key] = updates[key];
    }
  });

  if (Object.keys(updateFields).length === 0) {
    return sendError(res, 'No valid fields to update', 400);
  }

  // Validate user level if provided
  if (updateFields.user_level_id) {
    const userLevel = await UserLevel.findByPk(updateFields.user_level_id);
    if (!userLevel) {
      return sendError(res, 'Invalid user level', 400);
    }
  }

  // Prevent updating own account in deactivation
  if (updateFields.is_active === false && userIds.includes(req.user.id)) {
    return sendError(res, 'Cannot deactivate your own account', 400);
  }

  // Update users
  const [updatedCount] = await User.update(updateFields, {
    where: {
      id: userIds
    }
  });

  sendSuccess(res, `${updatedCount} users updated successfully`, {
    updatedCount,
    updates: updateFields
  });
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats,
  getUsersByDepartment,
  bulkUpdateUsers
};
