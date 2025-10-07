// Helper function to generate bill number
const generateBillNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp for uniqueness
  return `INV-${year}${month}${day}-${timestamp}`;
};

const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return generateBillNumber();
    }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productDescription: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total cannot be negative']
    }
  }],
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'net_banking', 'razorpay'],
    default: 'cash'
  },
  razorpayPaymentId: {
    type: String,
    sparse: true
  },
  razorpayOrderId: {
    type: String,
    sparse: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  dueDate: {
    type: Date,
    default: function() {
      // Set due date to 30 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  paidAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
billSchema.index({ billNumber: 1 });
billSchema.index({ customer: 1 });
billSchema.index({ paymentStatus: 1 });
billSchema.index({ createdAt: -1 });
billSchema.index({ dueDate: 1 });

// Virtual for checking if bill is overdue
billSchema.virtual('isOverdue').get(function() {
  return this.paymentStatus === 'pending' && new Date() > this.dueDate;
});

// Virtual for days until due
billSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  const diffTime = this.dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Static method to find bills by customer
billSchema.statics.findByCustomer = function(customerId) {
  return this.find({ customer: customerId })
    .populate('customer', 'name email phone')
    .populate('products.product', 'name image price')
    .sort({ createdAt: -1 });
};

// Static method to find bills by status
billSchema.statics.findByStatus = function(status) {
  return this.find({ paymentStatus: status })
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find overdue bills
billSchema.statics.findOverdue = function() {
  return this.find({
    paymentStatus: 'pending',
    dueDate: { $lt: new Date() }
  })
  .populate('customer', 'name email phone')
  .populate('products.product', 'name image price')
  .sort({ dueDate: 1 });
};

// Instance method to calculate totals
billSchema.methods.calculateTotals = function() {
  this.subtotal = this.products.reduce((sum, item) => sum + item.total, 0);
  this.totalAmount = this.subtotal + this.taxAmount - this.discountAmount;
  return this;
};

// Instance method to mark as paid
billSchema.methods.markAsPaid = function(paymentId, paymentMethod = 'razorpay') {
  this.paymentStatus = 'paid';
  this.paymentMethod = paymentMethod;
  this.paidAt = new Date();

  if (paymentId) {
    this.razorpayPaymentId = paymentId;
  }

  return this.save();
};

// Instance method to mark as failed
billSchema.methods.markAsFailed = function() {
  this.paymentStatus = 'failed';
  return this.save();
};

// Pre-save middleware to generate bill number
billSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    try {
      // Generate unique bill number
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // Get count of bills created today
      const todayStart = new Date(year, date.getMonth(), date.getDate());
      const todayCount = await mongoose.model('Bill').countDocuments({
        createdAt: { $gte: todayStart }
      });

      this.billNumber = `INV-${year}${month}${day}-${String(todayCount + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }

  // Calculate totals if not already calculated
  if (this.isModified('products') || !this.subtotal) {
    this.calculateTotals();
  }

  next();
});

// Pre-save middleware to update updatedAt
billSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Post-save middleware to update product quantities
billSchema.post('save', async function(doc) {
  try {
    // Only update quantities for new bills with pending payment
    if (doc.paymentStatus === 'pending') {
      const Product = mongoose.model('Product');

      for (const item of doc.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity }
        });
      }
    }
  } catch (error) {
    console.error('Error updating product quantities:', error);
  }
});

module.exports = mongoose.model('Bill', billSchema);
