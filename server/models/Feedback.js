const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bug', 'issue', 'feature', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous feedback
  },
  userEmail: {
    type: String,
    required: false
  },
  userName: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  url: {
    type: String,
    required: false
  },
  adminNotes: {
    type: String,
    default: ''
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ status: 1, priority: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, priority: 1 });

// Virtual for formatted timestamp
feedbackSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toLocaleString();
});

// Method to check if feedback is high priority
feedbackSchema.methods.isHighPriority = function() {
  return this.priority === 'high';
};

// Method to check if feedback needs email notification
feedbackSchema.methods.needsEmailNotification = function() {
  return this.isHighPriority() && !this.emailSent;
};

// Static method to get feedback statistics
feedbackSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        recent: {
          $sum: {
            $cond: [
              { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      total: 0,
      byType: {},
      byPriority: {},
      byStatus: {},
      recent: 0
    };
  }

  const result = stats[0];
  
  // Process the grouped data
  const byType = {};
  const byPriority = {};
  const byStatus = {};

  result.byType.forEach(item => {
    byType[item.type] = (byType[item.type] || 0) + 1;
  });

  result.byPriority.forEach(item => {
    byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
  });

  result.byStatus.forEach(item => {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
  });

  return {
    total: result.total,
    byType,
    byPriority,
    byStatus,
    recent: result.recent
  };
};

module.exports = mongoose.model('Feedback', feedbackSchema);
