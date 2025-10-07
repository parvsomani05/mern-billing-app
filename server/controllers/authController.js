const Customer = require('../models/Customer');
const { generateToken, setTokenCookie } = require('../middlewares/auth');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Register customer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Create customer
    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address
    });

    // Generate token
    const token = generateToken(customer._id);

    // Set token in cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login customer
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for email and password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    // Check for customer (include password in query)
    const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password');

    if (!customer) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await customer.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if account is active
    if (!customer.isActive) {
      return next(new ErrorResponse('Account has been deactivated', 401));
    }

    // Generate token
    const token = generateToken(customer._id);

    // Set token in cookie
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        role: customer.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const customer = await Customer.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id).select('+password');

    // Check current password
    if (!(await customer.comparePassword(req.body.currentPassword))) {
      return next(new ErrorResponse('Current password is incorrect', 400));
    }

    customer.password = req.body.newPassword;
    await customer.save();

    const token = generateToken(customer._id);
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Forgot password (placeholder for future implementation)
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = (req, res, next) => {
  // This would typically send an email with reset token
  // For now, just return a message
  res.status(200).json({
    success: true,
    message: 'Password reset functionality will be implemented soon'
  });
};
