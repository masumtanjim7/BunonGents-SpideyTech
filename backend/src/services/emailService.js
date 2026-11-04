const nodemailer = require('nodemailer');

// Hardcoded SMTP credentials directly in code (no .env required)
const DEFAULT_SMTP_USER = 'bunongents@gmail.com';
const DEFAULT_SMTP_PASS = 'dtqjzcpinpilmrhg'; // Google App Password (dtqj zcpi npil mrhg)

/**
 * Creates and returns a nodemailer transporter configured with Gmail.
 */
const getTransporter = () => {
  const user =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    DEFAULT_SMTP_USER;

  const rawPass =
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    DEFAULT_SMTP_PASS;

  const pass = rawPass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send 6-digit OTP email to User or Admin for Password Reset.
 */
const sendPasswordResetOtp = async ({ to, otp, userName, role, adminName }) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn(`[EmailService] Skipping OTP email to ${to}: Transporter not configured.`);
      return { success: false, reason: 'Transporter not configured' };
    }

    const senderEmail = process.env.SMTP_USER || DEFAULT_SMTP_USER;
    const name = userName || adminName || (role === 'admin' ? 'Administrator' : 'Customer');
    const isAdmin = role === 'admin';

    const portalTitle = isAdmin ? 'Administration Portal' : 'Account Security';
    const accountType = isAdmin ? 'Bunon Gents Administrator account' : 'Bunon Gents account';

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f3ee; margin: 0; padding: 24px; color: #11241c; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #d7ded8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background-color: #11241c; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; color: #ffffff; }
          .header p { margin: 6px 0 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #e5c158; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #33443d; margin-bottom: 24px; }
          .otp-box { background: #f4f3ee; border: 2px dashed #11241c; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #11241c; margin: 0; font-family: monospace; }
          .expiry { font-size: 12px; color: #73847c; margin-top: 8px; }
          .footer { background: #faf9f6; border-top: 1px solid #ebf0ec; padding: 20px 24px; text-align: center; font-size: 11px; color: #73847c; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BUNON GENTS</h1>
            <p>${portalTitle}</p>
          </div>
          <div class="content">
            <div class="greeting">Hello, ${name}</div>
            <p class="text">
              We received a request to reset the password for your ${accountType}. Use the verification code below to authorize this request:
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">This one-time passcode expires in <strong>10 minutes</strong>.</div>
            </div>
            <p class="text">
              If you did not request a password reset, please ignore this email or contact customer support. No changes have been made to your account.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Bunon Gents. All rights reserved.<br/>
            Security Verification Service &bull; Dhaka, Bangladesh
          </div>
        </div>
      </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Bunon Gents" <${senderEmail}>`,
      to,
      subject: `[BUNON GENTS] Password Reset Verification Code: ${otp}`,
      text: `Your Bunon Gents password reset code is: ${otp}. It expires in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[EmailService] OTP email sent to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Error sending OTP email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendAdminPasswordResetOtp = sendPasswordResetOtp;

/**
 * Format BDT currency helper
 */
const formatBDT = (amount) => `৳${Number(amount || 0).toLocaleString('en-BD')}`;

/**
 * Send Order Confirmation Email to Customer (and optionally store copy)
 */
const sendOrderConfirmationEmail = async (order) => {
  try {
    const recipient = order.customerEmail;
    if (!recipient || !recipient.includes('@')) {
      console.log(`[EmailService] Skipping order confirmation email for order #${order.orderNumber}: No valid customer email provided.`);
      return { success: false, reason: 'No customer email' };
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn(`[EmailService] Skipping order email: Transporter not configured.`);
      return { success: false, reason: 'Transporter not configured' };
    }

    const senderEmail = process.env.SMTP_USER || DEFAULT_SMTP_USER;

    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #ebf0ec;">
          <td style="padding: 12px 0;">
            <div style="font-weight: 600; font-size: 14px; color: #11241c;">${item.title}</div>
            <div style="font-size: 11px; color: #73847c;">Size: ${item.size || 'M'} &bull; Color: ${item.color || 'Default'}</div>
          </td>
          <td style="padding: 12px 8px; text-align: center; font-size: 13px; color: #11241c;">&times; ${item.quantity || 1}</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 14px; color: #11241c;">
            ${formatBDT((item.price || 0) * (item.quantity || 1))}
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f3ee; margin: 0; padding: 24px; color: #11241c; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #d7ded8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background-color: #11241c; padding: 36px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 26px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; color: #ffffff; }
          .header p { margin: 6px 0 0; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #e5c158; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; background: #eef5f1; color: #1a4d34; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
          .order-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #11241c; }
          .order-subtitle { font-size: 13px; color: #556b60; line-height: 1.5; margin-bottom: 24px; }
          .card { background: #faf9f6; border: 1px solid #ebf0ec; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
          .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700; color: #73847c; margin-bottom: 8px; }
          .card-text { font-size: 13px; line-height: 1.6; color: #11241c; margin: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #4a5c54; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0 0; font-size: 17px; font-weight: 700; color: #11241c; border-top: 2px solid #11241c; margin-top: 8px; }
          .footer { background: #faf9f6; border-top: 1px solid #ebf0ec; padding: 24px; text-align: center; font-size: 11px; color: #73847c; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BUNON GENTS</h1>
            <p>Everyday Modern Essentials</p>
          </div>
          <div class="content">
            <span class="badge">Order Received &amp; Confirmed</span>
            <h2 class="order-title">Thank you, ${order.customerName}!</h2>
            <p class="order-subtitle">
              Your order <strong>#${order.orderNumber}</strong> has been successfully placed. We are preparing your pieces with care and will keep you updated.
            </p>

            <div class="card">
              <div class="card-title">Delivery Details</div>
              <p class="card-text">
                <strong>Recipient:</strong> ${order.customerName} (${order.customerPhone})<br/>
                <strong>Address:</strong> ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || 'Dhaka'} (${order.shippingAddress?.deliveryZone || 'Inside Dhaka'})<br/>
                <strong>Payment Method:</strong> ${order.paymentMethod || 'COD'} (${order.paymentStatus || 'Pending'})
                ${order.paymentDetails?.transactionId ? `<br/><strong>TrxID:</strong> ${order.paymentDetails.transactionId}` : ''}
              </p>
            </div>

            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #11241c; margin-bottom: 12px;">
              Items in Your Order
            </div>
            <table>
              <thead>
                <tr style="border-bottom: 1px solid #d7ded8; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #73847c;">
                  <th style="padding-bottom: 8px;">Item</th>
                  <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                  <th style="padding-bottom: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background: #faf9f6; border-radius: 12px; padding: 16px; border: 1px solid #ebf0ec;">
              <div style="display: table; width: 100%;">
                <div style="display: table-row;">
                  <span style="display: table-cell; font-size: 13px; color: #556b60; padding: 4px 0;">Subtotal</span>
                  <span style="display: table-cell; font-size: 13px; text-align: right; font-weight: 500; padding: 4px 0;">${formatBDT(order.subtotal)}</span>
                </div>
                <div style="display: table-row;">
                  <span style="display: table-cell; font-size: 13px; color: #556b60; padding: 4px 0;">Delivery Fee (${order.shippingAddress?.deliveryZone || 'Standard'})</span>
                  <span style="display: table-cell; font-size: 13px; text-align: right; font-weight: 500; padding: 4px 0;">${formatBDT(order.shippingCost)}</span>
                </div>
                <div style="display: table-row; border-top: 1px solid #d7ded8;">
                  <span style="display: table-cell; font-size: 16px; font-weight: 700; color: #11241c; padding: 10px 0 0;">Total Amount</span>
                  <span style="display: table-cell; font-size: 16px; font-weight: 700; color: #11241c; text-align: right; padding: 10px 0 0;">${formatBDT(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            You can track your order status anytime at <strong>bunongents.com/track-order</strong> using Order #<strong>${order.orderNumber}</strong> or your phone number.<br/><br/>
            &copy; ${new Date().getFullYear()} Bunon Gents &bull; Dhaka, Bangladesh
          </div>
        </div>
      </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Bunon Gents" <${senderEmail}>`,
      to: recipient,
      subject: `Order Confirmed: #${order.orderNumber} - Bunon Gents`,
      text: `Thank you for your order #${order.orderNumber}! Total: ${formatBDT(order.totalAmount)}. Track status at bunongents.com/track-order.`,
      html: htmlContent,
    });

    console.log(`[EmailService] Order confirmation email sent to ${recipient} for #${order.orderNumber}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Error sending order confirmation email for #${order.orderNumber}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Order Status Update Email to Customer (e.g., when Admin clicks 'Confirmed')
 */
const sendOrderStatusUpdateEmail = async (order) => {
  try {
    const recipient = order.customerEmail;
    if (!recipient || !recipient.includes('@')) return { success: false, reason: 'No customer email' };

    const transporter = getTransporter();
    if (!transporter) return { success: false, reason: 'Transporter not configured' };

    const senderEmail = process.env.SMTP_USER || DEFAULT_SMTP_USER;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f3ee; margin: 0; padding: 24px; color: #11241c; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #d7ded8; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
          .header { background-color: #11241c; padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 700; color: #ffffff; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; background: #eef5f1; color: #1a4d34; font-size: 13px; font-weight: 700; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 700; margin: 0 0 10px; color: #11241c; }
          .text { font-size: 14px; line-height: 1.6; color: #33443d; margin-bottom: 20px; }
          .box { background: #faf9f6; border-radius: 12px; padding: 18px; border: 1px solid #ebf0ec; margin-bottom: 24px; font-size: 13px; }
          .footer { background: #faf9f6; border-top: 1px solid #ebf0ec; padding: 20px; text-align: center; font-size: 11px; color: #73847c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BUNON GENTS</h1>
          </div>
          <div class="content">
            <span class="badge">Status: ${order.orderStatus}</span>
            <h2 class="title">Update on Order #${order.orderNumber}</h2>
            <p class="text">
              Dear ${order.customerName},<br/><br/>
              Great news! Your order status has been updated to <strong>${order.orderStatus}</strong>.
            </p>
            <div class="box">
              <strong>Order Number:</strong> #${order.orderNumber}<br/>
              <strong>Total Amount:</strong> ${formatBDT(order.totalAmount)}<br/>
              <strong>Delivery Zone:</strong> ${order.shippingAddress?.deliveryZone || 'Dhaka'}<br/>
              <strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})
            </div>
            <p class="text">
              Thank you for shopping with Bunon Gents. We will notify you once your package is dispatched for delivery.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Bunon Gents &bull; Dhaka, Bangladesh
          </div>
        </div>
      </body>
    </html>
    `;

    const info = await transporter.sendMail({
      from: `"Bunon Gents" <${senderEmail}>`,
      to: recipient,
      subject: `Order #${order.orderNumber} Update: ${order.orderStatus} - Bunon Gents`,
      text: `Your Bunon Gents order #${order.orderNumber} status is now: ${order.orderStatus}.`,
      html: htmlContent,
    });

    console.log(`[EmailService] Order status update email sent to ${recipient} for #${order.orderNumber}. ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Error sending status update email for #${order.orderNumber}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetOtp,
  sendAdminPasswordResetOtp,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
};
