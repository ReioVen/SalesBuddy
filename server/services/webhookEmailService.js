const https = require('https');
const http = require('http');

class WebhookEmailService {
  constructor() {
    this.webhookUrl = process.env.EMAIL_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/your-webhook-url';
    this.fallbackEmail = process.env.FALLBACK_EMAIL || 'revotechSB@gmail.com';
  }

  async sendHighPriorityFeedbackNotification(feedback) {
    try {
      console.log('📧 [WEBHOOK EMAIL] Sending high priority feedback via webhook...');
      
      // Create webhook payload
      const payload = {
        to: this.fallbackEmail,
        subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
        html: this.generateEmailHTML(feedback),
        text: this.generateEmailText(feedback),
        feedback: {
          id: feedback._id,
          title: feedback.title,
          description: feedback.description,
          user: feedback.userName,
          email: feedback.userEmail,
          priority: feedback.priority,
          type: feedback.type,
          url: feedback.url,
          userAgent: feedback.userAgent,
          timestamp: feedback.createdAt
        }
      };

      // Try webhook first
      const webhookSent = await this.sendWebhook(payload);
      if (webhookSent) {
        console.log('📧 [WEBHOOK EMAIL] Webhook sent successfully');
        return true;
      }

      // If webhook fails, try direct HTTP POST to a simple email service
      const httpSent = await this.sendDirectHTTP(payload);
      if (httpSent) {
        console.log('📧 [WEBHOOK EMAIL] Direct HTTP sent successfully');
        return true;
      }

      // If all else fails, log the feedback
      console.log('📧 [WEBHOOK EMAIL] All methods failed - logging feedback');
      this.logFeedback(feedback);
      return false;

    } catch (error) {
      console.error('❌ [WEBHOOK EMAIL] Error sending feedback:', error);
      this.logFeedback(feedback);
      return false;
    }
  }

  async sendWebhook(payload) {
    return new Promise((resolve) => {
      if (!this.webhookUrl || this.webhookUrl.includes('your-webhook-url')) {
        console.log('📧 [WEBHOOK EMAIL] No webhook URL configured');
        resolve(false);
        return;
      }

      const postData = JSON.stringify(payload);
      const url = new URL(this.webhookUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000 // 10 second timeout
      };

      const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
        console.log('📧 [WEBHOOK EMAIL] Webhook response:', res.statusCode);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on('error', (error) => {
        console.error('❌ [WEBHOOK EMAIL] Webhook error:', error.message);
        resolve(false);
      });

      req.on('timeout', () => {
        console.error('❌ [WEBHOOK EMAIL] Webhook timeout');
        req.destroy();
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }

  async sendDirectHTTP(payload) {
    return new Promise((resolve) => {
      // Try to send to a simple email service endpoint
      const emailData = {
        to: this.fallbackEmail,
        subject: payload.subject,
        html: payload.html,
        from: 'SalesBuddy Feedback <noreply@salesbuddy.pro>'
      };

      const postData = JSON.stringify(emailData);
      
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
        console.log('📧 [WEBHOOK EMAIL] Direct HTTP response:', res.statusCode);
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });

      req.on('error', (error) => {
        console.error('❌ [WEBHOOK EMAIL] Direct HTTP error:', error.message);
        resolve(false);
      });

      req.on('timeout', () => {
        console.error('❌ [WEBHOOK EMAIL] Direct HTTP timeout');
        req.destroy();
        resolve(false);
      });

      req.write(postData);
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
    console.log('📧 [WEBHOOK EMAIL] HIGH PRIORITY FEEDBACK LOGGED:');
    console.log('📧 [WEBHOOK EMAIL] =================================');
    console.log('📧 [WEBHOOK EMAIL] Title:', feedback.title);
    console.log('📧 [WEBHOOK EMAIL] Description:', feedback.description);
    console.log('📧 [WEBHOOK EMAIL] User:', feedback.userName);
    console.log('📧 [WEBHOOK EMAIL] Email:', feedback.userEmail);
    console.log('📧 [WEBHOOK EMAIL] Priority:', feedback.priority);
    console.log('📧 [WEBHOOK EMAIL] Type:', feedback.type);
    console.log('📧 [WEBHOOK EMAIL] URL:', feedback.url);
    console.log('📧 [WEBHOOK EMAIL] User Agent:', feedback.userAgent);
    console.log('📧 [WEBHOOK EMAIL] Timestamp:', feedback.createdAt);
    console.log('📧 [WEBHOOK EMAIL] =================================');
  }
}

module.exports = new WebhookEmailService();
