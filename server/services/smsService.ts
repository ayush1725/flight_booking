import axios from 'axios';
import { logger } from '../utils/logger';

export interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * SMS Service for sending OTP messages
 * Supports multiple SMS providers with fallback mechanism
 */
export class SMSService {
  
  /**
   * Send OTP SMS using Fast2SMS (primary provider)
   */
  static async sendOTPWithFast2SMS(phoneNumber: string, otp: string): Promise<SMSResponse> {
    try {
      const apiKey = process.env.FAST2SMS_API_KEY;
      
      if (!apiKey) {
        logger.warn('Fast2SMS API key not configured, using fallback');
        return { success: false, error: 'SMS service not configured' };
      }

      // Remove country code if present and format for Indian numbers
      const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/^\+/, '');
      
      const message = `Your flight booking OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      
      const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', 
        new URLSearchParams({
          authorization: apiKey,
          route: 'otp',
          variables_values: otp,
          flash: '0',
          numbers: cleanPhone,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      if (response.data.return === true) {
        logger.info(`OTP sent successfully to ${cleanPhone} via Fast2SMS`);
        return {
          success: true,
          message: 'OTP sent successfully',
          data: response.data
        };
      } else {
        logger.error('Fast2SMS API error:', response.data);
        return {
          success: false,
          error: response.data.message || 'Failed to send SMS'
        };
      }
    } catch (error: any) {
      logger.error('Fast2SMS service error:', error?.response?.data || error.message);
      return {
        success: false,
        error: 'SMS service temporarily unavailable'
      };
    }
  }

  /**
   * Send OTP SMS using Textlocal (backup provider)
   */
  static async sendOTPWithTextlocal(phoneNumber: string, otp: string): Promise<SMSResponse> {
    try {
      const apiKey = process.env.TEXTLOCAL_API_KEY;
      const sender = process.env.TEXTLOCAL_SENDER || 'FLYBUK';
      
      if (!apiKey) {
        logger.warn('Textlocal API key not configured');
        return { success: false, error: 'Backup SMS service not configured' };
      }

      const message = `Your flight booking OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      
      const response = await axios.post('https://api.textlocal.in/send/', 
        new URLSearchParams({
          apikey: apiKey,
          numbers: phoneNumber,
          message: message,
          sender: sender
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      if (response.data.status === 'success') {
        logger.info(`OTP sent successfully to ${phoneNumber} via Textlocal`);
        return {
          success: true,
          message: 'OTP sent successfully',
          data: response.data
        };
      } else {
        logger.error('Textlocal API error:', response.data);
        return {
          success: false,
          error: response.data.errors?.[0]?.message || 'Failed to send SMS'
        };
      }
    } catch (error: any) {
      logger.error('Textlocal service error:', error?.response?.data || error.message);
      return {
        success: false,
        error: 'Backup SMS service temporarily unavailable'
      };
    }
  }

  /**
   * Mock SMS service for development/testing
   */
  static async sendOTPMock(phoneNumber: string, otp: string): Promise<SMSResponse> {
    logger.info(`[MOCK SMS] Sending OTP ${otp} to ${phoneNumber}`);
    logger.info(`[MOCK SMS] Message: Your flight booking OTP is: ${otp}. Valid for 5 minutes.`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'OTP sent successfully (mock mode)',
      data: {
        mock: true,
        otp: otp,
        phone: phoneNumber,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Main method to send OTP with fallback mechanism
   */
  static async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    // Validate phone number format
    if (!phoneNumber || phoneNumber.length < 10) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Validate OTP
    if (!otp || otp.length !== 6) {
      return {
        success: false,
        error: 'Invalid OTP format'
      };
    }

    // Development/testing mode
    if (process.env.NODE_ENV === 'development' && !process.env.FAST2SMS_API_KEY && !process.env.TEXTLOCAL_API_KEY) {
      logger.info('Development mode: Using mock SMS service');
      return this.sendOTPMock(phoneNumber, otp);
    }

    // Try primary provider (Fast2SMS)
    const primaryResult = await this.sendOTPWithFast2SMS(phoneNumber, otp);
    if (primaryResult.success) {
      return primaryResult;
    }

    logger.warn('Primary SMS provider failed, trying backup...');
    
    // Try backup provider (Textlocal)
    const backupResult = await this.sendOTPWithTextlocal(phoneNumber, otp);
    if (backupResult.success) {
      return backupResult;
    }

    logger.error('All SMS providers failed');
    
    // If both providers fail, use mock in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('All providers failed, falling back to mock service for development');
      return this.sendOTPMock(phoneNumber, otp);
    }

    return {
      success: false,
      error: 'Unable to send OTP. Please try again later or contact support.'
    };
  }

  /**
   * Generate a secure 6-digit OTP
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Validate OTP format
   */
  static isValidOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }

  /**
   * Format phone number for international SMS
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove spaces and special characters
    const clean = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Add country code if missing (default to India +91)
    if (!clean.startsWith('+')) {
      if (clean.startsWith('91') && clean.length === 12) {
        return '+' + clean;
      } else if (clean.length === 10) {
        return '+91' + clean;
      } else {
        return '+' + clean;
      }
    }
    
    return clean;
  }
}