  
  const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Ensure required directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Get filename without extension
const getFilenameWithoutExtension = (filename) => {
  return path.basename(filename, path.extname(filename));
};

// Generate unique filename
const generateUniqueFilename = (originalFilename, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = getFileExtension(originalFilename);
  const basename = getFilenameWithoutExtension(originalFilename);
  
  const cleanBasename = basename.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${prefix}${cleanBasename}_${timestamp}_${random}${extension}`;
};

// Validate file type
const validateFileType = (filename, allowedExtensions) => {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
};

// Validate file size
const validateFileSize = (fileSize, maxSize) => {
  return fileSize <= maxSize;
};

// Get file size in human readable format
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file MIME type dari extension
const getMimeType = (filename) => {
  const extension = getFileExtension(filename);
  
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

// Check if file is image
const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.includes(getFileExtension(filename));
};

// Check if file is document
const isDocumentFile = (filename) => {
  const documentExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
  return documentExtensions.includes(getFileExtension(filename));
};

// Generate file hash (untuk duplicate detection)
const generateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (error) => {
      reject(error);
    });
  });
};

// Copy file
const copyFile = async (sourcePath, destinationPath) => {
  return new Promise((resolve, reject) => {
    ensureDirectoryExists(path.dirname(destinationPath));
    
    const readStream = fs.createReadStream(sourcePath);
    const writeStream = fs.createWriteStream(destinationPath);
    
    readStream.pipe(writeStream);
    
    writeStream.on('finish', () => {
      resolve(destinationPath);
    });
    
    writeStream.on('error', (error) => {
      reject(error);
    });
    
    readStream.on('error', (error) => {
      reject(error);
    });
  });
};

// Move file
const moveFile = async (sourcePath, destinationPath) => {
  try {
    ensureDirectoryExists(path.dirname(destinationPath));
    
    // Try rename first (faster for same filesystem)
    try {
      fs.renameSync(sourcePath, destinationPath);
      return destinationPath;
    } catch (error) {
      // If rename fails, copy then delete
      await copyFile(sourcePath, destinationPath);
      fs.unlinkSync(sourcePath);
      return destinationPath;
    }
  } catch (error) {
    throw new Error(`Failed to move file: ${error.message}`);
  }
};

// Delete file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      resolve(false);
      return;
    }
    
    fs.unlink(filePath, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
};

// Delete multiple files
const deleteFiles = async (filePaths) => {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      const deleted = await deleteFile(filePath);
      results.push({ path: filePath, deleted, error: null });
    } catch (error) {
      results.push({ path: filePath, deleted: false, error: error.message });
    }
  }
  
  return results;
};

// Get file info
const getFileInfo = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const stats = fs.statSync(filePath);
  const filename = path.basename(filePath);
  
  return {
    filename,
    path: filePath,
    size: stats.size,
    sizeFormatted: formatFileSize(stats.size),
    extension: getFileExtension(filename),
    mimeType: getMimeType(filename),
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    created: stats.birthtime,
    modified: stats.mtime,
    accessed: stats.atime,
    isImage: isImageFile(filename),
    isDocument: isDocumentFile(filename)
  };
};

// List files in directory
const listFiles = (dirPath, options = {}) => {
  const {
    recursive = false,
    extensions = null,
    includeStats = false
  } = options;
  
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  const files = [];
  
  const scanDirectory = (currentPath) => {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory() && recursive) {
        scanDirectory(itemPath);
      } else if (stats.isFile()) {
        // Filter by extensions if specified
        if (extensions && !extensions.includes(getFileExtension(item))) {
          continue;
        }
        
        const fileInfo = {
          filename: item,
          path: itemPath,
          relativePath: path.relative(dirPath, itemPath)
        };
        
        if (includeStats) {
          Object.assign(fileInfo, {
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            extension: getFileExtension(item),
            mimeType: getMimeType(item),
            created: stats.birthtime,
            modified: stats.mtime,
            isImage: isImageFile(item),
            isDocument: isDocumentFile(item)
          });
        }
        
        files.push(fileInfo);
      }
    }
  };
  
  scanDirectory(dirPath);
  return files;
};

// Clean up old files (older than specified days)
const cleanupOldFiles = async (dirPath, daysOld = 30, options = {}) => {
  const { 
    recursive = false,
    extensions = null,
    dryRun = false 
  } = options;
  
  if (!fs.existsSync(dirPath)) {
    return { deletedCount: 0, files: [] };
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const files = listFiles(dirPath, { recursive, extensions, includeStats: true });
  const oldFiles = files.filter(file => file.created < cutoffDate);
  
  if (dryRun) {
    return {
      deletedCount: 0,
      files: oldFiles,
      wouldDelete: oldFiles.length
    };
  }
  
  const deletedFiles = [];
  
  for (const file of oldFiles) {
    try {
      await deleteFile(file.path);
      deletedFiles.push(file);
    } catch (error) {
      console.error(`Failed to delete ${file.path}:`, error.message);
    }
  }
  
  return {
    deletedCount: deletedFiles.length,
    files: deletedFiles
  };
};

// Create directory structure
const createDirectoryStructure = (basePath, structure) => {
  for (const item of structure) {
    const itemPath = path.join(basePath, item);
    ensureDirectoryExists(itemPath);
  }
};

// Get directory size
const getDirectorySize = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  let size = 0;
  const files = listFiles(dirPath, { recursive: true, includeStats: true });
  
  for (const file of files) {
    size += file.size;
  }
  
  return size;
};

// Validate file against security rules
const validateFileSecurity = (filename, fileBuffer = null) => {
  const issues = [];
  
  // Check for dangerous extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'];
  if (dangerousExtensions.includes(getFileExtension(filename))) {
    issues.push('Dangerous file extension');
  }
  
  // Check for hidden files or system files
  if (filename.startsWith('.') || filename.includes('..')) {
    issues.push('Invalid filename pattern');
  }
  
  // Check for extremely long filenames
  if (filename.length > 255) {
    issues.push('Filename too long');
  }
  
  // Check file content if buffer provided
  if (fileBuffer) {
    // Check for PHP code in images
    if (isImageFile(filename) && fileBuffer.includes('<?php')) {
      issues.push('Suspicious content detected');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

module.exports = {
  ensureDirectoryExists,
  getFileExtension,
  getFilenameWithoutExtension,
  generateUniqueFilename,
  validateFileType,
  validateFileSize,
  validateFileSecurity,
  formatFileSize,
  getMimeType,
  isImageFile,
  isDocumentFile,
  generateFileHash,
  copyFile,
  moveFile,
  deleteFile,
  deleteFiles,
  getFileInfo,
  listFiles,
  cleanupOldFiles,
  createDirectoryStructure,
  getDirectorySize
};
