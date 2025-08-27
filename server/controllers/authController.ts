import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const phoneOtpRequestSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (+1234567890)')
});

const phoneOtpVerifySchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (+1234567890)'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits')
});

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required')
});

/**
 * Authentication Controller
 * Handles all authentication-related endpoints
 */
export class AuthController {

  /**
   * Initiate Google OAuth sign-in
   * GET /auth/google
   */
  static async initiateGoogleAuth(req: Request, res: Response) {
    try {
      const redirectUrl = req.query.redirect_url as string || `${req.protocol}://${req.get('host')}/auth/callback`;
      
      const result = await AuthService.initiateGoogleSignIn(redirectUrl);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to initiate Google authentication',
          error: result.error
        });
      }

      logger.info('Google OAuth initiated successfully');
      
      // Return OAuth URL for frontend to redirect to
      res.json({
        success: true,
        data: {
          oauth_url: result.data?.oauth_url,
          provider: 'google'
        },
        message: 'Redirect user to oauth_url to complete Google authentication'
      });
    } catch (error) {
      logger.error('Google auth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'AUTH_SERVICE_ERROR'
      });
    }
  }

  /**
   * Handle OAuth callback
   * GET /auth/callback
   */
  static async handleOAuthCallback(req: Request, res: Response) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code is required',
          error: 'MISSING_AUTH_CODE'
        });
      }

      const result = await AuthService.handleOAuthCallback(code as string, state as string);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'OAuth authentication failed',
          error: result.error
        });
      }

      logger.info(`OAuth callback successful for user: ${result.data.user.email}`);

      // Return user data and tokens
      res.json({
        success: true,
        data: {
          user: result.data.user,
          session: result.data.session
        },
        message: 'Authentication successful'
      });
    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'AUTH_SERVICE_ERROR'
      });
    }
  }

  /**
   * Send OTP to phone number
   * POST /auth/phone/send-otp
   */
  static async sendPhoneOTP(req: Request, res: Response) {
    try {
      const validatedData = phoneOtpRequestSchema.parse(req.body);
      
      const result = await AuthService.sendPhoneOTP(validatedData.phone);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to send OTP',
          error: result.error
        });
      }

      logger.info(`OTP sent to phone: ${validatedData.phone.replace(/\d(?=\d{4})/g, '*')}`);
      
      res.json({
        success: true,
        data: result.data,
        message: result.message || 'OTP sent successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      logger.error('Send phone OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'AUTH_SERVICE_ERROR'
      });
    }
  }

  /**
   * Verify OTP for phone authentication
   * POST /auth/phone/verify-otp
   */
  static async verifyPhoneOTP(req: Request, res: Response) {
    try {
      const validatedData = phoneOtpVerifySchema.parse(req.body);
      
      const result = await AuthService.verifyPhoneOTP(validatedData.phone, validatedData.otp);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'OTP verification failed',
          error: result.error
        });
      }

      logger.info(`Phone OTP verified successfully for: ${validatedData.phone.replace(/\d(?=\d{4})/g, '*')}`);
      
      res.json({
        success: true,
        data: {
          user: result.data.user,
          session: result.data.session
        },
        message: 'Phone authentication successful'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      logger.error('Verify phone OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'AUTH_SERVICE_ERROR'
      });
    }
  }

  /**
   * Refresh authentication session
   * POST /auth/refresh
   */
  static async refreshSession(req: Request, res: Response) {
    try {
      const validatedData = refreshTokenSchema.parse(req.body);
      
      const result = await AuthService.refreshSession(validatedData.refresh_token);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: 'Session refresh failed',
          error: result.error
        });
      }

      logger.info('Session refreshed successfully');
      
      res.json({
        success: true,
        data: result.data,
        message: 'Session refreshed successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      logger.error('Refresh session error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'AUTH_SERVICE_ERROR'
      });
    }
  }

  /**
   * Sign out user
   * POST /auth/signout
   */
  static async signOut(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      
      const result = await AuthService.signOut(token);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Sign out failed',
          error: result.error
        });
      }

      logger.info('User signed out successfully');
      
      res.json({
        success: true,
        message: 'Signed out successfully'
      });
    } catch (error) {
      logger.error('Sign out error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'AUTH_SERVICE_ERROR'
      });
    }
  }

  /**
   * Get current user profile (protected route example)
   * GET /auth/profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      // User data is already available from auth middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
          error: 'NOT_AUTHENTICATED'
        });
      }

      logger.info(`Profile accessed by user: ${req.user.email || req.user.phone || req.user.id}`);
      
      res.json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            email: req.user.email,
            phone: req.user.phone,
            user_metadata: req.user.user_metadata,
            app_metadata: req.user.app_metadata
          }
        },
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'PROFILE_SERVICE_ERROR'
      });
    }
  }

  /**
   * Get authentication status
   * GET /auth/status
   */
  static async getAuthStatus(req: Request, res: Response) {
    try {
      const isAuthenticated = !!req.user;
      
      res.json({
        success: true,
        data: {
          authenticated: isAuthenticated,
          user: req.user || null
        }
      });
    } catch (error) {
      logger.error('Get auth status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}