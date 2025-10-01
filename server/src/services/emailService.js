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
    return;
  }

  try {
    await transporter.verify();
    
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
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to avoid breaking the registration process
  }
};

// Function to send facility invitation email
const sendFacilityInvitationEmail = async (inviteeEmail, invitation, facility, inviterName) => {
  // Skip if SMTP is not configured
  if (!transporter) {
    return;
  }

  try {
    await transporter.verify();
    
    const invitationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invitation/${invitation.invitationToken}`;
    const roleDisplayName = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);
    
    const mailOptions = {
      from: SMTP_FROM || SMTP_USER,
      to: inviteeEmail,
      subject: `You're invited to join ${facility.name} on Nexora`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin-bottom: 10px;">Nexora</h1>
            <h2 style="color: #374151; margin-top: 0;">Facility Invitation</h2>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
              <strong>${inviterName}</strong> has invited you to join the facility <strong>"${facility.name}"</strong> as a <strong>${roleDisplayName}</strong>.
            </p>
            
            ${facility.description ? `
              <p style="color: #6b7280; font-style: italic; margin-bottom: 15px;">
                "${facility.description}"
              </p>
            ` : ''}
            
            <p style="color: #374151; margin-bottom: 20px;">
              Join this facility to collaborate on projects, manage tasks, and work together with the team.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> This invitation will expire on ${new Date(invitation.expiresAt).toLocaleDateString()}. 
              Please accept it before then.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              If you don't have a Nexora account yet, you'll be prompted to create one when you accept this invitation.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              If the button above doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin-bottom: 20px;">
              ${invitationUrl}
            </p>
            
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Best regards,<br>
              The Nexora Team
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending facility invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
};

// Function to send facility invitation email to existing users
const sendFacilityInvitationToExistingUser = async (user, invitation, facility, inviterName) => {
  // Skip if SMTP is not configured
  if (!transporter) {
    return;
  }

  try {
    await transporter.verify();
    
    const invitationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invitation/${invitation.invitationToken}`;
    const roleDisplayName = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);
    
    const mailOptions = {
      from: SMTP_FROM || SMTP_USER,
      to: user.email,
      subject: `You're invited to join ${facility.name} on Nexora`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin-bottom: 10px;">Nexora</h1>
            <h2 style="color: #374151; margin-top: 0;">Facility Invitation</h2>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
              Hi <strong>${user.firstName || 'there'}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 15px;">
              <strong>${inviterName}</strong> has invited you to join the facility <strong>"${facility.name}"</strong> as a <strong>${roleDisplayName}</strong>.
            </p>
            
            ${facility.description ? `
              <p style="color: #6b7280; font-style: italic; margin-bottom: 15px;">
                "${facility.description}"
              </p>
            ` : ''}
            
            <p style="color: #374151; margin-bottom: 20px;">
              Since you already have a Nexora account, you can accept this invitation and start collaborating right away!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> This invitation will expire on ${new Date(invitation.expiresAt).toLocaleDateString()}. 
              Please accept it before then.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              You can also log into your Nexora account and check your notifications for this invitation.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              If the button above doesn't work, copy and paste this link into your browser:
            </p>
            
            <p style="color: #3b82f6; font-size: 14px; word-break: break-all; margin-bottom: 20px;">
              ${invitationUrl}
            </p>
            
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Best regards,<br>
              The Nexora Team
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending facility invitation email to existing user:', error);
    throw new Error('Failed to send invitation email');
  }
};

module.exports = {
  sendWelcomeEmail,
  sendFacilityInvitationEmail,
  sendFacilityInvitationToExistingUser
};
