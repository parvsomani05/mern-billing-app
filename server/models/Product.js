const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Product quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  sku: {
    type: String,
    unique: true,
    sparse: true, // Only unique if not null
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Threshold cannot be negative']
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
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ sku: 1 });

// Virtual for checking if product is low on stock
productSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.lowStockThreshold;
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toFixed(2)}`;
});

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({
    category: { $regex: category, $options: 'i' },
    isActive: true
  });
};

// Static method to find low stock products
productSchema.statics.findLowStock = function() {
  return this.find({
    isActive: true,
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
  });
};

// Instance method to reduce quantity
productSchema.methods.reduceQuantity = function(amount) {
  if (amount > this.quantity) {
    throw new Error('Insufficient stock');
  }
  this.quantity -= amount;
  return this.save();
};

// Instance method to increase quantity
productSchema.methods.increaseQuantity = function(amount) {
  this.quantity += amount;
  return this.save();
};

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    // Generate SKU from product name and timestamp
    const namePart = this.name.replace(/[^A-Z0-9]/gi, '').substring(0, 3).toUpperCase();
    const timePart = Date.now().toString().slice(-4);
    this.sku = `${namePart}${timePart}`;
  }
  next();
});

// Pre-save middleware to update updatedAt
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Product', productSchema);
