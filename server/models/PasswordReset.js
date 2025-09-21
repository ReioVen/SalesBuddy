const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired tokens
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate a secure random token
passwordResetSchema.statics.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Create a new password reset request
passwordResetSchema.statics.createResetRequest = async function(email) {
  try {
    // Clean up old unused tokens for this email (older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await this.deleteMany({
      email,
      used: false,
      createdAt: { $lt: tenMinutesAgo }
    });

    // Create new reset request
    const token = this.generateToken();
    const resetRequest = new this({
      email,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    await resetRequest.save();
    return resetRequest;
  } catch (error) {
    throw new Error('Failed to create password reset request');
  }
};

// Verify a reset token (without consuming it)
passwordResetSchema.statics.verifyToken = async function(token) {
  try {
    const resetRequest = await this.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    return { valid: true, email: resetRequest.email };
  } catch (error) {
    return { valid: false, error: 'Token verification failed' };
  }
};

// Verify and consume a reset token
passwordResetSchema.statics.verifyAndConsumeToken = async function(token) {
  try {
    const resetRequest = await this.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRequest) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    // Mark token as used
    resetRequest.used = true;
    await resetRequest.save();

    return { valid: true, email: resetRequest.email };
  } catch (error) {
    return { valid: false, error: 'Token verification failed' };
  }
};

// Clean up expired tokens (called periodically)
passwordResetSchema.statics.cleanupExpiredTokens = async function() {
  try {
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { used: true }
      ]
    });
    console.log(`Cleaned up ${result.deletedCount} expired password reset tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
