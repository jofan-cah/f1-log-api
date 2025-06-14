  
// Pagination utility functions

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Parse pagination parameters dari request
const parsePaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

// Generate pagination metadata
const generatePaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

// Sequelize pagination options
const getSequelizePagination = (req) => {
  const { page, limit, offset } = parsePaginationParams(req);
  
  return {
    limit,
    offset,
    page
  };
};

// Parse sorting parameters
const parseSortParams = (req, allowedFields = [], defaultSort = { field: 'created_at', direction: 'DESC' }) => {
  const sortBy = req.query.sortBy || req.query.sort_by || defaultSort.field;
  const sortDirection = (req.query.sortDirection || req.query.sort_direction || defaultSort.direction).toUpperCase();
  
  // Validate sort field
  const field = allowedFields.length > 0 && !allowedFields.includes(sortBy) 
    ? defaultSort.field 
    : sortBy;
  
  // Validate sort direction
  const direction = ['ASC', 'DESC'].includes(sortDirection) ? sortDirection : defaultSort.direction;
  
  return {
    field,
    direction,
    order: [[field, direction]]
  };
};

// Parse search parameters
const parseSearchParams = (req, searchableFields = []) => {
  const search = req.query.search || req.query.q || '';
  const searchTerm = search.trim();
  
  if (!searchTerm || searchableFields.length === 0) {
    return null;
  }

  // Generate LIKE conditions for all searchable fields
  const { Op } = require('sequelize');
  
  const searchConditions = searchableFields.map(field => ({
    [field]: {
      [Op.like]: `%${searchTerm}%`
    }
  }));

  return {
    [Op.or]: searchConditions
  };
};

// Parse filter parameters
const parseFilterParams = (req, allowedFilters = {}) => {
  const filters = {};
  
  Object.keys(allowedFilters).forEach(filterKey => {
    const value = req.query[filterKey];
    
    if (value !== undefined && value !== null && value !== '') {
      const filterConfig = allowedFilters[filterKey];
      
      if (typeof filterConfig === 'function') {
        // Custom filter function
        const result = filterConfig(value);
        if (result) {
          Object.assign(filters, result);
        }
      } else if (typeof filterConfig === 'string') {
        // Direct field mapping
        filters[filterConfig] = value;
      } else if (typeof filterConfig === 'object') {
        // Advanced filter configuration
        const { field, operator = 'eq', transform } = filterConfig;
        let filterValue = transform ? transform(value) : value;
        
        const { Op } = require('sequelize');
        
        switch (operator) {
          case 'like':
            filters[field] = { [Op.like]: `%${filterValue}%` };
            break;
          case 'in':
            filterValue = Array.isArray(filterValue) ? filterValue : filterValue.split(',');
            filters[field] = { [Op.in]: filterValue };
            break;
          case 'gte':
            filters[field] = { [Op.gte]: filterValue };
            break;
          case 'lte':
            filters[field] = { [Op.lte]: filterValue };
            break;
          case 'between':
            const [min, max] = Array.isArray(filterValue) ? filterValue : filterValue.split(',');
            filters[field] = { [Op.between]: [min, max] };
            break;
          case 'ne':
            filters[field] = { [Op.ne]: filterValue };
            break;
          default:
            filters[field] = filterValue;
        }
      }
    }
  });
  
  return filters;
};

// Date range filter helper
const parseDateRange = (req, field = 'created_at') => {
  const startDate = req.query.start_date || req.query.startDate;
  const endDate = req.query.end_date || req.query.endDate;
  
  if (!startDate && !endDate) {
    return null;
  }
  
  const { Op } = require('sequelize');
  const conditions = {};
  
  if (startDate) {
    conditions[Op.gte] = new Date(startDate);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    conditions[Op.lte] = end;
  }
  
  return { [field]: conditions };
};

// Complete pagination helper untuk Sequelize
const buildSequelizeQuery = (req, options = {}) => {
  const {
    allowedSortFields = [],
    defaultSort = { field: 'created_at', direction: 'DESC' },
    searchableFields = [],
    allowedFilters = {},
    include = [],
    attributes = null
  } = options;

  const pagination = getSequelizePagination(req);
  const sort = parseSortParams(req, allowedSortFields, defaultSort);
  const search = parseSearchParams(req, searchableFields);
  const filters = parseFilterParams(req, allowedFilters);
  const dateRange = parseDateRange(req);

  // Build where conditions
  const where = {};
  
  if (search) {
    Object.assign(where, search);
  }
  
  if (Object.keys(filters).length > 0) {
    Object.assign(where, filters);
  }
  
  if (dateRange) {
    Object.assign(where, dateRange);
  }

  const query = {
    where: Object.keys(where).length > 0 ? where : undefined,
    order: sort.order,
    limit: pagination.limit,
    offset: pagination.offset
  };

  if (include.length > 0) {
    query.include = include;
  }

  if (attributes) {
    query.attributes = attributes;
  }

  return {
    query,
    pagination: {
      page: pagination.page,
      limit: pagination.limit
    }
  };
};

// Helper untuk cursor-based pagination (untuk data besar)
const parseCursorPagination = (req) => {
  const cursor = req.query.cursor;
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || DEFAULT_LIMIT));
  const direction = (req.query.direction || 'next').toLowerCase();
  
  return {
    cursor,
    limit,
    direction,
    hasMore: false // Will be set after query
  };
};

// Generate cursor untuk next page
const generateCursor = (item, cursorField = 'id') => {
  if (!item || !item[cursorField]) {
    return null;
  }
  
  return Buffer.from(JSON.stringify({
    field: cursorField,
    value: item[cursorField],
    timestamp: new Date().toISOString()
  })).toString('base64');
};

// Parse cursor data
const parseCursor = (cursor) => {
  if (!cursor) {
    return null;
  }
  
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

module.exports = {
  parsePaginationParams,
  generatePaginationMeta,
  getSequelizePagination,
  parseSortParams,
  parseSearchParams,
  parseFilterParams,
  parseDateRange,
  buildSequelizeQuery,
  parseCursorPagination,
  generateCursor,
  parseCursor,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT
};