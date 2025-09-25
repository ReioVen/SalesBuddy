const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP with robust configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000, // 5 seconds
    socketTimeout: 10000, // 10 seconds
    pool: false, // disable connection pooling
    maxConnections: 1,
    maxMessages: 1,
    rateDelta: 1000, // 1 second
    rateLimit: 1
  });
};

// Send password reset email with retry logic
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 [EMAIL SERVICE] Attempt ${attempt}/${maxRetries} - Creating transporter...`);
      const transporter = createTransporter();
    
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

      console.log(`📧 [EMAIL SERVICE] Attempt ${attempt}/${maxRetries} - Sending email...`);
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ [EMAIL SERVICE] Password reset email sent successfully on attempt ${attempt}:`, result.messageId);
      return { success: true, messageId: result.messageId };
      
    } catch (error) {
      lastError = error;
      console.error(`❌ [EMAIL SERVICE] Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`🔄 [EMAIL SERVICE] Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // All attempts failed
  console.error(`❌ [EMAIL SERVICE] All ${maxRetries} attempts failed. Last error:`, lastError.message);
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
