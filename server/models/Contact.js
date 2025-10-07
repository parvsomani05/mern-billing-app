const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  notes: [{
    content: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
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
contactSchema.index({ status: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ email: 1 });

// Virtual for checking if contact is resolved
contactSchema.virtual('isResolved').get(function() {
  return ['resolved', 'closed'].includes(this.status);
});

// Virtual for response time in hours
contactSchema.virtual('responseTimeHours').get(function() {
  if (!this.resolvedAt) return null;

  const diffTime = this.resolvedAt - this.createdAt;
  const diffHours = diffTime / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
});

// Static method to find contacts by status
contactSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('assignedTo', 'name email')
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find unresolved contacts
contactSchema.statics.findUnresolved = function() {
  return this.find({
    status: { $in: ['new', 'in_progress'] }
  })
  .populate('assignedTo', 'name email')
  .sort({ priority: 1, createdAt: 1 });
};

// Static method to find contacts by priority
contactSchema.statics.findByPriority = function(priority) {
  return this.find({ priority })
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
};

// Instance method to mark as resolved
contactSchema.methods.markAsResolved = function(resolvedBy) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  return this.save();
};

// Instance method to add note
contactSchema.methods.addNote = function(content, createdBy) {
  this.notes.push({
    content,
    createdBy
  });
  return this.save();
};

// Instance method to assign to user
contactSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  this.status = 'in_progress';
  return this.save();
};

// Pre-save middleware to update updatedAt
contactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Contact', contactSchema);
