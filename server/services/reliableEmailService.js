const https = require('https');

class ReliableEmailService {
  constructor() {
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'https://api.emailjs.com/api/v1.0/email/send';
    this.serviceId = process.env.EMAILJS_SERVICE_ID || 'your-service-id';
    this.templateId = process.env.EMAILJS_TEMPLATE_ID || 'your-template-id';
    this.publicKey = process.env.EMAILJS_PUBLIC_KEY || 'your-public-key';
  }

  async sendHighPriorityFeedbackNotification(feedback) {
    try {
      console.log('📧 [RELIABLE EMAIL] Sending high priority feedback via reliable service...');
      
      // Try multiple email services in order of reliability
      const services = [
        () => this.sendViaEmailJS(feedback),
        () => this.sendViaResend(feedback),
        () => this.sendViaSendGrid(feedback),
        () => this.sendViaMailgun(feedback)
      ];

      for (const service of services) {
        try {
          const result = await service();
          if (result) {
            console.log('📧 [RELIABLE EMAIL] Email sent successfully via service');
            return true;
          }
        } catch (error) {
          console.log('📧 [RELIABLE EMAIL] Service failed:', error.message);
          continue;
        }
      }

      // If all services fail, log the feedback
      console.log('📧 [RELIABLE EMAIL] All services failed - logging feedback');
      this.logFeedback(feedback);
      return false;

    } catch (error) {
      console.error('❌ [RELIABLE EMAIL] Error:', error);
      this.logFeedback(feedback);
      return false;
    }
  }

  async sendViaEmailJS(feedback) {
    return new Promise((resolve) => {
      const payload = {
        service_id: this.serviceId,
        template_id: this.templateId,
        user_id: this.publicKey,
        template_params: {
          to_email: 'revotechSB@gmail.com',
          from_name: 'SalesBuddy Feedback System',
          subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
          message: this.generateEmailText(feedback),
          feedback_title: feedback.title,
          feedback_description: feedback.description,
          feedback_user: feedback.userName,
          feedback_email: feedback.userEmail,
          feedback_priority: feedback.priority,
          feedback_type: feedback.type,
          feedback_url: feedback.url,
          feedback_timestamp: feedback.createdAt
        }
      };

      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'api.emailjs.com',
        port: 443,
        path: '/api/v1.0/email/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        console.log('📧 [RELIABLE EMAIL] EmailJS response:', res.statusCode);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on('error', (error) => {
        console.error('❌ [RELIABLE EMAIL] EmailJS error:', error.message);
        resolve(false);
      });

      req.on('timeout', () => {
        console.error('❌ [RELIABLE EMAIL] EmailJS timeout');
        req.destroy();
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }

  async sendViaResend(feedback) {
    return new Promise((resolve) => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.log('📧 [RELIABLE EMAIL] No Resend API key configured');
        resolve(false);
        return;
      }

      const payload = {
        from: 'SalesBuddy <noreply@salesbuddy.pro>',
        to: ['revotechSB@gmail.com'],
        subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
        html: this.generateEmailHTML(feedback)
      };

      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        console.log('📧 [RELIABLE EMAIL] Resend response:', res.statusCode);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on('error', (error) => {
        console.error('❌ [RELIABLE EMAIL] Resend error:', error.message);
        resolve(false);
      });

      req.on('timeout', () => {
        console.error('❌ [RELIABLE EMAIL] Resend timeout');
        req.destroy();
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }

  async sendViaSendGrid(feedback) {
    return new Promise((resolve) => {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) {
        console.log('📧 [RELIABLE EMAIL] No SendGrid API key configured');
        resolve(false);
        return;
      }

      const payload = {
        personalizations: [{
          to: [{ email: 'revotechSB@gmail.com' }]
        }],
        from: { email: 'noreply@salesbuddy.pro', name: 'SalesBuddy Feedback' },
        subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
        content: [{
          type: 'text/html',
          value: this.generateEmailHTML(feedback)
        }]
      };

      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'api.sendgrid.com',
        port: 443,
        path: '/v3/mail/send',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        console.log('📧 [RELIABLE EMAIL] SendGrid response:', res.statusCode);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on('error', (error) => {
        console.error('❌ [RELIABLE EMAIL] SendGrid error:', error.message);
        resolve(false);
      });

      req.on('timeout', () => {
        console.error('❌ [RELIABLE EMAIL] SendGrid timeout');
        req.destroy();
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }

  async sendViaMailgun(feedback) {
    return new Promise((resolve) => {
      const apiKey = process.env.MAILGUN_API_KEY;
      const domain = process.env.MAILGUN_DOMAIN;
      if (!apiKey || !domain) {
        console.log('📧 [RELIABLE EMAIL] No Mailgun credentials configured');
        resolve(false);
        return;
      }

      const formData = new URLSearchParams({
        from: 'SalesBuddy Feedback <noreply@salesbuddy.pro>',
        to: 'revotechSB@gmail.com',
        subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
        html: this.generateEmailHTML(feedback)
      });

      const options = {
        hostname: 'api.mailgun.net',
        port: 443,
        path: `/v3/${domain}/messages`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formData.toString())
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        console.log('📧 [RELIABLE EMAIL] Mailgun response:', res.statusCode);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on('error', (error) => {
        console.error('❌ [RELIABLE EMAIL] Mailgun error:', error.message);
        resolve(false);
      });

      req.on('timeout', () => {
        console.error('❌ [RELIABLE EMAIL] Mailgun timeout');
        req.destroy();
        resolve(false);
      });

      req.write(formData.toString());
      req.end();
    });
  }

  generateEmailHTML(feedback) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; background: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          🚨 High Priority Feedback Received
        </h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin-top: 0;">Feedback Details</h3>
          <p><strong>Title:</strong> ${feedback.title}</p>
          <p><strong>Description:</strong> ${feedback.description}</p>
          <p><strong>User:</strong> ${feedback.userName} (${feedback.userEmail})</p>
          <p><strong>Priority:</strong> <span style="color: #dc2626; font-weight: bold;">${feedback.priority.toUpperCase()}</span></p>
          <p><strong>Type:</strong> ${feedback.type}</p>
          <p><strong>URL:</strong> <a href="${feedback.url}">${feedback.url}</a></p>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 14px; color: #6b7280;">
          <p><strong>User Agent:</strong> ${feedback.userAgent}</p>
          <p><strong>Timestamp:</strong> ${feedback.createdAt}</p>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          <em>This is an automated notification from SalesBuddy Beta Feedback System.</em>
        </p>
      </div>
    `;
  }

  generateEmailText(feedback) {
    return `
🚨 HIGH PRIORITY FEEDBACK RECEIVED

Title: ${feedback.title}
Description: ${feedback.description}
User: ${feedback.userName} (${feedback.userEmail})
Priority: ${feedback.priority.toUpperCase()}
Type: ${feedback.type}
URL: ${feedback.url}
User Agent: ${feedback.userAgent}
Timestamp: ${feedback.createdAt}

This is an automated notification from SalesBuddy Beta Feedback System.
    `.trim();
  }

  logFeedback(feedback) {
    console.log('📧 [RELIABLE EMAIL] HIGH PRIORITY FEEDBACK LOGGED:');
    console.log('📧 [RELIABLE EMAIL] =================================');
    console.log('📧 [RELIABLE EMAIL] Title:', feedback.title);
    console.log('📧 [RELIABLE EMAIL] Description:', feedback.description);
    console.log('📧 [RELIABLE EMAIL] User:', feedback.userName);
    console.log('📧 [RELIABLE EMAIL] Email:', feedback.userEmail);
    console.log('📧 [RELIABLE EMAIL] Priority:', feedback.priority);
    console.log('📧 [RELIABLE EMAIL] Type:', feedback.type);
    console.log('📧 [RELIABLE EMAIL] URL:', feedback.url);
    console.log('📧 [RELIABLE EMAIL] User Agent:', feedback.userAgent);
    console.log('📧 [RELIABLE EMAIL] Timestamp:', feedback.createdAt);
    console.log('📧 [RELIABLE EMAIL] =================================');
  }
}

module.exports = new ReliableEmailService();
