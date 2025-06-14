  
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Pastikan upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    'uploads/products',
    'uploads/profiles',
    'public/qr-codes'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize upload directories
ensureUploadDirs();

// Storage configuration
const createStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join('uploads', subfolder);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const filename = `${name}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    }
  });
};

// File filter untuk images
const imageFilter = (req, file, cb) => {
  // Check if file is image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, GIF, and WebP images are allowed', 400), false);
    }
  } else {
    cb(new AppError('Only image files are allowed', 400), false);
  }
};

// File filter untuk documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF, Word, Excel, and CSV files are allowed', 400), false);
  }
};

// File size limits (in bytes)
const fileSizeLimits = {
  image: 5 * 1024 * 1024,     // 5MB for images
  document: 10 * 1024 * 1024,  // 10MB for documents
  avatar: 2 * 1024 * 1024      // 2MB for avatars
};

// Upload configurations
const uploadConfigs = {
  // Product images
  productImage: multer({
    storage: createStorage('products'),
    fileFilter: imageFilter,
    limits: {
      fileSize: fileSizeLimits.image,
      files: 5 // Maximum 5 files
    }
  }),

  // User profile images
  profileImage: multer({
    storage: createStorage('profiles'),
    fileFilter: imageFilter,
    limits: {
      fileSize: fileSizeLimits.avatar,
      files: 1 // Single file only
    }
  }),

  // Documents
  document: multer({
    storage: createStorage('documents'),
    fileFilter: documentFilter,
    limits: {
      fileSize: fileSizeLimits.document,
      files: 10
    }
  }),

  // Any file type (with restrictions)
  any: multer({
    storage: createStorage('misc'),
    limits: {
      fileSize: fileSizeLimits.document,
      files: 5
    }
  })
};

// Middleware functions
const uploadMiddleware = {
  // Single product image
  singleProductImage: uploadConfigs.productImage.single('image'),
  
  // Multiple product images
  multipleProductImages: uploadConfigs.productImage.array('images', 5),
  
  // Single profile image
  singleProfileImage: uploadConfigs.profileImage.single('avatar'),
  
  // Documents
  documents: uploadConfigs.document.array('documents', 10),
  
  // Single document
  singleDocument: uploadConfigs.document.single('document'),
  
  // Any files
  anyFiles: uploadConfigs.any.array('files', 5)
};

// Helper function untuk delete file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function untuk delete multiple files
const deleteFiles = async (filePaths) => {
  const deletePromises = filePaths.map(filePath => deleteFile(filePath));
  try {
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting files:', error);
  }
};

// Middleware untuk validate uploaded files
const validateUploadedFiles = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    // Add file info to request
    req.uploadedFiles = req.files.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    }));
  } else if (req.file) {
    req.uploadedFile = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    };
  }

  next();
};

// Error handler untuk multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${Math.round(err.field === 'avatar' ? fileSizeLimits.avatar / (1024 * 1024) : fileSizeLimits.image / (1024 * 1024))}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected file field: ${err.field}`;
        break;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }

  next(err);
};

// Clean up uploaded files on error
const cleanupOnError = (req, res, next) => {
  res.on('finish', () => {
    // If response was not successful and files were uploaded, clean them up
    if (res.statusCode >= 400) {
      const filesToDelete = [];
      
      if (req.file) {
        filesToDelete.push(req.file.path);
      }
      
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => filesToDelete.push(file.path));
      }
      
      if (filesToDelete.length > 0) {
        deleteFiles(filesToDelete).catch(console.error);
      }
    }
  });
  
  next();
};

module.exports = {
  upload: uploadMiddleware,
  validateUploadedFiles,
  handleUploadError,
  cleanupOnError,
  deleteFile,
  deleteFiles,
  fileSizeLimits
};