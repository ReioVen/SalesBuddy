const nodemailer = require('nodemailer');
const axios = require('axios');

// Create multiple transporter configurations for fallback
const createTransporter = (config = 'gmail') => {
  const configs = {
    gmail: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 3000, // 3 seconds
      socketTimeout: 5000, // 5 seconds
      pool: false,
      maxConnections: 1,
      maxMessages: 1
    },
    gmail_ssl: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
      pool: false,
      maxConnections: 1,
      maxMessages: 1
    },
    outlook: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 5000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
      pool: false,
      maxConnections: 1,
      maxMessages: 1
    }
  };
  
  return nodemailer.createTransport(configs[config] || configs.gmail);
};

// Webhook-based email service (works on Railway)
const sendEmailViaWebhook = async (email, subject, html) => {
  try {
    console.log('📧 [WEBHOOK EMAIL] Sending email via webhook...');
    
    // Using a webhook service like Zapier, IFTTT, or custom webhook
    const webhookUrl = process.env.EMAIL_WEBHOOK_URL || 'https://hooks.zapier.com/hooks/catch/your-webhook-url';
    
    const webhookData = {
      to: email,
      subject: subject,
      html: html,
      from: 'SalesBuddy <noreply@salesbuddy.pro>',
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(webhookUrl, webhookData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ [WEBHOOK EMAIL] Email sent successfully via webhook:', response.status);
    return { success: true, messageId: `webhook-${Date.now()}` };
    
  } catch (error) {
    console.error('❌ [WEBHOOK EMAIL] Webhook email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send password reset email with HTTP first, then SMTP fallback
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">SalesBuddy</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">AI-Powered Sales Assistant</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Password Reset Request</h2>
        
        <p style="color: #374151; margin: 0 0 20px 0;">
          Hi ${firstName},
        </p>
        
        <p style="color: #374151; margin: 0 0 20px 0;">
          We received a request to reset your password for your SalesBuddy account. 
          Click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 5px 0 0 0;">
          ${resetUrl}
        </p>
      </div>
      
      <div style="text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">
          This link will expire in 1 hour for security reasons.
        </p>
        <p style="margin: 0;">
          If you didn't request this password reset, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 30px;">
        <p style="margin: 0;">
          Best regards,<br>
          The SalesBuddy Team
        </p>
      </div>
    </div>
  `;

  // Try webhook-based email first (works on Railway)
  console.log('📧 [EMAIL SERVICE] Trying webhook-based email service...');
  const webhookResult = await sendEmailViaWebhook(email, 'Password Reset - SalesBuddy', html);
  
  if (webhookResult.success) {
    console.log('✅ [EMAIL SERVICE] Webhook email sent successfully');
    return webhookResult;
  }
  
  console.log('❌ [EMAIL SERVICE] Webhook email failed, trying SMTP fallback...');
  
  // Fallback to SMTP configurations
  const configs = ['gmail', 'gmail_ssl', 'outlook'];
  let lastError;
  
  for (const config of configs) {
    try {
      console.log(`📧 [EMAIL SERVICE] Trying ${config} configuration...`);
      const transporter = createTransporter(config);
    
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'SalesBuddy',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Password Reset - SalesBuddy',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">SalesBuddy</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">AI-Powered Sales Assistant</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Password Reset Request</h2>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              Hi ${firstName},
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              We received a request to reset your password for your SalesBuddy account. 
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 5px 0 0 0;">
              ${resetUrl}
            </p>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0 0 10px 0;">
              This link will expire in 1 hour for security reasons.
            </p>
            <p style="margin: 0;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset - SalesBuddy
        
        Hi ${firstName},
        
        We received a request to reset your password for your SalesBuddy account.
        
        Click this link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The SalesBuddy Team
      `
    };

      console.log(`📧 [EMAIL SERVICE] Sending email via ${config}...`);
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL SERVICE] Password reset email sent successfully via ${config}:`, result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ [EMAIL SERVICE] ${config} configuration failed:`, error.message);
      
      // Try next configuration
      if (configs.indexOf(config) < configs.length - 1) {
        console.log(`🔄 [EMAIL SERVICE] Trying next configuration...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // All configurations failed
  console.error(`❌ [EMAIL SERVICE] All configurations failed. Last error:`, lastError.message);
  return { success: false, error: lastError.message };
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'SalesBuddy',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Welcome to SalesBuddy!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">SalesBuddy</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">AI-Powered Sales Assistant</p>
          </div>
          
          <div style="background: #f0f9ff; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to SalesBuddy!</h2>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              Hi ${firstName},
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              Welcome to SalesBuddy! We're excited to help you improve your sales conversations 
              with our AI-powered assistant.
            </p>
            
            <div style="background: white; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0;">Getting Started:</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px;">
                <li>Start your first AI conversation</li>
                <li>Explore our sales tips and lessons</li>
                <li>Customize your experience in settings</li>
                <li>Upgrade your plan for more features</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/conversations" 
                 style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Start Your First Conversation
              </a>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">
              Thank you for choosing SalesBuddy!
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email service is ready');
    return { success: true };
  } catch (error) {
    console.error('Email service configuration error:', error);
    return { success: false, error: error.message };
  }
};

// Send feedback email
const sendFeedbackEmail = async (feedback) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'SalesBuddy',
        address: process.env.EMAIL_USER
      },
      to: 'revotechSB@gmail.com',
      subject: `🚨 HIGH PRIORITY FEEDBACK: ${feedback.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">🚨 High Priority Feedback</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">SalesBuddy Beta Feedback System</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Feedback Details</h2>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              <strong>Title:</strong> ${feedback.title}
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              <strong>Description:</strong><br>
              <span style="background: #f9fafb; padding: 10px; border-radius: 4px; display: block; margin-top: 5px;">${feedback.description}</span>
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              <strong>User:</strong> ${feedback.userName} (${feedback.userEmail})
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              <strong>Priority:</strong> <span style="color: #dc2626; font-weight: bold;">${feedback.priority.toUpperCase()}</span>
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              <strong>Type:</strong> ${feedback.type}
            </p>
            
            <p style="color: #374151; margin: 0 0 20px 0;">
              <strong>URL:</strong> <a href="${feedback.url}" style="color: #2563eb;">${feedback.url}</a>
            </p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                <strong>User Agent:</strong><br>
                <span style="font-size: 12px; word-break: break-all;">${feedback.userAgent}</span>
              </p>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                <strong>Timestamp:</strong> ${feedback.createdAt}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from SalesBuddy Beta Feedback System.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('📧 [EMAIL SERVICE] Feedback email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Error sending feedback email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendFeedbackEmail,
  testEmailConnection
};
