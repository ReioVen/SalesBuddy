const cron = require('node-cron');
const User = require('../models/User');

class DailyRefreshService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Reset daily chat limits for all enterprise users (DEPRECATED - enterprise users now use monthly limits)
   * This function is kept for backward compatibility but no longer resets enterprise users
   */
  async resetEnterpriseDailyLimits() {
    try {
      console.log('Enterprise users now use monthly limits - skipping daily reset');
      
      // Enterprise users no longer need daily resets since they use monthly limits
      // The monthly reset is handled by the User model's incrementAIUsage method
      
      console.log('Daily reset completed. Enterprise users use monthly limits.');
      return { success: true, resetCount: 0, totalUsers: 0, message: 'Enterprise users now use monthly limits' };
    } catch (error) {
      console.error('Error in resetEnterpriseDailyLimits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the daily refresh cron job (DEPRECATED - enterprise users now use monthly limits)
   * This service is kept for backward compatibility but no longer performs daily resets
   */
  startDailyRefresh() {
    if (this.isRunning) {
      console.log('Daily refresh service is stopped but no longer needed - enterprise users use monthly limits');
      return;
    }

    console.log('Daily refresh service is no longer needed - enterprise users now use monthly limits');
    console.log('Monthly resets are handled automatically by the User model');
    this.isRunning = true;
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
