const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  try {
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

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
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

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testEmailConnection
};
