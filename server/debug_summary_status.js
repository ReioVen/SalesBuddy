const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salesbuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./server/models/User');

async function debugSummaryStatus() {
  try {
    console.log('=== DEBUGGING SUMMARY STATUS ===');
    
    // Find the user with testmain@gmail.com
    const user = await User.findOne({ email: 'testmain@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`\n--- User: ${user.email} ---`);
    console.log(`Plan: ${user.subscription.plan}`);
    console.log(`Status: ${user.subscription.status}`);
    console.log(`Summaries Generated Today: ${user.usage.summariesGeneratedToday}`);
    console.log(`Total Summaries Generated: ${user.usage.summariesGenerated}`);
    console.log(`Last Summary Reset Date: ${user.usage.lastSummaryResetDate}`);
    
    // Check if user can access summaries
    const canAccess = user.canAccessSummaries();
    console.log(`Can Access Summaries: ${canAccess}`);
    
    // Check if user can generate summary
    const canGenerate = user.canGenerateSummary();
    console.log(`Can Generate Summary: ${canGenerate}`);
    
    // Get summary status
    const summaryStatus = user.getSummaryStatus();
    console.log(`\n--- Summary Status ---`);
    console.log(`Summaries Generated Today: ${summaryStatus.summariesGeneratedToday}`);
    console.log(`Daily Limit: ${summaryStatus.dailyLimit}`);
    console.log(`Remaining Today: ${summaryStatus.remainingToday}`);
    console.log(`Can Generate: ${summaryStatus.canGenerate}`);
    
    // Check date logic
    const now = new Date();
    const lastSummaryReset = new Date(user.usage.lastSummaryResetDate);
    console.log(`\n--- Date Logic ---`);
    console.log(`Current Date: ${now}`);
    console.log(`Last Reset Date: ${lastSummaryReset}`);
    console.log(`Current Day: ${now.getDate()}`);
    console.log(`Last Reset Day: ${lastSummaryReset.getDate()}`);
    console.log(`Current Month: ${now.getMonth()}`);
    console.log(`Last Reset Month: ${lastSummaryReset.getMonth()}`);
    console.log(`Current Year: ${now.getFullYear()}`);
    console.log(`Last Reset Year: ${lastSummaryReset.getFullYear()}`);
    
    const isNewDay = now.getDate() !== lastSummaryReset.getDate() || 
                     now.getMonth() !== lastSummaryReset.getMonth() || 
                     now.getFullYear() !== lastSummaryReset.getFullYear();
    console.log(`Is New Day: ${isNewDay}`);
    
    // If it's a new day, reset the count
    if (isNewDay) {
      console.log('\n🔄 Resetting summary count for new day...');
      user.usage.summariesGeneratedToday = 0;
      user.usage.lastSummaryResetDate = now;
      await user.save();
      console.log('✅ Summary count reset successfully');
      
      // Check again
      const newCanGenerate = user.canGenerateSummary();
      console.log(`Can Generate Summary (after reset): ${newCanGenerate}`);
    }
    
  } catch (error) {
    console.error('Error debugging summary status:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugSummaryStatus();
