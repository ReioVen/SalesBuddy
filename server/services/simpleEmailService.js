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
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || 'your-password-here'
      }
    });
    
    console.log('📧 [SIMPLE EMAIL] Email service initialized with:', {
      user: process.env.EMAIL_USER || 'revotechSB@gmail.com',
      hasPassword: !!(process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS),
      usingEnvVars: !!(process.env.EMAIL_USER && (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS))
    });
  }

  async sendHighPriorityFeedbackNotification(feedback) {
    try {
      if (!this.transporter) {
        console.error('❌ [SIMPLE EMAIL] Email transporter not initialized');
        return false;
      }

      // Check if we have email credentials
      if (!process.env.EMAIL_USER || (!process.env.EMAIL_PASSWORD && !process.env.EMAIL_PASS)) {
        console.log('📧 [SIMPLE EMAIL] No email credentials - logging feedback instead');
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
        return true;
      }

      // Send actual email
      console.log('📧 [SIMPLE EMAIL] Sending email to revotechSB@gmail.com...');
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'revotechSB@gmail.com',
        subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
        html: `
          <h2>🚨 High Priority Feedback Received</h2>
          <p><strong>Title:</strong> ${feedback.title}</p>
          <p><strong>Description:</strong> ${feedback.description}</p>
          <p><strong>User:</strong> ${feedback.userName} (${feedback.userEmail})</p>
          <p><strong>Priority:</strong> ${feedback.priority}</p>
          <p><strong>Type:</strong> ${feedback.type}</p>
          <p><strong>URL:</strong> ${feedback.url}</p>
          <p><strong>User Agent:</strong> ${feedback.userAgent}</p>
          <p><strong>Timestamp:</strong> ${feedback.createdAt}</p>
          <hr>
          <p><em>This is an automated notification from SalesBuddy Beta Feedback System.</em></p>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 [SIMPLE EMAIL] Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ [SIMPLE EMAIL] Error sending email:', error);
      return false;
    }
  }
}

module.exports = new SimpleEmailService();
