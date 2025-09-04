const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = require('../config/env');

// Validate SMTP configuration
if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn('SMTP configuration is incomplete. Email functionality will be disabled.');
  console.warn('Required environment variables: SMTP_HOST, SMTP_USER, SMTP_PASS');
  console.warn('Optional: SMTP_PORT (default: 587), SMTP_FROM');
}

// Create transporter only if SMTP is configured
const transporter = SMTP_HOST && SMTP_USER && SMTP_PASS ? nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT || 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
}) : null;

// Function to send welcome email
const sendWelcomeEmail = async (user) => {
  // Skip if SMTP is not configured
  if (!transporter) {
    console.log('SMTP not configured - skipping welcome email');
    console.log('SMTP Config:', { SMTP_HOST, SMTP_USER, SMTP_PASS: SMTP_PASS ? '***' : 'missing' });
    return;
  }

  try {
    await transporter.verify();
    console.log('SMTP connection verified');
    
    const mailOptions = {
      from: SMTP_FROM || SMTP_USER,
      to: user.email,
      subject: 'Welcome to Nexora - Your Project Management Journey Begins!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Welcome to Nexora, ${user.firstName}!</h1>
          <p>Thank you for joining our project management platform. We're excited to have you on board!</p>
          <p>With Nexora, you can:</p>
          <ul>
            <li>Create and manage projects efficiently</li>
            <li>Collaborate with your team members</li>
            <li>Track tasks and progress</li>
            <li>Organize facilities and resources</li>
          </ul>
          <p>Get started by logging into your account and exploring the dashboard.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The Nexora Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to avoid breaking the registration process
  }
};

module.exports = {
  sendWelcomeEmail
};