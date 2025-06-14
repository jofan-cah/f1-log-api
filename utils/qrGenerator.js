  
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Ensure QR codes directory exists
const qrDir = path.join(__dirname, '../public/qr-codes');
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

// Default QR code options
const defaultOptions = {
  type: 'png',
  quality: 0.92,
  margin: 1,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  width: 200,
  errorCorrectionLevel: 'M'
};

// Generate QR code data untuk product
const generateProductQRData = (product) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  
  const qrData = {
    type: 'product',
    id: product.product_id,
    name: product.brand && product.model ? `${product.brand} ${product.model}` : product.product_id,
    category: product.category ? product.category.name : '',
    serial: product.serial_number || '',
    location: product.location || '',
    status: product.status || '',
    url: `${baseUrl}/products/${product.product_id}`,
    generated_at: new Date().toISOString()
  };

  return JSON.stringify(qrData);
};

// Generate QR code data untuk transaction
const generateTransactionQRData = (transaction) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  
  const qrData = {
    type: 'transaction',
    id: transaction.id,
    reference_no: transaction.reference_no || '',
    transaction_type: transaction.transaction_type,
    location: transaction.location,
    date: transaction.transaction_date,
    url: `${baseUrl}/transactions/${transaction.id}`,
    generated_at: new Date().toISOString()
  };

  return JSON.stringify(qrData);
};

// Generate QR code data untuk location
const generateLocationQRData = (location) => {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  
  const qrData = {
    type: 'location',
    name: location.name,
    address: location.address || '',
    coordinates: location.coordinates || null,
    url: `${baseUrl}/locations/${encodeURIComponent(location.name)}`,
    generated_at: new Date().toISOString()
  };

  return JSON.stringify(qrData);
};

// Generate QR code sebagai buffer
const generateQRBuffer = async (data, options = {}) => {
  try {
    const qrOptions = { ...defaultOptions, ...options };
    const buffer = await QRCode.toBuffer(data, qrOptions);
    return buffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

// Generate QR code dan save ke file
const generateQRFile = async (data, filename, options = {}) => {
  try {
    const qrOptions = { ...defaultOptions, ...options };
    const filepath = path.join(qrDir, filename);
    
    await QRCode.toFile(filepath, data, qrOptions);
    
    return {
      filename,
      filepath,
      url: `/public/qr-codes/${filename}`,
      data
    };
  } catch (error) {
    throw new Error(`Failed to generate QR code file: ${error.message}`);
  }
};

// Generate QR code sebagai data URL (base64)
const generateQRDataURL = async (data, options = {}) => {
  try {
    const qrOptions = { ...defaultOptions, ...options };
    const dataURL = await QRCode.toDataURL(data, qrOptions);
    return dataURL;
  } catch (error) {
    throw new Error(`Failed to generate QR data URL: ${error.message}`);
  }
};

// Generate QR code untuk product dan save
const generateProductQR = async (product, options = {}) => {
  const qrData = generateProductQRData(product);
  const filename = `product-${product.product_id}-${Date.now()}.png`;
  
  const result = await generateQRFile(qrData, filename, options);
  
  return {
    ...result,
    qr_data: qrData
  };
};

// Generate QR code untuk transaction dan save
const generateTransactionQR = async (transaction, options = {}) => {
  const qrData = generateTransactionQRData(transaction);
  const filename = `transaction-${transaction.id}-${Date.now()}.png`;
  
  const result = await generateQRFile(qrData, filename, options);
  
  return {
    ...result,
    qr_data: qrData
  };
};

// Generate QR code untuk location dan save
const generateLocationQR = async (location, options = {}) => {
  const qrData = generateLocationQRData(location);
  const filename = `location-${location.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.png`;
  
  const result = await generateQRFile(qrData, filename, options);
  
  return {
    ...result,
    qr_data: qrData
  };
};

// Generate batch QR codes untuk multiple products
const generateBatchProductQR = async (products, options = {}) => {
  const results = [];
  
  for (const product of products) {
    try {
      const qrResult = await generateProductQR(product, options);
      results.push({
        product_id: product.product_id,
        success: true,
        ...qrResult
      });
    } catch (error) {
      results.push({
        product_id: product.product_id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Generate custom QR code dengan data bebas
const generateCustomQR = async (data, filename, options = {}) => {
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  }
  
  return await generateQRFile(data, filename, options);
};

// Delete QR code file
const deleteQRFile = async (filename) => {
  try {
    const filepath = path.join(qrDir, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    
    return false;
  } catch (error) {
    throw new Error(`Failed to delete QR file: ${error.message}`);
  }
};

// Get QR code file info
const getQRFileInfo = (filename) => {
  const filepath = path.join(qrDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return null;
  }
  
  const stats = fs.statSync(filepath);
  
  return {
    filename,
    filepath,
    url: `/public/qr-codes/${filename}`,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime
  };
};

// Validate QR data
const validateQRData = (qrString) => {
  try {
    const data = JSON.parse(qrString);
    
    // Check required fields
    if (!data.type || !data.generated_at) {
      return { valid: false, error: 'Missing required fields' };
    }
    
    // Validate data types
    const validTypes = ['product', 'transaction', 'location', 'custom'];
    if (!validTypes.includes(data.type)) {
      return { valid: false, error: 'Invalid QR type' };
    }
    
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: 'Invalid QR data format' };
  }
};

// Cleanup old QR files (older than specified days)
const cleanupOldQRFiles = async (daysOld = 30) => {
  try {
    const files = fs.readdirSync(qrDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filepath = path.join(qrDir, file);
      const stats = fs.statSync(filepath);
      
      if (stats.birthtime < cutoffDate) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    }
    
    return { deletedCount };
  } catch (error) {
    throw new Error(`Failed to cleanup old QR files: ${error.message}`);
  }
};

module.exports = {
  generateProductQRData,
  generateTransactionQRData,
  generateLocationQRData,
  generateQRBuffer,
  generateQRFile,
  generateQRDataURL,
  generateProductQR,
  generateTransactionQR,
  generateLocationQR,
  generateBatchProductQR,
  generateCustomQR,
  deleteQRFile,
  getQRFileInfo,
  validateQRData,
  cleanupOldQRFiles,
  defaultOptions
};