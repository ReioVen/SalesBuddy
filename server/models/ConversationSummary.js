const mongoose = require('mongoose');

const conversationSummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  summaryNumber: {
    type: Number,
    required: true,
    min: 1
  },
  conversationCount: {
    type: Number,
    required: true,
    min: 5
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  stageRatings: {
    opening: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String
    },
    discovery: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String
    },
    presentation: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String
    },
    objectionHandling: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String
    },
    closing: {
      rating: { type: Number, min: 1, max: 10 },
      feedback: String
    }
  },
  strengths: [String],
  improvements: [String],
  exampleConversations: [{
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    stage: String,
    excerpt: String,
    context: String
  }],
  aiAnalysis: {
    personalityInsights: String,
    communicationStyle: String,
    recommendedFocus: [String],
    nextSteps: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSummarySchema.index({ userId: 1, summaryNumber: -1 });
conversationSummarySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ConversationSummary', conversationSummarySchema);
