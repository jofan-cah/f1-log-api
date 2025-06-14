  
// Custom validation functions

// Validate Indonesian phone number
const validateIndonesianPhone = (phone) => {
  if (!phone) return { valid: true, message: null };
  
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check patterns
  const patterns = [
    /^08\d{8,11}$/,     // Mobile: 08xxxxxxxxx (8-11 digits total)
    /^628\d{8,11}$/,    // Mobile with country code: 628xxxxxxxxx
    /^(\+62|62)8\d{8,11}$/, // Mobile with +62 or 62
    /^021\d{7,8}$/,     // Jakarta landline
    /^0\d{2,3}\d{6,8}$/ // Other area codes
  ];
  
  const isValid = patterns.some(pattern => pattern.test(cleanPhone));
  
  return {
    valid: isValid,
    message: isValid ? null : 'Invalid Indonesian phone number format',
    formatted: formatIndonesianPhone(cleanPhone)
  };
};

// Format Indonesian phone number
const formatIndonesianPhone = (phone) => {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Convert to standard format (08xxxxxxxxx)
  if (cleanPhone.startsWith('628')) {
    return '0' + cleanPhone.substring(2);
  } else if (cleanPhone.startsWith('+628')) {
    return '0' + cleanPhone.substring(3);
  } else if (cleanPhone.startsWith('62')) {
    return '0' + cleanPhone.substring(2);
  }
  
  return cleanPhone;
};

// Validate Indonesian postal code
const validateIndonesianPostalCode = (postalCode) => {
  if (!postalCode) return { valid: true, message: null };
  
  const cleanCode = postalCode.replace(/\D/g, '');
  const isValid = /^\d{5}$/.test(cleanCode);
  
  return {
    valid: isValid,
    message: isValid ? null : 'Indonesian postal code must be 5 digits'
  };
};

// Validate product ID format
const validateProductId = (productId) => {
  if (!productId) return { valid: false, message: 'Product ID is required' };
  
  // Format: 3 letter category code + 3 digits number (e.g., RTR001, SWH002)
  const pattern = /^[A-Z]{3}\d{3}$/;
  const isValid = pattern.test(productId);
  
  return {
    valid: isValid,
    message: isValid ? null : 'Product ID must be 3 letters followed by 3 digits (e.g., RTR001)'
  };
};

// Generate next product ID
const generateNextProductId = (categoryCode, existingIds = []) => {
  if (!categoryCode || categoryCode.length !== 3) {
    throw new Error('Category code must be 3 characters');
  }
  
  const prefix = categoryCode.toUpperCase();
  
  // Find existing numbers for this category
  const existingNumbers = existingIds
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.substring(3)))
    .filter(num => !isNaN(num));
  
  // Find next available number
  let nextNumber = 1;
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++;
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
};

// Validate email dengan custom rules
const validateEmail = (email) => {
  if (!email) return { valid: true, message: null };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  // Additional checks
  if (isValid) {
    const [localPart, domain] = email.split('@');
    
    if (localPart.length > 64) {
      return { valid: false, message: 'Email local part too long' };
    }
    
    if (domain.length > 253) {
      return { valid: false, message: 'Email domain too long' };
    }
    
    // Check for common typos
    const commonDomainTypos = {
      'gmail.co': 'gmail.com',
      'gmial.com': 'gmail.com',
      'yahoo.co': 'yahoo.com',
      'yahooo.com': 'yahoo.com'
    };
    
    const suggestion = commonDomainTypos[domain.toLowerCase()];
    if (suggestion) {
      return {
        valid: true,
        message: null,
        suggestion: `${localPart}@${suggestion}`
      };
    }
  }
  
  return {
    valid: isValid,
    message: isValid ? null : 'Invalid email format'
  };
};

// Validate password strength
const validatePassword = (password, requirements = {}) => {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    forbiddenPatterns = ['password', '123456', 'qwerty']
  } = requirements;
  
  const issues = [];
  
  if (!password) {
    return { valid: false, message: 'Password is required', issues: ['required'] };
  }
  
  // Length check
  if (password.length < minLength) {
    issues.push(`minimum ${minLength} characters`);
  }
  
  if (password.length > maxLength) {
    issues.push(`maximum ${maxLength} characters`);
  }
  
  // Character requirements
  if (requireUppercase && !/[A-Z]/.test(password)) {
    issues.push('uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    issues.push('lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    issues.push('number');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('special character');
  }
  
  // Forbidden patterns
  const lowerPassword = password.toLowerCase();
  for (const pattern of forbiddenPatterns) {
    if (lowerPassword.includes(pattern.toLowerCase())) {
      issues.push(`avoid common patterns like "${pattern}"`);
      break;
    }
  }
  
  // Calculate strength score
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  if (password.length >= 16) score += 1;
  
  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  
  return {
    valid: issues.length === 0,
    message: issues.length > 0 ? `Password must contain: ${issues.join(', ')}` : null,
    issues,
    strength,
    score
  };
};

// Validate Indonesian ID number (NIK)
const validateIndonesianId = (nik) => {
  if (!nik) return { valid: true, message: null };
  
  const cleanNik = nik.replace(/\D/g, '');
  
  if (cleanNik.length !== 16) {
    return { valid: false, message: 'NIK must be 16 digits' };
  }
  
  // Basic validation (could be enhanced with actual regional codes)
  const provinceCode = cleanNik.substring(0, 2);
  const regencyCode = cleanNik.substring(2, 4);
  const districtCode = cleanNik.substring(4, 6);
  const birthDate = cleanNik.substring(6, 12);
  const serialNumber = cleanNik.substring(12, 16);
  
  // Validate date of birth (DDMMYY format)
  const dd = parseInt(birthDate.substring(0, 2));
  const mm = parseInt(birthDate.substring(2, 4));
  const yy = parseInt(birthDate.substring(4, 6));
  
  // For female, day is added by 40
  const day = dd > 40 ? dd - 40 : dd;
  const gender = dd > 40 ? 'female' : 'male';
  
  if (day < 1 || day > 31 || mm < 1 || mm > 12) {
    return { valid: false, message: 'Invalid birth date in NIK' };
  }
  
  return {
    valid: true,
    message: null,
    parsed: {
      provinceCode,
      regencyCode,
      districtCode,
      birthDate: { day, month: mm, year: yy },
      gender,
      serialNumber
    }
  };
};

// Validate coordinate (latitude, longitude)
const validateCoordinate = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  const latValid = !isNaN(latitude) && latitude >= -90 && latitude <= 90;
  const lngValid = !isNaN(longitude) && longitude >= -180 && longitude <= 180;
  
  return {
    valid: latValid && lngValid,
    message: !latValid ? 'Invalid latitude' : !lngValid ? 'Invalid longitude' : null
  };
};

// Validate Indonesian banking account number
const validateBankAccount = (accountNumber, bankCode = null) => {
  if (!accountNumber) return { valid: true, message: null };
  
  const cleanAccount = accountNumber.replace(/\D/g, '');
  
  // Basic length validation (most Indonesian banks use 10-16 digits)
  if (cleanAccount.length < 8 || cleanAccount.length > 20) {
    return { valid: false, message: 'Account number must be 8-20 digits' };
  }
  
  // Bank-specific validation could be added here
  const bankValidations = {
    'BCA': { minLength: 10, maxLength: 10 },
    'BNI': { minLength: 10, maxLength: 10 },
    'BRI': { minLength: 15, maxLength: 15 },
    'MANDIRI': { minLength: 13, maxLength: 13 }
  };
  
  if (bankCode && bankValidations[bankCode.toUpperCase()]) {
    const { minLength, maxLength } = bankValidations[bankCode.toUpperCase()];
    if (cleanAccount.length < minLength || cleanAccount.length > maxLength) {
      return { 
        valid: false, 
        message: `${bankCode} account number must be ${minLength === maxLength ? minLength : `${minLength}-${maxLength}`} digits` 
      };
    }
  }
  
  return { valid: true, message: null };
};

// Sanitize input string
const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return input;
  
  const {
    removeHtml = true,
    removeScript = true,
    trimWhitespace = true,
    maxLength = null
  } = options;
  
  let sanitized = input;
  
  // Remove HTML tags
  if (removeHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Remove script content
  if (removeScript) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  // Trim whitespace
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }
  
  // Limit length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

// Validate array of IDs
const validateIdArray = (ids, options = {}) => {
  const { 
    minLength = 0, 
    maxLength = 100, 
    allowDuplicates = false,
    validator = null 
  } = options;
  
  if (!Array.isArray(ids)) {
    return { valid: false, message: 'IDs must be an array' };
  }
  
  if (ids.length < minLength) {
    return { valid: false, message: `Minimum ${minLength} IDs required` };
  }
  
  if (ids.length > maxLength) {
    return { valid: false, message: `Maximum ${maxLength} IDs allowed` };
  }
  
  if (!allowDuplicates) {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length !== ids.length) {
      return { valid: false, message: 'Duplicate IDs not allowed' };
    }
  }
  
  if (validator) {
    for (const id of ids) {
      const validation = validator(id);
      if (!validation.valid) {
        return { valid: false, message: `Invalid ID "${id}": ${validation.message}` };
      }
    }
  }
  
  return { valid: true, message: null };
};

module.exports = {
  validateIndonesianPhone,
  formatIndonesianPhone,
  validateIndonesianPostalCode,
  validateProductId,
  generateNextProductId,
  validateEmail,
  validatePassword,
  validateIndonesianId,
  validateCoordinate,
  validateBankAccount,
  sanitizeInput,
  validateIdArray
};