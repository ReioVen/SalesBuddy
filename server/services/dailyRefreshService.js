const cron = require('node-cron');
const User = require('../models/User');

class DailyRefreshService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Reset daily chat limits for all enterprise users
   */
  async resetEnterpriseDailyLimits() {
    try {
      console.log('Starting daily reset for enterprise users...');
      
      // Find all enterprise users with companies (they are considered paid)
      const enterpriseUsers = await User.find({
        'subscription.plan': 'enterprise',
        companyId: { $exists: true, $ne: null }
      });

      console.log(`Found ${enterpriseUsers.length} enterprise users to reset`);

      let resetCount = 0;
      const now = new Date();

      for (const user of enterpriseUsers) {
        try {
          // Reset daily usage
          await User.findByIdAndUpdate(user._id, {
            $set: {
              'usage.aiConversations': 0,
              'usage.lastDailyResetDate': now
            }
          });
          
          resetCount++;
          console.log(`Reset daily limit for user: ${user.email}`);
        } catch (error) {
          console.error(`Error resetting user ${user.email}:`, error);
        }
      }

      console.log(`Daily reset completed. Reset ${resetCount} enterprise users.`);
      return { success: true, resetCount, totalUsers: enterpriseUsers.length };
    } catch (error) {
      console.error('Error in resetEnterpriseDailyLimits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the daily refresh cron job
   */
  startDailyRefresh() {
    if (this.isRunning) {
      console.log('Daily refresh service is already running');
      return;
    }

    // Schedule to run every day at midnight (00:00)
    // Cron format: '0 0 * * *' = minute(0) hour(0) day(*) month(*) dayOfWeek(*)
    this.cronJob = cron.schedule('0 0 * * *', async () => {
      console.log('Running scheduled daily refresh at midnight...');
      await this.resetEnterpriseDailyLimits();
    }, {
      scheduled: false, // Don't start immediately
      timezone: 'UTC' // Use UTC timezone
    });

    this.cronJob.start();
    this.isRunning = true;
    console.log('Daily refresh service started - will run every day at 00:00 UTC');
  }

  /**
   * Stop the daily refresh cron job
   */
  stopDailyRefresh() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.isRunning = false;
      console.log('Daily refresh service stopped');
    }
  }

  /**
   * Manually trigger a daily reset (for testing or admin purposes)
   */
  async manualReset() {
    console.log('Manual daily reset triggered');
    return await this.resetEnterpriseDailyLimits();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? this.cronJob.nextDate() : null
    };
  }
}

// Create singleton instance
const dailyRefreshService = new DailyRefreshService();

module.exports = dailyRefreshService;
