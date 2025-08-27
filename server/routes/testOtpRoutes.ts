import { Router, Request, Response } from 'express';
import { OTPService } from '../services/otpService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (+1234567890)')
});

const verifyOTPSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (+1234567890)'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits')
});

/**
 * Test endpoint to send OTP
 * POST /api/test/send-otp
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const validation = sendOTPSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { phone } = validation.data;
    
    logger.info(`Test OTP send request for: ${phone.replace(/\d(?=\d{4})/g, '*')}`);
    
    const result = await OTPService.sendOTP(phone);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        debug_info: process.env.NODE_ENV === 'development' ? OTPService.getOTPStatus(phone) : undefined
      });
    }

    const response: any = {
      success: true,
      message: result.message,
      phone: phone.replace(/\d(?=\d{4})/g, '*'),
      expires_in: '5 minutes'
    };

    // In development mode, include the OTP for testing
    if (process.env.NODE_ENV === 'development') {
      const debugInfo = OTPService.getOTPStatus(phone);
      response.debug_info = debugInfo;
      response.dev_note = 'OTP included for development testing only';
    }

    res.json(response);

  } catch (error) {
    logger.error('Test send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Test endpoint to verify OTP
 * POST /api/test/verify-otp
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const validation = verifyOTPSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.errors
      });
    }

    const { phone, otp } = validation.data;
    
    logger.info(`Test OTP verify request for: ${phone.replace(/\d(?=\d{4})/g, '*')}`);
    
    const result = await OTPService.verifyOTP(phone, otp);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        debug_info: process.env.NODE_ENV === 'development' ? OTPService.getOTPStatus(phone) : undefined
      });
    }

    res.json({
      success: true,
      message: result.message,
      phone: phone.replace(/\d(?=\d{4})/g, '*'),
      verified_at: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Test verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Test endpoint to check OTP status (development only)
 * GET /api/test/otp-status/:phone
 */
router.get('/otp-status/:phone', (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is only available in development mode'
    });
  }

  try {
    const phone = req.params.phone;
    const status = OTPService.getOTPStatus(phone);
    const stats = OTPService.getStats();

    res.json({
      success: true,
      phone_status: status,
      system_stats: stats,
      note: 'This endpoint is for development/debugging only'
    });
  } catch (error) {
    logger.error('Test OTP status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;