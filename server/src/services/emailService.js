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

// Function to send notification email
const sendEmailNotification = async (userEmail, notification) => {
  // Skip if SMTP is not configured
  if (!transporter) {
    return;
  }

  try {
    await transporter.verify();
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const actionUrl = notification.actionUrl ? `${clientUrl}${notification.actionUrl}` : `${clientUrl}/dashboard`;
    
    // Get priority color
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 'urgent': return '#dc2626';
        case 'high': return '#ea580c';
        case 'normal': return '#10b981';
        case 'low': return '#6b7280';
        default: return '#10b981';
      }
    };

    // Get category icon
    const getCategoryIcon = (category) => {
      switch (category) {
        case 'task': return '📋';
        case 'project': return '📁';
        case 'facility': return '🏢';
        case 'system': return '⚙️';
        case 'communication': return '💬';
        default: return '🔔';
      }
    };

    const priorityColor = getPriorityColor(notification.priority);
    const categoryIcon = getCategoryIcon(notification.category);
    
    const mailOptions = {
      from: SMTP_FROM || SMTP_USER,
      to: userEmail,
      subject: `${categoryIcon} ${notification.title} - Nexora`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin-bottom: 10px;">Nexora</h1>
            <h2 style="color: #374151; margin-top: 0;">Notification</h2>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${priorityColor};">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <span style="font-size: 24px; margin-right: 10px;">${categoryIcon}</span>
              <h3 style="color: #374151; margin: 0; font-size: 18px;">${notification.title}</h3>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 15px;">
              ${notification.message}
            </p>
            
            ${notification.data && Object.keys(notification.data).length > 0 ? `
              <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin-top: 15px; border: 1px solid #e5e7eb;">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Additional Details:</h4>
                ${Object.entries(notification.data).map(([key, value]) => `
                  <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                    <strong>${key}:</strong> ${value}
                  </p>
                `).join('')}
              </div>
            ` : ''}
          </div>
          
          ${notification.actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" 
                 style="background-color: ${priorityColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Details
              </a>
            </div>
          ` : ''}
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              <strong>Priority:</strong> ${notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)} | 
              <strong>Category:</strong> ${notification.category.charAt(0).toUpperCase() + notification.category.slice(1)} | 
              <strong>Time:</strong> ${new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              You received this notification because you have email notifications enabled in your Nexora settings.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
              To manage your notification preferences, log into your Nexora account and go to Settings > Notifications.
            </p>
            
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              If you don't want to receive these emails, you can disable email notifications in your account settings.
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
    console.error('Error sending notification email:', error);
    throw new Error('Failed to send notification email');
  }
};

module.exports = {
  sendWelcomeEmail,
  sendFacilityInvitationEmail,
  sendFacilityInvitationToExistingUser,
  sendEmailNotification
};
