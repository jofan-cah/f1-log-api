  
const { UserPermission } = require('../models');
const { sendError } = require('../utils/response');

// Cache untuk permissions agar tidak query database terus
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get user permissions untuk module tertentu
const getUserPermissions = async (userLevelId, module) => {
  const cacheKey = `${userLevelId}-${module}`;
  const cached = permissionCache.get(cacheKey);

  // Check cache first
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.permissions;
  }

  // Query from database
  const permissions = await UserPermission.findOne({
    where: {
      user_level_id: userLevelId,
      module: module
    }
  });

  // Default permissions jika tidak ada di database
  const defaultPermissions = {
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false
  };

  const result = permissions ? {
    can_view: Boolean(permissions.can_view),
    can_add: Boolean(permissions.can_add),
    can_edit: Boolean(permissions.can_edit),
    can_delete: Boolean(permissions.can_delete)
  } : defaultPermissions;

  // Cache the result
  permissionCache.set(cacheKey, {
    permissions: result,
    timestamp: Date.now()
  });

  return result;
};

// Clear permission cache
const clearPermissionCache = (userLevelId = null, module = null) => {
  if (userLevelId && module) {
    permissionCache.delete(`${userLevelId}-${module}`);
  } else {
    permissionCache.clear();
  }
};

// Middleware untuk check permission view
const canView = (module) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    // Admin selalu bisa view semua
    if (req.user.user_level_id === 'admin') {
      return next();
    }

    try {
      const permissions = await getUserPermissions(req.user.user_level_id, module);
      
      if (!permissions.can_view) {
        return sendError(res, `No permission to view ${module}`, 403);
      }

      req.permissions = permissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
};

// Middleware untuk check permission add
const canAdd = (module) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (req.user.user_level_id === 'admin') {
      return next();
    }

    try {
      const permissions = await getUserPermissions(req.user.user_level_id, module);
      
      if (!permissions.can_add) {
        return sendError(res, `No permission to add ${module}`, 403);
      }

      req.permissions = permissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
};

// Middleware untuk check permission edit
const canEdit = (module) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (req.user.user_level_id === 'admin') {
      return next();
    }

    try {
      const permissions = await getUserPermissions(req.user.user_level_id, module);
      
      if (!permissions.can_edit) {
        return sendError(res, `No permission to edit ${module}`, 403);
      }

      req.permissions = permissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
};

// Middleware untuk check permission delete
const canDelete = (module) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (req.user.user_level_id === 'admin') {
      return next();
    }

    try {
      const permissions = await getUserPermissions(req.user.user_level_id, module);
      
      if (!permissions.can_delete) {
        return sendError(res, `No permission to delete ${module}`, 403);
      }

      req.permissions = permissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
};

// Middleware untuk check multiple permissions sekaligus
const hasPermission = (module, actions = []) => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    if (req.user.user_level_id === 'admin') {
      return next();
    }

    try {
      const permissions = await getUserPermissions(req.user.user_level_id, module);
      
      // Check semua actions yang required
      for (const action of actions) {
        const permissionKey = `can_${action}`;
        if (!permissions[permissionKey]) {
          return sendError(res, `No permission to ${action} ${module}`, 403);
        }
      }

      req.permissions = permissions;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
};

// Middleware untuk check ownership (user hanya bisa akses data milik sendiri)
const requireOwnership = (ownerField = 'created_by') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    // Admin bisa akses semua data
    if (req.user.user_level_id === 'admin') {
      return next();
    }

    // Check ownership di controller nanti
    req.requireOwnership = ownerField;
    next();
  };
};

// Helper function untuk check apakah user punya permission
const checkUserPermission = async (userLevelId, module, action) => {
  if (userLevelId === 'admin') {
    return true;
  }

  try {
    const permissions = await getUserPermissions(userLevelId, module);
    const permissionKey = `can_${action}`;
    return permissions[permissionKey] || false;
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
};

module.exports = {
  canView,
  canAdd,
  canEdit,
  canDelete,
  hasPermission,
  requireOwnership,
  getUserPermissions,
  clearPermissionCache,
  checkUserPermission
};