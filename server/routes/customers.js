const express = require('express');
const router = express.Router();

const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  getCustomerStats
} = require('../controllers/customerController');

const { protect, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Customer and Admin routes
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);

// Admin only routes
router.get('/', authorize('admin'), getCustomers);
router.post('/', authorize('admin'), createCustomer);
router.delete('/:id', authorize('admin'), deleteCustomer);
router.patch('/:id/status', authorize('admin'), toggleCustomerStatus);
router.get('/admin/stats', authorize('admin'), getCustomerStats);

module.exports = router;
