const express = require('express');
const router = express.Router();

const {
  getBills,
  getBill,
  createBill,
  updatePaymentStatus,
  getBillsByCustomer,
  getOverdueBills,
  getBillStats,
  generateBillPDF,
  createRazorpayOrder,
  verifyPayment,
  deleteBill,
  sendInvoiceEmail
} = require('../controllers/billController');

const { protect, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Customer and Admin routes
router.get('/', getBills);
router.get('/:id', getBill);
router.get('/customer/:customerId', getBillsByCustomer);

// Customer and Admin routes
router.get('/:id/pdf', generateBillPDF);
router.get('/:id/download-pdf', require('../controllers/billController').downloadBillPDF);
router.post('/:id/send-email', sendInvoiceEmail);
router.post('/:id/create-order', createRazorpayOrder);
router.post('/:id/verify-payment', verifyPayment);

// Customer and Admin routes
router.post('/', createBill);
router.patch('/:id/payment', authorize('admin'), updatePaymentStatus);
router.get('/admin/overdue', authorize('admin'), getOverdueBills);
router.get('/admin/stats', authorize('admin'), getBillStats);
router.delete('/:id', authorize('admin'), deleteBill);

module.exports = router;
