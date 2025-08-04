import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  return transporter;
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `"WebCat" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  try {
    const transport = getTransporter();
    await transport.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset for your WebCat account.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>Or copy and paste this link into your browser:</p>
    <p>${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this reset, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: 'WebCat - Password Reset Request',
    html
  });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = `
    <h2>Welcome to WebCat!</h2>
    <p>Hi ${name},</p>
    <p>Thank you for joining WebCat. Your account has been successfully created.</p>
    <p>You can now:</p>
    <ul>
      <li>Browse and list items in our catalog</li>
      <li>Communicate with other vendors</li>
      <li>Participate in community discussions</li>
      <li>Stay updated with upcoming events</li>
    </ul>
    <p>If you have any questions, feel free to contact our support team.</p>
    <p>Best regards,<br>The WebCat Team</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to WebCat',
    html
  });
};