import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { OTPService } from './otpService';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: any;
  app_metadata?: any;
}

export interface AuthResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Authentication Service for Supabase Auth integration
 * Handles Google OAuth and Phone OTP authentication
 */
export class AuthService {
  
  /**
   * Initialize Google OAuth sign-in process
   * Returns the OAuth URL for frontend redirection
   */
  static async initiateGoogleSignIn(redirectUrl: string = 'http://localhost:5000/auth/callback'): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          scopes: 'email profile'
        }
      });

      if (error) {
        logger.error('Google OAuth initiation failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info('Google OAuth URL generated successfully');
      return {
        success: true,
        data: {
          oauth_url: data.url,
          provider: 'google'
        }
      };
    } catch (error) {
      logger.error('Google OAuth initiation error:', error);
      return {
        success: false,
        error: 'Failed to initiate Google sign-in'
      };
    }
  }

  /**
   * Handle OAuth callback and create session
   */
  static async handleOAuthCallback(code: string, state?: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error('OAuth callback failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'No user or session returned from OAuth'
        };
      }

      logger.info(`User authenticated via OAuth: ${data.user.email}`);
      
      return {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            user_metadata: data.user.user_metadata,
            app_metadata: data.user.app_metadata
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            token_type: data.session.token_type
          }
        }
      };
    } catch (error) {
      logger.error('OAuth callback error:', error);
      return {
        success: false,
        error: 'Failed to process OAuth callback'
      };
    }
  }

  /**
   * Send OTP to phone number using custom SMS service
   */
  static async sendPhoneOTP(phoneNumber: string): Promise<AuthResponse> {
    try {
      // Validate phone number format (basic validation)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format. Use international format (+1234567890)'
        };
      }

      // Use our custom OTP service
      const result = await OTPService.sendOTP(phoneNumber);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to send OTP'
        };
      }

      return {
        success: true,
        message: result.message || 'OTP sent successfully',
        data: {
          phone: phoneNumber,
          expires_in: '5 minutes'
        }
      };
    } catch (error) {
      logger.error('Phone OTP send error:', error);
      return {
        success: false,
        error: 'Failed to send OTP'
      };
    }
  }

  /**
   * Verify OTP for phone number authentication
   */
  static async verifyPhoneOTP(phoneNumber: string, otp: string): Promise<AuthResponse> {
    try {
      // First verify the OTP with our custom service
      const otpResult = await OTPService.verifyOTP(phoneNumber, otp);
      
      if (!otpResult.success) {
        return {
          success: false,
          error: otpResult.error || 'Invalid OTP'
        };
      }

      // OTP is valid, now create or sign in user with Supabase
      // Since we can't directly create a session without email/password,
      // we'll use a custom JWT approach or create a user in our database
      
      try {
        // Try to create user with phone number as unique identifier
        const { data, error } = await supabase.auth.signUp({
          email: `${phoneNumber.replace(/\+/g, '')}@phone-auth.temp`,
          password: `temp_${Date.now()}_${Math.random()}`,
          options: {
            data: {
              phone: phoneNumber,
              auth_method: 'phone_otp'
            }
          }
        });

        if (error && !error.message.includes('User already registered')) {
          logger.error('User creation failed:', error);
          // Fallback: try to sign in
        }

        // Clear the OTP after successful verification
        OTPService.clearOTP(phoneNumber);

        // Create a custom session token
        const payload = {
          phone: phoneNumber,
          verified_at: new Date().toISOString(),
          auth_method: 'phone_otp'
        };
        
        const customToken = jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', { 
          expiresIn: '24h' 
        });

        logger.info(`User authenticated via phone OTP: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);
        
        return {
          success: true,
          data: {
            user: {
              id: data?.user?.id || `phone_${phoneNumber.replace(/\+/g, '')}`,
              phone: phoneNumber,
              email: data?.user?.email,
              user_metadata: { auth_method: 'phone_otp' },
              app_metadata: {}
            },
            session: {
              access_token: customToken,
              refresh_token: `refresh_${customToken}`,
              expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
              token_type: 'Bearer'
            }
          }
        };
      } catch (supabaseError: any) {
        logger.warn('Supabase auth failed, using custom auth:', supabaseError.message);
        
        // Clear the OTP after successful verification
        OTPService.clearOTP(phoneNumber);

        // Create a custom session token
        const payload = {
          phone: phoneNumber,
          verified_at: new Date().toISOString(),
          auth_method: 'phone_otp'
        };
        
        const customToken = jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', { 
          expiresIn: '24h' 
        });

        return {
          success: true,
          data: {
            user: {
              id: `phone_${phoneNumber.replace(/\+/g, '')}`,
              phone: phoneNumber,
              user_metadata: { auth_method: 'phone_otp' },
              app_metadata: {}
            },
            session: {
              access_token: customToken,
              refresh_token: `refresh_${customToken}`,
              expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
              token_type: 'Bearer'
            }
          }
        };
      }
    } catch (error) {
      logger.error('Phone OTP verification error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP'
      };
    }
  }

  /**
   * Refresh authentication session
   */
  static async refreshSession(refreshToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        logger.error('Session refresh failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.session) {
        return {
          success: false,
          error: 'No session returned'
        };
      }

      return {
        success: true,
        data: {
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            token_type: data.session.token_type
          },
          user: data.user
        }
      };
    } catch (error) {
      logger.error('Session refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh session'
      };
    }
  }

  /**
   * Sign out user
   */
  static async signOut(accessToken?: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Sign out failed:', error);
        return {
          success: false,
          error: error.message
        };
      }

      logger.info('User signed out successfully');
      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      logger.error('Sign out error:', error);
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  }

  /**
   * Get user from access token
   */
  static async getUserFromToken(accessToken: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone,
            user_metadata: data.user.user_metadata,
            app_metadata: data.user.app_metadata
          }
        }
      };
    } catch (error) {
      logger.error('Get user from token error:', error);
      return {
        success: false,
        error: 'Failed to get user from token'
      };
    }
  }
}