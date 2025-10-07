const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const ErrorResponse = require('../utils/errorResponse');
const PDFGenerator = require('../utils/pdfGenerator');
const EmailService = require('../utils/emailService');
const fs = require('fs');
const path = require('path');

// @desc    Get all bills
// @route   GET /api/bills
// @access  Private
exports.getBills = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, customerId } = req.query;

    // Build query
    let query = {};

    // Admin can see all bills, customers can only see their own
    if (req.user.role !== 'admin') {
      // Customers can see bills where they are either the customer OR the creator
      query.$or = [
        { customer: req.user._id.toString() },
        { createdBy: req.user._id.toString() }
      ];
    } else if (customerId) {
      query.customer = customerId;
    }

    if (status) {
      query.paymentStatus = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalBills = await Bill.countDocuments(query);
    const totalPages = Math.ceil(totalBills / parseInt(limit));

    const bills = await Bill.find(query)
      .populate('customer', 'name email phone')
      .populate('products.product', 'name image price')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: bills.length,
      totalBills,
      totalPages,
      currentPage: parseInt(page),
      data: bills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate and download PDF for bill
// @route   GET /api/bills/:id/pdf
// @access  Private
exports.generateBillPDF = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('products.product', 'name description image')
      .populate('createdBy', 'name email');

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Check if user owns the bill or is admin
    // Customers can see bills where they are either the customer OR the creator
    if (req.user.role !== 'admin') {
      const isCustomer = bill.customer && bill.customer._id.toString() === req.user._id.toString();
      const isCreator = bill.createdBy && bill.createdBy._id.toString() === req.user._id.toString();

      if (!isCustomer && !isCreator) {
        return next(new ErrorResponse('Access denied', 403));
      }
    }

    // Generate PDF
    const pdfData = await PDFGenerator.generateBillPDF(bill, bill.customer);

    // Update bill with PDF URL
    bill.pdfUrl = pdfData.url;
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'PDF generated successfully',
      data: {
        downloadUrl: pdfData.url,
        fileName: pdfData.fileName
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download PDF directly to download directory
// @route   GET /api/bills/:id/download-pdf
// @access  Private
exports.downloadBillPDF = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('products.product', 'name description image')
      .populate('createdBy', 'name email');

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Check if user owns the bill or is admin
    // Customers can see bills where they are either the customer OR the creator
    if (req.user.role !== 'admin') {
      const isCustomer = bill.customer && bill.customer._id.toString() === req.user._id.toString();
      const isCreator = bill.createdBy && bill.createdBy._id.toString() === req.user._id.toString();

      if (!isCustomer && !isCreator) {
        return next(new ErrorResponse('Access denied', 403));
      }
    }

    // Generate PDF
    const pdfData = await PDFGenerator.generateBillPDF(bill, bill.customer);

    // Update bill with PDF URL
    bill.pdfUrl = pdfData.url;
    await bill.save();

    // Read the generated PDF file
    const fs = require('fs');
    const path = require('path');
    const pdfPath = path.join(__dirname, '../', pdfData.url);

    if (!fs.existsSync(pdfPath)) {
      return next(new ErrorResponse('PDF file not found', 404));
    }

    // Set headers for direct download
    const fileName = `Invoice_${bill.billNumber || bill._id}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Stream the file directly to the response
    const readStream = fs.createReadStream(pdfPath);
    readStream.pipe(res);

    // Handle errors
    readStream.on('error', (error) => {
      console.error('Error streaming PDF file:', error);
      if (!res.headersSent) {
        next(new ErrorResponse('Error downloading PDF', 500));
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Create Razorpay order for bill payment
// @route   POST /api/bills/:id/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name email phone');

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Check if user owns the bill or is admin
    if (req.user.role !== 'admin' && bill.customer._id.toString() !== req.user._id.toString() && bill.createdBy.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Access denied', 403));
    }

    // Check if bill is already paid
    if (bill.paymentStatus === 'paid') {
      return next(new ErrorResponse('Bill is already paid', 400));
    }

    // Initialize Razorpay (you'll need to install razorpay package)
    const Razorpay = require('razorpay');

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create order
    const options = {
      amount: Math.round(bill.totalAmount * 100), // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: bill.billNumber,
      notes: {
        billId: bill._id.toString(),
        customerName: bill.customer.name,
        customerEmail: bill.customer.email
      }
    };

    const order = await razorpay.orders.create(options);

    // Update bill with order ID
    bill.razorpayOrderId = order.id;
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
        billNumber: bill.billNumber,
        customerName: bill.customer.name,
        description: `Payment for Invoice ${bill.billNumber}`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/bills/:id/verify-payment
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name email phone');

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Verify payment signature (you'll need to implement this)
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return next(new ErrorResponse('Payment verification failed', 400));
    }

    // Update bill payment status
    bill.paymentStatus = 'paid';
    bill.paymentMethod = 'razorpay';
    bill.razorpayPaymentId = razorpay_payment_id;
    bill.paidAt = new Date();
    await bill.save();

    // Generate PDF after successful payment
    const pdfData = await PDFGenerator.generateBillPDF(bill, bill.customer);

    // Update bill with PDF URL
    bill.pdfUrl = pdfData.url;
    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        bill,
        pdfUrl: pdfData.url,
        downloadUrl: pdfData.url
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single bill
// @route   GET /api/bills/:id
// @access  Private
exports.getBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('products.product', 'name description image price')
      .populate('createdBy', 'name email');

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Check if user owns the bill or is admin
    // Customers can see bills where they are either the customer OR the creator
    if (req.user.role !== 'admin') {
      const isCustomer = bill.customer && bill.customer._id.toString() === req.user._id.toString();
      const isCreator = bill.createdBy && bill.createdBy._id.toString() === req.user._id.toString();

      if (!isCustomer && !isCreator) {
        return next(new ErrorResponse('Access denied', 403));
      }
    }

    res.status(200).json({
      success: true,
      data: bill
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new bill
// @route   POST /api/bills
// @access  Private (Admin only)
exports.createBill = async (req, res, next) => {
  try {
    const { products, customer, notes, customerInfo, taxRate = 0, discount = 0, billNumber } = req.body;

    console.log('Bill creation request:', {
      products: products?.length || 0,
      hasCustomer: !!customer,
      hasCustomerInfo: !!customerInfo,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log('Validation failed: No products');
      return next(new ErrorResponse('Products are required', 400));
    }

    if (!customer && !customerInfo) {
      console.log('Validation failed: No customer or customerInfo');
      return next(new ErrorResponse('Customer is required', 400));
    }

    // Verify all products exist and have sufficient stock
    const productIds = products.map(item => item.product);
    const productsData = await Product.find({ _id: { $in: productIds } });

    if (productsData.length !== products.length) {
      return next(new ErrorResponse('One or more products not found', 404));
    }

    // Check stock availability and prepare bill products
    const billProducts = [];
    let subtotal = 0;

    for (const item of products) {
      const product = productsData.find(p => p._id.toString() === item.product);

      if (!product) {
        return next(new ErrorResponse(`Product ${item.product} not found`, 404));
      }

      if (product.quantity < item.quantity) {
        return next(new ErrorResponse(`Insufficient stock for ${product.name}`, 400));
      }

      const productTotal = product.price * item.quantity;
      subtotal += productTotal;

      billProducts.push({
        product: product._id,
        productName: product.name,
        productDescription: product.description || '',
        quantity: item.quantity,
        price: product.price,
        total: productTotal
      });
    }

    // Calculate totals
    const taxAmount = (subtotal * taxRate) / 100;
    const discountAmount = parseFloat(discount) || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Handle customer creation if customerInfo is provided instead of customer ID
    let customerId = customer;
    if (customerInfo && !customer) {
      // Check if customer with this email already exists
      const existingCustomer = await Customer.findOne({ email: customerInfo.email.toLowerCase() });

      if (existingCustomer) {
        // Use existing customer
        customerId = existingCustomer._id;
      } else {
        // Create new customer from customerInfo
        const newCustomer = await Customer.create({
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address || '',
          createdBy: req.user.id
        });
        customerId = newCustomer._id;
      }
    }

    // If no customer ID is provided and no customerInfo, use the authenticated user as customer
    if (!customerId && !customerInfo) {
      customerId = req.user.id;
    }

    // Create bill (don't pass billNumber if not provided, let the model auto-generate it)
    const billData = {
      customer: customerId,
      products: billProducts,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      notes,
      createdBy: req.user.id
    };

    // Only add billNumber if it was explicitly provided
    if (billNumber) {
      billData.billNumber = billNumber;
    }

    const bill = await Bill.create(billData);

    // Populate the response
    await bill.populate('customer', 'name email phone address');
    await bill.populate('products.product', 'name description image price');
    await bill.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: bill
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment status
// @route   PATCH /api/bills/:id/payment
// @access  Private (Admin only)
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod, razorpayPaymentId, razorpayOrderId } = req.body;

    if (!paymentStatus) {
      return next(new ErrorResponse('Payment status is required', 400));
    }

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Update payment status
    bill.paymentStatus = paymentStatus;
    bill.paymentMethod = paymentMethod || bill.paymentMethod;

    if (razorpayPaymentId) {
      bill.razorpayPaymentId = razorpayPaymentId;
    }

    if (razorpayOrderId) {
      bill.razorpayOrderId = razorpayOrderId;
    }

    if (paymentStatus === 'paid') {
      bill.paidAt = new Date();
    }

    await bill.save();

    // Populate the response
    await bill.populate('customer', 'name email phone');
    await bill.populate('products.product', 'name image price');

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: bill
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bills by customer
// @route   GET /api/bills/customer/:customerId
// @access  Private
exports.getBillsByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    // Check if user owns the bills or is admin
    if (req.user.role !== 'admin' && customerId !== req.user.id) {
      return next(new ErrorResponse('Access denied', 403));
    }

    const bills = await Bill.find({ customer: customerId })
      .populate('customer', 'name email phone')
      .populate('products.product', 'name image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue bills
// @route   GET /api/bills/overdue
// @access  Private (Admin only)
exports.getOverdueBills = async (req, res, next) => {
  try {
    const overdueBills = await Bill.findOverdue()
      .populate('customer', 'name email phone');

    res.status(200).json({
      success: true,
      count: overdueBills.length,
      data: overdueBills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bill statistics
// @route   GET /api/bills/stats
// @access  Private (Admin only)
exports.getBillStats = async (req, res, next) => {
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

    const stats = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'paid'] },
                '$totalAmount',
                0
              ]
            }
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ['$paymentStatus', 'pending'] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalBills: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };

    // Get status breakdown
    const statusBreakdown = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          amount: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        statusBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete bill
// @route   DELETE /api/bills/:id
// @access  Private (Admin only)
exports.deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Check for admin
    if (req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this bill', 401));
    }

    await bill.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send invoice PDF via email
// @route   POST /api/bills/:id/send-email
// @access  Private
exports.sendInvoiceEmail = async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('products.product', 'name description image');

    if (!bill) {
      return next(new ErrorResponse('Bill not found', 404));
    }

    // Check permissions
    if (req.user.role !== 'admin') {
      const isCustomer = bill.customer && bill.customer._id.toString() === req.user._id.toString();
      const isCreator = bill.createdBy && bill.createdBy._id.toString() === req.user._id.toString();

      if (!isCustomer && !isCreator) {
        return next(new ErrorResponse('Access denied', 403));
      }
    }

    // Generate PDF
    const pdfData = await PDFGenerator.generateBillPDF(bill, bill.customer);
    const pdfPath = path.join(__dirname, '../', pdfData.url);
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Prepare email data
    const emailData = {
      to: email || bill.customer.email,
      subject: subject || `Invoice ${bill.billNumber} from ${process.env.COMPANY_NAME || 'MERN Billing App'}`,
      customerName: bill.customer.name,
      billNumber: bill.billNumber,
      pdfBuffer: pdfBuffer,
      customMessage: message
    };

    // Send email
    const emailResult = await EmailService.sendInvoiceEmail(emailData);

    if (emailResult.success) {
      // Update bill with email sent timestamp
      bill.emailSentAt = new Date();
      bill.emailSentTo = email || bill.customer.email;
      await bill.save();

      res.status(200).json({
        success: true,
        message: 'Invoice sent successfully via email',
        data: {
          messageId: emailResult.messageId,
          sentTo: email || bill.customer.email
        }
      });
    } else {
      return next(new ErrorResponse('Failed to send email: ' + emailResult.error, 500));
    }
  } catch (error) {
    next(error);
  }
};
