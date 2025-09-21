const express = require('express');
const { body, validationResult } = require('express-validator');
const EnterpriseRequest = require('../models/EnterpriseRequest');

const router = express.Router();

// Submit enterprise request
router.post('/request', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
  body('phone').optional().trim(),
  body('companySize').isIn(['1-10', '11-50', '51-200', '201-500', '500+']).withMessage('Valid company size is required'),
  body('industry').trim().notEmpty().withMessage('Industry is required'),
  body('useCase').trim().notEmpty().withMessage('Use case is required'),
  body('expectedUsers').isInt({ min: 1 }).withMessage('Expected users must be at least 1'),
  body('budget').isIn(['$500-$1000', '$1000-$2500', '$2500-$5000', '$5000+']).withMessage('Valid budget range is required'),
  body('timeline').isIn(['Immediate', '1-2 weeks', '1 month', '2-3 months', '3+ months']).withMessage('Valid timeline is required'),
  body('additionalInfo').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        errors: errors.array() 
      });
    }

    const {
      firstName,
      lastName,
      email,
      company,
      jobTitle,
      phone,
      companySize,
      industry,
      useCase,
      expectedUsers,
      budget,
      timeline,
      additionalInfo
    } = req.body;

    // Check if request already exists for this email (case-insensitive)
    const existingRequest = await EnterpriseRequest.findOne({ email: email.toLowerCase() });
    if (existingRequest) {
      return res.status(400).json({ 
        error: 'An enterprise request already exists for this email address' 
      });
    }

    // Create new enterprise request
    const enterpriseRequest = new EnterpriseRequest({
      firstName,
      lastName,
      email,
      company,
      jobTitle,
      phone,
      companySize,
      industry,
      useCase,
      expectedUsers,
      budget,
      timeline,
      additionalInfo
    });

    await enterpriseRequest.save();

    // TODO: Send notification email to sales team
    // TODO: Send confirmation email to user

    res.status(201).json({
      message: 'Enterprise request submitted successfully',
      requestId: enterpriseRequest._id
    });
  } catch (error) {
    console.error('Enterprise request error:', error);
    res.status(500).json({ error: 'Failed to submit enterprise request' });
  }
});

// Get enterprise request (admin only - would need admin middleware)
router.get('/requests', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const requests = await EnterpriseRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await EnterpriseRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get enterprise requests error:', error);
    res.status(500).json({ error: 'Failed to get enterprise requests' });
  }
});

// Update enterprise request status (admin only)
router.put('/requests/:id/status', [
  body('status').isIn(['pending', 'contacted', 'qualified', 'closed']).withMessage('Valid status is required'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    const { id } = req.params;

    const request = await EnterpriseRequest.findByIdAndUpdate(
      id,
      { 
        status, 
        notes,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Enterprise request not found' });
    }

    res.json({
      message: 'Enterprise request updated successfully',
      request
    });
  } catch (error) {
    console.error('Update enterprise request error:', error);
    res.status(500).json({ error: 'Failed to update enterprise request' });
  }
});

module.exports = router; 