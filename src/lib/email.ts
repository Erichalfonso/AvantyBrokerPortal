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
