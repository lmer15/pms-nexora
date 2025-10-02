// Simple validation middleware without external dependencies
// Provides basic validation for common data types

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property] || {};
    const result = {};
    const errors = [];

    // Validate each field in the schema
    for (const [key, fieldSchema] of Object.entries(schema)) {
      if (fieldSchema.required && (data[key] === undefined || data[key] === null || data[key] === '')) {
        errors.push({ field: key, message: 'Required field' });
        continue;
      }

      if (data[key] !== undefined && data[key] !== null) {
        const fieldResult = fieldSchema.validate(data[key]);
        if (fieldResult.error) {
          errors.push({ field: key, message: fieldResult.error.details[0].message });
        } else {
          result[key] = fieldResult.value;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors
      });
    }

    // Replace the original data with validated and sanitized data
    req[property] = { ...data, ...result };
    next();
  };
};

// Common validation schemas
const schemas = {
  task: {
    title: { 
      validate: (value) => {
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        const trimmed = value.trim();
        if (trimmed.length < 1) return { error: { details: [{ message: 'Title is required' }] } };
        if (trimmed.length > 200) return { error: { details: [{ message: 'Title must be less than 200 characters' }] } };
        return { value: trimmed };
      }, 
      required: true 
    },
    description: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: '' };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        const trimmed = value.trim();
        if (trimmed.length > 2000) return { error: { details: [{ message: 'Description must be less than 2000 characters' }] } };
        return { value: trimmed };
      } 
    },
    status: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: 'todo' };
        const validStatuses = ['todo', 'in-progress', 'review', 'done'];
        if (!validStatuses.includes(value)) return { error: { details: [{ message: 'Invalid status' }] } };
        return { value };
      } 
    },
    priority: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: 'medium' };
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(value)) return { error: { details: [{ message: 'Invalid priority' }] } };
        return { value };
      } 
    },
    assigneeId: { 
      validate: (value) => {
        if (value === undefined || value === null || value === '') return { value: null };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        return { value: value.trim() };
      } 
    },
    dueDate: { 
      validate: (value) => {
        if (value === undefined || value === null || value === '') return { value: null };
        const date = new Date(value);
        if (isNaN(date.getTime())) return { error: { details: [{ message: 'Invalid date format' }] } };
        return { value: date.toISOString() };
      } 
    },
    tags: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: [] };
        if (!Array.isArray(value)) return { error: { details: [{ message: 'Must be an array' }] } };
        const validTags = value.filter(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50);
        return { value: validTags };
      } 
    },
    progress: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: 0 };
        const num = Number(value);
        if (isNaN(num)) return { error: { details: [{ message: 'Must be a number' }] } };
        return { value: Math.max(0, Math.min(100, num)) };
      } 
    }
  },

  taskUpdate: {
    title: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        const trimmed = value.trim();
        if (trimmed.length < 1) return { error: { details: [{ message: 'Title cannot be empty' }] } };
        if (trimmed.length > 200) return { error: { details: [{ message: 'Title must be less than 200 characters' }] } };
        return { value: trimmed };
      }, 
      required: false 
    },
    description: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        const trimmed = value.trim();
        if (trimmed.length > 2000) return { error: { details: [{ message: 'Description must be less than 2000 characters' }] } };
        return { value: trimmed };
      } 
    },
    status: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        const validStatuses = ['todo', 'in-progress', 'review', 'done'];
        if (!validStatuses.includes(value)) return { error: { details: [{ message: 'Invalid status' }] } };
        return { value };
      } 
    },
    priority: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        if (!validPriorities.includes(value)) return { error: { details: [{ message: 'Invalid priority' }] } };
        return { value };
      } 
    },
    assigneeId: { 
      validate: (value) => {
        if (value === undefined || value === null || value === '') return { value: undefined };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        return { value: value.trim() };
      } 
    },
    projectId: { 
      validate: (value) => {
        if (value === undefined || value === null || value === '') return { value: undefined };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        return { value: value.trim() };
      } 
    },
    dueDate: { 
      validate: (value) => {
        if (value === undefined || value === null || value === '') return { value: undefined };
        const date = new Date(value);
        if (isNaN(date.getTime())) return { error: { details: [{ message: 'Invalid date format' }] } };
        return { value: date.toISOString() };
      } 
    },
    tags: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        if (!Array.isArray(value)) return { error: { details: [{ message: 'Must be an array' }] } };
        const validTags = value.filter(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50);
        return { value: validTags };
      } 
    },
    progress: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        const num = Number(value);
        if (isNaN(num)) return { error: { details: [{ message: 'Must be a number' }] } };
        return { value: Math.max(0, Math.min(100, num)) };
      } 
    }
  },

  pagination: {
    page: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: 1 };
        const num = Number(value);
        if (isNaN(num) || num < 1) return { value: 1 };
        return { value: Math.floor(num) };
      } 
    },
    limit: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: 50 };
        const num = Number(value);
        if (isNaN(num) || num < 1) return { value: 50 };
        return { value: Math.min(100, Math.max(1, Math.floor(num))) };
      } 
    }
  },

  projectUpdate: {
    name: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        const trimmed = value.trim();
        if (trimmed.length < 1) return { error: { details: [{ message: 'Name cannot be empty' }] } };
        if (trimmed.length > 200) return { error: { details: [{ message: 'Name must be less than 200 characters' }] } };
        return { value: trimmed };
      }, 
      required: false 
    },
    description: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        const trimmed = value.trim();
        if (trimmed.length > 2000) return { error: { details: [{ message: 'Description must be less than 2000 characters' }] } };
        return { value: trimmed };
      } 
    },
    status: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        const validStatuses = ['planning', 'in-progress', 'completed', 'on-hold', 'critical'];
        if (!validStatuses.includes(value)) return { error: { details: [{ message: 'Invalid status' }] } };
        return { value };
      } 
    },
    assignees: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: undefined };
        if (!Array.isArray(value)) return { error: { details: [{ message: 'Must be an array' }] } };
        if (value.some(id => typeof id !== 'string' || id.trim().length === 0)) {
          return { error: { details: [{ message: 'All assignee IDs must be non-empty strings' }] } };
        }
        return { value: value.map(id => id.trim()) };
      } 
    }
  },
  savedFilterView: {
    name: { 
      required: true,
      validate: (value) => {
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        const trimmed = value.trim();
        if (trimmed.length < 1) return { error: { details: [{ message: 'Name is required' }] } };
        if (trimmed.length > 50) return { error: { details: [{ message: 'Name must be less than 50 characters' }] } };
        return { value: trimmed };
      }
    },
    facilityId: { 
      required: true,
      validate: (value) => {
        if (typeof value !== 'string') return { error: { details: [{ message: 'Must be a string' }] } };
        if (value.trim().length < 1) return { error: { details: [{ message: 'Facility ID is required' }] } };
        return { value: value.trim() };
      }
    },
    filters: { 
      required: true,
      validate: (value) => {
        if (typeof value !== 'object' || value === null) {
          return { error: { details: [{ message: 'Filters must be an object' }] } };
        }
        
        const validFilterKeys = ['searchTerm', 'filter', 'assigneeFilter', 'tagFilter', 'priorityFilter'];
        const validFilterValues = {
          filter: ['all', 'todo', 'in-progress', 'review', 'done'],
          assigneeFilter: ['all'], // Will be populated with actual assignee names
          tagFilter: ['all'], // Will be populated with actual tags
          priorityFilter: ['all', 'low', 'medium', 'high', 'urgent']
        };

        for (const [key, val] of Object.entries(value)) {
          if (!validFilterKeys.includes(key)) {
            return { error: { details: [{ message: `Invalid filter key: ${key}` }] } };
          }

          if (key === 'searchTerm') {
            if (typeof val !== 'string') {
              return { error: { details: [{ message: 'searchTerm must be a string' }] } };
            }
          } else if (key !== 'searchTerm' && validFilterValues[key]) {
            if (!validFilterValues[key].includes(val)) {
              return { error: { details: [{ message: `Invalid value for ${key}: ${val}` }] } };
            }
          }
        }

        return { value };
      }
    },
    isDefault: { 
      validate: (value) => {
        if (value === undefined || value === null) return { value: false };
        if (typeof value !== 'boolean') return { error: { details: [{ message: 'Must be a boolean' }] } };
        return { value };
      }
    }
  }
};

// Specific validation middlewares
const validateTask = validate(schemas.task);
const validateTaskUpdate = validate(schemas.taskUpdate);
const validateProjectUpdate = validate(schemas.projectUpdate);
const validateSavedFilterView = validate(schemas.savedFilterView);
const validatePagination = validate(schemas.pagination, 'query');

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Rate limiting middleware (basic implementation)
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }

    // Check current IP
    const userRequests = requests.get(key) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(key, recentRequests);

    next();
  };
};

module.exports = {
  validate,
  validateTask,
  validateTaskUpdate,
  validateProjectUpdate,
  validateSavedFilterView,
  validatePagination,
  sanitizeInput,
  rateLimit,
  schemas
};