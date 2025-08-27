import { SMSService } from './smsService';
import { logger } from '../utils/logger';

interface OTPRecord {
  phone: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

/**
 * OTP Service for managing phone verification
 * Uses in-memory storage for simplicity (can be moved to database later)
 */
export class OTPService {
  private static otpStorage = new Map<string, OTPRecord>();
  private static readonly OTP_EXPIRY_MINUTES = 5;
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Generate and send OTP to phone number
   */
  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      // Clean up expired OTPs first
      this.cleanupExpiredOTPs();

      // Format phone number
      const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
      
      // Check if OTP was recently sent (rate limiting)
      const existingOTP = this.otpStorage.get(formattedPhone);
      if (existingOTP && !this.isExpired(existingOTP)) {
        const remainingTime = Math.ceil((existingOTP.expiresAt.getTime() - Date.now()) / 60000);
        return {
          success: false,
          error: `OTP already sent. Please wait ${remainingTime} minutes or use the existing OTP.`
        };
      }

      // Generate new OTP
      const otp = SMSService.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP
      this.otpStorage.set(formattedPhone, {
        phone: formattedPhone,
        otp,
        expiresAt,
        attempts: 0,
        verified: false
      });

      // Send SMS
      const smsResult = await SMSService.sendOTP(formattedPhone, otp);
      
      if (!smsResult.success) {
        // Remove from storage if SMS failed
        this.otpStorage.delete(formattedPhone);
        return {
          success: false,
          error: smsResult.error || 'Failed to send OTP'
        };
      }

      logger.info(`OTP generated and sent to ${formattedPhone.replace(/\d(?=\d{4})/g, '*')}`);
      
      return {
        success: true,
        message: `OTP sent to ${formattedPhone.replace(/\d(?=\d{4})/g, '*')}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
      };

    } catch (error: any) {
      logger.error('Send OTP error:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.'
      };
    }
  }

  /**
   * Verify OTP for phone number
   */
  static async verifyOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
      const otpRecord = this.otpStorage.get(formattedPhone);

      if (!otpRecord) {
        return {
          success: false,
          error: 'OTP not found. Please request a new OTP.'
        };
      }

      // Check if OTP is expired
      if (this.isExpired(otpRecord)) {
        this.otpStorage.delete(formattedPhone);
        return {
          success: false,
          error: 'OTP has expired. Please request a new OTP.'
        };
      }

      // Check if already verified
      if (otpRecord.verified) {
        return {
          success: false,
          error: 'OTP already used. Please request a new OTP.'
        };
      }

      // Check max attempts
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        this.otpStorage.delete(formattedPhone);
        return {
          success: false,
          error: 'Maximum attempts exceeded. Please request a new OTP.'
        };
      }

      // Increment attempt counter
      otpRecord.attempts++;

      // Verify OTP
      if (otpRecord.otp !== otp) {
        const remainingAttempts = this.MAX_ATTEMPTS - otpRecord.attempts;
        return {
          success: false,
          error: remainingAttempts > 0 
            ? `Invalid OTP. ${remainingAttempts} attempts remaining.`
            : 'Invalid OTP. Maximum attempts exceeded.'
        };
      }

      // Mark as verified
      otpRecord.verified = true;
      
      logger.info(`OTP verified successfully for ${formattedPhone.replace(/\d(?=\d{4})/g, '*')}`);
      
      return {
        success: true,
        message: 'OTP verified successfully'
      };

    } catch (error: any) {
      logger.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again.'
      };
    }
  }

  /**
   * Check if OTP is verified for a phone number
   */
  static isOTPVerified(phoneNumber: string): boolean {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const otpRecord = this.otpStorage.get(formattedPhone);
    
    return otpRecord !== undefined && 
           otpRecord.verified && 
           !this.isExpired(otpRecord);
  }

  /**
   * Clear OTP after successful authentication
   */
  static clearOTP(phoneNumber: string): void {
    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    this.otpStorage.delete(formattedPhone);
    logger.info(`OTP cleared for ${formattedPhone.replace(/\d(?=\d{4})/g, '*')}`);
  }

  /**
   * Get OTP status for debugging (development only)
   */
  static getOTPStatus(phoneNumber: string): any {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);
    const otpRecord = this.otpStorage.get(formattedPhone);
    
    if (!otpRecord) {
      return { status: 'not_found' };
    }

    return {
      status: 'found',
      phone: formattedPhone,
      otp: otpRecord.otp, // Only in development!
      expiresAt: otpRecord.expiresAt,
      attempts: otpRecord.attempts,
      verified: otpRecord.verified,
      expired: this.isExpired(otpRecord)
    };
  }

  /**
   * Check if OTP record is expired
   */
  private static isExpired(otpRecord: OTPRecord): boolean {
    return new Date() > otpRecord.expiresAt;
  }

  /**
   * Clean up expired OTPs
   */
  private static cleanupExpiredOTPs(): void {
    const now = new Date();
    const entries = Array.from(this.otpStorage.entries());
    for (const [phone, record] of entries) {
      if (now > record.expiresAt) {
        this.otpStorage.delete(phone);
      }
    }
  }

  /**
   * Get storage statistics (for monitoring)
   */
  static getStats(): { totalOTPs: number; expiredOTPs: number; verifiedOTPs: number } {
    const total = this.otpStorage.size;
    let expired = 0;
    let verified = 0;

    const records = Array.from(this.otpStorage.values());
    for (const record of records) {
      if (this.isExpired(record)) {
        expired++;
      }
      if (record.verified) {
        verified++;
      }
    }

    return { totalOTPs: total, expiredOTPs: expired, verifiedOTPs: verified };
  }
}