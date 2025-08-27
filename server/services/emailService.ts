import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Email Service for sending verification emails and notifications
 */
export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter with configuration
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      // Check if SMTP credentials are available
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpPort && smtpUser && smtpPass) {
        // Use SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        logger.info('Email service initialized with SMTP configuration');
      } else {
        // Use test account for development
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'ethereal.user@ethereal.email',
            pass: 'ethereal.pass',
          },
        });
        logger.info('Email service initialized with test configuration');
      }
    }
    return this.transporter;
  }

  /**
   * Send email verification code
   */
  static async sendVerificationEmail(email: string, verificationCode: string, userName?: string): Promise<EmailResponse> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@flightbooking.com',
        to: email,
        subject: 'Verify Your Email - Flight Booking App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">✈️ Flight Booking</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email Address</h2>
              <p style="color: #475569; margin-bottom: 20px;">
                ${userName ? `Hi ${userName},` : 'Hi there,'}<br>
                Welcome to Flight Booking! Please verify your email address to complete your account setup.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #2563eb; color: white; display: inline-block; padding: 15px 30px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                  ${verificationCode}
                </div>
              </div>
              
              <p style="color: #475569; font-size: 14px;">
                Enter this verification code in the app to verify your email address.<br>
                <strong>This code expires in 15 minutes.</strong>
              </p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't create an account with Flight Booking, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p>© 2025 Flight Booking App. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        `,
        text: `
          Flight Booking - Email Verification
          
          ${userName ? `Hi ${userName},` : 'Hi there,'}
          
          Welcome to Flight Booking! Please verify your email address to complete your account setup.
          
          Verification Code: ${verificationCode}
          
          Enter this code in the app to verify your email address.
          This code expires in 15 minutes.
          
          Security Note: If you didn't create an account with Flight Booking, please ignore this email.
          
          © 2025 Flight Booking App. All rights reserved.
        `
      };

      // In development mode, log email details instead of sending
      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        logger.info('📧 [MOCK EMAIL] Verification email details:');
        logger.info(`To: ${email}`);
        logger.info(`Subject: ${mailOptions.subject}`);
        logger.info(`Verification Code: ${verificationCode}`);
        logger.info(`Code expires in: 15 minutes`);
        
        return {
          success: true,
          message: 'Verification email sent successfully (development mode)',
          data: {
            mock: true,
            email: email,
            verificationCode: verificationCode, // Only in development!
            expiresIn: '15 minutes'
          }
        };
      }

      const info = await transporter.sendMail(mailOptions);
      
      logger.info(`Verification email sent to ${email}, messageId: ${info.messageId}`);
      
      // Generate preview URL for Ethereal Email (test accounts)
      if (info.messageId && process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info(`Preview URL: ${previewUrl}`);
        }
      }

      return {
        success: true,
        message: 'Verification email sent successfully',
        data: {
          messageId: info.messageId,
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Partially hide email
        }
      };

    } catch (error: any) {
      logger.error('Send verification email error:', error);
      return {
        success: false,
        error: 'Failed to send verification email'
      };
    }
  }

  /**
   * Send welcome email after successful verification
   */
  static async sendWelcomeEmail(email: string, userName: string): Promise<EmailResponse> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@flightbooking.com',
        to: email,
        subject: 'Welcome to Flight Booking! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">✈️ Flight Booking</h1>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1e293b; margin-top: 0;">Welcome aboard, ${userName}! 🎉</h2>
              <p style="color: #475569;">
                Your email has been successfully verified and your account is now active!
              </p>
              
              <p style="color: #475569;">
                You can now:
              </p>
              <ul style="color: #475569;">
                <li>Search and book flights</li>
                <li>Manage your bookings</li>
                <li>View your travel history</li>
                <li>Update your profile</li>
              </ul>
            </div>
            
            <div style="text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p>© 2025 Flight Booking App. All rights reserved.</p>
            </div>
          </div>
        `,
        text: `
          Flight Booking - Welcome!
          
          Welcome aboard, ${userName}!
          
          Your email has been successfully verified and your account is now active!
          
          You can now search and book flights, manage your bookings, and more.
          
          © 2025 Flight Booking App. All rights reserved.
        `
      };

      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        logger.info(`📧 [MOCK EMAIL] Welcome email sent to ${userName} (${email})`);
        return {
          success: true,
          message: 'Welcome email sent successfully (development mode)',
          data: { mock: true, email: email }
        };
      }

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${email}, messageId: ${info.messageId}`);

      return {
        success: true,
        message: 'Welcome email sent successfully',
        data: { messageId: info.messageId }
      };

    } catch (error: any) {
      logger.error('Send welcome email error:', error);
      return {
        success: false,
        error: 'Failed to send welcome email'
      };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetCode: string, userName?: string): Promise<EmailResponse> {
    try {
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@flightbooking.com',
        to: email,
        subject: 'Reset Your Password - Flight Booking App',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">✈️ Flight Booking</h1>
            </div>
            
            <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #991b1b; margin-top: 0;">🔒 Password Reset Request</h2>
              <p style="color: #7f1d1d;">
                ${userName ? `Hi ${userName},` : 'Hi there,'}<br>
                We received a request to reset your password. Use the code below to reset it.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #dc2626; color: white; display: inline-block; padding: 15px 30px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                  ${resetCode}
                </div>
              </div>
              
              <p style="color: #7f1d1d; font-size: 14px;">
                Enter this reset code to create a new password.<br>
                <strong>This code expires in 15 minutes.</strong>
              </p>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <div style="text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p>© 2025 Flight Booking App. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        `,
        text: `
          Flight Booking - Password Reset
          
          ${userName ? `Hi ${userName},` : 'Hi there,'}
          
          We received a request to reset your password. Use the code below to reset it.
          
          Reset Code: ${resetCode}
          
          Enter this code to create a new password.
          This code expires in 15 minutes.
          
          Security Note: If you didn't request a password reset, please ignore this email.
          
          © 2025 Flight Booking App. All rights reserved.
        `
      };

      if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
        logger.info('📧 [MOCK EMAIL] Password reset email details:');
        logger.info(`To: ${email}`);
        logger.info(`Reset Code: ${resetCode}`);
        logger.info(`Code expires in: 15 minutes`);
        
        return {
          success: true,
          message: 'Password reset email sent successfully (development mode)',
          data: {
            mock: true,
            email: email,
            resetCode: resetCode, // Only in development!
            expiresIn: '15 minutes'
          }
        };
      }

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}, messageId: ${info.messageId}`);

      return {
        success: true,
        message: 'Password reset email sent successfully',
        data: {
          messageId: info.messageId,
          email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        }
      };

    } catch (error: any) {
      logger.error('Send password reset email error:', error);
      return {
        success: false,
        error: 'Failed to send password reset email'
      };
    }
  }

  /**
   * Generate a secure 6-digit verification code
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate verification code format
   */
  static isValidVerificationCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  }
}