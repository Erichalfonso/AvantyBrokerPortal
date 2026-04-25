import nodemailer from "nodemailer";

// Configure transporter based on environment
// For AWS SES: set SMTP_HOST=email-smtp.us-east-2.amazonaws.com, SMTP_PORT=587
// For development: uses ethereal test account if no SMTP config
function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
  }

  // Dev fallback: log to console instead of sending
  return null;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || "noreply@avantycare.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[email] (dev mode) Would send to: ${to}`);
    console.log(`[email] Subject: ${subject}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    console.log(`[email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[email] Failed to send to ${to}:`, error);
    return false;
  }
}

// ─── Email Templates ────────────────────────────────────

export function tripAssignedEmail(providerName: string, tripNumber: string, appointmentDate: string, pickupAddress: string) {
  return {
    subject: `New Trip Assignment: ${tripNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">New Trip Assigned</h2>
        <p>Hello ${providerName},</p>
        <p>A new trip has been assigned to you:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Trip #</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${tripNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Date</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${appointmentDate}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Pickup</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${pickupAddress}</td></tr>
        </table>
        <p>Please log in to accept or decline this assignment.</p>
        <a href="${process.env.NEXTAUTH_URL || "https://portal.avantycare.com"}/dashboard/trips/${tripNumber}"
           style="display: inline-block; padding: 12px 24px; background-color: #319795; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          View Trip
        </a>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}

export function tripStatusChangedEmail(recipientName: string, tripNumber: string, oldStatus: string, newStatus: string) {
  return {
    subject: `Trip ${tripNumber} Status: ${newStatus}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">Trip Status Updated</h2>
        <p>Hello ${recipientName},</p>
        <p>Trip <strong>${tripNumber}</strong> has been updated:</p>
        <p style="font-size: 18px; margin: 16px 0;">
          <span style="color: #718096;">${oldStatus}</span>
          &rarr;
          <span style="color: #319795; font-weight: bold;">${newStatus}</span>
        </p>
        <a href="${process.env.NEXTAUTH_URL || "https://portal.avantycare.com"}/dashboard/trips/${tripNumber}"
           style="display: inline-block; padding: 12px 24px; background-color: #319795; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          View Trip
        </a>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}

export function forgotPasswordEmail(name: string, resetUrl: string) {
  return {
    subject: "Reset your Avanty Care password",
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset the password for your Avanty Care account. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #319795; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #718096; font-size: 13px;">If the button doesn't work, paste this link into your browser:</p>
        <p style="color: #319795; font-size: 13px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #718096; font-size: 13px; margin-top: 24px;">If you did not request this reset, you can safely ignore this email — your password will not change.</p>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}

export function passwordResetEmail(name: string, tempPassword: string) {
  const loginUrl = `${process.env.NEXTAUTH_URL || "https://portal.avantycare.com"}/`;
  return {
    subject: "Your Avanty Care password has been reset",
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">Password Reset</h2>
        <p>Hello ${name},</p>
        <p>An administrator has reset your password. Use the temporary password below to sign in, then change it from your account settings.</p>
        <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace; font-size: 16px; color: #1a365d;">
          ${tempPassword}
        </div>
        <a href="${loginUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #319795; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Sign In
        </a>
        <p style="color: #718096; font-size: 13px; margin-top: 24px;">If you did not request this reset, contact your administrator immediately.</p>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}

export function reimbursementSubmittedEmail(
  recipientName: string,
  formNumber: string,
  formType: string,
  submitterName: string,
  totalAmount: number,
) {
  const reviewUrl = `${process.env.NEXTAUTH_URL || "https://portal.avantycare.com"}/dashboard/reimbursements/${formNumber}`;
  const formTypeLabel = formType.replace(/_/g, " ").toLowerCase();
  return {
    subject: `New ${formTypeLabel} submitted: ${formNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">Reimbursement Form Submitted</h2>
        <p>Hello ${recipientName},</p>
        <p>A new reimbursement form is awaiting review:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Form #</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${formNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Type</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${formTypeLabel}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Submitted by</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${submitterName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Total</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${totalAmount.toFixed(2)}</td></tr>
        </table>
        <a href="${reviewUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #319795; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Review Form
        </a>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}

export function reimbursementStatusChangedEmail(
  recipientName: string,
  formNumber: string,
  oldStatus: string,
  newStatus: string,
  reviewNotes?: string | null,
) {
  const formUrl = `${process.env.NEXTAUTH_URL || "https://portal.avantycare.com"}/dashboard/reimbursements/${formNumber}`;
  const notesBlock = reviewNotes
    ? `<p style="color: #718096; margin-top: 16px;"><strong>Review notes:</strong></p><div style="background: #f7fafc; border-left: 3px solid #319795; padding: 12px; margin-top: 8px; white-space: pre-wrap;">${reviewNotes}</div>`
    : "";
  return {
    subject: `Form ${formNumber} ${newStatus.toLowerCase()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">Reimbursement Form Update</h2>
        <p>Hello ${recipientName},</p>
        <p>Form <strong>${formNumber}</strong> has been updated:</p>
        <p style="font-size: 18px; margin: 16px 0;">
          <span style="color: #718096;">${oldStatus}</span>
          &rarr;
          <span style="color: #319795; font-weight: bold;">${newStatus}</span>
        </p>
        ${notesBlock}
        <a href="${formUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #319795; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          View Form
        </a>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}

export function complaintFiledEmail(
  recipientName: string,
  complaintNumber: string,
  category: string,
  description: string,
  providerName?: string | null,
) {
  const complaintUrl = `${process.env.NEXTAUTH_URL || "https://portal.avantycare.com"}/dashboard/complaints`;
  const providerRow = providerName
    ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Provider</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${providerName}</td></tr>`
    : "";
  const truncated = description.length > 280 ? description.slice(0, 280) + "…" : description;
  return {
    subject: `New complaint: ${complaintNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">New Complaint Filed</h2>
        <p>Hello ${recipientName},</p>
        <p>A new complaint has been filed and requires review:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Complaint #</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${complaintNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Category</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${category.replace(/_/g, " ")}</td></tr>
          ${providerRow}
        </table>
        <p style="color: #718096;"><strong>Description:</strong></p>
        <div style="background: #f7fafc; border-left: 3px solid #e53e3e; padding: 12px; white-space: pre-wrap;">${truncated}</div>
        <a href="${complaintUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #319795; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">
          View Complaints
        </a>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}

export function credentialExpiringEmail(providerName: string, credentialType: string, expirationDate: string) {
  return {
    subject: `Credential Expiring: ${credentialType}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #1a365d;">Credential Expiring Soon</h2>
        <p>Hello ${providerName},</p>
        <p>The following credential is expiring soon:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Type</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${credentialType}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #718096;">Expires</td><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e; font-weight: bold;">${expirationDate}</td></tr>
        </table>
        <p>Please update this credential to maintain your active status.</p>
        <p style="color: #a0aec0; font-size: 12px; margin-top: 24px;">Avanty Care Transportation Portal</p>
      </div>
    `,
  };
}
