const Customer = require('../models/Customer');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Admin only)
exports.getCustomers = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 10, search } = req.query;

    // Build query
    let query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCustomers = await Customer.countDocuments(query);
    const totalPages = Math.ceil(totalCustomers / parseInt(limit));

    const customers = await Customer.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: customers.length,
      totalCustomers,
      totalPages,
      currentPage: parseInt(page),
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer) {
      return next(new ErrorResponse('Customer not found', 404));
    }

    // Check if user owns the profile or is admin
    if (req.user.role !== 'admin' && customer._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Access denied', 403));
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private (Admin only)
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      role: role || 'customer'
    });

    // Remove password from response
    customer.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address, role } = req.body;

    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return next(new ErrorResponse('Customer not found', 404));
    }

    // Check if user owns the profile or is admin
    if (req.user.role !== 'admin' && customer._id.toString() !== req.user.id) {
      return next(new ErrorResponse('Access denied', 403));
    }

    // Check if email is being changed and if it already exists
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
      if (existingCustomer) {
        return next(new ErrorResponse('Email already registered', 400));
      }
    }

    const updateData = {
      name,
      email: email ? email.toLowerCase() : customer.email,
      phone,
      address,
      role
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    customer = await Customer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer (soft delete)
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return next(new ErrorResponse('Customer not found', 404));
    }

    // Prevent deleting the last admin
    if (customer.role === 'admin') {
      const adminCount = await Customer.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return next(new ErrorResponse('Cannot delete the last admin user', 400));
      }
    }

    // Soft delete
    customer.isActive = false;
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle customer status (active/inactive)
// @route   PATCH /api/customers/:id/status
// @access  Private (Admin only)
exports.toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return next(new ErrorResponse('Customer not found', 404));
    }

    // Prevent deactivating the last admin
    if (customer.role === 'admin' && customer.isActive) {
      const adminCount = await Customer.countDocuments({
        role: 'admin',
        isActive: true,
        _id: { $ne: customer._id }
      });
      if (adminCount === 0) {
        return next(new ErrorResponse('Cannot deactivate the last admin user', 400));
      }
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: customer._id,
        name: customer.name,
        isActive: customer.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private (Admin only)
exports.getCustomerStats = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const stats = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: {
              $cond: ['$isActive', 1, 0]
            }
          },
          adminUsers: {
            $sum: {
              $cond: [
                { $eq: ['$role', 'admin'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalCustomers: 0,
      activeCustomers: 0,
      adminUsers: 0
    };

    // Get role breakdown
    const roleBreakdown = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        inactiveCustomers: result.totalCustomers - result.activeCustomers,
        roleBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};
