const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateQuantity,
  getProductsByCategory,
  getLowStockProducts,
  getCategories
} = require('../controllers/productController');

const { protect, authorize } = require('../middlewares/auth');
const { uploadSingle } = require('../middlewares/upload');

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProduct);

// Protected routes (Admin only) - with file upload support
router.post('/', protect, authorize('admin'), uploadSingle('productImage'), createProduct);
router.put('/:id', protect, authorize('admin'), uploadSingle('productImage'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.patch('/:id/quantity', protect, authorize('admin'), updateQuantity);
router.get('/admin/low-stock', protect, authorize('admin'), getLowStockProducts);

module.exports = router;
