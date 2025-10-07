const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { isActive: true };

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages,
      currentPage: parseInt(page),
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin only)
exports.createProduct = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    // Handle file upload - multer middleware already processed the file
    if (req.file) {
      // File uploaded via multer middleware - use the path provided by multer
      req.body.image = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image) {
      // Image URL provided directly (for external images)
      req.body.image = req.body.image;
    } else {
      // No image provided - this should be caught by validation
      return next(new ErrorResponse('Product image is required', 400));
    }

    // Map frontend field names to backend field names
    if (req.body.stock !== undefined) {
      req.body.quantity = parseInt(req.body.stock);
      delete req.body.stock;
    }

    if (req.body.price !== undefined) {
      req.body.price = parseFloat(req.body.price);
    }

    const product = await Product.create(req.body);

    // Populate the createdBy field
    await product.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Handle file upload - multer middleware already processed the file
    if (req.file) {
      // File uploaded via multer middleware - use the path provided by multer
      req.body.image = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image) {
      // Image URL provided directly (for external images)
      req.body.image = req.body.image;
    }
    // If neither is provided, keep the existing image

    // Map frontend field names to backend field names
    if (req.body.stock !== undefined) {
      req.body.quantity = parseInt(req.body.stock);
      delete req.body.stock;
    }

    if (req.body.price !== undefined) {
      req.body.price = parseFloat(req.body.price);
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product quantity
// @route   PATCH /api/products/:id/quantity
// @access  Private (Admin only)
exports.updateQuantity = async (req, res, next) => {
  try {
    const { quantity, operation = 'set' } = req.body;

    if (quantity === undefined) {
      return next(new ErrorResponse('Quantity is required', 400));
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    let newQuantity;
    switch (operation) {
      case 'add':
        newQuantity = product.quantity + parseInt(quantity);
        break;
      case 'subtract':
        newQuantity = product.quantity - parseInt(quantity);
        if (newQuantity < 0) {
          return next(new ErrorResponse('Insufficient stock', 400));
        }
        break;
      case 'set':
      default:
        newQuantity = parseInt(quantity);
        break;
    }

    product.quantity = newQuantity;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Quantity updated successfully',
      data: {
        id: product._id,
        name: product.name,
        previousQuantity: product.quantity - (operation === 'add' ? parseInt(quantity) : 0) + (operation === 'subtract' ? parseInt(quantity) : 0),
        currentQuantity: product.quantity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const products = await Product.find({
      category: { $regex: req.params.category, $options: 'i' },
      isActive: true
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private (Admin only)
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
