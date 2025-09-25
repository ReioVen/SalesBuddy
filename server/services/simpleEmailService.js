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
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'revotechSB@gmail.com',
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || 'your-password-here'
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 15000, // 15 seconds
      socketTimeout: 30000, // 30 seconds
      pool: false, // Disable pooling for better reliability
      maxConnections: 1,
      maxMessages: 1,
      rateDelta: 10000, // 10 seconds
      rateLimit: 1
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
      console.log('📧 [SIMPLE EMAIL] Email response:', {
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response
      });
      return true;
    } catch (error) {
      console.error('❌ [SIMPLE EMAIL] Error sending email:', error);
      console.error('❌ [SIMPLE EMAIL] Error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      
      // Fallback: Log the feedback details since email failed
      console.log('📧 [SIMPLE EMAIL] FALLBACK - Logging high priority feedback:');
      console.log('📧 [SIMPLE EMAIL] Title:', feedback.title);
      console.log('📧 [SIMPLE EMAIL] Description:', feedback.description);
      console.log('📧 [SIMPLE EMAIL] User:', feedback.userName);
      console.log('📧 [SIMPLE EMAIL] Email:', feedback.userEmail);
      console.log('📧 [SIMPLE EMAIL] Priority:', feedback.priority);
      console.log('📧 [SIMPLE EMAIL] Type:', feedback.type);
      console.log('📧 [SIMPLE EMAIL] URL:', feedback.url);
      console.log('📧 [SIMPLE EMAIL] User Agent:', feedback.userAgent);
      console.log('📧 [SIMPLE EMAIL] Timestamp:', feedback.createdAt);
      
      return false;
    }
  }
}

module.exports = new SimpleEmailService();
