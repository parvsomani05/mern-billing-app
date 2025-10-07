const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../utils/errorResponse');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;

    // Determine upload path based on file field name or route
    if (file.fieldname === 'productImage' || req.baseUrl.includes('products')) {
      uploadPath = path.join(__dirname, '../uploads/products');
    } else if (file.fieldname === 'profileImage' || req.baseUrl.includes('customers')) {
      uploadPath = path.join(__dirname, '../uploads/profiles');
    } else {
      uploadPath = path.join(__dirname, '../uploads/general');
    }

    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);

    // Sanitize filename
    const sanitizedName = basename.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}_${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.', 400), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files at once
  }
});

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ErrorResponse('One or more files are too large. Maximum size is 5MB per file.', 400));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ErrorResponse(`Too many files. Maximum ${maxCount} files allowed.`, 400));
          }
        }
        return next(err);
      }
      next();
    });
  };
};

// Middleware for mixed file upload (multiple fields)
const uploadFields = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ErrorResponse('File too large. Maximum size is 5MB.', 400));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ErrorResponse('Too many files uploaded.', 400));
          }
        }
        return next(err);
      }
      next();
    });
  };
};

// Utility function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to get file URL
const getFileUrl = (req, filename, subfolder = '') => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${subfolder}${filename}`;
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  deleteFile,
  getFileUrl,
  ensureDirectoryExists
};
