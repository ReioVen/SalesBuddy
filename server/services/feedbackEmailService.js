const nodemailer = require('nodemailer');

class FeedbackEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Hardcoded email credentials for revotechSB@gmail.com
    const emailUser = process.env.EMAIL_USER || 'revotechSB@gmail.com';
    const emailPass = process.env.EMAIL_PASS || 'your-gmail-app-password'; // Replace with actual Gmail App Password
    
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    
    console.log('📧 [FEEDBACK EMAIL] Email service initialized with:', {
      user: emailUser,
      hasPassword: !!emailPass,
      usingEnvVars: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    });
  }

  async sendHighPriorityFeedbackNotification(feedback) {
    try {
      if (!this.transporter) {
        console.error('❌ [FEEDBACK EMAIL] Email transporter not initialized');
        return false;
      }

      // Check if we have valid email credentials (either from env vars or hardcoded)
      const emailUser = process.env.EMAIL_USER || 'revotechSB@gmail.com';
      const emailPass = process.env.EMAIL_PASS || 'your-gmail-app-password';
      
      if (!emailUser || !emailPass || emailPass === 'your-gmail-app-password') {
        console.error('❌ [FEEDBACK EMAIL] Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables or update the hardcoded credentials.');
        return false;
      }

      const mailOptions = {
        from: emailUser,
        to: 'revotechSB@gmail.com',
        subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
        html: this.generateFeedbackEmailHTML(feedback)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 [FEEDBACK EMAIL] High priority feedback notification sent:', {
        messageId: result.messageId,
        feedbackId: feedback._id,
        priority: feedback.priority,
        type: feedback.type
      });

      return true;
    } catch (error) {
      console.error('❌ [FEEDBACK EMAIL] Failed to send high priority notification:', error);
      return false;
    }
  }

  generateFeedbackEmailHTML(feedback) {
    const priorityColor = feedback.priority === 'high' ? '#dc2626' : 
                         feedback.priority === 'medium' ? '#d97706' : '#059669';
    
    const typeIcon = {
      'bug': '🐛',
      'issue': '⚠️',
      'feature': '💡',
      'other': '📝'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>High Priority Feedback Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${priorityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .priority-badge { 
            display: inline-block; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: bold; 
            text-transform: uppercase;
            background: ${priorityColor};
            color: white;
          }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .description { 
            background: white; 
            padding: 15px; 
            border-radius: 4px; 
            border-left: 4px solid ${priorityColor};
            margin: 15px 0;
          }
          .footer { 
            margin-top: 20px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 High Priority Feedback Alert</h1>
            <p>A user has submitted high-priority feedback that requires immediate attention.</p>
          </div>
          
          <div class="content">
            <div style="margin-bottom: 20px;">
              <span class="priority-badge">${feedback.priority.toUpperCase()}</span>
              <span style="margin-left: 10px; font-size: 18px;">${typeIcon[feedback.type]}</span>
              <span style="margin-left: 5px; font-weight: bold; text-transform: capitalize;">${feedback.type}</span>
            </div>

            <div class="info-row">
              <span class="label">Title:</span>
              <span class="value">${feedback.title}</span>
            </div>

            <div class="info-row">
              <span class="label">User:</span>
              <span class="value">${feedback.userName || 'Anonymous'} ${feedback.userEmail ? `(${feedback.userEmail})` : ''}</span>
            </div>

            <div class="info-row">
              <span class="label">Submitted:</span>
              <span class="value">${new Date(feedback.createdAt).toLocaleString()}</span>
            </div>

            <div class="info-row">
              <span class="label">URL:</span>
              <span class="value">${feedback.url || 'N/A'}</span>
            </div>

            <div class="info-row">
              <span class="label">Browser:</span>
              <span class="value">${feedback.userAgent ? feedback.userAgent.split(' ').slice(-2).join(' ') : 'N/A'}</span>
            </div>

            <div class="description">
              <strong>Description:</strong><br>
              ${feedback.description.replace(/\n/g, '<br>')}
            </div>

            <div style="margin-top: 20px; text-align: center;">
              <a href="${process.env.CLIENT_URL || 'https://salesbuddy.pro'}/admin/feedback" 
                 style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View in Admin Dashboard
              </a>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated notification from the SalesBuddy Beta Feedback System.</p>
            <p>Feedback ID: ${feedback._id}</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testEmailConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }
      
      await this.transporter.verify();
      console.log('✅ [FEEDBACK EMAIL] Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ [FEEDBACK EMAIL] Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new FeedbackEmailService();
