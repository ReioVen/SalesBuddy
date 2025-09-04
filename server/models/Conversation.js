const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: Number,
    default: 0
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  scenario: {
    type: String,
    enum: ['general', 'cold_call', 'objection_handling', 'closing', 'follow_up', 'custom', 'lead_call'],
    default: 'general'
  },
  industry: String,
  product: String,
  customerType: String,
  clientCustomization: {
    name: String,
    personality: String,
    industry: String,
    role: String,
    customPrompt: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
         // Additional profile details for random client generation
     familySize: Number,
     income: String,
     incomeRange: String,
     priceSensitivity: String,
     familyType: String,
     specificDetails: String,
     priceContext: String,
     fullProfile: String,
     // Personality traits for varied client behavior
     personalityTraits: [String],
     // Difficulty phase for sales conversation (beginning_hard, middle_hard, closing_hard)
     difficultyPhase: String,
     // Selling points, problems, and weak spots based on difficulty
     sellingPoints: [String],
     problems: [String],
     weakSpots: [String]
  },
  messages: [messageSchema],
  totalTokens: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  // Detailed AI ratings for each sales phase
  aiRatings: {
    introduction: {
      type: Number,
      min: 1,
      max: 10
    },
    mapping: {
      type: Number,
      min: 1,
      max: 10
    },
    productPresentation: {
      type: Number,
      min: 1,
      max: 10
    },
    objectionHandling: {
      type: Number,
      min: 1,
      max: 10
    },
    close: {
      type: Number,
      min: 1,
      max: 10
    }
  },
  aiRatingFeedback: String,
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isActive: 1 });

// Virtual for message count
conversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add message (without saving to database)
conversationSchema.methods.addMessage = function(role, content, tokens = 0) {
  this.messages.push({
    role,
    content,
    tokens,
    timestamp: new Date()
  });
  this.totalTokens += tokens;
  this.updatedAt = new Date();
  // Note: Not saving to database immediately - will be saved when conversation ends
  return this;
};

// Method to add message and save to database (for when immediate save is needed)
conversationSchema.methods.addMessageAndSave = function(role, content, tokens = 0) {
  this.messages.push({
    role,
    content,
    tokens,
    timestamp: new Date()
  });
  this.totalTokens += tokens;
  this.updatedAt = new Date();
  return this.save();
};

// Method to get conversation summary
conversationSchema.methods.getSummary = function() {
  const userMessages = this.messages.filter(m => m.role === 'user').length;
  const assistantMessages = this.messages.filter(m => m.role === 'assistant').length;
  
  return {
    id: this._id,
    title: this.title,
    scenario: this.scenario,
    messageCount: this.messageCount,
    userMessages,
    assistantMessages,
    totalTokens: this.totalTokens,
    duration: this.duration,
    rating: this.rating,
    aiRatings: this.aiRatings,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Method to end conversation and calculate duration
conversationSchema.methods.endConversation = function() {
  this.duration = Math.floor((new Date() - this.createdAt) / 1000); // duration in seconds
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get user's conversation history
conversationSchema.statics.getUserHistory = function(userId, limit = 20, skip = 0) {
  return this.find({ userId, isActive: true })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('title scenario messages messageCount totalTokens duration rating aiRatings aiRatingFeedback clientCustomization createdAt updatedAt');
};

module.exports = mongoose.model('Conversation', conversationSchema); 