const mongoose = require('mongoose');
const feedbackEmailService = require('../services/feedbackEmailService');

// Load environment variables
require('dotenv').config();

async function testFeedbackEmail() {
  try {
    console.log('🧪 [TEST] Starting feedback email test...');
    
    // Check environment variables
    console.log('📧 [TEST] Email configuration:');
    console.log('  EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ [TEST] Email credentials not configured');
      return;
    }
    
    // Test email connection
    console.log('📧 [TEST] Testing email connection...');
    const emailConnected = await feedbackEmailService.testEmailConnection();
    
    if (!emailConnected) {
      console.error('❌ [TEST] Email connection failed. Check EMAIL_USER and EMAIL_PASS environment variables.');
      return;
    }
    
    console.log('✅ [TEST] Email connection successful');
    
    // Connect to database
    console.log('🔗 [TEST] Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ [TEST] Database connected');
    
    // Create a test feedback object
    const testFeedback = {
      _id: new mongoose.Types.ObjectId(),
      type: 'bug',
      priority: 'high',
      title: 'Test High Priority Feedback',
      description: 'This is a test feedback submission to verify the email notification system is working correctly.',
      userName: 'Test User',
      userEmail: 'test@example.com',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      url: 'https://salesbuddy.pro/test',
      createdAt: new Date()
    };
    
    console.log('📧 [TEST] Sending test email notification...');
    const emailSent = await feedbackEmailService.sendHighPriorityFeedbackNotification(testFeedback);
    
    if (emailSent) {
      console.log('✅ [TEST] Test email sent successfully to revotechSB@gmail.com');
    } else {
      console.error('❌ [TEST] Failed to send test email');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 [TEST] Database connection closed');
    process.exit(0);
  }
}

// Run the test
testFeedbackEmail();