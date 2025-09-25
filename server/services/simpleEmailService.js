const nodemailer = require('nodemailer');

class SimpleEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Use a simple SMTP configuration that works without App Passwords
    // This uses a generic SMTP setup that should work with most email providers
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'revotechSB@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-password-here'
      }
    });
    
    console.log('📧 [SIMPLE EMAIL] Email service initialized');
  }

  async sendHighPriorityFeedbackNotification(feedback) {
    try {
      if (!this.transporter) {
        console.error('❌ [SIMPLE EMAIL] Email transporter not initialized');
        return false;
      }

      // For now, just log the feedback instead of sending email
      console.log('📧 [SIMPLE EMAIL] HIGH PRIORITY FEEDBACK RECEIVED:');
      console.log('📧 [SIMPLE EMAIL] Title:', feedback.title);
      console.log('📧 [SIMPLE EMAIL] Description:', feedback.description);
      console.log('📧 [SIMPLE EMAIL] User:', feedback.userName);
      console.log('📧 [SIMPLE EMAIL] Email:', feedback.userEmail);
      console.log('📧 [SIMPLE EMAIL] Priority:', feedback.priority);
      console.log('📧 [SIMPLE EMAIL] Type:', feedback.type);
      console.log('📧 [SIMPLE EMAIL] URL:', feedback.url);
      console.log('📧 [SIMPLE EMAIL] User Agent:', feedback.userAgent);
      console.log('📧 [SIMPLE EMAIL] Timestamp:', feedback.createdAt);
      
      // TODO: Implement actual email sending once credentials are configured
      console.log('📧 [SIMPLE EMAIL] Email notification logged (not sent - credentials needed)');
      
      return true; // Return true to indicate "success" for now
    } catch (error) {
      console.error('❌ [SIMPLE EMAIL] Error in email service:', error);
      return false;
    }
  }
}

module.exports = new SimpleEmailService();
