import { EmailService } from './emailService';
import { logger } from '../utils/logger';

interface EmailVerificationRecord {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  userId?: string;
}

/**
 * Email Verification Service for managing email verification codes
 * Uses in-memory storage for simplicity (can be moved to database later)
 */
export class EmailVerificationService {
  private static verificationStorage = new Map<string, EmailVerificationRecord>();
  private static readonly CODE_EXPIRY_MINUTES = 15;
  private static readonly MAX_ATTEMPTS = 5;

  /**
   * Send verification code to email address
   */
  static async sendVerificationCode(email: string, userName?: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Clean up expired codes first
      this.cleanupExpiredCodes();

      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if verification was recently sent (rate limiting)
      const existingRecord = this.verificationStorage.get(normalizedEmail);
      if (existingRecord && !this.isExpired(existingRecord)) {
        const remainingTime = Math.ceil((existingRecord.expiresAt.getTime() - Date.now()) / 60000);
        return {
          success: false,
          error: `Verification code already sent. Please wait ${remainingTime} minutes or use the existing code.`
        };
      }

      // Generate new verification code
      const code = EmailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      // Store verification record
      this.verificationStorage.set(normalizedEmail, {
        email: normalizedEmail,
        code,
        expiresAt,
        attempts: 0,
        verified: false
      });

      // Send email
      const emailResult = await EmailService.sendVerificationEmail(normalizedEmail, code, userName);
      
      if (!emailResult.success) {
        // Remove from storage if email failed
        this.verificationStorage.delete(normalizedEmail);
        return {
          success: false,
          error: emailResult.error || 'Failed to send verification email'
        };
      }

      logger.info(`Email verification code sent to ${normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`);
      
      return {
        success: true,
        message: `Verification code sent to ${normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}. Valid for ${this.CODE_EXPIRY_MINUTES} minutes.`
      };

    } catch (error: any) {
      logger.error('Send email verification error:', error);
      return {
        success: false,
        error: 'Failed to send verification code. Please try again.'
      };
    }
  }

  /**
   * Verify email verification code
   */
  static async verifyCode(email: string, code: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const record = this.verificationStorage.get(normalizedEmail);

      if (!record) {
        return {
          success: false,
          error: 'Verification code not found. Please request a new code.'
        };
      }

      // Check if code is expired
      if (this.isExpired(record)) {
        this.verificationStorage.delete(normalizedEmail);
        return {
          success: false,
          error: 'Verification code has expired. Please request a new code.'
        };
      }

      // Check if already verified
      if (record.verified) {
        return {
          success: false,
          error: 'Email already verified. Please proceed to login.'
        };
      }

      // Check max attempts
      if (record.attempts >= this.MAX_ATTEMPTS) {
        this.verificationStorage.delete(normalizedEmail);
        return {
          success: false,
          error: 'Maximum verification attempts exceeded. Please request a new code.'
        };
      }

      // Increment attempt counter
      record.attempts++;

      // Verify code
      if (record.code !== code.trim()) {
        const remainingAttempts = this.MAX_ATTEMPTS - record.attempts;
        return {
          success: false,
          error: remainingAttempts > 0 
            ? `Invalid verification code. ${remainingAttempts} attempts remaining.`
            : 'Invalid verification code. Maximum attempts exceeded.'
        };
      }

      // Mark as verified
      record.verified = true;
      
      logger.info(`Email verified successfully: ${normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`);
      
      return {
        success: true,
        message: 'Email verified successfully'
      };

    } catch (error: any) {
      logger.error('Verify email code error:', error);
      return {
        success: false,
        error: 'Failed to verify code. Please try again.'
      };
    }
  }

  /**
   * Check if email is verified
   */
  static isEmailVerified(email: string): boolean {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.verificationStorage.get(normalizedEmail);
    
    return record !== undefined && 
           record.verified && 
           !this.isExpired(record);
  }

  /**
   * Clear verification record after successful registration
   */
  static clearVerification(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    this.verificationStorage.delete(normalizedEmail);
    logger.info(`Email verification cleared for ${normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`);
  }

  /**
   * Get verification status for debugging (development only)
   */
  static getVerificationStatus(email: string): any {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = this.verificationStorage.get(normalizedEmail);
    
    if (!record) {
      return { status: 'not_found' };
    }

    return {
      status: 'found',
      email: normalizedEmail,
      code: record.code, // Only in development!
      expiresAt: record.expiresAt,
      attempts: record.attempts,
      verified: record.verified,
      expired: this.isExpired(record)
    };
  }

  /**
   * Send password reset code
   */
  static async sendPasswordResetCode(email: string, userName?: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      this.cleanupExpiredCodes();

      const normalizedEmail = email.toLowerCase().trim();
      
      // Check rate limiting
      const existingRecord = this.verificationStorage.get(`reset_${normalizedEmail}`);
      if (existingRecord && !this.isExpired(existingRecord)) {
        const remainingTime = Math.ceil((existingRecord.expiresAt.getTime() - Date.now()) / 60000);
        return {
          success: false,
          error: `Password reset code already sent. Please wait ${remainingTime} minutes.`
        };
      }

      // Generate reset code
      const code = EmailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      // Store reset record (with prefix to avoid conflicts)
      this.verificationStorage.set(`reset_${normalizedEmail}`, {
        email: normalizedEmail,
        code,
        expiresAt,
        attempts: 0,
        verified: false
      });

      // Send reset email
      const emailResult = await EmailService.sendPasswordResetEmail(normalizedEmail, code, userName);
      
      if (!emailResult.success) {
        this.verificationStorage.delete(`reset_${normalizedEmail}`);
        return {
          success: false,
          error: emailResult.error || 'Failed to send password reset email'
        };
      }

      logger.info(`Password reset code sent to ${normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`);
      
      return {
        success: true,
        message: `Password reset code sent to ${normalizedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}.`
      };

    } catch (error: any) {
      logger.error('Send password reset error:', error);
      return {
        success: false,
        error: 'Failed to send password reset code.'
      };
    }
  }

  /**
   * Verify password reset code
   */
  static async verifyPasswordResetCode(email: string, code: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const record = this.verificationStorage.get(`reset_${normalizedEmail}`);

      if (!record) {
        return {
          success: false,
          error: 'Reset code not found. Please request a new code.'
        };
      }

      if (this.isExpired(record)) {
        this.verificationStorage.delete(`reset_${normalizedEmail}`);
        return {
          success: false,
          error: 'Reset code has expired. Please request a new code.'
        };
      }

      if (record.attempts >= this.MAX_ATTEMPTS) {
        this.verificationStorage.delete(`reset_${normalizedEmail}`);
        return {
          success: false,
          error: 'Maximum attempts exceeded. Please request a new code.'
        };
      }

      record.attempts++;

      if (record.code !== code.trim()) {
        const remainingAttempts = this.MAX_ATTEMPTS - record.attempts;
        return {
          success: false,
          error: remainingAttempts > 0 
            ? `Invalid reset code. ${remainingAttempts} attempts remaining.`
            : 'Invalid reset code. Maximum attempts exceeded.'
        };
      }

      record.verified = true;
      
      return {
        success: true,
        message: 'Reset code verified successfully'
      };

    } catch (error: any) {
      logger.error('Verify password reset code error:', error);
      return {
        success: false,
        error: 'Failed to verify reset code.'
      };
    }
  }

  /**
   * Clear password reset record
   */
  static clearPasswordReset(email: string): void {
    const normalizedEmail = email.toLowerCase().trim();
    this.verificationStorage.delete(`reset_${normalizedEmail}`);
  }

  /**
   * Check if record is expired
   */
  private static isExpired(record: EmailVerificationRecord): boolean {
    return new Date() > record.expiresAt;
  }

  /**
   * Clean up expired verification codes
   */
  private static cleanupExpiredCodes(): void {
    const now = new Date();
    const entries = Array.from(this.verificationStorage.entries());
    for (const [email, record] of entries) {
      if (now > record.expiresAt) {
        this.verificationStorage.delete(email);
      }
    }
  }

  /**
   * Get storage statistics (for monitoring)
   */
  static getStats(): { totalCodes: number; expiredCodes: number; verifiedCodes: number } {
    const total = this.verificationStorage.size;
    let expired = 0;
    let verified = 0;

    const records = Array.from(this.verificationStorage.values());
    for (const record of records) {
      if (this.isExpired(record)) {
        expired++;
      }
      if (record.verified) {
        verified++;
      }
    }

    return { totalCodes: total, expiredCodes: expired, verifiedCodes: verified };
  }
}