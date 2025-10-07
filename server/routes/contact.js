const express = require('express');
const router = express.Router();

const {
  getContacts,
  getContact,
  createContact,
  deleteContact,
  markAsRead,
  updateContactStatus,
  assignContact,
  addContactNote,
  getContactStats
} = require('../controllers/contactController');

const { protect, authorize } = require('../middlewares/auth');

// Public routes
router.post('/', createContact);

// Protected routes (Admin only)
router.get('/', protect, authorize('admin'), getContacts);
router.get('/:id', protect, authorize('admin'), getContact);
router.delete('/:id', protect, authorize('admin'), deleteContact);
router.patch('/:id/read', protect, authorize('admin'), markAsRead);
router.patch('/:id/status', protect, authorize('admin'), updateContactStatus);
router.patch('/:id/assign', protect, authorize('admin'), assignContact);
router.post('/:id/notes', protect, authorize('admin'), addContactNote);
router.get('/admin/stats', protect, authorize('admin'), getContactStats);

module.exports = router;
