import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:', {
      to: options.to,
      subject: options.subject,
    });
    return;
  }

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || 'noreply@cushionquoting.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: options.attachments,
  });
}

export async function sendInvitationEmail(
  email: string,
  name: string,
  invitationToken: string
): Promise<void> {
  const invitationUrl = `${process.env.WEB_URL}/accept-invitation?token=${invitationToken}`;

  await sendEmail({
    to: email,
    subject: 'You\'ve been invited to Cushion Quoting System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Cushion Quoting System!</h2>
        <p>Hello ${name},</p>
        <p>You've been invited to join the Cushion Quoting System. Click the button below to set up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6B7280;">${invitationUrl}</p>
        <p>This invitation will expire in 7 days.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #6B7280; font-size: 12px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `
Welcome to Cushion Quoting System!

Hello ${name},

You've been invited to join the Cushion Quoting System. 

Click the link below to set up your account:
${invitationUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `,
  });
}

export async function sendQuoteEmail(
  email: string,
  customerName: string,
  quoteNumber: string,
  pdfBuffer: Buffer
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Your Quote ${quoteNumber} - Cushion Quoting System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Cushion Quote</h2>
        <p>Hello ${customerName},</p>
        <p>Thank you for your interest in our cushions. Please find your quote attached to this email.</p>
        <p><strong>Quote Number:</strong> ${quoteNumber}</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
        <p style="color: #6B7280; font-size: 12px;">
          This quote is valid for 30 days from the date of issue.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `Quote-${quoteNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
