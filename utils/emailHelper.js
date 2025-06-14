const nodemailer = require('nodemailer');
const { formatDate, formatDateTime } = require('./dateHelper');

// Create email transporter
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // Add additional options for development
  if (process.env.NODE_ENV === 'development') {
    config.debug = true;
    config.logger = true;
  }

  return nodemailer.createTransporter(config);
};

// Validate email configuration
const validateEmailConfig = () => {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`Missing email configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

// Send email function
const sendEmail = async (options) => {
  if (!validateEmailConfig()) {
    throw new Error('Email configuration is incomplete');
  }

  const {
    to,
    subject,
    html,
    text,
    attachments = [],
    from = process.env.SMTP_USER,
    cc = null,
    bcc = null
  } = options;

  const transporter = createTransporter();

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'ISP Inventory'}" <${from}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text,
    attachments
  };

  if (cc) {
    mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
  }

  if (bcc) {
    mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  // Welcome email template
  welcome: (user) => ({
    subject: `Welcome to ${process.env.APP_NAME || 'ISP Inventory System'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome ${user.full_name}!</h2>
        <p>Your account has been successfully created in our ISP Inventory Management System.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Account Details:</h3>
          <p><strong>Username:</strong> ${user.username}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.userLevel?.level_name || user.user_level_id}</p>
          <p><strong>Department:</strong> ${user.department || 'Not specified'}</p>
        </div>
        
        <p>Please keep your login credentials secure and contact your administrator if you need any assistance.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>This is an automated message from ${process.env.APP_NAME || 'ISP Inventory System'}.</p>
        </div>
      </div>
    `,
    text: `Welcome ${user.full_name}! Your account has been created. Username: ${user.username}, Role: ${user.userLevel?.level_name || user.user_level_id}`
  }),

  // Password reset email
  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${user.full_name},</p>
        <p>You have requested to reset your password. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.APP_URL}/reset-password?token=${resetToken}" 
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>If the button doesn't work, copy and paste this link: ${process.env.APP_URL}/reset-password?token=${resetToken}</p>
        </div>
      </div>
    `,
    text: `Password reset requested for ${user.full_name}. Reset link: ${process.env.APP_URL}/reset-password?token=${resetToken}`
  }),

  // Low stock alert email
  lowStockAlert: (categories) => ({
    subject: 'Low Stock Alert - Inventory Management',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">⚠️ Low Stock Alert</h2>
        <p>The following items are running low in stock and need attention:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Category</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Current Stock</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Reorder Point</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Unit</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map(cat => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${cat.name} (${cat.code})</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #dc3545; font-weight: bold;">${cat.current_stock}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${cat.reorder_point}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${cat.unit || 'Unit'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p>Please review and reorder these items as necessary.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>Generated on ${formatDateTime(new Date())}</p>
        </div>
      </div>
    `,
    text: `Low Stock Alert: ${categories.map(c => `${c.name}: ${c.current_stock} ${c.unit || 'units'}`).join(', ')}`
  }),

  // Transaction notification email
  transactionNotification: (transaction) => ({
    subject: `Transaction ${transaction.transaction_type.toUpperCase()} - ${transaction.reference_no || transaction.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Transaction Notification</h2>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Transaction Details:</h3>
          <p><strong>Type:</strong> ${transaction.transaction_type.toUpperCase()}</p>
          <p><strong>Reference:</strong> ${transaction.reference_no || transaction.id}</p>
          <p><strong>Person:</strong> ${transaction.first_person}</p>
          ${transaction.second_person ? `<p><strong>To/From:</strong> ${transaction.second_person}</p>` : ''}
          <p><strong>Location:</strong> ${transaction.location}</p>
          <p><strong>Date:</strong> ${formatDateTime(transaction.transaction_date)}</p>
          <p><strong>Status:</strong> <span style="padding: 3px 8px; border-radius: 3px; background: ${transaction.status === 'closed' ? '#d4edda' : '#fff3cd'}; color: ${transaction.status === 'closed' ? '#155724' : '#856404'};">${transaction.status.toUpperCase()}</span></p>
        </div>
        
        ${transaction.items && transaction.items.length > 0 ? `
          <h3>Items:</h3>
          <ul>
            ${transaction.items.map(item => `
              <li>${item.product?.brand || ''} ${item.product?.model || item.product_id} (Qty: ${item.quantity})</li>
            `).join('')}
          </ul>
        ` : ''}
        
        ${transaction.notes ? `<p><strong>Notes:</strong> ${transaction.notes}</p>` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>Transaction created by ${transaction.created_by || 'System'}</p>
        </div>
      </div>
    `,
    text: `Transaction ${transaction.transaction_type} - ${transaction.reference_no || transaction.id} at ${transaction.location} by ${transaction.first_person}`
  }),

  // Purchase receipt notification
  purchaseNotification: (receipt) => ({
    subject: `Purchase Receipt - ${receipt.receipt_number}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Purchase Receipt Notification</h2>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Receipt Details:</h3>
          <p><strong>Receipt Number:</strong> ${receipt.receipt_number}</p>
          <p><strong>PO Number:</strong> ${receipt.po_number}</p>
          <p><strong>Supplier:</strong> ${receipt.supplier?.name || 'Unknown'}</p>
          <p><strong>Date:</strong> ${formatDate(receipt.receipt_date)}</p>
          <p><strong>Total Amount:</strong> Rp ${receipt.total_amount?.toLocaleString('id-ID') || '0'}</p>
          <p><strong>Status:</strong> ${receipt.status.toUpperCase()}</p>
        </div>
        
        ${receipt.items && receipt.items.length > 0 ? `
          <h3>Items:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Category</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Quantity</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Unit Price</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.items.map(item => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.category?.name || 'Unknown'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">Rp ${item.unit_price?.toLocaleString('id-ID') || '0'}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">Rp ${item.total_price?.toLocaleString('id-ID') || '0'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          <p>Created by ${receipt.created_by || 'System'}</p>
        </div>
      </div>
    `,
    text: `Purchase receipt ${receipt.receipt_number} from ${receipt.supplier?.name} - Rp ${receipt.total_amount?.toLocaleString('id-ID')}`
  })
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  if (!user.email) {
    console.warn('Cannot send welcome email: user has no email address');
    return { success: false, reason: 'No email address' };
  }

  const template = emailTemplates.welcome(user);
  
  return await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  if (!user.email) {
    throw new Error('User has no email address');
  }

  const template = emailTemplates.passwordReset(user, resetToken);
  
  return await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// Send low stock alert email
const sendLowStockAlert = async (categories, recipients) => {
  if (!recipients || recipients.length === 0) {
    console.warn('Cannot send low stock alert: no recipients specified');
    return { success: false, reason: 'No recipients' };
  }

  const template = emailTemplates.lowStockAlert(categories);
  
  return await sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// Send transaction notification email
const sendTransactionNotification = async (transaction, recipients) => {
  if (!recipients || recipients.length === 0) {
    console.warn('Cannot send transaction notification: no recipients specified');
    return { success: false, reason: 'No recipients' };
  }

  const template = emailTemplates.transactionNotification(transaction);
  
  return await sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// Send purchase notification email
const sendPurchaseNotification = async (receipt, recipients) => {
  if (!recipients || recipients.length === 0) {
    console.warn('Cannot send purchase notification: no recipients specified');
    return { success: false, reason: 'No recipients' };
  }

  const template = emailTemplates.purchaseNotification(receipt);
  
  return await sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// Send bulk emails with rate limiting
const sendBulkEmails = async (emails, rateLimit = 10) => {
  const results = [];
  const chunks = [];
  
  // Split emails into chunks
  for (let i = 0; i < emails.length; i += rateLimit) {
    chunks.push(emails.slice(i, i + rateLimit));
  }
  
  // Send chunks with delay
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkPromises = chunk.map(email => sendEmail(email));
    
    try {
      const chunkResults = await Promise.allSettled(chunkPromises);
      results.push(...chunkResults);
      
      // Add delay between chunks (except for last chunk)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error sending email chunk ${i}:`, error);
    }
  }
  
  return results;
};

// Test email configuration
const testEmailConfig = async () => {
  if (!validateEmailConfig()) {
    return { success: false, error: 'Email configuration incomplete' };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendLowStockAlert,
  sendTransactionNotification,
  sendPurchaseNotification,
  sendBulkEmails,
  testEmailConfig,
  validateEmailConfig,
  emailTemplates
};