const nodemailer = require('nodemailer');

class AlternativeEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Try a different Gmail configuration
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Use SSL port instead of TLS
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_USER || 'revotechSB@gmail.com',
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || 'your-password-here'
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      },
      connectionTimeout: 20000, // 20 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 20000, // 20 seconds
      pool: false,
      maxConnections: 1,
      maxMessages: 1
    });
    
    console.log('📧 [ALTERNATIVE EMAIL] Email service initialized with SSL configuration');
  }

  async sendHighPriorityFeedbackNotification(feedback) {
    try {
      if (!this.transporter) {
        console.error('❌ [ALTERNATIVE EMAIL] Email transporter not initialized');
        return false;
      }

      // Check if we have email credentials
      if (!process.env.EMAIL_USER || (!process.env.EMAIL_PASSWORD && !process.env.EMAIL_PASS)) {
        console.log('📧 [ALTERNATIVE EMAIL] No email credentials - logging feedback instead');
        this.logFeedback(feedback);
        return true;
      }

      // Send actual email
      console.log('📧 [ALTERNATIVE EMAIL] Sending email to revotechSB@gmail.com...');
      
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
      console.log('📧 [ALTERNATIVE EMAIL] Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ [ALTERNATIVE EMAIL] Error sending email:', error);
      console.log('📧 [ALTERNATIVE EMAIL] FALLBACK - Logging feedback details:');
      this.logFeedback(feedback);
      return false;
    }
  }

  logFeedback(feedback) {
    console.log('📧 [ALTERNATIVE EMAIL] HIGH PRIORITY FEEDBACK:');
    console.log('📧 [ALTERNATIVE EMAIL] Title:', feedback.title);
    console.log('📧 [ALTERNATIVE EMAIL] Description:', feedback.description);
    console.log('📧 [ALTERNATIVE EMAIL] User:', feedback.userName);
    console.log('📧 [ALTERNATIVE EMAIL] Email:', feedback.userEmail);
    console.log('📧 [ALTERNATIVE EMAIL] Priority:', feedback.priority);
    console.log('📧 [ALTERNATIVE EMAIL] Type:', feedback.type);
    console.log('📧 [ALTERNATIVE EMAIL] URL:', feedback.url);
    console.log('📧 [ALTERNATIVE EMAIL] User Agent:', feedback.userAgent);
    console.log('📧 [ALTERNATIVE EMAIL] Timestamp:', feedback.createdAt);
  }
}

module.exports = new AlternativeEmailService();
