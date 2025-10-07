const Contact = require('../models/Contact');
const ErrorResponse = require('../utils/errorResponse');
const emailService = require('../utils/emailService');

// @desc    Get all contacts
// @route   GET /api/contact
// @access  Private (Admin only)
exports.getContacts = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalContacts = await Contact.countDocuments(query);
    const totalPages = Math.ceil(totalContacts / parseInt(limit));

    const contacts = await Contact.find(query)
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: contacts.length,
      totalContacts,
      totalPages,
      currentPage: parseInt(page),
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contact
// @route   GET /api/contact/:id
// @access  Private (Admin only)
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('resolvedBy', 'name email');

    if (!contact) {
      return next(new ErrorResponse('Contact not found', 404));
    }

    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contact
// @route   DELETE /api/contact/:id
// @access  Private (Admin only)
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ErrorResponse('Contact not found', 404));
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark contact as read
// @route   PATCH /api/contact/:id/read
// @access  Private (Admin only)
exports.markAsRead = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ErrorResponse('Contact not found', 404));
    }

    // Update the contact to mark as read (you can add an isRead field to the model)
    // For now, we'll update the status to 'resolved' as a way to mark as read
    contact.status = 'resolved';
    contact.resolvedBy = req.user.id;
    contact.resolvedAt = new Date();

    await contact.save();

    // Populate the response
    await contact.populate('resolvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Contact marked as read successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new contact
// @route   POST /api/contact
// @access  Public
exports.createContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, priority } = req.body;

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      priority: priority || 'medium',
      ipAddress,
      userAgent
    });

    // Send email notification to admin (if email service is configured)
    try {
      const emailContent = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Priority:</strong> ${priority || 'medium'}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `;

      await emailService.sendEmail({
        to: process.env.SMTP_USER || 'admin@yourapp.com',
        subject: `New Contact Form: ${subject}`,
        html: emailContent
      });
    } catch (emailError) {
      console.error('Failed to send contact notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact status
// @route   PATCH /api/contact/:id/status
// @access  Private (Admin only)
exports.updateContactStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return next(new ErrorResponse('Status is required', 400));
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ErrorResponse('Contact not found', 404));
    }

    contact.status = status;

    if (status === 'resolved') {
      contact.resolvedBy = req.user.id;
      contact.resolvedAt = new Date();
    }

    if (notes) {
      contact.notes.push({
        content: notes,
        createdBy: req.user.id
      });
    }

    await contact.save();

    // Populate the response
    await contact.populate('assignedTo', 'name email');
    await contact.populate('resolvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign contact to user
// @route   PATCH /api/contact/:id/assign
// @access  Private (Admin only)
exports.assignContact = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return next(new ErrorResponse('User ID is required', 400));
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ErrorResponse('Contact not found', 404));
    }

    await contact.assignTo(userId);
    await contact.populate('assignedTo', 'name email');

    res.status(200).json({
      success: true,
      message: 'Contact assigned successfully',
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add note to contact
// @route   POST /api/contact/:id/notes
// @access  Private (Admin only)
exports.addContactNote = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next(new ErrorResponse('Note content is required', 400));
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return next(new ErrorResponse('Contact not found', 404));
    }

    contact.notes.push({
      content,
      createdBy: req.user.id
    });

    await contact.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: contact.notes[contact.notes.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get contact statistics
// @route   GET /api/contact/stats
// @access  Private (Admin only)
exports.getContactStats = async (req, res, next) => {
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

    const stats = await Contact.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          resolvedContacts: {
            $sum: {
              $cond: [
                { $in: ['$status', ['resolved', 'closed']] },
                1,
                0
              ]
            }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $and: [
                  { $in: ['$status', ['resolved', 'closed']] },
                  { $ne: ['$resolvedAt', null] }
                ]},
                { $divide: [
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  1000 * 60 * 60 // Convert to hours
                ]},
                null
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalContacts: 0,
      resolvedContacts: 0,
      avgResponseTime: 0
    };

    // Get status breakdown
    const statusBreakdown = await Contact.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        statusBreakdown,
        resolutionRate: result.totalContacts > 0 ?
          (result.resolvedContacts / result.totalContacts * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};
